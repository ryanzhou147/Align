import { HabitCoachingAgent } from "../agent.js";
import type { LlmClient, LlmMessage } from "../types.js";

async function main() {
    console.log("--- Habit Coaching Agent Demo ---\n");

    // Deterministic Demo (No LLM)
    console.log("1. No LLM (Deterministic Fallback):");
    const agentNoLlm = new HabitCoachingAgent({});
    const responseNoLlm = await agentNoLlm.coach({
        observations: ["crowding", "plaque buildup"],
        context: {
            treatmentNotes: "Braces recommended."
        }
    });
    console.log(responseNoLlm.formatted);
    console.log("\n---------------------------------\n");

    // Mock LLM Demo
    console.log("2. With Mock LLM:");
    const mockLlm: LlmClient = {
        complete: async (input: { messages: LlmMessage[] }) => {
            return `HABIT COACHING SUMMARY

Observation:
Crowding makes certain areas harder to reach, leading to plaque buildup.

Recommended Habit:
Use an interdental brush or floss daily to clean between crowded teeth.

Why This Helps:
Removing plaque from hard-to-reach areas prevents gum inflammation and helps your braces treatment progress smoothly.

Optional Extra Tip:
Consider using an oscillating electric toothbrush for more effective plaque removal.`;
        }
    };

    const agentWithLlm = new HabitCoachingAgent({ llm: mockLlm });
    const responseWithLlm = await agentWithLlm.coach({
        observations: ["crowding", "plaque buildup"],
        context: {
            treatmentNotes: "Braces recommended."
        }
    });
    console.log(responseWithLlm.formatted);
}

main().catch(console.error);
