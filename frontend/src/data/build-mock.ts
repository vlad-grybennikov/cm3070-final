// Shared builder types and constants. The actual page/brief/clarification data
// now comes from the orchestrator's /command response (see lib/orchestrator.ts).

/** The brief the assistant inferred from the conversation. */
export interface Brief {
  business: string;
  audience: string;
  goal: string;
}

/** A point-in-time snapshot of the page. */
export interface PageVersion {
  id: string;
  /** Short description of what changed in this version. */
  label: string;
  /** Relative timestamp, e.g. "now", "2 minutes ago". */
  when: string;
}

/** Display labels for each section type. */
export const SECTION_LABELS = {
  hero: "Hero",
  benefits: "Benefits",
  promotion: "Promotion",
  testimonials: "Testimonials",
  faq: "FAQ",
} as const;
