import type { PageData, Section } from "@/types/sections";
import { getDb } from "@/lib/mongodb";

/**
 * Looks up a published page by its URL path (e.g. "/demo", "/windows/quote").
 * Returns `null` when no published page exists at that URL.
 *
 * Reads from the `pages` collection in MongoDB; only documents with
 * `publish: true` are served.
 */
export async function getPageByUrl(url: string): Promise<PageData | null> {
  const db = await getDb();
  const doc = await db.collection("pages").findOne({ url, publish: true });

  if (!doc || !Array.isArray(doc.sections)) return null;

  return { sections: doc.sections as Section[] };
}
