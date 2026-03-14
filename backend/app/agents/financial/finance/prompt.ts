import type { RecommendationResult, RetrievalResult } from "./types.js";

export const SUN_LIFE_SYSTEM_PROMPT = `You are SunLife Financial Agent, an AI insurance advisor embedded inside a virtual dental clinic application.

Your purpose is to help users understand which Sun Life insurance plan best supports their dental or orthodontic treatment.

You operate inside a booth labeled "Sun Life Insurance Booth". Users interact with you through a chat interface.

Responsibilities:
1. Retrieve and analyze information from Sun Life insurance documentation and webpages.
2. Identify which Sun Life plans include dental or orthodontic coverage.
3. Compare plans and determine which plan is most suitable for the user's dental needs.
4. Explain coverage clearly, including reimbursements, limitations, waiting periods, and cost implications.
5. Provide structured, easy-to-understand recommendations.

Rules:
- Only use information retrieved from Sun Life sources.
- Do not invent insurance policies or numbers.
- If exact numbers are unavailable, say "coverage varies by plan and employer policy".
- Do not present yourself as a licensed financial advisor.
- Do not give medical diagnoses.
- Always explain insurance concepts in simple language.

Required response format:
SUN LIFE PLAN RECOMMENDATION

User Need:
(short explanation)

Recommended Plan:
(plan name)

Why This Plan Fits:
(clear reasoning)

Coverage Details:
- orthodontic coverage
- reimbursement percentage
- lifetime maximum
- waiting period
- other relevant benefits

Estimated Cost Insight:
(plain-language estimate explanation)

Source Reference:
(Sun Life pages or documents only)`;

export function buildRecommendationPrompt(input: {
  userQuestion: string;
  userNeed: string;
  retrievalResults: RetrievalResult[];
}): string {
  const sources = input.retrievalResults
    .map((result, index) => {
      const { document } = result;
      return [
        `Source ${index + 1}: ${document.planName}`,
        `URL: ${document.source.url}`,
        `Summary: ${document.summary}`,
        `Coverage: orthodontic=${document.coverage.orthodonticCoverage}, reimbursement=${document.coverage.reimbursementPercentage ?? "coverage varies by plan and employer policy"}, lifetime maximum=${document.coverage.lifetimeMaximum ?? "coverage varies by plan and employer policy"}, waiting period=${document.coverage.waitingPeriod ?? "coverage varies by plan and employer policy"}`,
        `Other benefits: ${document.coverage.otherRelevantBenefits.join("; ") || "None specified"}`,
        `Limitations: ${document.limitations.join("; ") || "None specified"}`
      ].join("\n");
    })
    .join("\n\n");

  return [
    `User question: ${input.userQuestion}`,
    `Detected need: ${input.userNeed}`,
    "Use only the sources below.",
    sources,
    "Recommend the single best matching plan, mention uncertainty when the source does not provide exact figures, and preserve the required response structure."
  ].join("\n\n");
}

export function formatRecommendation(result: RecommendationResult): string {
  const coverage = result.coverageDetails;
  const sources = result.sourceReferences
    .map((source) => `• ${source.title}: ${source.url}`)
    .join("\n");

  return [
    "SUN LIFE PLAN RECOMMENDATION",
    "",
    "User Need:",
    result.userNeed,
    "",
    "Recommended Plan:",
    result.recommendedPlan,
    "",
    "Why This Plan Fits:",
    result.whyThisPlanFits,
    "",
    "Coverage Details:",
    `• Orthodontic coverage: ${coverage.orthodonticCoverage}`,
    `• Reimbursement percentage: ${coverage.reimbursementPercentage ?? "coverage varies by plan and employer policy"}`,
    `• Lifetime maximum: ${coverage.lifetimeMaximum ?? "coverage varies by plan and employer policy"}`,
    `• Waiting period: ${coverage.waitingPeriod ?? "coverage varies by plan and employer policy"}`,
    `• Other relevant benefits: ${coverage.otherRelevantBenefits.join("; ") || "None specified"}`,
    "",
    "Estimated Cost Insight:",
    result.estimatedCostInsight,
    "",
    "Source Reference:",
    sources,
    "",
    `Note: ${result.disclaimer}`
  ].join("\n");
}
