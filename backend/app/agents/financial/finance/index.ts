export { SunLifeFinancialAgent, classifyUserNeed } from "./agent.js";
export { SunLifeWebRetriever } from "./retriever.js";
export {
  formatRecommendation,
  SUN_LIFE_SYSTEM_PROMPT
} from "./prompt.js";
export type {
  AgentRequest,
  AgentResponse,
  CoverageDetails,
  LlmClient,
  LlmMessage,
  RecommendationResult,
  RetrievalResult,
  SourceReference,
  SunLifePlanDocument,
  SunLifeRetriever,
  UserContext,
  UserNeedCategory,
  WebScraper
} from "./types.js";
