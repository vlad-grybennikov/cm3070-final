import type { Section } from "@/types/sections";
import type { Brief, PageVersion } from "@/data/build-mock";

/** A validated page as returned by the orchestrator. */
export interface ValidatedPage {
  version: number;
  name: string;
  url: string;
  sections: Section[];
}

export interface ValidationStatus {
  valid: boolean;
  gates?: { intent: string; schema: string; operations: string };
}

/** The HLA and the ordered atomic operations (OAO) the planner produced. */
export interface Plan {
  action: string;
  operations: string[];
}

/**
 * Result of a voice command from the orchestrator's `/command`.
 * `recognizedCommand` is the STT transcript; `message` is the assistant's reply.
 * The page is schema-validated server-side (Gate 2).
 */
export interface CommandResponse {
  recognizedCommand: string;
  language?: string;
  message: string;
  summary: string;
  brief: Brief;
  clarifications: string[];
  versions: PageVersion[];
  page: ValidatedPage;
  plan: Plan;
  validation: ValidationStatus;
}

/** Thrown when the orchestrator rejects the command (e.g. Gate 2 schema failure). */
export class CommandRejected extends Error {
  constructor(
    public recognizedCommand: string,
    public stage: string,
    message: string,
  ) {
    super(message);
    this.name = "CommandRejected";
  }
}

const BASE_URL =
  process.env.NEXT_PUBLIC_ORCHESTRATOR_URL ?? "http://localhost:8000";

/**
 * Sends recorded audio to the orchestrator and returns the validated page data.
 * Throws {@link CommandRejected} on a 422 validation rejection.
 */
export async function sendCommand(audio: Blob): Promise<CommandResponse> {
  const form = new FormData();
  form.append("file", audio, "command.webm");

  const res = await fetch(`${BASE_URL}/command`, {
    method: "POST",
    body: form,
  });

  if (res.status === 422) {
    const data = await res.json();
    throw new CommandRejected(
      data.recognizedCommand ?? "",
      data.error?.stage ?? "schema",
      data.error?.message ?? "The generated page failed validation.",
    );
  }

  if (!res.ok) {
    throw new Error(`Orchestrator returned ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as CommandResponse;
}

export interface PublishResult {
  url: string;
  published: boolean;
}

/**
 * Publishes a page: persists its sections and sets `publish: true` in the DB,
 * keyed by URL.
 */
export async function publishPage(
  url: string,
  sections: Section[],
): Promise<PublishResult> {
  const res = await fetch(`${BASE_URL}/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, sections }),
  });

  if (!res.ok) {
    throw new Error(`Orchestrator returned ${res.status} ${res.statusText}`);
  }

  return res.json();
}
