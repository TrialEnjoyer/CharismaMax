import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Router from "next/router";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

import type { Characters, Conversation, Difficulty, Scenario } from "~/types";
import Beatrice from "../../public/Assets/Characters/Beatrice.png";
import Betty from "../../public/Assets/Characters/Betty.png";
import David from "../../public/Assets/Characters/David.png";
import Isaac from "../../public/Assets/Characters/Isaac.png";
import Meralda from "../../public/Assets/Characters/Meralda.png";

const scenariosList: Scenario[] = [
  {
    id: 1,
    created_at: new Date(),
    text: `Scenario: You accidentally bump into the character while walking through a crowded mall. After a brief moment of surprise, you start a conversation to apologize and make sure everything is okay.`,
    name: "Mall Encounter",
    intended_difficulty: null,
    description: null,
  },
  {
    id: 2,
    created_at: new Date(),
    text: `Scenario: At a local café, there's a mix-up with the drink orders, and you end up with the character's order. You approach them to rectify the mistake and strike up a conversation over the shared confusion.`,
    name: "Café Mix-up",
    intended_difficulty: null,
    description: null,
  },
  {
    id: 3,
    created_at: new Date(),
    text: `Scenario: You notice the character sitting alone in the park, deeply engrossed in a book or an activity. Intrigued, you approach them to ask about the book or what they are doing, initiating a conversation.`,
    name: "Park Observation",
    intended_difficulty: null,
    description: null,
  },
  {
    id: 4,
    created_at: new Date(),
    text: `Scenario: Both you and the character are waiting at a bus or train station when an announcement is made about an unexpected delay. You turn to the character to discuss the situation and share the inconvenience.`,
    name: "Public Transport Delay",
    intended_difficulty: null,
    description: null,
  },
  {
    id: 5,
    created_at: new Date(),
    text: `Scenario: At a neighborhood event or street fair, you and the character both show interest in the same booth or activity. This shared interest leads to a spontaneous conversation about the event and your experiences.`,
    name: "Street Fair",
    intended_difficulty: null,
    description: null,
  },
];

const difficultiesList: Difficulty[] = [
  {
    id: 1,
    created_at: new Date(),
    name: "Confidence Booster",
    text: `Interaction Ease: Characters are welcoming and open, facilitating easier and more positive exchanges.
    Tone: Supportive and uplifting, with characters encouraging expression and ideas.
    Scoring: Moderately lenient, focusing on effort and positive reinforcement.
    Feedback: Constructive and encouraging, highlighting strengths and offering gentle improvement suggestions.`,
    intended_rating: "Beginner to Easy",
  },
  {
    id: 2,
    created_at: new Date(),
    name: "Easy",
    text: `Interaction Ease: Characters are very cooperative, making conversations straightforward and less challenging.
    Tone: Friendly and non-confrontational, ensuring a relaxed and stress-free interaction environment.
    Scoring: Highly forgiving, with a focus on participation rather than precision or complexity.
    Feedback: Simple and positive, primarily acknowledging effort and participation without delving deeply into critique.`,
    intended_rating: "Easy",
  },
  {
    id: 3,
    created_at: new Date(),
    name: "Medium",
    text: `Interaction Ease: Characters offer a balanced mix of cooperation and mild challenges, making conversations more dynamic.
    Tone: Neutral and realistic, mirroring typical everyday interactions.
    Scoring: Fair and balanced, recognizing good effort and correct responses while noting obvious mistakes.
    Feedback: Constructive with a balance of praise and practical suggestions for improvement.`,
    intended_rating: "Medium",
  },
  {
    id: 4,
    created_at: new Date(),
    name: "Hard",
    text: `Interaction Ease: Characters are challenging and less predictable, requiring more thoughtful and precise communication.
    Tone: Critical yet realistic, with characters often presenting complex problems or counterarguments.
    Scoring: Strict and demanding, rewarding only well-crafted responses and penalizing inaccuracies or weak arguments.
    Feedback: Detailed and analytical, focusing on identifying areas for significant improvement and offering advanced tips.`,
    intended_rating: "Challenging to Hard",
  },
  {
    id: 5,
    created_at: new Date(),
    name: "Bad Day",
    text: `Interaction Ease: Characters are portrayed as having a rough day, making them less receptive and more irritable. This requires extra care and tact in communication.
    Tone: The tone is tense and unpredictable, reflecting the characters' moodiness and potential for overreaction.
    Scoring: Particularly strict, as even small missteps in tone or content can lead to negative reactions. Emphasis is on empathy and careful wording.
    Feedback: Candid and straightforward, highlighting the importance of emotional intelligence and adaptability in difficult conversations.`,
    intended_rating: "Hard",
  },
  {
    id: 6,
    created_at: new Date(),
    name: "Unhinged",
    text: `Interaction Ease: Characters display erratic and unpredictable behavior, requiring users to constantly adapt their communication strategies.
    Tone: Wildly fluctuating, ranging from excessively friendly to suddenly confrontational or nonsensical.
    Scoring: Extremely challenging, as the unpredictable nature of characters makes it difficult to consistently achieve positive outcomes.
    Feedback: Focuses on the user's ability to remain composed, think on their feet, and handle unexpected twists in conversation.`,
    intended_rating: "Hard - Extreme",
  },
  {
    id: 7,
    created_at: new Date(),
    name: "Extreme",
    text: `Interaction Ease: Characters are highly critical, skeptical, and present complex arguments or scenarios, demanding exceptional communication skills.
    Tone: Intense and intellectually demanding, with a focus on sophisticated discourse and intricate problem-solving.
    Scoring: Exacting and rigorous, rewarding only the most adept and well-constructed responses, while penalizing any logical fallacies or weak arguments.
    Feedback: In-depth and highly analytical, offering detailed critiques aimed at refining advanced communication and reasoning skills.`,
    intended_rating: "Extreme",
  },
];

