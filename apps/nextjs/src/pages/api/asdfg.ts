import { useSupabaseClient } from "@supabase/auth-helpers-react";
import OpenAI from "openai";

export const asdfg = async (input) => {
  //  const openai = new OpenAI();
  //const supabase = useSupabaseClient().auth.admin;
  console.log(input);
  //const completion = await openai.chat.completions.create({

  //})
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      // Call your function with the request body or other data
      await asdfg(req.body);

      // Send a response back
      res.status(200).json({ message: "Function executed successfully" });
    } catch (error) {
      // Handle errors
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    // Handle non-POST requests
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
