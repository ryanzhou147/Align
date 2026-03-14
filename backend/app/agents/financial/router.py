import os
from fastapi import APIRouter
from pydantic import BaseModel
from dotenv import load_dotenv

router = APIRouter(prefix="/agents/financial", tags=["Financial Agent"])

# Load local agent .env
agent_env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(agent_env_path):
    load_dotenv(agent_env_path)

SUN_LIFE_URL = "https://www.sunlife.ca/en/explore-products/insurance/health-insurance/personal-health-insurance/dental-insurance/"

# Pre-scraped fallback (Axios/requests gets 403 from Sun Life's CDN)
SCRAPED_CONTENT_FALLBACK = """
### Sun Life Basic Plan
* Preventative Dental Care: 60% reimbursement
* Annual Maximum: $500
* Recall Visits: Every 9 months
* Restorative/Orthodontics: No coverage

### Sun Life Standard Plan
* Preventative Dental Care: 70% reimbursement
* Annual Maximum: $750
* Recall Visits: Every 9 months
* Restorative/Orthodontics: No coverage

### Sun Life Enhanced Plan
* Preventative Dental Care: 80% reimbursement
* Annual Maximum(Preventative): $750
* Recall Visits: Every 9 months
* Restorative Dental Care: 50% reimbursement
* Annual Maximum (Restorative): $500
* Orthodontics: 60% reimbursement (includes braces)
* Lifetime Maximum (Orthodontics): $1,500
"""

SYSTEM_PROMPT = """You are SunLife Financial Agent, an AI insurance advisor embedded inside a virtual dental clinic application.

Your purpose is to help users understand which Sun Life insurance plan best supports their dental or orthodontic treatment.

Responsibilities:
1. Analyze information from Sun Life insurance documentation.
2. Identify which Sun Life plans include dental or orthodontic coverage.
3. Compare plans and determine which is most suitable for the user's dental needs.
4. Explain coverage clearly, including reimbursements, limitations, waiting periods, and cost implications.

Rules:
- Only use information from Sun Life sources.
- Do not invent insurance policies or numbers.
- Do not present yourself as a licensed financial advisor.

Required response format:
SUN LIFE PLAN RECOMMENDATION

User Need:
(short explanation)

Recommended Plan:
(plan name)

Why This Plan Fits:
(clear reasoning)

Coverage Details:
- Orthodontic coverage
- Reimbursement percentage
- Lifetime maximum
- Waiting period
- Other relevant benefits

Estimated Cost Insight:
(plain-language estimate)

Source Reference:
Sun Life Personal Health Insurance — sunlife.ca"""


@router.get("")
def get_financial_agent() -> dict[str, object]:
    return {
        "agent": "financial",
        "goal": "Estimate insurance coverage and treatment cost exposure.",
        "status": "active",
    }


class FinancialAnalyzeRequest(BaseModel):
    question: str = "What Sun Life dental plan best covers my treatment?"


@router.post("/analyze")
async def analyze_financial(req: FinancialAnalyzeRequest) -> dict:
    # 1. Try live scrape, fall back to pre-scraped content
    scraped_content = await _scrape_sunlife()

    # 2. Call Gemini
    try:
        from google import genai  # type: ignore
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set")

        client = genai.Client(api_key=api_key)

        prompt = (
            f"User Question: {req.question}\n\n"
            f"Below is live content retrieved from Sun Life's website ({SUN_LIFE_URL}).\n"
            "Analyze it and provide the most optimal insurance recommendation:\n\n"
            f"{scraped_content}"
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=SYSTEM_PROMPT + "\n\n" + prompt,
        )
        return {
            "recommendation": response.text,
            "source": SUN_LIFE_URL,
            "scraped": scraped_content != SCRAPED_CONTENT_FALLBACK,
        }

    except Exception as e:
        return {
            "recommendation": (
                "Gemini is not configured. Here is the raw Sun Life plan data:\n\n"
                + scraped_content
            ),
            "source": SUN_LIFE_URL,
            "scraped": scraped_content != SCRAPED_CONTENT_FALLBACK,
            "error": str(e),
        }


async def _scrape_sunlife() -> str:
    try:
        import httpx
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-CA,en;q=0.9",
        }
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            r = await client.get(SUN_LIFE_URL, headers=headers)
            if r.status_code == 200:
                # Strip HTML tags for a plain-text pass to Gemini
                import re
                text = re.sub(r"<[^>]+>", " ", r.text)
                text = re.sub(r"\s+", " ", text).strip()
                return text[:12000]  # cap at ~12k chars
    except Exception:
        pass
    return SCRAPED_CONTENT_FALLBACK
