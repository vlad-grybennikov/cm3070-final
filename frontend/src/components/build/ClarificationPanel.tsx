"use client";

import { useState } from "react";
import { MicIcon, QuestionIcon } from "./icons";

/**
 * Walks the user through the assistant's clarifying questions. Answering either
 * way advances to the next question.
 */
export function ClarificationPanel({ questions }: { questions: string[] }) {
  const [index, setIndex] = useState(0);
  const done = index >= questions.length;

  return (
    <section className="rounded-2xl border border-black/10 bg-zinc-50 p-5 dark:border-white/10 dark:bg-zinc-900/40">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <QuestionIcon className="h-5 w-5 text-zinc-400" />
          Clarification
        </h2>
        {!done && (
          <span className="text-sm text-zinc-400">
            {index + 1} of {questions.length}
          </span>
        )}
      </div>

      {done ? (
        <p className="mt-4 text-sm text-zinc-500">All clarifications answered.</p>
      ) : (
        <>
          <p className="mt-4 text-sm leading-6">{questions[index]}</p>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIndex((i) => i + 1)}
              className="flex-1 rounded-lg border border-black/10 bg-background py-2.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
            >
              Yes, keep it
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => i + 1)}
              className="flex-1 rounded-lg border border-black/10 bg-background py-2.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
            >
              No, remove it
            </button>
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400">
            <MicIcon className="h-3.5 w-3.5" />
            or answer by voice
          </p>
        </>
      )}
    </section>
  );
}
