import { SunLifeFinancialAgent } from "../agent.js";
import { SunLifeWebRetriever } from "../retriever.js";
import type { LlmClient, LlmMessage, WebScraper } from "../types.js";

async function main() {
  console.log("--- Sun Life Financial Agent (Web + LLM) Demo ---\n");

  const mockScraper: WebScraper = {
    scrape: async (url) => {
      return `[Mock Scraped Content from ${url}]
      Sun Life Dental Insurance covers cleanings, exams, and orthodontic treatments.
      Reimbursement varies by plan but can be up to 80%.
      Waiting periods apply for some major restorative work.`;
    }
  };

  const retriever = new SunLifeWebRetriever({ scraper: mockScraper });

  // 1. Deterministic Demo (No LLM)
  console.log("1. No LLM (Deterministic Notification):");
  const agentNoLlm = new SunLifeFinancialAgent({ retriever });
  const responseNoLlm = await agentNoLlm.answer({
    question: "Does Sun Life cover braces?"
  });
  console.log(responseNoLlm.formatted);
  console.log("\n---------------------------------\n");

  // 2. Mock LLM Demo
  console.log("2. With Mock LLM (Gemini-ready):");
  const mockLlm: LlmClient = {
    complete: async (input: { messages: LlmMessage[] }) => {
      return `SUN LIFE PLAN RECOMMENDATION

User Need:
Coverage for orthodontic treatment such as braces or aligners.

Recommended Plan:
Sun Life Extended Dental (Analyzed from Web Data)

Why This Fits:
Based on the live data retrieved, Sun Life's dental plans generally provide support for orthodontic care, with reimbursement levels vary by employer.

Coverage Details:
• Orthodontic coverage: varies
• Reimbursement percentage: up to 80%
• Lifetime maximum: varies
• Waiting period: check group booklet

Estimated Cost Insight:
Since this is an orthodontic request, costs can be significant. This plan helps reduce out-of-pocket exposure significantly.

Source Reference:
• Sun Life Personal Dental Insurance: https://www.sunlife.ca/en/explore-products/insurance/health-insurance/personal-health-insurance/dental-insurance/`;
    }
  };

  const agentWithLlm = new SunLifeFinancialAgent({ retriever, llm: mockLlm });
  const responseWithLlm = await agentWithLlm.answer({
    question: "Does Sun Life cover braces?"
  });
  console.log(responseWithLlm.formatted);
}

main().catch(console.error);
