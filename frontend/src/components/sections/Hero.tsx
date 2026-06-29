import type { HeroSection } from "@/types/sections";
import { CmsImage } from "@/components/ui/CmsImage";
import { CtaButton } from "@/components/ui/CtaButton";

export function Hero({ headline, subhead, image, button }: HeroSection) {
  return (
    <section className="w-full" data-section="hero">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <div className="relative aspect-[16/7] w-full overflow-hidden rounded-2xl bg-muted">
          <CmsImage
            image={image}
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        </div>

        <div className="mt-8 flex flex-col items-start gap-4">
          <h1 className="text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
            {headline}
          </h1>
          {subhead && (
            <p className="max-w-2xl text-lg text-muted-foreground">{subhead}</p>
          )}
          <div className="mt-2">
            <CtaButton button={button} variant="accent" />
          </div>
        </div>
      </div>
    </section>
  );
}
