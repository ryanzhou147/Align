export interface HabitCoachingRequest {
    observations: string[];
    context?: {
        treatmentNotes?: string;
        orthodonticProgression?: string;
    };
}

export interface HabitCoachingResult {
    observation: string;
    recommendedHabit: string;
    whyThisHelps: string;
    optionalExtraTip?: string;
}

export interface AgentResponse {
    structured: HabitCoachingResult;
    formatted: string;
}

export interface LlmMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface LlmClient {
    complete(input: { messages: LlmMessage[] }): Promise<string>;
}
