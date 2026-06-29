import type { Section } from "@/types/sections";
import { Hero } from "./Hero";
import { Benefits } from "./Benefits";
import { Promotion } from "./Promotion";
import { Testimonials } from "./Testimonials";
import { Faq } from "./Faq";

/**
 * Maps a single section's `type` to its component. The `never` default makes
 * this a compile error if a new {@link Section} member is added without a case.
 */
export function SectionRenderer({ section }: { section: Section }) {
  switch (section.type) {
    case "hero":
      return <Hero {...section} />;
    case "benefits":
      return <Benefits {...section} />;
    case "promotion":
      return <Promotion {...section} />;
    case "testimonials":
      return <Testimonials {...section} />;
    case "faq":
      return <Faq {...section} />;
    default: {
      const _exhaustive: never = section;
      return _exhaustive;
    }
  }
}
