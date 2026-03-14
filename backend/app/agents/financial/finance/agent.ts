import {
  buildRecommendationPrompt,
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
  "This assistant provides educational insurance information based on retrieved Sun Life sources and is not a licensed financial advisor.";

export class SunLifeFinancialAgent {
  constructor(
    private readonly dependencies: {
      retriever: SunLifeRetriever;
      llm?: LlmClient;
    }
  ) {}

  async answer(request: AgentRequest): Promise<AgentResponse> {
    const categories = classifyUserNeed(request.question);
    const userNeed = summarizeUserNeed(request.question, categories);
    const retrievalResults = await this.dependencies.retriever.retrieve({
      query: buildRetrievalQuery(request),
      categories,
      limit: 3
    });

    if (retrievalResults.length === 0) {
      const emptyResult: RecommendationResult = {
        userNeed,
        recommendedPlan: "No matching Sun Life source found",
        whyThisPlanFits:
          "I could not find a retrieved Sun Life source that clearly matches this dental request yet.",
        coverageDetails: {
          orthodonticCoverage: "varies",
          otherRelevantBenefits: ["Please retrieve additional Sun Life plan documents before recommending"]
        },
        estimatedCostInsight:
          "Without a matching Sun Life source, I cannot estimate how coverage would affect treatment costs.",
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
    const prompt = buildRecommendationPrompt({
      userQuestion: question,
      userNeed,
      retrievalResults
    });

    const completion = await this.dependencies.llm!.complete({
      messages: [
        { role: "system", content: SUN_LIFE_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ]
    });

    const fallback = this.generateDeterministicRecommendation(userNeed, retrievalResults);
    return {
      ...fallback,
      whyThisPlanFits: completion.trim() || fallback.whyThisPlanFits
    };
  }

  private generateDeterministicRecommendation(
    userNeed: string,
    retrievalResults: RetrievalResult[]
  ): RecommendationResult {
    const [best, ...rest] = retrievalResults;

    return {
      userNeed,
      recommendedPlan: best.document.planName,
      whyThisPlanFits: buildWhyThisPlanFits(userNeed, best, rest),
      coverageDetails: best.document.coverage,
      estimatedCostInsight: buildEstimatedCostInsight(best),
      sourceReferences: retrievalResults.map((result) => result.document.source),
      relatedPlans: rest.map((result) => result.document.planName),
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

function buildRetrievalQuery(request: AgentRequest): string {
  const details = request.context?.notes ? ` ${request.context.notes}` : "";
  return `${request.question}${details}`;
}

function buildWhyThisPlanFits(
  userNeed: string,
  best: RetrievalResult,
  alternatives: RetrievalResult[]
): string {
  const normalizedNeed = userNeed.endsWith(".") ? userNeed.slice(0, -1) : userNeed;
  const comparison =
    alternatives.length > 0
      ? ` It ranked ahead of ${alternatives
          .map((result) => result.document.planName)
          .join(", ")} based on the retrieved coverage match.`
      : "";

  const orthodonticLine =
    best.document.coverage.orthodonticCoverage === "yes"
      ? " The retrieved source indicates orthodontic support, which matters for braces-focused questions."
      : best.document.coverage.orthodonticCoverage === "varies"
        ? " The retrieved source shows that coverage depends on the employer or plan design, so users should verify their exact benefits."
        : "";

  return `${best.document.planName} is the strongest retrieved match for this need: ${normalizedNeed}.${orthodonticLine}${comparison}`.trim();
}

function buildEstimatedCostInsight(best: RetrievalResult): string {
  if (best.document.coverage.orthodonticCoverage === "yes") {
    return "Orthodontic treatment can be expensive, so a plan with orthodontic support may reduce out-of-pocket costs, subject to reimbursement rules, waiting periods, and plan maximums in the retrieved Sun Life source.";
  }

  if (best.document.coverage.orthodonticCoverage === "varies") {
    return "Your final cost depends on the employer-selected Sun Life coverage, so reimbursement and maximums should be checked against the exact group benefits booklet or plan page.";
  }

  return "This plan may help with routine dental costs, but orthodontic expenses may remain mostly out of pocket if braces or aligners are not included.";
}
