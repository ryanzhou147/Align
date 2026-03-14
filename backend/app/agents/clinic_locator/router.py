from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

from .agent import wizard_find_clinics, wizard_get_slots, wizard_book
from .google_calendar import create_event, get_free_slots
from .google_places import find_nearby_clinics

router = APIRouter(prefix="/agents/clinic-locator", tags=["Clinic Locator Agent"])


@router.get("")
def get_clinic_locator_agent() -> dict[str, object]:
    return {
        "agent": "clinic_locator",
        "goal": "Find clinics and schedule follow-up care.",
        "status": "active",
    }


# ── Wizard steps ──────────────────────────────────────────────────────────────

class FindClinicsRequest(BaseModel):
    lat: float
    lng: float
    radius_km: float = 5.0


@router.post("/wizard/find-clinics")
async def wizard_step_find_clinics(req: FindClinicsRequest):
    """Step 1: Find nearby dental clinics."""
    try:
        return await wizard_find_clinics(req.lat, req.lng, req.radius_km)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class GetSlotsRequest(BaseModel):
    google_token: str
    start_date: str | None = None
    end_date: str | None = None


@router.post("/wizard/get-slots")
def wizard_step_get_slots(req: GetSlotsRequest):
    """Step 2: Get available calendar slots (defaults to next 7 days)."""
    try:
        return wizard_get_slots(req.google_token, req.start_date, req.end_date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class BookRequest(BaseModel):
    google_token: str
    clinic_name: str
    clinic_address: str
    start_datetime: str
    end_datetime: str


@router.post("/wizard/book")
def wizard_step_book(req: BookRequest):
    """Step 3: Book the appointment."""
    try:
        return wizard_book(
            req.google_token,
            req.clinic_name,
            req.clinic_address,
            req.start_datetime,
            req.end_datetime,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Direct test routes (kept for debugging) ───────────────────────────────────

@router.get("/clinics")
async def get_clinics(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(5.0),
):
    try:
        return {"clinics": await find_nearby_clinics(lat, lng, radius_km)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/slots")
def get_slots(
    start: str = Query(...),
    end: str = Query(...),
    token: str = Query(...),
):
    try:
        return {"slots": get_free_slots(token, start, end)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
