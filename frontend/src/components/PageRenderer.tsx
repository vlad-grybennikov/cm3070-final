import type { Section } from "@/types/sections";
import { SectionRenderer } from "./sections/SectionRenderer";

/**
 * Renders an ordered list of sections into a page. The list is the JSON
 * document that will later come from MongoDB.
 */
export function PageRenderer({ sections }: { sections: Section[] }) {
  return (
    <main className="flex w-full flex-1 flex-col">
      {sections.map((section, i) => (
        <SectionRenderer key={i} section={section} />
      ))}
    </main>
  );
}
