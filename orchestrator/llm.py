"""Language service (STUB behind a stable interface).

Handles the language-model responsibilities: intent classification, brief
extraction, and copy generation. Everything here is faked but presented through
the interface the real LLM (Ollama) will implement later — the orchestrator
calls these methods and does not know it's a stub.
"""

import re

from mock_page import COPY_TEMPLATES

# Canonical section order, and the words a user might use to name each section.
SECTION_ORDER = ["hero", "benefits", "testimonials", "promotion", "faq"]
SECTION_ALIASES = {
    "hero": r"hero|header|banner|headline",
    "benefits": r"benefit|feature|advantage|why choose|why us",
    "testimonials": r"testimonial|review|rating|quote",
    "promotion": r"promotion|promo|offer|sale|discount|deal|call to action|cta",
    "faq": r"faq|q ?and ?a|q&a|question",
}
# Used when the user names no sections.
DEFAULT_SCHEMA = ["hero", "benefits", "testimonials", "promotion", "faq"]


class LanguageService:
    def classify_intent(self, transcript: str) -> str:
        """Map a transcript to a high-level action (HLA).

        STUB: editing verbs resolve to `editContent` (a DESIGNED, not-yet-supported
        action) so the intent gate has something to reject; everything else is
        `createPage`.
        """
        if re.search(r"\b(edit|change|update|replace|remove|delete)\b", transcript or "", re.IGNORECASE):
            return "editContent"
        return "createPage"

    def extract_brief(self, transcript: str) -> dict:
        """Derive a Brief from the transcript.

        STUB: naively guesses the business name from the transcript so the
        generated page demonstrably reflects what was spoken; audience/goal/tone
        are defaulted.
        """
        return {
            "business": self._guess_business(transcript),
            "audience": "Local homeowners",
            "goal": "Collect enquiries",
            "tone": None,
        }

    def generate_schema(self, brief: dict, transcript: str) -> list[str]:
        """Produce the page structure: an ordered list of section types.

        STUB: a real LLM would design this from the brief. Here we read which
        sections the user actually named and include only those (in canonical
        order); if none are named we fall back to a full default layout.
        Returning [] simulates the LLM producing a broken schema (fails Gate 2).
        """
        text = (transcript or "").lower()

        if re.search(r"\b(break|invalid|corrupt)\b", text):
            return []  # demo: structurally invalid schema → rejected at Gate 2

        named = [
            section
            for section in SECTION_ORDER
            if re.search(SECTION_ALIASES[section], text)
        ]
        return named or list(DEFAULT_SCHEMA)

    def generate_copy(self, section_type: str, brief: dict) -> dict:
        """Return the text fields for a section, filled from the brief.

        STUB: copies templated content; injects the business name into the hero
        headline. Returns a deep-ish copy so callers can mutate freely.
        """
        template = COPY_TEMPLATES.get(section_type, {})
        copy = {key: _clone(value) for key, value in template.items()}

        if section_type == "hero":
            copy["headline"] = brief["business"]

        return copy

    @staticmethod
    def _guess_business(transcript: str) -> str:
        text = (transcript or "").strip()
        if not text:
            return "Your Business"

        # "...for Maria's Bakery ..." → "Maria's Bakery"
        match = re.search(r"\bfor\s+([A-Z][\w&'’]*(?:\s+[A-Z][\w&'’]*){0,3})", text)
        if match:
            return match.group(1).strip(" .,")

        # Fallback: first few words of the transcript.
        return " ".join(text.split()[:2]).strip(" .,") or "Your Business"


def _clone(value):
    if isinstance(value, list):
        return [_clone(v) for v in value]
    if isinstance(value, dict):
        return {k: _clone(v) for k, v in value.items()}
    return value
