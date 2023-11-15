import React, { useEffect, useRef, useState } from "react";
import Router, { useRouter } from "next/router";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import OpenAI from "openai";

import { env } from "~/env.mjs";

type Conversation = {
  createdAt: string;
  id: number;
  review?: string | null;
  score?: number | null;
  type: string;
  userId: string;
  title: string;
};

type message = {
  id: number;
  conversationId: number;
  text: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  score?: number;
  review?: string;
  reply?: string;
  history: string[];
};

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
      const { data, error } = await supabase
        .from("Message")
        .select("*")
        .eq("conversationId", conversationId.current || id);

      if (error) {
        console.log(error);
        throw error;
      }
      setMessages(data);
      //if messages contains just 1 message and no reply, then generate a response.
      if (data.length == 1 && !data[0].reply) {
        handleGenerate(data[0]);
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
    if (conversationId.current != null) {
      console.log(conversationId.current);
      fetchConversation(convoId).catch(() => {
        console.log("error fetching conversation");
      });
      fetchMessages(convoId).catch(() => {
        console.log("error fetching messages");
      });
    }
    //set conversationId AFTER fetching conversation IF statement to guarantee it only happens once
    conversationId.current = convoId;
    /* May not actually need realtime updates.
    //setup subscription to messages

    const MessageSubscription = supabase
      .channel(`ChatMessages:${convoId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "Message" },
        manipulateMessagesWithUpdate,
      )
      .subscribe();
    return () => {
      MessageSubscription.unsubscribe();
    };*/
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

  const handleGenerate = async (input: message) => {
    setLoading(true);
    setShowRegenerate(false);
    const openai = new OpenAI({
      apiKey: env.NEXT_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });
    const ResponseAddOnText = ` Response is to always be in valid JSON format following: {"reply": "[Your response to the message here]","score": [Your score out of 100],"review": "[Your review here]"}`;
    const openAIFormattedMessages = transformMessagesToOpenAIFormat(messages);
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Specify the model
      messages: [
        {
          role: "system",
          content:
            `Rate the following messages from the user on a scale of 0 to 100 based on its clarity, politeness, effectiveness, and overall communication quality. Provide a short review on how the message could have been better, considering factors such as tone, clarity, and engagement. Then, craft an appropriate response to the message. Format your reply as a JSON object containing the score, review, and response.
      Always stick to the Response format. Do not mention anything about being an ai model or assistant; You are a conversation partner, a ficticious character of your own making. Do not ask how you can assist the user. Always reply as realistically as possible keeping the whole conversation in mind. If the reply doesnt go somewhere, try to steer the conversation in a random direction in an attempt to keep it going. If after a few replies the conversation still doesnt go anywhere, feel free to end the conversation. Also feel free to get confrontational if the user is being rude or abusive.` +
            ResponseAddOnText,
        },
        ...openAIFormattedMessages,
        { role: "user", content: input.text + " --- " + ResponseAddOnText },
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
          setError("Taking a while... Regeneration active");
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
      <div className="flex flex-row gap-5 p-5 pt-0">
        <div
          className=" rounded-md bg-emerald-400 p-1 text-center font-bold hover:cursor-pointer hover:bg-emerald-600"
          onClick={handleHomeClick}
        >
          Home
        </div>
        <h1 className="text-2xl font-bold">{conversation?.title}</h1>
      </div>
      <div className=" flex-grow overflow-scroll p-5" ref={messagesRef}>
        {messages.map((message) => {
          return (
            <div key={message.id} className="">
              <div className="my-5">
                <p className="p-5 text-zinc-400">{message.text}</p>
              </div>
              <div className=" bg-zinc-800 p-5">
                {message.reply ? (
                  <Card
                    reply={message.reply}
                    review={message.review}
                    score={message.score}
                  />
                ) : (
                  <div className="flex justify-center">
                    <span className=" text-center text-zinc-500">
                      {stream.length > 0 && stream}
                    </span>
                    {/** loading spinner */}
                    {stream.length == 0 && (
                      <>
                        {showRegenerate ? (
                          <button
                            onClick={() => {
                              setError("");
                              handleGenerate(message);
                            }}
                            className="rounded bg-blue-500 px-2 py-1 text-white"
                          >
                            Regenerate
                          </button>
                        ) : (
                          <div className="relative my-10 h-16 w-16">
                            <div className="absolute left-0 top-0 h-full w-full animate-spin rounded-full border-4 border-t-0 border-blue-500" />
                            <div
                              className="absolute left-0 top-0 h-full w-full animate-spin rounded-full border-4 border-t-0 border-red-500"
                              style={{ animationDelay: "-0.5s" }}
                            />
                            <div
                              className="absolute left-0 top-0 h-full w-full animate-spin rounded-full border-4 border-t-0 border-green-500"
                              style={{ animationDelay: "-1s" }}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
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
