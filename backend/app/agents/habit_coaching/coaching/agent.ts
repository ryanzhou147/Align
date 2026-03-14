import {
    HABIT_COACH_SYSTEM_PROMPT,
    buildCoachingPrompt,
    formatCoachingSummary
} from "./prompt.js";
import type {
    AgentResponse,
    HabitCoachingRequest,
    HabitCoachingResult,
    LlmClient
} from "./types.js";

export class HabitCoachingAgent {
    constructor(
        private readonly dependencies: {
            llm?: LlmClient;
        }
    ) { }

    async coach(request: HabitCoachingRequest): Promise<AgentResponse> {
        if (!this.dependencies.llm) {
            // Fallback deterministic response or error if LLM is missing
            const fallback: HabitCoachingResult = {
                observation: request.observations.join(", ") || "No specific observations provided.",
                recommendedHabit: "Maintain a consistent brushing and flossing routine.",
                whyThisHelps: "Consistent hygiene prevents plaque buildup and supports overall oral health.",
                optionalExtraTip: "Wait for the LLM to be configured for personalized advice."
            };

            return {
                structured: fallback,
                formatted: formatCoachingSummary(fallback)
            };
        }

        const prompt = buildCoachingPrompt({
            observations: request.observations,
            treatmentNotes: request.context?.treatmentNotes,
            orthodonticProgression: request.context?.orthodonticProgression
        });

        const completion = await this.dependencies.llm.complete({
            messages: [
                { role: "system", content: HABIT_COACH_SYSTEM_PROMPT },
                { role: "user", content: prompt }
            ]
        });

        // Simple parser for the completion if it follows the expected format
        // In a real scenario, we might want more robust parsing or tool calling
        const structured = this.parseCompletion(completion, request.observations);

        return {
            structured,
            formatted: formatCoachingSummary(structured)
        };
    }

    private parseCompletion(completion: string, observations: string[]): HabitCoachingResult {
        // This is a naive parser. In production, you'd use structured output from the LLM.
        const lines = completion.split("\n");
        let observation = observations.join(", ");
        let recommendedHabit = "";
        let whyThisHelps = "";
        let optionalExtraTip = "";

        let currentSection = "";

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("Observation:")) {
                currentSection = "observation";
                continue;
            } else if (trimmed.startsWith("Recommended Habit:")) {
                currentSection = "habit";
                continue;
            } else if (trimmed.startsWith("Why This Helps:")) {
                currentSection = "why";
                continue;
            } else if (trimmed.startsWith("Optional Extra Tip:")) {
                currentSection = "tip";
                continue;
            }

            if (!trimmed) continue;

            if (currentSection === "observation") observation = trimmed;
            else if (currentSection === "habit") recommendedHabit = trimmed;
            else if (currentSection === "why") whyThisHelps = trimmed;
            else if (currentSection === "tip") optionalExtraTip = trimmed;
        }

        return {
            observation: observation || observations.join(", "),
            recommendedHabit: recommendedHabit || "Follow a standard hygiene routine.",
            whyThisHelps: whyThisHelps || "To ensure long-term dental health.",
            optionalExtraTip: optionalExtraTip || undefined
        };
    }
}
