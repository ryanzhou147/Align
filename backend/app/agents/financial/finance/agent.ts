import {
  formatRecommendation,
  SUN_LIFE_SYSTEM_PROMPT
} from "./prompt.js";
import type {
  AgentRequest,
  AgentResponse,
  LlmClient,
  RecommendationResult,
  RetrievalResult,
  SunLifeRetriever,
  UserNeedCategory
} from "./types.js";

const DEFAULT_DISCLAIMER =
  "This assistant provides educational insurance information based on live data retrieved from Sun Life sources and is not a licensed financial advisor.";

export class SunLifeFinancialAgent {
  constructor(
    private readonly dependencies: {
      retriever: SunLifeRetriever;
      llm?: LlmClient;
    }
  ) { }

  async answer(request: AgentRequest): Promise<AgentResponse> {
    const categories = classifyUserNeed(request.question);
    const userNeed = summarizeUserNeed(request.question, categories);

    // The retriever now fetches live web data instead of mock data.
    const retrievalResults = await this.dependencies.retriever.retrieve({
      query: request.question,
      categories,
      limit: 1
    });

    if (retrievalResults.length === 0) {
      const emptyResult: RecommendationResult = {
        userNeed,
        recommendedPlan: "No matching Sun Life source found",
        whyThisPlanFits:
          "I could not retrieve live Sun Life data for this request at the moment.",
        coverageDetails: {
          orthodonticCoverage: "varies",
          otherRelevantBenefits: ["Please check Sun Life's official website directly."]
        },
        estimatedCostInsight:
          "Without live data, I cannot estimate how coverage would affect treatment costs.",
        sourceReferences: [],
        relatedPlans: [],
        disclaimer: DEFAULT_DISCLAIMER,
        retrievalResults: []
      };

      return {
        structured: emptyResult,
        formatted: formatRecommendation(emptyResult)
      };
    }

    // If an LLM (Gemini) is provided, it will analyze the scraped content.
    // Otherwise, we provide a deterministic notification.
    const structured = this.dependencies.llm
      ? await this.generateWithLlm(request.question, userNeed, retrievalResults)
      : this.generateDeterministicRecommendation(userNeed, retrievalResults);

    return {
      structured,
      formatted: formatRecommendation(structured)
    };
  }

  private async generateWithLlm(
    question: string,
    userNeed: string,
    retrievalResults: RetrievalResult[]
  ): Promise<RecommendationResult> {
    // Enhanced prompt includes the scraped content for Gemini to analyze
    const context = retrievalResults
      .map(r => `Source: ${r.document.source.url}\nContent: ${r.rawContent ?? "No content found"}`)
      .join("\n\n");

    const prompt = `User Question: ${question}
Detected Need: ${userNeed}

Below is the live content retrieved from Sun Life's website. Please analyze it to provide the most optimal finance solution for the user:

${context}

Please provide your analysis following the required structure.`;

    const completion = await this.dependencies.llm!.complete({
      messages: [
        { role: "system", content: SUN_LIFE_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ]
    });

    const fallback = this.generateDeterministicRecommendation(userNeed, retrievalResults);

    // In a real implementation, you'd parse the LLM's structured output.
    // Here we use the completion as the primary reasoning.
    return {
      ...fallback,
      whyThisPlanFits: completion.trim() || fallback.whyThisPlanFits
    };
  }

  private generateDeterministicRecommendation(
    userNeed: string,
    retrievalResults: RetrievalResult[]
  ): RecommendationResult {
    const [best] = retrievalResults;

    return {
      userNeed,
      recommendedPlan: best.document.planName,
      whyThisPlanFits: "Live data has been retrieved and is ready for LLM analysis.",
      coverageDetails: best.document.coverage,
      estimatedCostInsight: "Detailed cost insights will be provided once the Gemini key is configured.",
      sourceReferences: [best.document.source],
      relatedPlans: [],
      disclaimer: DEFAULT_DISCLAIMER,
      retrievalResults
    };
  }
}

export function classifyUserNeed(question: string): UserNeedCategory[] {
  const normalized = question.toLowerCase();
  const categories = new Set<UserNeedCategory>();

  if (/(brace|orthodont|aligner|invisalign)/.test(normalized)) {
    categories.add("orthodontics");
  }
  if (/(cleaning|checkup|cavity|filling|root canal|dental)/.test(normalized)) {
    categories.add("general_dental");
  }
  if (/(preventive|preventative|checkup|cleaning|exam)/.test(normalized)) {
    categories.add("preventive_dental");
  }
  if (/(cost|price|estimate|expensive|out of pocket)/.test(normalized)) {
    categories.add("cost_estimate");
  }
  if (/(eligible|eligibility|qualify|employer|work benefits|group plan)/.test(normalized)) {
    categories.add("coverage_eligibility");
  }
  if (/(best|recommend|which plan|what plan)/.test(normalized)) {
    categories.add("best_plan");
  }

  if (categories.size === 0) {
    categories.add("best_plan");
    categories.add("general_dental");
  }

  return [...categories];
}

function summarizeUserNeed(question: string, categories: UserNeedCategory[]): string {
  if (categories.includes("orthodontics")) {
    return "Coverage for orthodontic treatment such as braces or aligners.";
  }
  if (categories.includes("preventive_dental")) {
    return "Support for preventive dental care such as exams and cleanings.";
  }
  if (categories.includes("coverage_eligibility")) {
    return "Help understanding whether a Sun Life plan includes eligible dental coverage.";
  }
  if (categories.includes("cost_estimate")) {
    return "Help estimating how Sun Life dental coverage could reduce out-of-pocket costs.";
  }
  if (categories.includes("general_dental")) {
    return "Coverage for general dental treatment.";
  }
  return `Help choosing the best Sun Life dental plan for: ${question}`;
}
