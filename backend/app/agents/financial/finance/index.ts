export { SunLifeFinancialAgent, classifyUserNeed } from "./agent.js";
export { InMemorySunLifeRetriever } from "./retriever.js";
export { mockSunLifeDocuments } from "./mockData.js";
export {
  buildRecommendationPrompt,
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
  UserNeedCategory
} from "./types.js";
