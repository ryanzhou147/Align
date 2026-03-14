from fastapi import APIRouter

router = APIRouter(prefix="/agents/habit-coaching", tags=["Habit Coaching Agent"])


@router.get("")
def get_habit_coaching_agent() -> dict[str, object]:
    return {
        "agent": "habit_coaching",
        "goal": "Generate oral hygiene coaching from scan insights.",
        "status": "implemented",
    }