const characterList: Characters[] = [
  {
    id: "Betty",
    backstory:
      "Name: Betty Occupation: Barista. Background: Mid-twenties, sociable and popular at the local café she works at, known for her friendly service and passion for coffee. Interests: Active on social media, particularly Instagram and TikTok. Loves traveling and exploring new cultures. Fashion enthusiast, known for her unique style. Personality: Outgoing, optimistic, and resourceful. Part-time marketing student and a cat owner named Mocha.",
    image: Betty.src,
    created_at: new Date(),
  },
  {
    id: "David",
    backstory: `Name: David
    Occupation: Mechanic
    Background: David is in his early thirties and works as a mechanic at a local garage. He's known for his practical skills and straightforward approach to solving mechanical problems.
    Interests:
    Passionate about rugby, playing in a local team during his off hours.
    Enjoys working on personal vehicle projects, often customizing cars or motorcycles.
    Personality: David is down-to-earth and physically robust, with a competitive spirit from his rugby experience. He's a team player both at work and on the rugby field, and he values hard work and determination.
    Additional Details:
    Often spends weekends either at rugby matches or in his garage working on a new project.
    Known for his friendly banter and being a reliable friend and colleague.`,
    image: David.src,
    created_at: new Date(),
  },
  {
    id: "Meralda",
    backstory: `Name: Meralda
    Background: Meralda is a young woman in her late teens. She has faced several challenges in her life, leading to her being somewhat withdrawn and introspective.
    Deeply passionate about birds, finding peace and solace in birdwatching and caring for them.
    Enjoys solitary activities, often spending time in nature or at bird sanctuaries.
    Meralda is introspective and quiet, often lost in her thoughts. She struggles with self-esteem issues and tends to avoid social interactions.
    Meralda has a plain appearance and doesn't pay much attention to fashion or trends.
    She often wears simple, comfortable clothing, usually with something that represents her love for birds, like a bird-themed accessory.
    Meralda finds comfort in writing and sketching, often documenting different bird species she encounters.
    Despite her social challenges, she has a deep empathy for animals and a keen interest in environmental conservation.`,
    image: Meralda.src,
    created_at: new Date(),
  },
  {
    id: "Isaac",
    backstory: `Name: Isaac
    Occupation: Insurance Broker
    Background: Isaac is in his late forties and has built a reputation in the insurance industry for his unique and sometimes abrasive negotiation style.
    Personality:
    Combative and Unpredictable: Isaac is known for his challenging demeanor in negotiations, often quickly changing his tone if things don't align with his expectations.
    Pragmatic: He has a sharp eye for practicality and monetary value, often judging others who pursue interests he sees as lacking tangible benefits.
    Interests:
    Enjoys engaging in theological discussions and community work through his part-time role as a rabbi.
    Has a peculiar habit of picking up loose change from the ground, symbolizing his keen attention to even small financial gains.
    Physical Appearance:
    Dresses smartly, often in a suit, reflecting his professional role.
    His facial expressions often convey skepticism or critical assessment.
    Additional Details:
    Isaac is respected for his intelligence and success but often finds it challenging to build warm personal relationships due to his abrasive nature.`,
    image: Isaac.src,
    created_at: new Date(),
  },
  {
    id: "Beatrice",
    backstory: `Name: Beatrice
    Background: Beatrice comes from a wealthy Tunisian merchant family. She has never needed to work, thanks to her family's affluence.
    Egotistical and Entitled: Beatrice is aware of her beauty and uses it to her advantage, often displaying a sense of entitlement.
    Mean and Abrasive: She can be quite harsh and dismissive, especially towards those who don't meet her standards or cater to her whims.
    Demanding: Beatrice often behaves as though others owe her attention or service, reflecting her upbringing in a wealthy family.
    Extremely beautiful, with an impeccable sense of style that reflects her wealth and status.
    Often dressed in high-end fashion, with an aura of sophistication and superiority.
    Enjoys social events and being the center of attention.
    Has a taste for luxury and exclusive experiences, be it in travel, dining, or fashion. Her life of privilege has shielded her from many of life's hardships, contributing to her disconnected and demanding demeanor.`,
    image: Beatrice.src,
    created_at: new Date(),
  },
];

