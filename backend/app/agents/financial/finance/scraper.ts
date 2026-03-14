import axios from "axios";
import type { WebScraper } from "./types.js";

export class AxiosWebScraper implements WebScraper {
    async scrape(url: string): Promise<string> {
        try {
            const response = await axios.get(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                }
            });

            // For this demo, we just return the raw HTML (or a text-representation if it's too large).
            // In production, you'd use a parser like Cheerio to extract relevant text.
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Failed to scrape ${url}: ${error.message}`);
            }
            throw error;
        }
    }
}
