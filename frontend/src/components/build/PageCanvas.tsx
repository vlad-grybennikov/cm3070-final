"use client";

import type { Section } from "@/types/sections";
import { SECTION_LABELS } from "@/data/build-mock";
import { SectionRenderer } from "@/components/sections/SectionRenderer";

/**
 * Live preview of the page. Reuses the real section components so what the user
 * sees here is exactly what ships. Each section is selectable; the selected one
 * drives the Edit panel.
 */
export function PageCanvas({
  sections,
  selectedIndex,
  onSelect,
}: {
  sections: Section[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="h-full overflow-y-auto rounded-2xl border border-black/10 bg-zinc-100 p-4 dark:border-white/10 dark:bg-zinc-900/40">
      <div className="flex flex-col gap-4">
        {sections.map((section, i) => {
          const selected = i === selectedIndex;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              className={`relative block w-full overflow-hidden rounded-xl bg-background text-left transition-shadow ${
                selected
                  ? "ring-2 ring-foreground"
                  : "ring-1 ring-black/10 hover:ring-black/20 dark:ring-white/10 dark:hover:ring-white/20"
              }`}
            >
              {selected && (
                <span className="absolute left-3 top-3 z-10 rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background">
                  SELECTED · {SECTION_LABELS[section.type]}
                </span>
              )}
              {/* Inner content is preview-only — clicks select the section. */}
              <div className="pointer-events-none">
                <SectionRenderer section={section} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
