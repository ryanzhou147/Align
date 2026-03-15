from fastapi import APIRouter, UploadFile, File, Form, HTTPException

router = APIRouter(prefix="/orchestrator", tags=["Agent Orchestrator"])


@router.get("")
def get_orchestrator() -> dict[str, object]:
    return {
        "name": "agent_orchestrator",
        "sequence": [
            "treatment_predictive",
            "habit_coaching",
            "financial",
            "doctor_summary",
        ],
        "status": "active",
    }


@router.post("/patient-analyze")
async def patient_analyze(
    name: str = Form(...),
    age: int = Form(...),
    chief_complaint: str = Form(...),
    image: UploadFile = File(...),
) -> dict:
    """
    Full patient pipeline:
    1. run_treatment_pipeline  → analysis + timeline images
    2. habit coaching agent    → personalized hygiene tips
    3. financial agent         → Sun Life insurance recommendation
    4. doctor summary agent    → clinical handoff note
    """
    image_bytes = await image.read()

    # Step 1 — Treatment analysis + demo timeline
    from app.agents.treatment_predictive.agent import run_treatment_pipeline
    treatment_result = await run_treatment_pipeline(image_bytes)
    analysis = treatment_result["analysis"]
    timeline = treatment_result["timeline"]

    # Step 2 — Habit coaching
    observations = list(analysis.get("issues", []))
    if analysis.get("cavities_detected"):
        observations.append("cavities detected")

    from app.agents.habit_coaching.router import analyze_habits, HabitAnalyzeRequest
    habit_result = analyze_habits(HabitAnalyzeRequest(medications=[], observations=observations))

    # Step 3 — Financial recommendation
    severity = analysis.get("severity", "moderate")
    needs_braces = analysis.get("suitable_for_braces", True)
    question = (
        f"Patient needs orthodontic treatment ({severity} severity). "
        f"{'Braces are recommended.' if needs_braces else 'Alternative treatment may be preferred.'} "
        "What Sun Life plan best covers this and what are estimated out-of-pocket costs?"
    )
    from app.agents.financial.router import analyze_financial, FinancialAnalyzeRequest
    financial_result = await analyze_financial(FinancialAnalyzeRequest(question=question))

    # Step 4 — Doctor summary
    summary_data = {
        "patient_profile": {
            "name": name,
            "age": age,
            "chief_complaint": chief_complaint,
        },
        "vision_intake": analysis,
        "treatment_simulation": {
            "timeline": [{"month": s["month"], "label": s["label"]} for s in timeline],
            "estimated_months": analysis.get("estimated_months", 24),
        },
        "habit_coaching": habit_result,
        "financial_agent": financial_result,
    }
    from app.agents.doctor_summary.agent import DoctorSummaryAgent
    summary = DoctorSummaryAgent().generate_summary(summary_data)

    return {
        "patient": {"name": name, "age": age, "chief_complaint": chief_complaint},
        "analysis": analysis,
        "timeline": timeline,
        "habit_coaching": habit_result,
        "financial": financial_result,
        "summary": summary,
    }
