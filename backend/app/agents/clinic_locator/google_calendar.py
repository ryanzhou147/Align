from datetime import datetime, timedelta, timezone
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials


def _calendar_service(google_token: str):
    creds = Credentials(token=google_token)
    return build("calendar", "v3", credentials=creds, cache_discovery=False)


def get_free_slots(google_token: str, start_date: str, end_date: str) -> list[dict]:
    """
    Return 30-minute free slots Mon–Fri 8am–5pm (user's primary calendar).
    start_date / end_date: ISO date strings like '2026-03-13'.
    """
    service = _calendar_service(google_token)

    time_min = f"{start_date}T00:00:00Z"
    time_max = f"{end_date}T23:59:59Z"

    body = {
        "timeMin": time_min,
        "timeMax": time_max,
        "items": [{"id": "primary"}],
    }
    freebusy = service.freebusy().query(body=body).execute()
    busy_periods = freebusy["calendars"]["primary"]["busy"]

    # Build busy intervals as datetime objects (UTC)
    busy = []
    for p in busy_periods:
        busy.append((
            datetime.fromisoformat(p["start"].replace("Z", "+00:00")),
            datetime.fromisoformat(p["end"].replace("Z", "+00:00")),
        ))

    # Generate candidate 30-min slots
    start_dt = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc)
    end_dt = datetime.fromisoformat(end_date).replace(tzinfo=timezone.utc)

    slots = []
    current = start_dt
    while current <= end_dt:
        if current.weekday() < 5:  # Mon–Fri
            for hour in range(8, 17):
                for minute in (0, 30):
                    slot_start = current.replace(hour=hour, minute=minute, second=0, microsecond=0)
                    slot_end = slot_start + timedelta(minutes=30)
                    if not _overlaps_busy(slot_start, slot_end, busy):
                        slots.append({
                            "start": slot_start.isoformat(),
                            "end": slot_end.isoformat(),
                        })
        current += timedelta(days=1)

    return slots


def _overlaps_busy(slot_start, slot_end, busy):
    for b_start, b_end in busy:
        if slot_start < b_end and slot_end > b_start:
            return True
    return False


def create_event(
    google_token: str,
    clinic_name: str,
    clinic_address: str,
    start_datetime: str,
    end_datetime: str,
) -> dict:
    """Create a Google Calendar event for the appointment."""
    service = _calendar_service(google_token)

    event = {
        "summary": f"Dental Appointment at {clinic_name}",
        "location": clinic_address,
        "description": f"Dental appointment booked via Clinic Locator agent.",
        "start": {"dateTime": start_datetime, "timeZone": "UTC"},
        "end": {"dateTime": end_datetime, "timeZone": "UTC"},
    }

    created = service.events().insert(calendarId="primary", body=event).execute()
    return {
        "event_id": created["id"],
        "html_link": created.get("htmlLink"),
        "summary": created.get("summary"),
        "start": created["start"]["dateTime"],
        "end": created["end"]["dateTime"],
    }


def delete_event(google_token: str, event_id: str) -> None:
    """Delete a calendar event by ID (used in tests)."""
    service = _calendar_service(google_token)
    service.events().delete(calendarId="primary", eventId=event_id).execute()
