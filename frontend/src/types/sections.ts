/**
 * Content model for JSON-driven pages.
 *
 * A page is an ordered list of sections. Each section is a discriminated
 * union member keyed on `type`, so the renderer can pick the right component
 * and TypeScript can narrow the props exhaustively.
 *
 * Mirrors the design-document UML. This is the shape that will later be read
 * from MongoDB.
 */

/** Shared image reference (UML: Image). */
export interface ImageRef {
  src: string;
  alt: string;
}

/** Shared call-to-action (UML: Button). `href` is optional for real navigation. */
export interface ButtonRef {
  label: string;
  href?: string;
}

/** UML: HeroSection */
export interface HeroSection {
  type: "hero";
  headline: string;
  subhead?: string;
  image: ImageRef;
  button: ButtonRef;
}

/** UML: BenefitItem */
export interface BenefitItem {
  icon: ImageRef;
  title: string;
  caption: string;
}

/** UML: BenefitsSection (items: 3..6) */
export interface BenefitsSection {
  type: "benefits";
  heading: string;
  items: BenefitItem[];
}

/** UML: PromotionSection */
export interface PromotionSection {
  type: "promotion";
  title: string;
  description: string;
  button: ButtonRef;
}

/** UML: TestimonialItem */
export interface TestimonialItem {
  name: string;
  rating: number;
  content: string;
}

/** UML: TestimonialsSection (items: 1..*) */
export interface TestimonialsSection {
  type: "testimonials";
  heading?: string;
  items: TestimonialItem[];
}

/** UML: FAQItem */
export interface FAQItem {
  question: string;
  answer: string;
}

/** UML: FAQSection (items: 1..*) */
export interface FAQSection {
  type: "faq";
  heading?: string;
  items: FAQItem[];
}

/** Any renderable section. Add new section types here. */
export type Section =
  | HeroSection
  | BenefitsSection
  | PromotionSection
  | TestimonialsSection
  | FAQSection;

/** Narrowing helper: the set of valid `type` values. */
export type SectionType = Section["type"];

/** Top-level page document. */
export interface PageData {
  sections: Section[];
}
