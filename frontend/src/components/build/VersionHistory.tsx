"use client";

import { useState } from "react";
import type { PageVersion } from "@/data/build-mock";

export function VersionHistory({ versions }: { versions: PageVersion[] }) {
  const [selected, setSelected] = useState(versions[0]?.id);

  return (
    <section className="rounded-2xl border border-border p-5">
      <h2 className="text-lg font-semibold">Page version history</h2>

      <ul className="mt-4 flex flex-col gap-2">
        {versions.map((version) => {
          const active = version.id === selected;
          return (
            <li key={version.id}>
              <button
                type="button"
                onClick={() => setSelected(version.id)}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
                  active
                    ? "border-border bg-muted"
                    : "border-border hover:bg-muted"
                }`}
              >
                <span
                  className={`h-3 w-3 shrink-0 rounded-full border ${
                    active
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/40"
                  }`}
                />
                <span className="flex-1 truncate text-sm">{version.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {version.when}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
