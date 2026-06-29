"""createPage pipeline — the orchestrator's validated generation flow.

Mirrors the master control flow), in three explicit stages:

  1. classify the High-Level Action (HLA) and validate it against the allowed
     action set -> Gate 1 (intent)
  2. plan the HLA into an ordered list of atomic operations (OAO)
  3. execute the OAO in order — generate copy, select image, assemble each
     section (Gate 3, default on failure), then assemble + schema-validate the
     whole Page -> Gate 2 (schema)

Content failures default silently; intent/schema failures are raised so the
caller can surface them to the user.

Every step logs to the "vlp.pipeline" logger so the flow is observable.
"""

import logging
import re
from dataclasses import dataclass
from typing import Optional

from pydantic import ValidationError

from image_selector import ImageService
from llm import LanguageService
from mock_page import CLARIFICATIONS, VERSIONS
from schema import (
    BenefitsSection,
    FAQSection,
    HeroSection,
    Page,
    PromotionSection,
    TestimonialsSection,
)

# High-level actions the prototype supports (Gate 1).
ALLOWED_ACTIONS = {"createPage"}

# Map section type -> model, for per-operation (Gate 3) validation.
SECTION_MODELS = {
    "hero": HeroSection,
    "benefits": BenefitsSection,
    "testimonials": TestimonialsSection,
    "promotion": PromotionSection,
    "faq": FAQSection,
}

lang = LanguageService()
images = ImageService()

# Self-contained logger so steps are visible regardless of uvicorn's config.
logger = logging.getLogger("vlp.pipeline")
if not logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("%(asctime)s [pipeline] %(message)s", "%H:%M:%S"))
    logger.addHandler(_handler)
    logger.setLevel(logging.INFO)
    logger.propagate = False


# ----- errors (surfaced to the user) -----
class PipelineError(Exception):
    """A failure that should be shown to the user, tagged with its stage."""

    stage = "pipeline"

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class CommandUnclear(PipelineError):
    stage = "command"


class IntentInvalid(PipelineError):
    stage = "intent"


class SchemaInvalid(PipelineError):
    stage = "schema"


# ----- ordered atomic operation (OAO) -----
@dataclass
class Operation:
    kind: str  # generate_copy | select_image | assemble_section | assemble_page
    target: Optional[str] = None  # section type, where applicable

    def __str__(self) -> str:
        return f"{self.kind}:{self.target}" if self.target else self.kind


# A usable command needs at least this much signal (rejects blips / noise).
MIN_COMMAND_CHARS = 6
MIN_COMMAND_WORDS = 2

# Phrases Whisper commonly hallucinates from silence/noise — treated as "no command".
HALLUCINATIONS = {
    "thank you",
    "thank you very much",
    "thank you for watching",
    "thanks",
    "thanks for watching",
    "please subscribe",
    "subscribe",
    "you",
    "bye",
    "okay",
    "ok",
    "uh",
    "um",
}


def run_create_page(transcript: str, language: str | None = None) -> dict:
    logger.info("──────── createPage pipeline start ────────")
    logger.info("transcript: %r (lang=%s)", _short(transcript), language)

    # 0. command-quality gate — reject too-short / unintelligible commands
    _check_command(transcript)

    # 1. classify HLA + Gate 1 (intent validation against the allowed set)
    hla = _classify_hla(transcript)

    # 2. extract brief
    brief = lang.extract_brief(transcript)
    logger.info(
        "STEP 2/4 brief extracted: business=%r audience=%r goal=%r",
        brief["business"], brief["audience"], brief["goal"],
    )

    # 3. generate the page schema (LLM stub) — an ordered list of sections
    schema = lang.generate_schema(brief, transcript)
    logger.info("STEP 3/4 schema generated: %d sections %s", len(schema), schema)

    # 4. plan the schema -> ordered atomic operations (OAO)
    operations = _plan_operations(schema)
    logger.info("STEP 4/4 planner produced %d atomic operations:", len(operations))
    for i, op in enumerate(operations, 1):
        logger.info("    OAO %02d/%02d  %s", i, len(operations), op)

    # 3. execute OAO (Gate 3 per-op) then assemble + Gate 2
    page, operations_status = _execute_operations(operations, brief)

    logger.info(
        "gates: intent=ok operations=%s schema=ok → page %s (%d sections)",
        operations_status, page.url, len(page.sections),
    )
    logger.info("──────── pipeline done: VALID ────────")

    business = brief["business"]
    return {
        "recognizedCommand": transcript,
        "language": language,
        "message": (
            f"Okay, understood — I've drafted a {len(page.sections)}-section page "
            f"for {business}."
        ),
        "summary": f"Building a landing page for {business} to {brief['goal'].lower()}.",
        "brief": brief,
        "clarifications": CLARIFICATIONS,
        "versions": VERSIONS,
        "page": page.model_dump(),
        "plan": {
            "action": hla,
            "schema": schema,
            "operations": [str(o) for o in operations],
        },
        "validation": {
            "valid": True,
            "gates": {"intent": "ok", "schema": "ok", "operations": operations_status},
        },
    }


