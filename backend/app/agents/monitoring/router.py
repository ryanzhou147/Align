from fastapi import APIRouter

router = APIRouter(prefix="/agents/monitoring", tags=["Monitoring Agent"])


@router.get("")
def get_monitoring_agent() -> dict[str, object]:
    return {
        "agent": "monitoring",
        "goal": "Track progress after treatment begins.",
        "status": "scaffolded",
    }