function CreateConvoForm() {
  // first starts a convo, then sends message. when message is sent, trigger chat Gippity Goppity Give me the Zoppity to generate
  // desired info.
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const supabase = useSupabaseClient();
  const user = useUser();
  const [selectedScenario, setSelectedScenario] = useState<
    Scenario | undefined
  >();
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    Difficulty | undefined
  >();
  const [selectedCharacter, setSelectedCharacter] = useState<
    Characters | undefined
  >();
  const [scenarios, setScenarios] = useState<Scenario[]>(scenariosList);
  const [difficulties, setDifficulties] =
    useState<Difficulty[]>(difficultiesList);
  const [characters, setCharacters] = useState<Characters[]>(characterList);
  const [content, setContent] = useState<string>("");

  const createConversation = async () => {
    const toConversation: Conversation = {
      type: "basic",
      userId: user.id,
      title:
        selectedScenario?.name + " with " + selectedCharacter?.id || "untitled", //title: content.length > 20 ? content.slice(0, 20) + "..." : content,
      scenario_name: selectedScenario?.name,
      scenario_id: selectedScenario?.id.toString(),
      scenario_text: selectedScenario?.text,
      difficulty_name: selectedDifficulty?.name,
      difficulty_text: selectedDifficulty?.text,
      character_id: selectedCharacter?.id,
      character_text: selectedCharacter?.backstory,
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

  const DataChecks = () => {
    setLoading(true);
    if (!user) {
      setError("Please sign in to start a conversation.");
      setLoading(false);
      return;
    }
    if (content.length < 1) {
      setError("Please enter a message.");
      setLoading(false);
      return;
    }
    //Check for data, if data not present, randomize from lists.
    if (!selectedScenario) {
      const randomScenario =
        scenarios[Math.floor(Math.random() * scenarios.length)];
      setSelectedScenario(randomScenario);
    }
    if (!selectedDifficulty) {
      const randomDifficulty =
        difficulties[Math.floor(Math.random() * difficulties.length)];
      setSelectedDifficulty(randomDifficulty);
    }
    if (!selectedCharacter) {
      const randomCharacter =
        characters[Math.floor(Math.random() * characters.length)];
      setSelectedCharacter(randomCharacter);
    }
    setTimeout(() => {
      console.log(selectedScenario);
      console.log(selectedDifficulty);
      console.log(selectedCharacter);
      handleSend();
    }, 200);
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
      console.log(error);
      setError("Failed to create conversation.");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center justify-center">
        {/* Form Heading */}
        <h2 className="mb-4 text-2xl font-bold">Start a New Conversation</h2>

        {/* Error Message */}
        {error && (
          <div
            className="relative rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Scenario Selector */}
        <div className="mb-4 flex w-60 flex-col justify-center">
          <label
            htmlFor="scenario"
            className="mb-2 block text-center text-sm font-bold text-gray-400"
          >
            Choose a Scenario:
          </label>
          <select
            id="scenario"
            className="focus:shadow-outline rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
            onChange={(e) => {
              const scenario = scenarios.find(
                (scenario) => scenario.id.toString() === e.target.value,
              );
              console.log(scenario);
              setSelectedScenario(scenario);
            }}
          >
            <option key="Random">Random</option>
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Selector */}
        <div className="mb-4 flex w-60 flex-col justify-center">
          <label
            htmlFor="difficulty"
            className="mb-2 block text-center text-sm font-bold text-gray-500"
          >
            Select Difficulty:
          </label>
          <select
            id="difficulty"
            className="focus:shadow-outline rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
            onChange={(e) => {
              const difficulty = difficulties.find(
                (difficulty) => difficulty.id.toString() === e.target.value,
              );
              setSelectedDifficulty(difficulty);
            }}
          >
            <option value="Random">Random</option>
            {difficulties.map((difficulty) => (
              <option key={difficulty.id} value={difficulty.id}>
                {difficulty.name}
              </option>
            ))}
          </select>
        </div>

        {/* Character Selector */}
        <div className="mb-4 w-full">
          <label className="mb-2 block text-center text-sm font-bold text-gray-600">
            Select a Character:
          </label>
          <div className="flex flex-wrap justify-center gap-4">
            {characters.map((character) => (
              <div
                key={character.id}
                className={`relative h-24 w-24 cursor-pointer rounded-lg bg-cover bg-center ${
                  selectedCharacter?.id === character.id
                    ? "ring-2 ring-blue-500"
                    : ""
                }`}
                style={{ backgroundImage: `url(${character.image})` }}
                onClick={() => setSelectedCharacter(character)}
                title={character.id}
              >
                <h4 className="absolute bottom-0 left-0 right-0 bg-black/50 text-center font-bold text-white">
                  {character.id}
                </h4>
                {selectedCharacter?.id === character.id && (
                  <div className="absolute inset-0 rounded-lg bg-blue-500 opacity-25"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Text Input */}
        <div className="mb-4 w-[90%] sm:w-[80%] md:w-[65%]">
          <label
            htmlFor="content"
            className="mb-2 block text-center text-sm font-bold text-gray-700"
          >
            Your Conversation Starter:
          </label>
          <textarea
            id="content"
            className="focus:shadow-outline w-full rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
            rows={4}
            placeholder="Type your message here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          ></textarea>
        </div>

        {/* Send Button */}
        <button
          onClick={DataChecks}
          className="focus:shadow-outline rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 focus:outline-none"
          disabled={loading}
        >
          Start Conversation
        </button>
      </div>
    </div>
  );
}
/*
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
*/
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
        <title>CharismaMax</title>
        <meta name="description" content="CharismaMax" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col bg-zinc-900 text-zinc-200">
        <div className=" flex flex-row-reverse">
          <div className="container mt-12 flex flex-col items-center justify-center gap-4 px-4 py-8">
            <h1 className="my-20 text-center text-5xl font-extrabold tracking-tight text-lime-600 sm:text-[5rem]">
              Charisma<span className=" text-rose-700">Max</span>
            </h1>
            <AuthShowcase />
            <CreateConvoForm />
          </div>
          {/** Old conversations list */}
          {open ? (
            <div className="absolute inset-0 flex w-screen md:relative md:w-auto">
              <div className="absolute left-0 z-10 max-h-screen w-[80%] overflow-auto bg-zinc-900 p-5 md:relative md:max-w-md">
                <h3
                  onClick={() => {
                    setOpen(false);
                  }}
                  className="mb-4 bg-emerald-600 text-center text-xl font-semibold text-black"
                >
                  Conversations
                </h3>
                <div className="space-y-4">
                  {conversation.map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col items-center justify-center gap-2 rounded-lg bg-white/10 p-4 transition duration-300 ease-in-out hover:bg-white/20"
                    >
                      <Link href={`/chat/${c.id}`}>
                        <span className="text-xl font-bold">{c.title}</span>
                      </Link>
                      <p className="text-sm text-zinc-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div
                className="flex h-screen w-full bg-zinc-900 bg-opacity-80 md:hidden"
                onClick={handleOutsideClick}
              ></div>
            </div>
          ) : (
            <div className="absolute left-5 top-5">
              <button
                className="rounded-lg bg-white/10 px-5 py-2 font-semibold text-zinc-200 transition hover:bg-white/20"
                onClick={() => setOpen(true)}
              >
                Open Menu
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
