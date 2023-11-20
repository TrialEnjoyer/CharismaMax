import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Router, { useRouter } from "next/router";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import OpenAI from "openai";

import { env } from "~/env.mjs";
import type { Conversation, message } from "~/types";
import ThinkingSVG from "../../../public/Assets/think-50s-200px.svg";

const ConversationPage = () => {
  const [conversation, setConversation] = useState<Conversation>();
  const [messages, setMessages] = useState<message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const conversationId = useRef<number>();
  const messagesRef = useRef<HTMLDivElement>(null);
  const user = useUser();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [stream, setStream] = useState<string>("");
  const [loadingMessageId, setLoadingMessageId] = useState<number | null>(null);

  // Function to fetch conversation details
  const fetchConversation = async (id: number): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("Conversation")
        .select("*")
        .eq("id", conversationId.current || id)
        .single();
      if (error) {
        console.log(error);
        throw error;
      }
      setConversation(data);
      console.log(data);
    } catch (error) {
      setError("Failed to fetch conversation.");
    }
  };

  // Function to fetch messages
  const fetchMessages = async (id: number): Promise<void> => {
    try {
      console.log("fetching messages");
      const { data, error } = await supabase
        .from("Message")
        .select("*")
        .eq("conversationId", conversationId.current || id);

      if (error) {
        console.log(error);
        throw error;
      }
      console.log(data);
      setMessages(data);
      //if messages contains just 1 message and no reply, then generate a response.
      if (data.length == 1 && !data[0].reply) {
        handleGenerate(data[0], true);
        //console.log("asdfasdf");
        return;
      }
      //if the last entry contains no reply, then set Loading to true
      if (data.length > 0 && !data[data.length - 1].reply) {
        setLoading(true);
        return;
      }
      return;
    } catch (error) {
      setError("Failed to fetch messages.");
      return;
    }
  };

  // Load the conversation and messages when the component mounts
  useEffect(() => {
    //perform user check, if user - then fetch Conversation
    const id = window.location.pathname.replace("/chat/", "");
    const convoId = parseInt(id);

    //Place conversationId here in production.
    conversationId.current = convoId;

    if (conversationId.current != null) {
      console.log(conversationId.current);
      fetchConversation(convoId).catch(() => {
        console.log("error fetching conversation");
      });
      fetchMessages(convoId).catch(() => {
        console.log("error fetching messages");
      });
    }
  }, []);

  const handleSend = async () => {
    setLoading(true);
    if (!user?.id) {
      alert("You have been signed out. Please sign in again.");
      await router.push("/");
    }
    if (newMessage.trim().length < 3) {
      setError("Message must be at least 3 characters long.");
      setLoading(false);
      return;
    }
    try {
      const toDatabase = {
        conversationId: conversationId.current,
        text: newMessage,
        userId: user.id,
        updatedAt: new Date(),
      };
      const { data, error } = await supabase
        .from("Message")
        .insert(toDatabase)
        .select("id");
      if (error) {
        console.log(error);
        throw error;
      }
      setNewMessage("");
      setError("");
      toDatabase["id"] = data[0]?.id;
      setMessages([...messages, toDatabase]);
      //for testing purposes, trigger the response generation
      handleGenerate(toDatabase);
    } catch (error) {
      setError(error.message);
    }
  };

  function transformMessagesToOpenAIFormat(messages: message[]) {
    const transformedMessages: {
      role: "assistant" | "user";
      content: string;
    }[] = [];

    messages.forEach((msg) => {
      // For the user role
      transformedMessages.push({
        role: "user",
        content: msg.text,
      });

      // For the assistant role
      const assistantData = {
        reply: msg.reply || "", // Default to an empty string if reply is not available
        score: msg.score || 0, // Default to 0 if score is not available
        review: msg.review || "", // Default to an empty string if review is not available
      };

      transformedMessages.push({
        role: "assistant",
        content: JSON.stringify(assistantData),
      });
    });

    return transformedMessages;
  }

  const handleGenerate = async (input: message, first: boolean) => {
    setLoading(true);
    setShowRegenerate(false);
    setLoadingMessageId(input.id);
    const openai = new OpenAI({
      apiKey: env.NEXT_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });
    const ResponseAddOnText = `Stay in character while replying. Response is to always be in valid JSON format following: {"reply": "[Your response to the message here]","score": [Your score out of 100],"review": "[Your review here]"}`;
    const openAIFormattedMessages = transformMessagesToOpenAIFormat(messages);
    let inputmessage = input.text;
    if (first) {
      inputmessage += `(From the admin - DO NOT INCLUDE IN SCORING - Advance the conversation in a direction based on your the scenario)`;
    }
    const completion = await openai.chat.completions.create({
      model: "gpt-4", //"gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: ` You are a modern conversation partner, a ficticious modern character called ${conversation?.character_id}, your background is as follows: ${conversation?.character_text}. The current scenario is: ${conversation?.scenario_text}. Always reply in character as much possible keeping the whole conversation in mind. If the reply doesnt go somewhere, try to steer the conversation in a random direction in an attempt to keep it going. If after a few replies the conversation still doesnt go anywhere, feel free to end the conversation.
            Rate the following messages from the user on a scale of 0 to 100 based on the following scoring difficulty: ${conversation?.difficulty_text},taking into consideration the character you play, the user's reply, and the scenario. Provide a short review on how the message could have been better, considering factors such as tone, clarity, and engagement. Then, craft an appropriate response to the message. Format your reply as a JSON object containing the score, review, and response.
            Always stick to the Response format. Do not ask how you can assist the user nor mention anything about being an ai model or assistant. ${ResponseAddOnText}. Once again, the character you play does not offer assistance or uses standard greetings like 'How can I help you?' and if you do not know what to say, or if the input is too small to generate a decent response, then reply true to your character in that situation.`,
        },
        ...openAIFormattedMessages,
        { role: "user", content: inputmessage + " --- " + ResponseAddOnText },
      ],
      max_tokens: 150,
      stream: true,
    });

    let streamTxt = "";
    for await (const message of completion) {
      if (
        message.choices &&
        message.choices.length > 0 &&
        message.choices[0]?.delta.content
      ) {
        const content = message.choices[0]?.delta.content;
        // validate chunk - if it contains duplicate messages, then ignore
        streamTxt += content;
        setStream((prevStream) => prevStream + content);
      }
    }
    //manipulate data to fit the format
    try {
      const dataObj: { reply: string; score: number; review: string } =
        JSON.parse(streamTxt) as {
          reply: string;
          score: number;
          review: string;
        };

      const toDatabase = {
        id: input.id,
        conversationId: input.conversationId,
        text: input.text,
        userId: input.userId,
        createdAt: input.createdAt,
        updatedAt: new Date(),
        history: input.history,
        reply: dataObj.reply || undefined,
        score: dataObj.score || undefined,
        review: dataObj.review || undefined,
      };
      setStream("");
      setLoading(false);
      setLoadingMessageId(null);
      const { error } = await supabase
        .from("Message")
        .update(toDatabase)
        .eq("id", input.id);

      if (error) {
        console.log(error);
        throw error;
      }
      setMessages([...messages, toDatabase]);
    } catch (error) {
      console.log(error);
      setStream("");
      setError("Something went wrong while generating a response.");
    }
  };

  useEffect(() => {
    if (loading) {
      setTimeout(() => {
        if (!stream && loading) {
          //setError("Taking a while... Regeneration active");
          setShowRegenerate(true);
        }
      }, 10000);
    }
  }, [loading]);

  useEffect(() => {
    if (messages.length > 10) {
      setError("Getting close to the limit of 10 messages. Try to wrap it up.");
      return;
    } else {
      setError("");
    }
    if (messagesRef.current) {
      setTimeout(() => {
        if (messagesRef.current?.scrollHeight) {
          messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages]);

  const handleHomeClick = async () => {
    await Router.push("/");
  };

  return (
    <div className="mx-auto flex h-screen w-full flex-col justify-between overflow-hidden bg-zinc-900 p-4 text-zinc-200">
      <div className="flex flex-row gap-5 p-1 pt-0 md:p-5">
        <div
          className=" h-8 rounded-md bg-emerald-400 p-1 text-center font-bold hover:cursor-pointer hover:bg-emerald-600"
          onClick={handleHomeClick}
        >
          Home
        </div>
        <h1 className="text-2xl font-bold">{conversation?.title}</h1>
      </div>
      <div className=" flex-grow overflow-x-hidden md:p-5" ref={messagesRef}>
        {messages
          .sort((a, b) => a.id - b.id)
          .map((message) => {
            return (
              <div key={message.id} className="">
                <div className="my-5">
                  <p className="p-5 text-zinc-400">{message.text}</p>
                </div>
                <div className=" flex flex-row justify-between bg-zinc-800 p-1 md:p-5">
                  {message.reply ? (
                    <Card
                      reply={message.reply}
                      review={message.review}
                      score={message.score}
                    />
                  ) : (
                    <div className="flex flex-grow justify-center ">
                      <span className=" w-full text-left text-zinc-400">
                        {stream.length > 0 && stream}
                      </span>
                      {stream.length == 0 && loading && showRegenerate && (
                        <button
                          onClick={() => {
                            setError("");
                            handleGenerate(message);
                          }}
                          className="mx-auto h-10 self-center rounded bg-blue-500 px-2 py-1 text-white"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  )}
                  <div className="relative">
                    <div className="flex w-24">
                      {loading &&
                        stream.length == 0 &&
                        loadingMessageId == message.id && (
                          <Image
                            src={ThinkingSVG}
                            alt="Thinking"
                            width={80} // Set this to the width of your SVG
                            height={80} // Set this to the height of your SVG
                            className="absolute z-10 h-20 w-20" // z-10 to ensure it's above the other image
                            style={{ top: -35, left: -25 }} // Adjust top and left values to position it correctly over the portrait
                          />
                        )}
                      <Image
                        src={`/Assets/Characters/${conversation?.character_id}.png`}
                        alt="Character Portrait"
                        width={96}
                        height={96}
                        className="z-0 h-24 w-24 rounded-full object-cover" // z-0 or remove if not needed, to ensure this is below the ThinkingSVG
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
      <div className=" w-full justify-end">
        <div className="mb-5 flex flex-row gap-3 self-end">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message here"
            disabled={loading} //loading}
            className="flex min-h-[64px] flex-grow rounded border p-2 text-black"
            maxLength={500}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className=" max-h-[64px] rounded bg-blue-500 px-4 py-2 text-white disabled:bg-blue-300"
          >
            Send
          </button>
        </div>
      </div>
      {error.length > 0 && <p className="text-red-500">{error}</p>}
    </div>
  );
};

interface CardProps {
  score: number;
  review: string;
  reply: string;
}

const Card: React.FC<CardProps> = ({
  score,
  review,
  reply,
}: {
  score?: number;
  review?: string;
  reply?: string;
}) => {
  const [showReview, setShowReview] = React.useState(false);

  return (
    <div className="bg-zinc-800 p-4 text-zinc-200">
      <div className="mb-2 flex w-full">
        <span className="w-full text-right font-medium text-zinc-500">
          {score || 0}/100
        </span>
      </div>
      <div className="my-2">
        <span className="font-medium">{reply || ""}</span>
      </div>
      <div className=" mt-5 flex w-full items-center justify-center">
        <button
          className=" self-center text-emerald-400 hover:text-emerald-600"
          onClick={() => setShowReview(!showReview)}
        >
          {showReview ? "Hide Review" : "View Feedback"}
        </button>
      </div>
      {showReview && (
        <div className="mb-2">
          <span className="font-medium">{review || ""}</span>
        </div>
      )}
    </div>
  );
};
export default ConversationPage;
