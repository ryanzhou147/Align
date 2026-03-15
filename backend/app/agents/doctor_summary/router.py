from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from .agent import DoctorSummaryAgent

router = APIRouter(prefix="/agents/doctor-summary", tags=["Doctor Summary Agent"])

class DoctorSummaryRequest(BaseModel):
    patient_profile: dict = {}
    vision_intake: dict = {}
    treatment_simulation: dict = {}
    image_progression: dict = {}
    habit_coaching: dict = {}
    financial_agent: dict = {}

@router.get("")
def get_doctor_summary_agent() -> dict[str, object]:
    return {
        "agent": "doctor_summary",
        "goal": "Generate a clinical handoff note for providers by synthesizing multi-agent outputs.",
        "status": "implemented",
    }

@router.post("/analyze")
def generate_summary(req: DoctorSummaryRequest) -> dict:
    try:
        agent = DoctorSummaryAgent()
        summary = agent.generate_summary(req.dict())
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
