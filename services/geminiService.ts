
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async *streamChat(messages: Message[], systemInstruction?: string) {
    const chat = this.ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: systemInstruction || "You are Easing, a helpful, concise, and calm AI assistant designed for daily use. Maintain a polite and soothing tone. Use markdown for structure when helpful.",
        temperature: 0.7,
      },
    });

    // We only send the last message because the internal Gemini chat state handles history
    // But for a fresh session or stateless call, we might want to map history
    // Since we create a fresh chat instance here, we can iterate messages if we wanted to seed history.
    // For simplicity in this ChatGPT-like app, we'll send the whole history in the first call if it's empty
    // but usually, we just use the chat session.
    
    // Convert our messages to Gemini format (excluding the very last one which we send as the prompt)
    const history = messages.slice(0, -1).map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    // Re-instantiate chat with history
    const chatWithHistory = this.ai.chats.create({
      model: MODEL_NAME,
      history: history,
      config: {
        systemInstruction: systemInstruction || "You are Easing, a helpful, calm AI assistant. Use markdown.",
      }
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chatWithHistory.sendMessageStream({ message: lastMessage });

    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      yield c.text || "";
    }
  }

  async generateTitle(firstMessage: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate a very short (max 4 words) descriptive title for a chat that starts with: "${firstMessage}". Return only the title text.`,
    });
    return response.text?.trim() || "New Chat";
  }
}

export const geminiService = new GeminiService();
