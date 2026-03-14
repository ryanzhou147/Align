import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LlmClient, LlmMessage } from "./types.js";

export class GeminiLlmClient implements LlmClient {
    private readonly genAI: GoogleGenerativeAI;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async complete(input: { messages: LlmMessage[] }): Promise<string> {
        const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Convert LlmMessage format to Gemini's expected Content format if needed,
        // but for simple completion, we can use the system prompt + user message.
        const systemPrompt = input.messages.find((m) => m.role === "system")?.content || "";
        const userMessage = input.messages.find((m) => m.role === "user")?.content || "";

        const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${userMessage}` : userMessage;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
    }
}
