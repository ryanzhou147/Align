import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
    const apiKey = "AIzaSyDhFiVFrqMxwmYgZ9_UMePQh_w9t3AK4HY";

    try {
        // Note: listModels is on the genAI instance directly in newer versions or via a different sub-service.
        // However, the Node SDK usually exposes models under genAI.
        // Let's try the direct listModels if available or search for it.

        // Actually, in @google/generative-ai, you might need to use a different approach.
        // Let's try to fetch from the API directly using axios to be sure.

        console.log("Fetching available models via REST API...");
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        console.log("Available Models:");
        console.log(JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("Failed to list models:", error.message || error);
    }
}

listModels();
