import os
from google import genai as google_genai
from google.genai import types as genai_types

class DoctorSummaryAgent:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set")
        self.client = google_genai.Client(api_key=api_key)
        self.model_id = "gemini-2.5-flash"

    def generate_summary(self, data: dict) -> str:
        """
        Processes structured agent outputs and generates a doctor-facing summary.
        """
        system_instruction = (
            "You are an orchestrating AI agent called DoctorSummaryAgent.\n\n"
            "PURPOSE:\n"
            "Synthesize outputs from multiple specialized dental AI agents into a single, clean, "
            "one-page doctor-facing clinical summary. This is for providers (dentists/orthodontists), "
            "not patients.\n\n"
            "RULES:\n"
            "1. Do not diagnose conditions with certainty. Use professional hedging like 'visible signs suggest' or 'may indicate'.\n"
            "2. Do not invent missing data. Omit sections with missing inputs or state information is limited.\n"
            "3. Do not repeat the same finding multiple times. Remove redundancy.\n"
            "4. Organize findings into a medically readable, concise, and structured format.\n"
            "5. The tone should be like a clinical assistant preparing a pre-consult summary.\n"
            "6. Keep the final output to approximately one page.\n\n"
            "REQUIRED OUTPUT FORMAT:\n"
            "DOCTOR SUMMARY PAGE\n\n"
            "Patient Overview\n"
            "[short summary]\n\n"
            "Key Clinical Observations\n"
            "- [finding 1]\n"
            "- [finding 2]\n\n"
            "Likely Treatment Path\n"
            "[concise summary]\n\n"
            "Patient Guidance / Habit Risks\n"
            "- [risk 1]\n"
            "- [risk 2]\n\n"
            "Insurance / Financial Context\n"
            "- [financial info 1]\n"
            "- [financial info 2]\n\n"
            "Recommended Next Step\n"
            "[short actionable recommendation]"
        )

        prompt = f"Here is the structured data from the multiple dental agents:\n\n{data}\n\nGenerate the DOCTOR SUMMARY PAGE."

        response = self.client.models.generate_content(
            model=self.model_id,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                system_instruction=system_instruction,
                thinking_config=genai_types.ThinkingConfig(thinking_budget=0),
            ),
        )

        return response.text
