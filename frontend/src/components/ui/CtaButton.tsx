import type { ButtonRef } from "@/types/sections";

type Variant = "primary" | "accent" | "secondary";

const base =
  "inline-flex h-12 items-center justify-center rounded-full px-6 text-base font-medium transition-colors";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  accent: "bg-accent text-accent-foreground hover:opacity-90",
  secondary: "border border-border text-foreground hover:bg-muted",
};

/**
 * Renders a {@link ButtonRef}. Falls back to a non-navigating `<button>` when
 * the content provides no `href`.
 */
export function CtaButton({
  button,
  variant = "primary",
}: {
  button: ButtonRef;
  variant?: Variant;
}) {
  const className = `${base} ${variants[variant]}`;

  if (button.href) {
    return (
      <a href={button.href} className={className}>
        {button.label}
      </a>
    );
  }

  return (
    <button type="button" className={className}>
      {button.label}
    </button>
  );
}
