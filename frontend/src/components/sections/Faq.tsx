import type { FAQSection } from "@/types/sections";

/**
 * Accordion built on native `<details>`/`<summary>` so it stays interactive
 * without client-side JavaScript (fully renderable as a Server Component).
 */
export function Faq({ heading, items }: FAQSection) {
  return (
    <section className="w-full" data-section="faq">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {heading && (
          <h2 className="mb-8 text-3xl font-semibold tracking-tight">{heading}</h2>
        )}

        <div className="border-y border-border">
          {items.map((item, i) => (
            <details
              key={i}
              className="group border-b border-border py-4 last:border-b-0"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
                {item.question}
                <span className="text-2xl leading-none text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
