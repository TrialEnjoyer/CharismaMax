import React, { useEffect, useRef, useState } from "react";
import Router from "next/router";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

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
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number>(0); // [1
  const messagesRef = useRef<HTMLDivElement>(null);
  const user = useUser();
  const supabase = useSupabaseClient();

  // Extract the conversation ID from the URL

  // Function to fetch conversation details
  const fetchConversation = async (id: number): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("Conversation")
        .select("*")
        .eq("id", conversationId || id)
        .single();
      if (error) {
        console.log(error);
        throw error;
      }
      setConversation(data);
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
        .eq("conversationId", conversationId || id);

      if (error) {
        console.log(error);
        throw error;
      }
      setMessages(data);
    } catch (error) {
      setError("Failed to fetch messages.");
    }
  };

  // Load the conversation and messages when the component mounts
  useEffect(() => {
    //perform user check, if user - then fetch Conversation
    const id = window.location.pathname.replace("/chat/", "");
    const convoId = parseInt(id);
    setConversationId(convoId);

    fetchMessages(convoId);
    fetchConversation(convoId);

    //setup subscription to messages

    const MessageSubscription = supabase
      .channel(`messages:${convoId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "Message" },
        (payload) => {
          const updatedMessages = messages.map((message) => {
            if (message.id === payload.new.id) {
              return payload.new;
            }
            return message;
          });
          setMessages(updatedMessages);
          console.log("updated message: ", payload.new);
          return;
        },
      )
      .subscribe();

    return () => {
      MessageSubscription.unsubscribe();
    };
  }, []);

  const handleSend = async () => {
    if (newMessage.trim() === "") {
      setError("Message cannot be empty.");
      return;
    }
    setLoading(true);
    try {
      const toDatabase = {
        conversationId,
        text: newMessage,
        userId: user.id,
        updatedAt: new Date(),
      };
      const { error } = await supabase.from("Message").insert(toDatabase);

      if (error) {
        console.log(error);
        throw error;
      }
      setNewMessage("");
      setError("");
      toDatabase["id"] = messages.length + 42;
      setMessages([...messages, toDatabase]);
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    const length = messages.length;
    if (length > 0) {
      if (messages[length - 1].reply) {
        setLoading(false);
      } else {
        setLoading(true);
      }
    }
    if (messagesRef.current) {
      setTimeout(() => {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }, 100);
    }
  }, [messages]);

  const handleHomeClick = async () => {
    await Router.push("/");
  };

  return (
    <div className="mx-auto flex max-h-screen w-full flex-col justify-between overflow-hidden bg-zinc-900 p-4 text-zinc-200">
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
        {messages.map((message) => (
          <div key={message.id} className="">
            <div>
              <p className="p-5 text-zinc-400">{message.text}</p>
            </div>
            <div className=" bg-zinc-800 p-5">
              {message.reply || (
                <span className=" text-center text-zinc-500">Thinking...</span>
              )}
              {loading && (
                <div className="flex justify-center">
                  {/** loading spinner */}
                  <div className="mt-10 h-16 w-16 animate-spin rounded-full border-b-4 border-t-4 border-amber-400"></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className=" w-full justify-end">
        <div className="mb-5 flex flex-row gap-3 self-end">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message here"
            disabled={false} //loading}
            className="flex min-h-[64px] flex-grow rounded border p-2 text-black"
            maxLength={500}
          />
          <button
            onClick={handleSend}
            disabled={false} //loading}
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

export default ConversationPage;
