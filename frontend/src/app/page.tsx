"use client";

import { useState } from "react";
import type { Section } from "@/types/sections";
import {
  sendCommand,
  publishPage,
  CommandRejected,
  type CommandResponse,
} from "@/lib/orchestrator";
import { useRecorder } from "@/components/build/useRecorder";
import { BuildTopBar } from "@/components/build/BuildTopBar";
import { UnderstoodPanel } from "@/components/build/UnderstoodPanel";
import { ClarificationPanel } from "@/components/build/ClarificationPanel";
import { PageCanvas } from "@/components/build/PageCanvas";
import { EditPanel } from "@/components/build/EditPanel";
import { VersionHistory } from "@/components/build/VersionHistory";
import { EmptyState } from "@/components/build/EmptyState";

interface Rejection {
  stage: string;
  message: string;
}

export default function BuilderPage() {
  const recorder = useRecorder();
  const [isWorking, setIsWorking] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejection, setRejection] = useState<Rejection | null>(null);
  const [result, setResult] = useState<CommandResponse | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Push-to-talk: first click starts recording, second stops and sends.
  const handleMicClick = async () => {
    if (isWorking) return;

    if (recorder.isRecording) {
      const audio = await recorder.stop();
      setIsWorking(true);
      setError(null);
      setRejection(null);
      try {
        const response = await sendCommand(audio);
        setResult(response);
        setSections(response.page.sections);
        setSelectedIndex(0);
        setPublished(false);
      } catch (e) {
        if (e instanceof CommandRejected) {
          // Validation gate refused the command/page (A-3) — visible, not just logged.
          setRejection({ stage: e.stage, message: e.message });
        } else {
          setError(
            e instanceof Error
              ? `Couldn't reach the orchestrator (${e.message}).`
              : "Something went wrong.",
          );
        }
      } finally {
        setIsWorking(false);
      }
      return;
    }

    setError(null);
    try {
      await recorder.start();
    } catch {
      setError("Microphone access was denied.");
    }
  };

  const updateSection = (index: number, next: Section) => {
    setSections((prev) => prev.map((s, i) => (i === index ? next : s)));
    setPublished(false); // edits invalidate the published state
  };

  const handlePublish = async () => {
    if (!result || isPublishing) return;
    setIsPublishing(true);
    setError(null);
    try {
      await publishPage(result.page.url, sections);
      setPublished(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? `Couldn't publish (${e.message}).`
          : "Something went wrong while publishing.",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const selected = sections[selectedIndex];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1600px] flex-col gap-6 p-6">
      <BuildTopBar
        isRecording={recorder.isRecording}
        isWorking={isWorking}
        isPublishing={isPublishing}
        published={published}
        canPublish={!!result}
        message={result?.message ?? ""}
        pageUrl={result?.page.url ?? null}
        rejection={rejection}
        error={error}
        onMicClick={handleMicClick}
        onPublish={handlePublish}
      />

      {result ? (
        <div className="grid flex-1 gap-6 lg:grid-cols-[300px_1fr_340px]">
          {/* Left: understanding + clarifications */}
          <aside className="flex flex-col gap-6">
            <UnderstoodPanel summary={result.summary} brief={result.brief} />
            <ClarificationPanel
              key={result.recognizedCommand}
              questions={result.clarifications}
            />
          </aside>

          {/* Center: live page preview */}
          <PageCanvas
            sections={sections}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />

          {/* Right: section editor + version history */}
          <aside className="flex flex-col gap-6">
            {selected && (
              <EditPanel
                section={selected}
                onUpdate={(next) => updateSection(selectedIndex, next)}
              />
            )}
            <VersionHistory versions={result.versions} />
          </aside>
        </div>
      ) : (
        <EmptyState
          isRecording={recorder.isRecording}
          isWorking={isWorking}
          rejection={rejection}
        />
      )}

      <footer className="text-center text-xs text-muted-foreground">
        <b>Voice Landing Pages</b>, June 2026
      </footer>
    </div>
  );
}
