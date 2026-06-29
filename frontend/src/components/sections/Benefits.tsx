import type { BenefitsSection, ImageRef } from "@/types/sections";
import { CmsImage } from "@/components/ui/CmsImage";

/**
 * Benefit icon. SVGs are rendered via a CSS mask so they all take a single
 * theme color regardless of their own fills; other images render normally.
 */
function BenefitIcon({ icon }: { icon: ImageRef }) {
  const isSvg = icon.src.toLowerCase().endsWith(".svg");

  if (isSvg) {
    return (
      <span
        role="img"
        aria-label={icon.alt}
        className="h-10 w-10 bg-primary"
        style={{
          maskImage: `url(${icon.src})`,
          WebkitMaskImage: `url(${icon.src})`,
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          maskSize: "contain",
          WebkitMaskSize: "contain",
        }}
      />
    );
  }

  return (
    <div className="relative h-full w-full">
      <CmsImage image={icon} sizes="80px" className="object-contain p-2" />
    </div>
  );
}

export function Benefits({ heading, items }: BenefitsSection) {
  return (
    <section className="w-full" data-section="benefits">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight">
          {heading}
        </h2>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                <BenefitIcon icon={item.icon} />
              </div>
              <h3 className="text-lg font-medium">{item.title}</h3>
              <p className="mt-1 text-muted-foreground">{item.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
