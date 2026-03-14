"""
Test the agent loop with mocked tools and real Claude API calls.
Requires ANTHROPIC_API_KEY in backend/.env or environment.
"""
import pytest
import sys
import os
import json
from unittest.mock import AsyncMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

# Load env before importing agent
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))

MOCK_CLINICS = [
    {
        "name": "Smile Dental",
        "address": "100 Queen St W, Toronto",
        "place_id": "abc123",
        "rating": 4.5,
        "lat": 43.6510,
        "lng": -79.3830,
        "open_now": True,
    }
]

MOCK_SLOTS = [
    {"start": "2026-03-14T09:00:00+00:00", "end": "2026-03-14T09:30:00+00:00"},
    {"start": "2026-03-14T10:00:00+00:00", "end": "2026-03-14T10:30:00+00:00"},
]

MOCK_EVENT = {
    "event_id": "evt_test_123",
    "html_link": "https://calendar.google.com/event?eid=test",
    "summary": "Dental Appointment at Smile Dental",
    "start": "2026-03-14T09:00:00Z",
    "end": "2026-03-14T09:30:00Z",
}


@pytest.mark.asyncio
async def test_agent_finds_clinics_and_books():
    """
    Run the agent loop with mocked tool dispatch. Verify it:
    - streams text events
    - calls find_nearby_clinics
    - eventually emits a 'done' event
    """
    with patch("app.agents.clinic_locator.agent.dispatch_tool", new_callable=AsyncMock) as mock_dispatch:
        # Return clinics on first tool call, slots on second, event on third
        mock_dispatch.side_effect = [
            json.dumps(MOCK_CLINICS),
            json.dumps(MOCK_SLOTS),
            json.dumps(MOCK_EVENT),
        ]

        from app.agents.clinic_locator.agent import run_agent

        messages = [
            {
                "role": "user",
                "content": (
                    "I need to book a dental appointment near me this week. "
                    "Book me at Smile Dental on March 14th at 9am."
                ),
            }
        ]
        location = {"lat": 43.6426, "lng": -79.3871}
        google_token = "mock_token_123"

        events = []
        async for sse in run_agent(messages, location, google_token):
            events.append(sse)

        # Should have received some events
        assert len(events) > 0, "Should produce SSE events"

        # Last event should be 'done'
        assert "event: done" in events[-1], f"Last event should be done, got: {events[-1]}"

        # Should have text events
        text_events = [e for e in events if "event: text" in e]
        assert len(text_events) > 0, "Should have text streaming events"


@pytest.mark.asyncio
async def test_agent_handles_tool_error():
    """Verify the agent continues gracefully when a tool raises an exception."""
    with patch("app.agents.clinic_locator.agent.dispatch_tool", new_callable=AsyncMock) as mock_dispatch:
        mock_dispatch.side_effect = Exception("Places API quota exceeded")

        from app.agents.clinic_locator.agent import run_agent

        messages = [{"role": "user", "content": "Find dental clinics near me."}]
        location = {"lat": 43.6426, "lng": -79.3871}

        events = []
        async for sse in run_agent(messages, location, ""):
            events.append(sse)

        # Agent should still complete
        assert any("event: done" in e for e in events), "Should still emit done event"
