import { MicIcon } from "./icons";

/**
 * Shown before any page has been generated. Reflects whether the app is idle,
 * recording, or waiting on the backend.
 */
export function EmptyState({
  isRecording,
  isWorking,
  rejection,
}: {
  isRecording: boolean;
  isWorking: boolean;
  rejection: { stage: string; message: string } | null;
}) {
  const showRejection = rejection && !isWorking && !isRecording;

  return (
    <div
      className={`flex flex-1 items-center justify-center rounded-2xl border border-dashed bg-muted p-12 text-center ${
        showRejection ? "border-red-300" : "border-border"
      }`}
    >
      <div className="flex max-w-md flex-col items-center gap-3">
        {showRejection ? (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-2xl text-red-600">
              ⚠
            </span>
            <h2 className="text-2xl font-semibold text-red-600">
              Rejected at the {rejection.stage} gate
            </h2>
            <p className="text-muted-foreground">{rejection.message}</p>
            <p className="text-sm text-muted-foreground">
              The validator refused to render an invalid page. Try again.
            </p>
          </>
        ) : isWorking ? (
          <>
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
            <h2 className="text-2xl font-semibold text-primary">
              Generating your page…
            </h2>
            <p className="text-muted-foreground">
              Transcribing your request and drafting the sections.
            </p>
          </>
        ) : isRecording ? (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white">
              <MicIcon className="h-6 w-6" />
            </span>
            <h2 className="text-2xl font-semibold text-primary">Listening…</h2>
            <p className="text-muted-foreground">
              Describe the landing page you want, then tap the mic again to send.
            </p>
          </>
        ) : (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background text-muted-foreground">
              <MicIcon className="h-6 w-6" />
            </span>
            <h2 className="text-2xl font-semibold text-primary">No page yet</h2>
            <p className="text-muted-foreground">
              Tap the microphone and describe the landing page you want to
              build. Your draft will appear here.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
