"""Pydantic schema — the single source of truth for a validated Page.

This is Gate 2 of the validation model: a Page is only ever persisted or
returned if it validates against these models. FastAPI also emits these as
OpenAPI/JSON-Schema for the front end.
"""

from typing import Annotated, Literal, Optional, Union

from pydantic import BaseModel, Field

# Non-empty string (rejects "" / whitespace-only copy)
NonEmptyStr = Annotated[str, Field(min_length=1)]


# ----- shared value objects -----
class Image(BaseModel):
    src: NonEmptyStr
    alt: str = ""


class Button(BaseModel):
    label: NonEmptyStr
    href: Optional[str] = None


# ----- the inferred brief -----
class Brief(BaseModel):
    business: NonEmptyStr
    audience: NonEmptyStr
    goal: NonEmptyStr
    tone: Optional[str] = None


# ----- sections -----
class HeroSection(BaseModel):
    type: Literal["hero"]
    headline: NonEmptyStr
    subhead: Optional[str] = None
    image: Image
    button: Button


class BenefitItem(BaseModel):
    icon: Image
    title: NonEmptyStr
    caption: NonEmptyStr


class BenefitsSection(BaseModel):
    type: Literal["benefits"]
    heading: NonEmptyStr
    # 3..6 items
    items: Annotated[list[BenefitItem], Field(min_length=3, max_length=6)]


class TestimonialItem(BaseModel):
    name: NonEmptyStr
    rating: Annotated[int, Field(ge=1, le=5)]
    content: NonEmptyStr


class TestimonialsSection(BaseModel):
    type: Literal["testimonials"]
    heading: Optional[str] = None
    items: Annotated[list[TestimonialItem], Field(min_length=1)]


class PromotionSection(BaseModel):
    type: Literal["promotion"]
    title: NonEmptyStr
    description: NonEmptyStr
    button: Button


class FAQItem(BaseModel):
    question: NonEmptyStr
    answer: NonEmptyStr


class FAQSection(BaseModel):
    type: Literal["faq"]
    heading: Optional[str] = None
    items: Annotated[list[FAQItem], Field(min_length=1)]


# Discriminated union on `type`
Section = Annotated[
    Union[
        HeroSection,
        BenefitsSection,
        TestimonialsSection,
        PromotionSection,
        FAQSection,
    ],
    Field(discriminator="type"),
]


class Page(BaseModel):
    version: int = 1
    name: NonEmptyStr
    url: NonEmptyStr
    # at least one section
    sections: Annotated[list[Section], Field(min_length=1)]
