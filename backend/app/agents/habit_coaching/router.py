import os
import httpx
from fastapi import APIRouter
from pydantic import BaseModel

PUSHOVER_APP_TOKEN = os.getenv("PUSHOVER_APP_TOKEN", "")
PUSHOVER_USER_KEY  = os.getenv("PUSHOVER_USER_KEY", "")

router = APIRouter(prefix="/agents/habit-coaching", tags=["Habit Coaching Agent"])


@router.get("")
def get_habit_coaching_agent() -> dict[str, object]:
    return {
        "agent": "habit_coaching",
        "goal": "Generate oral hygiene coaching from scan insights.",
        "status": "implemented",
    }


class HabitAnalyzeRequest(BaseModel):
    medications: list[str] = []
    observations: list[str] = []


@router.post("/analyze")
def analyze_habits(req: HabitAnalyzeRequest) -> dict:
    try:
        import google.generativeai as genai  # type: ignore
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set")

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")

        meds_str = ", ".join(req.medications) if req.medications else "None reported"
        obs_str  = ", ".join(req.observations) if req.observations else "General dental wellness"

        prompt = (
            "You are a friendly dental habit coach. Based on the following information, "
            "provide personalized oral hygiene coaching advice.\n\n"
            f"Medications: {meds_str}\n"
            f"Dental observations: {obs_str}\n\n"
            "Provide 3-5 specific, actionable tips. Keep each tip concise (1-2 sentences). "
            "Format as a numbered list."
        )

        response = model.generate_content(prompt)
        return {"coaching_plan": response.text}

    except Exception:
        tips = [
            "1. Brush for 2 minutes twice daily using fluoride toothpaste.",
            "2. Floss at least once per day, ideally before bedtime.",
            "3. Rinse with antiseptic mouthwash to reduce bacteria.",
            "4. Drink plenty of water and limit sugary snacks between meals.",
            "5. Schedule a professional cleaning every 6 months.",
        ]
        if req.medications:
            tip = (
                f"6. Let your dentist know about {req.medications[0]} — "
                "some medications affect saliva and gum health."
            )
            tips.append(tip)
        return {"coaching_plan": "\n".join(tips)}


class NotifyRequest(BaseModel):
    message: str = "Your habit coaching session is complete. Time to brush! 🦷"


@router.post("/notify")
async def send_pushover_notification(req: NotifyRequest) -> dict:
    if not PUSHOVER_APP_TOKEN or not PUSHOVER_USER_KEY:
        return {"ok": False, "error": "Pushover keys not configured"}
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.pushover.net/1/messages.json",
            data={
                "token":    PUSHOVER_APP_TOKEN,
                "user":     PUSHOVER_USER_KEY,
                "title":    "Dental Habit Coach",
                "message":  req.message,
                "priority": 1,
            },
        )
    return {"ok": resp.status_code == 200, "status": resp.status_code}
