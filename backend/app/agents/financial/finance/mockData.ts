import type { SunLifePlanDocument } from "./types.js";

export const mockSunLifeDocuments: SunLifePlanDocument[] = [
  {
    id: "phi-basic-dental",
    planName: "Sun Life Personal Health Insurance - Basic",
    source: {
      title: "Sun Life Personal Health Insurance - Basic",
      url: "https://www.sunlife.ca/en/insurance/personal-health-insurance/basic/",
      excerpt: "Example source placeholder for plan-level dental benefits."
    },
    summary:
      "Entry-level personal health coverage with routine dental support and no orthodontic focus in the source summary.",
    categories: ["general_dental", "preventive_dental", "best_plan"],
    coverage: {
      orthodonticCoverage: "no",
      reimbursementPercentage: "coverage varies by plan and employer policy",
      lifetimeMaximum: "coverage varies by plan and employer policy",
      waitingPeriod: "coverage varies by plan and employer policy",
      otherRelevantBenefits: ["Routine dental support", "Preventive care may be included"]
    },
    limitations: [
      "Orthodontic treatment is not described in this source summary",
      "Exact reimbursement may vary"
    ],
    keywords: ["dental", "cleaning", "checkup", "preventive", "basic"]
  },
  {
    id: "phi-enhanced-dental-ortho",
    planName: "Sun Life Personal Health Insurance - Enhanced",
    source: {
      title: "Sun Life Personal Health Insurance - Enhanced",
      url: "https://www.sunlife.ca/en/insurance/personal-health-insurance/enhanced/",
      excerpt: "Example source placeholder for enhanced dental and orthodontic support."
    },
    summary:
      "Enhanced personal health coverage positioned for broader dental support, including orthodontic-related needs when available in the source material.",
    categories: ["orthodontics", "general_dental", "best_plan", "cost_estimate"],
    coverage: {
      orthodonticCoverage: "yes",
      reimbursementPercentage: "coverage varies by plan and employer policy",
      lifetimeMaximum: "coverage varies by plan and employer policy",
      waitingPeriod: "coverage varies by plan and employer policy",
      otherRelevantBenefits: [
        "Broader dental support than entry-level plans",
        "May reduce out-of-pocket costs for orthodontic treatment"
      ]
    },
    limitations: [
      "Exact orthodontic reimbursement is not specified in this placeholder source",
      "Waiting periods may apply"
    ],
    keywords: ["braces", "orthodontic", "orthodontics", "aligners", "enhanced", "dental"]
  },
  {
    id: "group-benefits-dental",
    planName: "Sun Life Group Benefits - Dental Coverage",
    source: {
      title: "Sun Life Group Benefits - Dental Coverage",
      url: "https://www.sunlife.ca/en/group/benefits/dental/",
      excerpt: "Example source placeholder for employer-sponsored dental plans."
    },
    summary:
      "Employer-sponsored dental coverage where reimbursement, annual maximums, and orthodontic eligibility can vary by employer plan design.",
    categories: ["coverage_eligibility", "general_dental", "orthodontics", "best_plan"],
    coverage: {
      orthodonticCoverage: "varies",
      reimbursementPercentage: "coverage varies by plan and employer policy",
      lifetimeMaximum: "coverage varies by plan and employer policy",
      waitingPeriod: "coverage varies by plan and employer policy",
      otherRelevantBenefits: [
        "Coverage can be tailored by employer",
        "Useful when the user already has workplace benefits"
      ]
    },
    limitations: [
      "Eligibility depends on employer-selected benefits",
      "Coverage details are plan-specific"
    ],
    keywords: ["employer", "work", "group", "benefits", "eligibility", "coverage"]
  }
];
