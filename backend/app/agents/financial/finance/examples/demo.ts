import { SunLifeFinancialAgent } from "../agent.js";
import { mockSunLifeDocuments } from "../mockData.js";
import { InMemorySunLifeRetriever } from "../retriever.js";

async function main(): Promise<void> {
  const agent = new SunLifeFinancialAgent({
    retriever: new InMemorySunLifeRetriever(mockSunLifeDocuments)
  });

  const response = await agent.answer({
    question: "I need help finding a Sun Life plan that can help cover braces for my teenager."
  });

  console.log(response.formatted);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
