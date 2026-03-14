import type {
  RetrievalResult,
  SunLifePlanDocument,
  SunLifeRetriever,
  UserNeedCategory
} from "./types.js";

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export class InMemorySunLifeRetriever implements SunLifeRetriever {
  constructor(private readonly documents: SunLifePlanDocument[]) {}

  async retrieve(input: {
    query: string;
    categories: UserNeedCategory[];
    limit?: number;
  }): Promise<RetrievalResult[]> {
    const queryTerms = new Set(tokenize(input.query));
    const categorySet = new Set(input.categories);

    const results = this.documents
      .map((document) => {
        const matchedTerms = document.keywords.filter((keyword) =>
          queryTerms.has(keyword.toLowerCase())
        );
        const categoryScore = document.categories.some((category) => categorySet.has(category))
          ? 4
          : 0;
        const keywordScore = matchedTerms.length * 2;
        const orthodonticBoost =
          queryTerms.has("braces") || queryTerms.has("orthodontic")
            ? document.coverage.orthodonticCoverage === "yes"
              ? 3
              : 0
            : 0;

        return {
          document,
          score: categoryScore + keywordScore + orthodonticBoost,
          matchedTerms
        };
      })
      .filter((result) => result.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, input.limit ?? 5);

    return results;
  }
}
