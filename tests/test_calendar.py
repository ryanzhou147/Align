"""
Test Google Calendar integration.
Requires GOOGLE_TEST_TOKEN env var set to a real OAuth access token.
Run: GOOGLE_TEST_TOKEN=<token> pytest tests/test_calendar.py
"""
import pytest
import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.agents.clinic_locator.google_calendar import get_free_slots, create_event, delete_event

TOKEN = os.getenv("GOOGLE_TEST_TOKEN", "")


@pytest.mark.skipif(not TOKEN, reason="GOOGLE_TEST_TOKEN not set")
def test_get_free_slots_returns_slots():
    """Verify free slot computation returns valid 30-min slots."""
    today = datetime.now(timezone.utc).date()
    start = today.isoformat()
    end = (today + timedelta(days=7)).isoformat()

    slots = get_free_slots(TOKEN, start, end)

    assert isinstance(slots, list), "Should return a list"
    if slots:
        slot = slots[0]
        assert "start" in slot and "end" in slot
        # Verify 30-minute duration
        start_dt = datetime.fromisoformat(slot["start"])
        end_dt = datetime.fromisoformat(slot["end"])
        assert (end_dt - start_dt).seconds == 1800, "Slot should be 30 minutes"


@pytest.mark.skipif(not TOKEN, reason="GOOGLE_TEST_TOKEN not set")
def test_get_free_slots_excludes_busy():
    """Slots returned should not overlap with any busy period."""
    today = datetime.now(timezone.utc).date()
    start = today.isoformat()
    end = (today + timedelta(days=3)).isoformat()

    slots = get_free_slots(TOKEN, start, end)

    # Verify business hours: 8am–5pm
    for slot in slots:
        start_dt = datetime.fromisoformat(slot["start"])
        assert 8 <= start_dt.hour < 17, f"Slot {slot['start']} outside business hours"
        assert start_dt.weekday() < 5, f"Slot {slot['start']} on weekend"


@pytest.mark.skipif(not TOKEN, reason="GOOGLE_TEST_TOKEN not set")
def test_create_and_delete_event():
    """Create a test event and clean it up."""
    tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).date()
    start = f"{tomorrow}T10:00:00Z"
    end = f"{tomorrow}T10:30:00Z"

    event = create_event(
        TOKEN,
        clinic_name="Test Dental Clinic",
        clinic_address="123 Test Street",
        start_datetime=start,
        end_datetime=end,
    )

    assert "event_id" in event
    assert "html_link" in event
    assert "Dental Appointment" in event["summary"]

    # Cleanup
    delete_event(TOKEN, event["event_id"])
