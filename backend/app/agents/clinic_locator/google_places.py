import os
import httpx
from dotenv import load_dotenv

load_dotenv()

PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
PLACES_NEARBY_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"


async def find_nearby_clinics(lat: float, lng: float, radius_km: float = 5) -> list[dict]:
    """Search Google Places for nearby dental clinics."""
    params = {
        "location": f"{lat},{lng}",
        "radius": int(radius_km * 1000),
        "type": "dentist",
        "key": PLACES_API_KEY,
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(PLACES_NEARBY_URL, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

    results = data.get("results", [])[:5]
    clinics = []
    for r in results:
        clinics.append({
            "name": r.get("name"),
            "address": r.get("vicinity"),
            "place_id": r.get("place_id"),
            "rating": r.get("rating"),
            "lat": r["geometry"]["location"]["lat"],
            "lng": r["geometry"]["location"]["lng"],
            "open_now": r.get("opening_hours", {}).get("open_now"),
        })
    return clinics
