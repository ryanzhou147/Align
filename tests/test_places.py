"""Test Google Places integration with real API call (Toronto downtown coords)."""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.agents.clinic_locator.google_places import find_nearby_clinics


@pytest.mark.asyncio
async def test_find_clinics_returns_results():
    """Verify that a real Places API call near Toronto returns dental clinics."""
    # Toronto downtown: CN Tower area
    clinics = await find_nearby_clinics(lat=43.6426, lng=-79.3871, radius_km=5)

    assert isinstance(clinics, list), "Should return a list"
    assert len(clinics) > 0, "Should find at least one clinic"
    assert len(clinics) <= 5, "Should return at most 5 clinics"

    first = clinics[0]
    assert "name" in first, "Clinic should have a name"
    assert "address" in first, "Clinic should have an address"
    assert "place_id" in first, "Clinic should have a place_id"
    assert "lat" in first and "lng" in first, "Clinic should have coordinates"


@pytest.mark.asyncio
async def test_find_clinics_radius_filter():
    """Verify that a very small radius returns fewer or different results."""
    clinics_large = await find_nearby_clinics(lat=43.6426, lng=-79.3871, radius_km=10)
    clinics_small = await find_nearby_clinics(lat=43.6426, lng=-79.3871, radius_km=0.1)

    # Small radius near CN Tower should return fewer results than large radius
    assert len(clinics_small) <= len(clinics_large)
