from fastapi import APIRouter, HTTPException, UploadFile, File

from .agent import run_treatment_pipeline

router = APIRouter(prefix="/agents/treatment-predictive", tags=["Treatment Predictive Agent"])

_ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png"}


@router.get("")
def get_treatment_predictive_agent() -> dict[str, object]:
    return {
        "agent": "treatment_predictive",
        "goal": "Simulate likely treatment outcomes and timeline.",
        "status": "active",
    }


@router.post("/analyze")
async def analyze_teeth(image: UploadFile = File(...)) -> dict:
    """
    Accept a teeth photo and return a 5-stage orthodontic treatment timeline.

    - **image**: JPEG or PNG of open-mouth teeth (no full-face required)

    Returns analysis (severity, issues, duration) and a timeline of 5 images
    (month 0 = original, months 3/9/15/24 = AI-generated stages), each as
    a base64-encoded JPEG string (`image_b64`). If Vertex AI rate limits
    image generation, the pipeline retries with backoff and may reuse the
    last successful image for a stage instead of failing the whole request.
    """
    if image.content_type not in _ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{image.content_type}'. Upload a JPEG or PNG image.",
        )

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        result = await run_treatment_pipeline(image_bytes)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {e}")

    return result
