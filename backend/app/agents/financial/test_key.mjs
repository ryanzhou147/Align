import { GoogleGenerativeAI } from "@google/generative-ai";

async function test() {
    const apiKey = "AIzaSyDhFiVFrqMxwmYgZ9_UMePQh_w9t3AK4HY";
    const genAI = new GoogleGenerativeAI(apiKey);

    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];

    for (const modelName of models) {
        try {
            console.log(`Testing ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello, are you there?");
            console.log(`${modelName} Success:`, (await result.response).text());
            break; // Stop if one works
        } catch (error) {
            console.error(`${modelName} failed:`, error.message || error);
        }
    }
}

test();