def _check_command(transcript: str) -> None:
    """Gate 0 — reject empty, too-short or unintelligible voice commands."""
    text = (transcript or "").strip()
    words = re.findall(r"[A-Za-z]{2,}", text)
    normalized = re.sub(r"[^a-z ]", "", text.lower()).strip()

    if len(text) < MIN_COMMAND_CHARS or len(words) < MIN_COMMAND_WORDS:
        logger.warning("GATE 0 (command) REJECTED: transcript too short/unclear: %r", text)
        raise CommandUnclear(
            "That didn't sound like a command — try saying something like "
            "\"a landing page for window installers\"."
        )

    if normalized in HALLUCINATIONS:
        logger.warning("GATE 0 (command) REJECTED: likely silence/hallucination: %r", text)
        raise CommandUnclear(
            "I didn't hear a command — hold the mic and describe the page you want."
        )

    logger.info("GATE 0 (command) ok: %d words", len(words))


def _classify_hla(transcript: str) -> str:
    """Gate 1 — classify the HLA and reject anything not in the allowed set."""
    hla = lang.classify_intent(transcript)
    logger.info("STEP 1/4 classify intent → HLA=%r", hla)
    if hla not in ALLOWED_ACTIONS:
        logger.warning(
            "GATE 1 (intent) REJECTED: %r not in allowed actions %s",
            hla, sorted(ALLOWED_ACTIONS),
        )
        raise IntentInvalid(
            f"Action '{hla}' isn't supported yet — try describing a page to create."
        )
    logger.info("GATE 1 (intent) ok: %r is allowed", hla)
    return hla


def _plan_operations(schema: list[str]) -> list[Operation]:
    """Planner — split the ordered section schema into atomic operations (OAO)."""
    operations: list[Operation] = []
    for section_type in schema:
        operations.append(Operation("generate_copy", section_type))
        operations.append(Operation("select_image", section_type))
        operations.append(Operation("assemble_section", section_type))
    operations.append(Operation("assemble_page"))
    return operations


def _execute_operations(operations: list[Operation], brief: dict):
    """Execute the OAO in order, validating each (Gate 3) and the Page (Gate 2)."""
    drafts: dict[str, dict] = {}
    sections: list[dict] = []
    operations_status = "ok"
    page: Page | None = None

    for i, op in enumerate(operations, 1):
        prefix = f"exec {i:02d}/{len(operations)} {op}"

        if op.kind == "generate_copy":
            drafts[op.target] = {"type": op.target, **lang.generate_copy(op.target, brief)}
            logger.info("%s → copy fields: %s", prefix, list(drafts[op.target].keys()))

        elif op.kind == "select_image":
            _attach_images(op.target, drafts[op.target])
            logger.info("%s → images attached", prefix)

        elif op.kind == "assemble_section":
            raw = drafts[op.target]
            try:
                model = SECTION_MODELS[op.target](**raw)  # Gate 3
                sections.append(model.model_dump())
                logger.info("%s → GATE 3 ok", prefix)
            except ValidationError as e:
                sections.append(_default_section(op.target))  # silent default
                operations_status = "defaulted"
                logger.warning(
                    "%s → GATE 3 failed (%d error(s)) → applied default",
                    prefix, e.error_count(),
                )

        elif op.kind == "assemble_page":
            page = _assemble_page(brief, sections)  # Gate 2 (may raise SchemaInvalid)
            logger.info("%s → GATE 2 ok", prefix)

    assert page is not None, "planner must end with an assemble_page operation"
    return page, operations_status


def _attach_images(section_type: str, section: dict) -> None:
    if section_type == "hero":
        section["image"] = images.select("hero")
    elif section_type == "benefits":
        for i, item in enumerate(section.get("items", [])):
            item["icon"] = images.select("benefits", i)


def _assemble_page(brief: dict, sections: list[dict]) -> Page:
    page_dict = {
        "version": 1,
        "name": brief["business"],
        "url": _slugify(brief["business"]),
        "sections": sections,
    }
    try:
        return Page(**page_dict)
    except ValidationError as e:
        message = _summarize_errors(e)
        logger.warning("GATE 2 (schema) REJECTED: %s", message)
        raise SchemaInvalid(message) from e


def _default_section(section_type: str) -> dict:
    """A guaranteed-valid fallback used when an operation fails Gate 3."""
    placeholder = {"src": "/images/hero-section.jpg", "alt": ""}
    defaults = {
        "hero": {
            "type": "hero",
            "headline": "Welcome",
            "image": placeholder,
            "button": {"label": "Learn more"},
        },
        "benefits": {
            "type": "benefits",
            "heading": "Benefits",
            "items": [
                {"icon": placeholder, "title": "Benefit", "caption": "Description."}
                for _ in range(3)
            ],
        },
        "testimonials": {
            "type": "testimonials",
            "heading": "Testimonials",
            "items": [{"name": "Customer", "rating": 5, "content": "Great service."}],
        },
        "promotion": {
            "type": "promotion",
            "title": "Special offer",
            "description": "Get in touch today.",
            "button": {"label": "Learn more"},
        },
        "faq": {
            "type": "faq",
            "heading": "FAQ",
            "items": [{"question": "Have a question?", "answer": "Contact us."}],
        },
    }
    return defaults[section_type]


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return "/" + (slug or "page")


def _summarize_errors(error: ValidationError) -> str:
    count = error.error_count()
    first = error.errors()[0]
    loc = ".".join(str(part) for part in first["loc"]) or "page"
    return f"{count} schema error(s); first at '{loc}': {first['msg']}"


def _short(text: str, limit: int = 80) -> str:
    text = (text or "").strip()
    return text if len(text) <= limit else text[: limit - 1] + "…"
