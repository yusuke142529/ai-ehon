//src/services/openaiClient.ts

"use server"

import OpenAI from "openai";

let openai: OpenAI | null = null;

export async function getOpenAI(): Promise<OpenAI| null> {
  if (openai) return openai;

  const apiKey = process.env.OPENAI_API_KEY;
  if(!apiKey) {
    console.error("Missing OPENAI_API_KEY in env");
    return null;
  }

  openai = new OpenAI({ apiKey });
  return openai;
}