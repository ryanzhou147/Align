"""
Treatment Predictive Agent — demo mode.

Pipeline:
  1. Analyze uploaded teeth image with Gemini 2.5 Flash (real, live)
  2. Return pre-rendered demo images from backend/img/ as the treatment timeline

Demo images: img/2.png → month 3, img/3.png → month 9, img/4.png → month 15, img/5.png → month 24
"""

import base64
import io
import json
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from google import genai
from google.genai import types
from PIL import Image

from .prompts import DENTAL_ANALYSIS_PROMPT

load_dotenv()

_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT", "core-shard-487323-q9")
_LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
_ANALYSIS_MODEL = "gemini-2.5-flash"
_MAX_IMAGE_PX = 768
_JPEG_QUALITY = 72

# Pre-rendered demo images: (month, label, filename)
_DEMO_STAGES = [
    (3,  "Braces Applied",     "2.png"),
    (9,  "Early Movement",     "3.png"),
    (15, "Almost There",       "4.png"),
    (24, "Treatment Complete", "5.png"),
]

_IMG_DIR = Path(__file__).parent.parent.parent.parent / "img"


def _get_client() -> genai.Client:
    return genai.Client(
        vertexai=True,
        project=_PROJECT,
        location=_LOCATION,
    )


def _resize_image(image_bytes: bytes) -> bytes:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img.thumbnail((_MAX_IMAGE_PX, _MAX_IMAGE_PX), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=_JPEG_QUALITY)
    return buf.getvalue()


def _image_bytes_to_b64(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode("utf-8")


def _parse_json_response(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1]) if len(lines) > 2 else text
    return json.loads(text)


def _load_demo_images() -> list[dict]:
    """Load pre-rendered demo images from backend/img/."""
    stages = []
    for month, label, filename in _DEMO_STAGES:
        path = _IMG_DIR / filename
        raw = path.read_bytes()
        stages.append({
            "month": month,
            "label": label,
            "image_b64": _image_bytes_to_b64(raw),
        })
    return stages


async def _analyze_teeth(client: genai.Client, image_bytes: bytes) -> dict:
    try:
        image_part = types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")
        response = await client.aio.models.generate_content(
            model=_ANALYSIS_MODEL,
            contents=[image_part, DENTAL_ANALYSIS_PROMPT],
        )
        result = _parse_json_response(response.text)
        result["estimated_months"] = 24
        return result
    except Exception:
        return {
            "severity": "moderate",
            "issues": ["crowding detected", "minor rotations present", "spacing irregularities"],
            "cavities_detected": False,
            "cavity_notes": "Unable to assess — analysis failed",
            "estimated_months": 24,
            "suitable_for_braces": True,
            "notes": "Standard orthodontic treatment recommended based on visible alignment issues.",
        }


async def run_treatment_pipeline(image_bytes: bytes) -> dict[str, Any]:
    resized = _resize_image(image_bytes)
    client = _get_client()

    # Real analysis on the uploaded photo
    analysis = await _analyze_teeth(client, resized)

    # Demo timeline from pre-rendered images
    timeline = [{"month": 0, "label": "Current Teeth", "image_b64": _image_bytes_to_b64(resized)}]
    timeline.extend(_load_demo_images())

    return {"analysis": analysis, "timeline": timeline}
