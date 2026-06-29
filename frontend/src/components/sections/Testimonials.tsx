import type { TestimonialsSection } from "@/types/sections";

function Stars({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div
      className="flex gap-0.5 text-amber-500"
      role="img"
      aria-label={`${filled} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className={i < filled ? "" : "text-zinc-300 dark:text-zinc-700"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function Testimonials({ heading, items }: TestimonialsSection) {
  return (
    <section className="w-full" data-section="testimonials">
      <div className="mx-auto max-w-5xl px-6 py-16">
        {heading && (
          <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight">
            {heading}
          </h2>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          {items.map((item, i) => (
            <figure
              key={i}
              className="flex flex-col gap-3 rounded-xl border border-border bg-muted p-6"
            >
              <figcaption className="font-medium text-primary">{item.name}</figcaption>
              <Stars rating={item.rating} />
              <blockquote className="text-muted-foreground">{item.content}</blockquote>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
