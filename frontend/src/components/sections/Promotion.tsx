import type { PromotionSection } from "@/types/sections";
import { CtaButton } from "@/components/ui/CtaButton";

export function Promotion({ title, description, button }: PromotionSection) {
  return (
    <section className="w-full" data-section="promotion">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex flex-col items-center gap-6 rounded-2xl bg-muted px-6 py-16 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-primary">
            {title}
          </h2>
          <p className="max-w-2xl text-lg text-muted-foreground">{description}</p>
          <CtaButton button={button} variant="accent" />
        </div>
      </div>
    </section>
  );
}
