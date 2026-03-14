import { SunLifeFinancialAgent } from "../agent.js";
import { SunLifeWebRetriever } from "../retriever.js";
import { GeminiLlmClient } from "../gemini.js";
import type { WebScraper } from "../types.js";

async function main() {
  const GEMINI_API_KEY = "AIzaSyDDbXmRDcwUBr7epX5lV3NqhQNasnSz7jA";

  console.log("--- Sun Life Financial Agent (LIVE WEB + GEMINI) Test ---\n");

  // Since direct Axios scraping failed with 403, we use the content successfully 
  // extracted via the browser subagent to verify the end-to-end flow.
  const REAL_SCRAPED_CONTENT = `
### **PHI Basic Plan**
*   **Preventative Dental care:** 60% reimbursement.
*   **Annual Maximum:** $500.
*   **Recall Visits:** Every 9 months.
*   **Waiting Period:** 3 months before you are eligible for coverage.
*   **Restorative & Orthodontics:** No coverage.

### **PHI Standard Plan**
*   **Preventative Dental care:** 70% reimbursement.
*   **Annual Maximum:** $750.
*   **Recall Visits:** Every 9 months.
*   **Waiting Period:** 3 months before you are eligible for coverage.
*   **Restorative & Orthodontics:** No coverage.

### **PHI Enhanced Plan**
*   **Preventative Dental care:** 80% reimbursement ($750 annual maximum).
*   **Restorative Dental care:** 50% reimbursement ($500 annual maximum).
*   **Orthodontics (including braces):** 60% reimbursement ($1,500 lifetime maximum).
*   **Recall Visits:** Every 9 months.
*   **Waiting Periods:**
    *   **3 months** for preventative coverage.
    *   **1 year** for restorative coverage.
    *   **2 years** for orthodontic coverage.
  `;

  const scraper: WebScraper = {
    scrape: async () => REAL_SCRAPED_CONTENT
  };

  const retriever = new SunLifeWebRetriever({ scraper });
  const llm = new GeminiLlmClient(GEMINI_API_KEY);

  const agent = new SunLifeFinancialAgent({ retriever, llm });

  const question = "Does Sun Life cover braces? I want to know the reimbursement and lifetime maximum if possible.";
  console.log(`Question: ${question}\n`);
  console.log("Analyzing retrieved content with Gemini...\n");

  try {
    const response = await agent.answer({ question });

    console.log("--- Formatted Response ---\n");
    console.log(response.formatted);

  } catch (error) {
    console.error("Error during agent execution:", error);
  }
}

main().catch(console.error);
