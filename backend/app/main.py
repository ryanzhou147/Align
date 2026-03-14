from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.agents.clinic_locator.router import router as clinic_locator_router
from app.agents.financial.router import router as financial_router
from app.agents.habit_coaching.router import router as habit_coaching_router
from app.agents.monitoring.router import router as monitoring_router
from app.agents.treatment_predictive.router import router as treatment_predictive_router
from app.core.orchestrator import router as orchestrator_router
from app.pipeline.dental_model.router import router as dental_model_router

app = FastAPI(title="Dental Multi-Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dental_model_router)
app.include_router(orchestrator_router)
app.include_router(treatment_predictive_router)
app.include_router(habit_coaching_router)
app.include_router(financial_router)
app.include_router(clinic_locator_router)
app.include_router(monitoring_router)


@app.get("/")
def read_root() -> dict[str, str]:
    return {"status": "ok", "message": "Dental Multi-Agent API scaffold"}


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy"}
