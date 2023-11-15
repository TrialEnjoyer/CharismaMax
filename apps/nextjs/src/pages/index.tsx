import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Router from "next/router";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

function CreateConvoForm() {
  // first starts a convo, then sends message. when message is sent, trigger chat Gippity Goppity Give me the Zoppity to generate
  // desired info.
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const supabase = useSupabaseClient();
  const user = useUser();

  const [content, setContent] = useState("");

  const createConversation = async () => {
    const toConversation: {
      createdAt?: string;
      id?: number;
      review?: string | null;
      score?: number | null;
      type: string;
      userId: string;
      title: string;
    } = {
      type: "basic",
      userId: user.id,
      title: content.length > 20 ? content.slice(0, 20) + "..." : content,
    };
    const { data, error } = await supabase
      .from("Conversation")
      .insert(toConversation)
      .select("id");
    if (error) {
      console.log(error);
      throw error;
    }
    return data[0] as {
      id: number;
    };
  };

  const sendMessage = async (conversationId: number, text: string) => {
    const toMessage: {
      conversationId: number;
      text: string;
      userId: string;
      updatedAt?: Date;
    } = {
      conversationId,
      text,
      userId: user.id,
      updatedAt: new Date(),
    };
    const { error } = await supabase.from("Message").insert(toMessage);
    if (error) {
      console.log(error);
      throw error;
    }
    return;
  };

  const handleSend = async () => {
    try {
      // Create a new conversation
      const conversation = await createConversation();

      // Assuming you have a function to send a message
      await sendMessage(conversation.id, content);

      // Change screen to the chat screen
      await Router.push(`/chat/${conversation.id}`);

      // Clear the form and reset states - probably should just leave them as is????
      setContent("");
      setLoading(false);
      setError("");
    } catch (error) {
      setError("Failed to create conversation.");
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-2xl flex-col p-4">
      <textarea
        disabled={loading}
        className=" mb-2 min-h-[64px] rounded bg-white/10 p-2 text-zinc-200"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type here to start a conversation"
      />
      <button
        className="rounded bg-emerald-400 p-2 font-bold text-zinc-900"
        disabled={loading}
        onClick={handleSend}
      >
        Create Conversation!
      </button>
      {error.length > 0 && (
        <span className="mt-2 text-red-500">
          <p>{error}</p>
        </span>
      )}
    </div>
  );
}

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

export default function HomePage() {
  const user = useUser();
  const supabase = useSupabaseClient();
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<
    {
      id: number;
      title: string;
      createdAt: Date;
      userId: string;
    }[]
  >([]);

  useEffect(() => {
    if (user) {
      //fetch all conversations to be listed in a sidebar
      FetchConversations();
    }
  }, [user]);

  const FetchConversations = async () => {
    const { data: conversations, error } = await supabase
      .from("Conversation")
      .select("*")
      .eq("userId", user.id)
      .order("createdAt", { ascending: false });
    if (error) {
      console.log(error);
      throw error;
    }
    if (conversations) {
      setConversation(conversations);
    }
  };

  const handleOutsideClick = (event) => {
    setOpen(false);
  };

  return (
    <>
      <Head>
        <title>END ME.</title>
        <meta name="description" content="CharismaMax" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col bg-zinc-900 text-zinc-200">
        <div className=" flex flex-row-reverse">
          <div className="container mt-12 flex flex-col items-center justify-center gap-4 px-4 py-8">
            <h1 className="my-20 text-center text-5xl font-extrabold tracking-tight sm:text-[5rem]">
              <span className="text-fuchsia-500">END</span> me{" "}
              <span className="text-emerald-400">(Placeholder)</span>
            </h1>
            <AuthShowcase />
            <CreateConvoForm />
          </div>
          {/** Old conversations list */}
          {open ? (
            <div className=" absolute flex w-screen md:static md:w-auto">
              <div className=" absolute left-0 flex max-h-screen max-w-full flex-col self-start bg-zinc-900 px-5 pt-5 md:static">
                <h3 className="bg-emerald-600 text-center text-xl font-semibold text-black">
                  Conversations
                </h3>
                <div className="overflow-scroll">
                  {conversation.map((c) => {
                    return (
                      <div
                        key={c.id}
                        className="my-3 flex max-w-2xl flex-col items-center justify-center gap-4 rounded-lg bg-white/10 p-4"
                      >
                        <Link href={`/chat/${c.id}`}>
                          <span className="text-xl font-bold">{c.title}</span>
                        </Link>
                        <p className="text-sm text-zinc-400">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div
                className=" flex h-screen flex-grow bg-zinc-900 bg-opacity-80"
                onClick={handleOutsideClick}
              ></div>
            </div>
          ) : (
            <div className="absolute left-5 top-5">
              <button
                className="rounded-lg bg-white/10 px-5 py-2 font-semibold text-zinc-200 no-underline transition hover:bg-white/20"
                onClick={() => setOpen(true)}
              >
                V
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function AuthShowcase() {
  const supabase = useSupabaseClient();
  const user = useUser();
  /*const { data: secretMessage } = api.auth.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: !!user },
  );*/

  return (
    <div className="absolute right-5 top-5 flex flex-col items-center justify-center gap-4">
      {!user && (
        <Link
          className="flex items-center gap-1 rounded-lg bg-white/10 px-10 py-3 font-semibold text-zinc-200 no-underline transition hover:bg-white/20"
          href="/signin"
        >
          Sign In
        </Link>
      )}
      {user && (
        <>
          {/*<p className="text-center text-2xl text-zinc-200">
            {user && <span>Logged in as {user?.user_metadata?.name}</span>}
            {secretMessage && <span> - {secretMessage}</span>}
          </p>*/}
          <button
            className="rounded-lg bg-white/10 px-10 py-3 font-semibold text-zinc-200 no-underline transition hover:bg-white/20"
            onClick={() => void supabase.auth.signOut()}
          >
            Sign Out
          </button>
        </>
      )}
    </div>
  );
}
