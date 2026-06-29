"""Canned stub content for the createPage flow.

This is STUB data behind the language service: templated copy that the copy
generator fills from the brief, plus the (FE-only) clarifications and version
history. Replaced by a real LLM later. Images are added by image_selector.
"""

# Templated copy per section. The hero headline is injected with the business
# name by the language service so the page echoes what was spoken.
COPY_TEMPLATES = {
    "hero": {
        "subhead": (
            "European-crafted windows and doors with Energy Star's highest "
            "efficiency rating. Triple-pane glass and a lifetime warranty — "
            "working directly with installers."
        ),
        "button": {"label": "Get your free quote", "href": "#"},
    },
    "benefits": {
        "heading": "Why homeowners choose us",
        "items": [
            {
                "title": "Quality Guaranteed",
                "caption": (
                    "Fully equipped installers and quality materials backed by "
                    "manufacturer warranties. Your investment is protected."
                ),
            },
            {
                "title": "Energy-Efficient Solutions",
                "caption": (
                    "Our windows and doors meet the highest energy standards, "
                    "helping you save money while keeping your family comfortable "
                    "year-round."
                ),
            },
            {
                "title": "Personalized Service",
                "caption": (
                    "We listen to your needs and guide you through every decision "
                    "— from style selection to final installation. You're never "
                    "just a number."
                ),
            },
        ],
    },
    "testimonials": {
        "heading": "Rated 4.9 by 500+ homeowners",
        "items": [
            {
                "name": "Danylo F., Toronto",
                "rating": 5,
                "content": (
                    "The installation in my home was exceptional — professional, "
                    "precise, and a noticeable improvement in insulation. The team "
                    "was respectful, clean, and finished on time. My home feels so "
                    "much warmer now!"
                ),
            },
            {
                "name": "Araz H., Mississauga",
                "rating": 5,
                "content": (
                    "Incredibly efficient, clean and friendly service. We replaced "
                    "our two main doors and are very happy. They have a wide "
                    "catalogue and helped us choose the perfect style — outstanding "
                    "quality at a reasonable price."
                ),
            },
            {
                "name": "Shania C., Brampton",
                "rating": 5,
                "content": "Fast, good quality and reasonable prices. Highly recommend!",
            },
        ],
    },
    "promotion": {
        "title": "Save up to 50% on new windows",
        "description": (
            "Get up to 30% off your first installment, plus free disposal of your "
            "old windows and a free professional cleaning after installation."
        ),
        "button": {"label": "Get a free estimate", "href": "#"},
    },
    "faq": {
        "heading": "Frequently asked questions",
        "items": [
            {
                "question": "How much does it cost to replace windows and doors?",
                "answer": (
                    "Every project is unique based on the number of windows or "
                    "doors, the styles chosen, and your home's needs. Most window "
                    "replacements range from $500–$2,000 per window, and doors from "
                    "$2,000–$6,000."
                ),
            },
            {
                "question": "How long does installation take?",
                "answer": (
                    "Most window installations take 1–2 days depending on the "
                    "number of windows. Door installations typically take 4–8 hours."
                ),
            },
            {
                "question": "Will my home be a mess during installation?",
                "answer": (
                    "No. We protect your home with drop cloths, clean up debris "
                    "daily, and leave your space spotless when we're done."
                ),
            },
            {
                "question": "Do you offer warranties?",
                "answer": (
                    "Yes — all our windows and doors come with manufacturer "
                    "warranties covering both materials and workmanship."
                ),
            },
        ],
    },
}

# FE-only extras (not part of the validated Page; shown in the builder).
CLARIFICATIONS = [
    "Should the hero mention the triple-pane glass upgrade?",
    "Do you want the first-installment discount highlighted?",
]

VERSIONS = [
    {"id": "v1", "label": "Initial draft", "when": "now"},
]
