DENTAL_ANALYSIS_PROMPT = """
You are an expert orthodontist and dental clinician analyzing a dental photograph.

Carefully examine every visible tooth and respond with a JSON object ONLY (no markdown, no code fences):

{
  "severity": "mild" | "moderate" | "severe",
  "issues": [
    "<specific observation 1>",
    "<specific observation 2>",
    "<specific observation 3>",
    "<specific observation 4>",
    "<specific observation 5>"
  ],
  "cavities_detected": true | false,
  "cavity_notes": "<describe location and appearance of any visible cavities or dark spots, or 'None detected'>",
  "estimated_months": <integer between 6 and 36>,
  "suitable_for_braces": true | false,
  "notes": "<two to three sentence clinical summary covering alignment, hygiene, and recommended treatment>"
}

Guidelines:
- severity: mild = minor spacing/rotation only, moderate = clear crowding or bite issues, severe = significant misalignment, crossbite, or major crowding
- issues: list up to 5 specific clinical observations — e.g. "lower arch crowding with overlapping lateral incisors", "upper right canine rotation ~20 degrees", "anterior open bite", "spacing between upper central incisors", "dark discoloration on molar suggesting cavity"
- cavities_detected: true if you see any dark spots, brown/black staining, visible decay, or structural damage on any tooth surface
- cavity_notes: be specific about which teeth and what you see — e.g. "dark brown lesion on lower left first molar, possible occlusal cavity; minor staining on upper incisors"
- estimated_months: MUST be between 6 and 36. Never return 0. Mild cases: 6–12. Moderate: 12–24. Severe: 24–36.
- suitable_for_braces: false only if there are severe untreated cavities, missing teeth, or gum disease visible
- notes: write a clear 2–3 sentence summary a patient can understand
"""

GLOBAL_GUARDRAILS = (
    "Preserve the exact same person, same mouth opening, same lip position, same camera angle, same crop, same lighting, "
    "and same visible teeth count. Do not zoom, widen the smile, close the mouth, or change facial expression. "
    "Preserve the exact shape of every tooth — the width, height, edges, chips, stains, and surface texture of each tooth must be identical to the input. "
    "Do not reshape, resize, smooth, round, or regenerate any tooth. Do not replace a tooth with a generic tooth shape. "
    "Do not whiten teeth, smooth skin, improve gums, remove stains, fix cavities, restore broken teeth, or replace missing structure. "
    "The only allowed changes are braces being added or removed at the correct stage and gradual changes in tooth position over time."
)

STAGE_DEFINITIONS = [
    {
        "month": 3,
        "label": "Braces Applied",
        "prompt": (
            f"{GLOBAL_GUARDRAILS} "
            "You are overlaying metal braces onto this dental photo. This is day 1 of braces — no tooth movement has occurred yet. "
            "TASK: Place a small square metal bracket directly on top of each tooth exactly where it sits now. "
            "Connect the brackets with a thin metal archwire. That is the only change. "
            "STRICTLY FORBIDDEN: moving, rotating, tilting, or shifting any tooth even 1 millimeter. "
            "STRICTLY FORBIDDEN: straightening, aligning, or improving any tooth position. "
            "Every crooked tooth, every rotated tooth, every overlapping tooth must remain in its exact original position. "
            "If a tooth is rotated 30 degrees in the input, it must still be rotated 30 degrees in the output with a bracket on it. "
            "If teeth are overlapping in the input, they must still be overlapping in the output with brackets on them. "
            "The output must look like someone physically glued metal brackets onto the existing crooked teeth."
        ),
    },
    {
        "month": 9,
        "label": "Early Movement",
        "prompt": (
            f"{GLOBAL_GUARDRAILS} "
            "You are editing a dental photo that already shows teeth with braces, for month 9 of treatment. "
            "Keep all metal brackets and the archwire on every visible tooth. "
            "Show only modest orthodontic progress. "
            "Keep about 75 to 80 percent of the original crookedness still present. "
            "The teeth must still look clearly crowded and misaligned. "
            "The upper front teeth should look only a little less overlapped than month 3, and the lower front teeth should still look obviously crowded. "
            "This should be visibly better than month 3, but still very far from straight."
        ),
    },
    {
        "month": 15,
        "label": "Almost There",
        "prompt": (
            f"{GLOBAL_GUARDRAILS} "
            "You are editing a dental photo that shows teeth with braces for month 15 of treatment. "
            "Keep all metal brackets and the archwire on every visible tooth. "
            "Show clear progress, but do not finish treatment yet. "
            "Keep about 35 to 45 percent of the original crookedness still present. "
            "The upper front teeth should be much better aligned than month 9, but still not perfectly straight. "
            "The lower crowded teeth should still show visible irregularity. "
            "This should look obviously improved over month 9, but still unfinished."
        ),
    },
    {
        "month": 24,
        "label": "Treatment Complete",
        "prompt": (
            f"{GLOBAL_GUARDRAILS} "
            "You are editing a dental photo for the final completed stage at month 24. "
            "Remove every bracket, every wire, and all metal hardware completely so the teeth are fully bare with no braces at all. "
            "Now show the strongest orthodontic improvement in the sequence. "
            "The teeth should appear straight and evenly aligned, clearly better than month 15. "
            "Do not improve anything unrelated to orthodontic alignment. "
            "The only intended differences are final tooth alignment and braces removal."
        ),
    },
]
