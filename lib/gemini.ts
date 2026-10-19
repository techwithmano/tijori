import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export const ai = new Proxy({} as GoogleGenAI, {
  get(_target, prop) {
    const client = getGemini();
    if (!client) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }
    return (client as any)[prop];
  },
});

export default ai;

