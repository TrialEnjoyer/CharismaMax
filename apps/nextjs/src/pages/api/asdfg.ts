/*const instructions = `
Rate the following messages from the user on a scale of 0 to 100 based on its clarity, politeness, effectiveness, and overall communication quality. Provide a short review on how the message could have been better, considering factors such as tone, clarity, and engagement. Then, craft an appropriate response to the message. Format your reply as a JSON object containing the score, review, and response.

Message: "${data.text}"

---

Response Format: 
{
  "score": [Your score out of 100],
  "review": "[Your review here]",
  "reply": "[Your response to the message here]"
}
 Always stick to the Response format. Do not mention anything about being an ai model - always reply as realistically as possible keeping the whole conversation in mind. 
`;*/

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  "https://ptuvhgjossijfhigdnfy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dXZoZ2pvc3NpamZoaWdkbmZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5OTIyODkxNywiZXhwIjoyMDE0ODA0OTE3fQ.QiVoU72R3cY14YVk3U5BydNMY8yJxczOgSpFZkTeUGw",
);

export const GenerateResponse = async (input): Promise<boolean> => {
  //console.log(input);
  console.log("Attempting the thing.");
  const openai = new OpenAI({
    apiKey: "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",
    dangerouslyAllowBrowser: true,
  }); //env.OPENAI_API_KEY);
  const data = input.record;

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo", // Specify the model
    messages: [
      {
        role: "system",
        content: `Rate the following messages from the user on a scale of 0 to 100 based on its clarity, politeness, effectiveness, and overall communication quality. Provide a short review on how the message could have been better, considering factors such as tone, clarity, and engagement. Then, craft an appropriate response to the message. Format your reply as a JSON object containing the score, review, and response.
    Response Format: 
    {
      "score": [Your score out of 100],
      "review": "[Your review here]",
      "reply": "[Your response to the message here]"
    }
    Always stick to the Response format. Do not mention anything about being an ai model. Always reply as realistically as possible keeping the whole conversation in mind. `,
      },
      { role: "user", content: data.text },
    ], //instructions,
    max_tokens: 50,
    response_format: { type: "json_object" },
  });

  console.log("Response: ", completion);
  //const response = JSON.parse(completion);
  /*
  data.reply = completion.reply;
  data.score = completion.score;
  data.review = completion.review;
  data.updatedDate = new Date();

  const { error } = await supabase
    .from("Message")
    .update(data)
    .eq("id", data.id);

  if (error) {
    console.log(error);
    return false;
  }
*/
  return true;
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      // Call your function with the request body or other data
      const reply = await GenerateResponse(req.body);

      if (!reply) {
        res
          .status(400)
          .json({ message: "Error: Bad Request - function failed" });
      }
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
