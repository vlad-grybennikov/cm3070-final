import { notFound } from "next/navigation";
import { PageRenderer } from "@/components/PageRenderer";
import { getPageByUrl } from "@/lib/page";

/**
 * Renders any published page by its URL. The catch-all captures every path
 * except `/` (the builder), looks it up in the DB, and 404s if missing.
 */
export default async function GeneratedPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const url = "/" + slug.join("/");

  const page = await getPageByUrl(url);
  if (!page) notFound();

  return <PageRenderer sections={page.sections} />;
}
