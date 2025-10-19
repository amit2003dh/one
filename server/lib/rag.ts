import OpenAI from "openai";
import type { KnowledgeBase, Email } from "@shared/schema";

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

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const client = getOpenAIClient();
    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to generate embedding");
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function findRelevantKnowledge(
  query: string,
  knowledgeEntries: KnowledgeBase[],
  topK: number = 3
): Promise<KnowledgeBase[]> {
  if (knowledgeEntries.length === 0) {
    return [];
  }

  const queryEmbedding = await generateEmbedding(query);
  
  const scoredEntries = knowledgeEntries
    .filter(entry => entry.embedding)
    .map(entry => {
      const embedding = JSON.parse(entry.embedding as string);
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      return { entry, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return scoredEntries.map(item => item.entry);
}

export interface SuggestedReply {
  reply: string;
  confidence: number;
  relevantKnowledge: string[];
}

export async function generateReply(
  email: Email,
  knowledgeEntries: KnowledgeBase[]
): Promise<SuggestedReply> {
  try {
    const client = getOpenAIClient();
    
    const emailContext = `
Subject: ${email.subject}
From: ${email.from}
Body: ${email.bodyText?.substring(0, 1000) || "No body"}
    `.trim();

    const relevantKnowledge = await findRelevantKnowledge(emailContext, knowledgeEntries, 3);
    
    const knowledgeContext = relevantKnowledge.length > 0
      ? relevantKnowledge.map(k => k.content).join("\n\n")
      : "No specific knowledge base available.";

    const prompt = `You are an AI email assistant. Based on the following knowledge base and the received email, generate a professional and contextually appropriate reply.

KNOWLEDGE BASE:
${knowledgeContext}

RECEIVED EMAIL:
${emailContext}

Generate a professional email reply that:
1. Acknowledges the email appropriately
2. Uses information from the knowledge base when relevant (e.g., meeting links, product info)
3. Is polite and professional
4. Stays on topic

Respond with JSON in this format: { "reply": "your suggested reply text", "confidence": 0.0-1.0 }`;

    const response = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a professional email assistant that generates contextually appropriate replies based on knowledge base information.",
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
      reply: result.reply || "Thank you for your email. I will get back to you shortly.",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.7)),
      relevantKnowledge: relevantKnowledge.map(k => k.content),
    };
  } catch (error) {
    console.error("Error generating reply:", error);
    throw new Error("Failed to generate reply suggestion");
  }
}
