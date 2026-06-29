"use client";

import Image from "next/image";
import { MicIcon } from "./icons";

interface BuildTopBarProps {
  isRecording: boolean;
  isWorking: boolean;
  isPublishing: boolean;
  published: boolean;
  canPublish: boolean;
  message: string;
  pageUrl: string | null;
  rejection: { stage: string; message: string } | null;
  error: string | null;
  onMicClick: () => void;
  onPublish: () => void;
}

/**
 * Top bar: brand, push-to-talk mic, a Publish action, and the latest assistant
 * message with an in-flight progress indicator. Fully controlled by the page.
 */
export function BuildTopBar({
  isRecording,
  isWorking,
  isPublishing,
  published,
  canPublish,
  message,
  pageUrl,
  rejection,
  error,
  onMicClick,
  onPublish,
}: BuildTopBarProps) {
  // "Busy" = any voice/request activity; drives the Publish disabled state.
  const busy = isRecording || isWorking || isPublishing;
  const inFlight = isWorking || isPublishing;

  const status = error
    ? error
    : isWorking
      ? "Transcribing your request…"
      : isPublishing
        ? "Publishing your page…"
        : isRecording
          ? "Listening…"
          : message || "Tap the mic and describe the page you want.";

  return (
    <header className="rounded-2xl border border-border bg-muted p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo.svg"
            alt="Voice Landing Pages logo"
            width={40}
            height={40}
            className="rounded-xl"
            priority
          />
          <span className="text-2xl tracking-tight text-default">
            <b>V</b>oice &nbsp;
            <b>L</b>anding &nbsp;
            <b>P</b>ages
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={onMicClick}
            disabled={isWorking || isPublishing}
            aria-pressed={isRecording}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
            className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors disabled:opacity-50 ${
              isRecording
                ? "animate-pulse border-transparent bg-red-500 text-white"
                : "border-border text-muted-foreground hover:bg-background"
            }`}
          >
            <MicIcon className="h-5 w-5" />
          </button>
          <span className="text-xs font-medium tracking-wide text-muted-foreground">
            {isRecording ? "Recording… (tap to send)" : "Tap to talk"}
          </span>
        </div>

        <button
          type="button"
          onClick={onPublish}
          disabled={busy || !canPublish}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
            published
              ? "bg-accent text-accent-foreground hover:opacity-90"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {published ? "Published ✓" : "Publish"}
        </button>
      </div>

      <div
        className={`mt-4 flex items-center gap-3 rounded-xl border bg-background px-4 py-3 ${
          rejection && !busy ? "border-red-300" : "border-border"
        }`}
      >
        <span
          className={`h-3 w-3 shrink-0 rounded-full ${
            isRecording
              ? "animate-pulse bg-red-500"
              : rejection && !busy
                ? "bg-red-500"
                : published && !busy && !error
                  ? "bg-accent"
                  : "border border-border"
          }`}
        />
        {rejection && !busy ? (
          <p className="flex-1 truncate text-sm text-red-600">
            <span className="font-semibold">
              ⚠ Rejected at the {rejection.stage} gate
            </span>{" "}
            — {rejection.message}
          </p>
        ) : published && pageUrl && !busy && !error ? (
          <p className="flex-1 truncate text-sm">
            Published —{" "}
            <a
              href={pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent underline underline-offset-2"
            >
              view your page at {pageUrl}
            </a>
          </p>
        ) : (
          <p className={`flex-1 truncate text-sm ${error ? "text-red-600" : ""}`}>
            {status}
          </p>
        )}
        {inFlight && (
          <span className="h-1.5 w-40 shrink-0 overflow-hidden rounded-full bg-muted">
            <span className="block h-full w-1/3 animate-progress-slide rounded-full bg-primary-light" />
          </span>
        )}
      </div>
    </header>
  );
}

