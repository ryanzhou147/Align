export type UserNeedCategory =
  | "orthodontics"
  | "general_dental"
  | "preventive_dental"
  | "cost_estimate"
  | "coverage_eligibility"
  | "best_plan";

export interface UserContext {
  age?: number;
  employerSponsored?: boolean;
  dependants?: number;
  location?: string;
  notes?: string;
}

export interface AgentRequest {
  question: string;
  context?: UserContext;
}

export interface CoverageDetails {
  orthodonticCoverage: "yes" | "no" | "varies";
  reimbursementPercentage?: string;
  lifetimeMaximum?: string;
  waitingPeriod?: string;
  otherRelevantBenefits: string[];
}

export interface SourceReference {
  title: string;
  url: string;
  excerpt?: string;
}

export interface SunLifePlanDocument {
  id: string;
  planName: string;
  source: SourceReference;
  summary: string;
  categories: UserNeedCategory[];
  coverage: CoverageDetails;
  limitations: string[];
  keywords: string[];
}

export interface RetrievalResult {
  document: SunLifePlanDocument;
  score: number;
  matchedTerms: string[];
  rawContent?: string;
}

export interface RecommendationResult {
  userNeed: string;
  recommendedPlan: string;
  whyThisPlanFits: string;
  coverageDetails: CoverageDetails;
  estimatedCostInsight: string;
  sourceReferences: SourceReference[];
  relatedPlans: string[];
  disclaimer: string;
  retrievalResults: RetrievalResult[];
}

export interface AgentResponse {
  structured: RecommendationResult;
  formatted: string;
}

export interface SunLifeRetriever {
  retrieve(input: {
    query: string;
    categories: UserNeedCategory[];
    limit?: number;
  }): Promise<RetrievalResult[]>;
}

export interface WebScraper {
  scrape(url: string): Promise<string>;
}

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmClient {
  complete(input: { messages: LlmMessage[] }): Promise<string>;
}
