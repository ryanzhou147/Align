"""
Clinic locator wizard — three-step flow, no LLM required.

Step 1  find_clinics   { lat, lng, radius_km? }
          → { step: "select_clinic", clinics: [...] }

Step 2  get_slots      { google_token, start_date, end_date }
          → { step: "select_slot", slots: [...] }

Step 3  book           { google_token, clinic_name, clinic_address,
                         start_datetime, end_datetime }
          → { step: "done", event: {...} }
"""

from typing import Optional
from datetime import datetime, timedelta, timezone
from .google_places import find_nearby_clinics
from .google_calendar import get_free_slots, create_event


async def wizard_find_clinics(lat: float, lng: float, radius_km: float = 5) -> dict:
    clinics = await find_nearby_clinics(lat, lng, radius_km)
    return {"step": "select_clinic", "clinics": clinics}


def wizard_get_slots(google_token: str, start_date: Optional[str], end_date: Optional[str]) -> dict:
    if not start_date:
        today = datetime.now(timezone.utc).date()
        start_date = today.isoformat()
        end_date = (today + timedelta(days=7)).isoformat()
    slots = get_free_slots(google_token, start_date, end_date)
    return {"step": "select_slot", "slots": slots}


def wizard_book(
    google_token: str,
    clinic_name: str,
    clinic_address: str,
    start_datetime: str,
    end_datetime: str,
) -> dict:
    event = create_event(google_token, clinic_name, clinic_address, start_datetime, end_datetime)
    return {"step": "done", "event": event}
