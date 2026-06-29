"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import type { Section } from "@/types/sections";
import { SECTION_LABELS } from "@/data/build-mock";
import { PencilIcon } from "./icons";

/**
 * Inline editor for the selected section. Edits are immutable: each input
 * builds the next section and calls {@link onUpdate}, which updates the canvas
 * live. Fields shown adapt to the section type.
 */
export function EditPanel({
  section,
  onUpdate,
}: {
  section: Section;
  onUpdate: (next: Section) => void;
}) {
  return (
    <section className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
      <h2 className="text-lg font-semibold">Edit: {SECTION_LABELS[section.type]}</h2>
      <div className="mt-2">{renderFields(section, onUpdate)}</div>
    </section>
  );
}

function renderFields(section: Section, onUpdate: (next: Section) => void): ReactNode {
  switch (section.type) {
    case "hero":
      return (
        <>
          <Field label="Title">
            <TextInput
              value={section.headline}
              onChange={(headline) => onUpdate({ ...section, headline })}
            />
          </Field>
          <Field label="Description">
            <TextArea
              value={section.subhead ?? ""}
              onChange={(subhead) => onUpdate({ ...section, subhead })}
            />
          </Field>
          <Field label="Button">
            <TextInput
              value={section.button.label}
              onChange={(label) =>
                onUpdate({ ...section, button: { ...section.button, label } })
              }
            />
          </Field>
          <Field label="Image">
            <ImagePreview src={section.image.src} alt={section.image.alt} />
          </Field>
        </>
      );

    case "benefits":
      return (
        <Field label="Heading">
          <TextInput
            value={section.heading}
            onChange={(heading) => onUpdate({ ...section, heading })}
          />
        </Field>
      );

    case "promotion":
      return (
        <>
          <Field label="Title">
            <TextInput
              value={section.title}
              onChange={(title) => onUpdate({ ...section, title })}
            />
          </Field>
          <Field label="Description">
            <TextArea
              value={section.description}
              onChange={(description) => onUpdate({ ...section, description })}
            />
          </Field>
          <Field label="Button">
            <TextInput
              value={section.button.label}
              onChange={(label) =>
                onUpdate({ ...section, button: { ...section.button, label } })
              }
            />
          </Field>
        </>
      );

    case "testimonials":
    case "faq":
      return (
        <Field label="Heading">
          <TextInput
            value={section.heading ?? ""}
            onChange={(heading) => onUpdate({ ...section, heading })}
          />
        </Field>
      );

    default: {
      const _exhaustive: never = section;
      return _exhaustive;
    }
  }
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-black/10 py-4 last:border-b-0 dark:border-white/10">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500">{label}</span>
        <PencilIcon className="h-3.5 w-3.5 text-zinc-400" />
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const inputClass =
  "w-full rounded-md bg-transparent text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-foreground/20";

function TextInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
    />
  );
}

function TextArea({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={2}
      className={`${inputClass} resize-none`}
    />
  );
}

function ImagePreview({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-black/10 bg-zinc-100 dark:border-white/10 dark:bg-zinc-800">
      <Image src={src} alt={alt} fill sizes="320px" className="object-cover" />
    </div>
  );
}
