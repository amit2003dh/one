import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.");
  }
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

export interface EmailCategorizationResult {
  category: "Interested" | "Meeting Booked" | "Not Interested" | "Spam" | "Out of Office";
  confidence: number;
}

export async function categorizeEmail(
  subject: string,
  body: string,
  from: string
): Promise<EmailCategorizationResult> {
  try {
    const client = getOpenAIClient();
    const prompt = `Analyze this email and categorize it into one of these categories:
- "Interested": The sender shows interest in your product/service/proposal
- "Meeting Booked": The email is about scheduling or confirming a meeting
- "Not Interested": The sender declines or shows no interest
- "Spam": The email is promotional, unsolicited, or irrelevant
- "Out of Office": Auto-reply indicating the person is away

Email Details:
From: ${from}
Subject: ${subject}
Body: ${body.substring(0, 1000)}

Respond with JSON in this format: { "category": "category_name", "confidence": 0.0-1.0 }`;

    const response = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an email categorization expert. Analyze emails and categorize them accurately based on their content and intent.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      category: result.category,
      confidence: Math.max(0, Math.min(1, result.confidence || 0.8)),
    };
  } catch (error) {
    console.error("Error categorizing email:", error);
    throw new Error("Failed to categorize email");
  }
}
