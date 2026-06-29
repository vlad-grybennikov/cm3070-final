import Image from "next/image";
import type { ImageRef } from "@/types/sections";

/**
 * Wraps `next/image` for content-driven images whose dimensions are unknown at
 * build time. Uses `fill`, so the parent must be positioned and sized.
 *
 * Remote hosts must be allow-listed in `next.config.ts` (`images.remotePatterns`).
 */
export function CmsImage({
  image,
  sizes,
  className,
}: {
  image: ImageRef;
  sizes?: string;
  className?: string;
}) {
  return (
    <Image src={image.src} alt={image.alt} fill sizes={sizes} className={className} />
  );
}
