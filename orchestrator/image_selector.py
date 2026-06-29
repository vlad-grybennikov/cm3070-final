"""Image selection service (STUB behind a stable interface).

For now returns fixed local images (served by the frontend from /public). Later
this is replaced by real CLIP-based selection without changing the orchestrator.
"""


class ImageService:
    # Fixed image per section type. Benefits returns a different icon per item.
    HERO = {"src": "/images/hero-section.jpg", "alt": "Premium installed windows"}
    BENEFITS = [
        {"src": "/images/quality.svg", "alt": "Quality guaranteed"},
        {"src": "/images/energy.svg", "alt": "Energy-efficient solutions"},
        {"src": "/images/personalisation.svg", "alt": "Personalized service"},
    ]

    def select(self, section_type: str, index: int = 0) -> dict:
        """Return an `{src, alt}` image for a section (and item index)."""
        if section_type == "hero":
            return dict(self.HERO)
        if section_type == "benefits":
            return dict(self.BENEFITS[index % len(self.BENEFITS)])
        # default placeholder for any other section that needs an image
        return {"src": "/images/hero-section.jpg", "alt": ""}
