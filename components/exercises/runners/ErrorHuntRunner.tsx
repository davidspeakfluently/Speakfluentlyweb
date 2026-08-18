"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { ErrorHuntData, ExerciseRunnerResult } from "@/lib/exercise-content";
import { compareAnswers } from "@/lib/exercise-grading";
import { ResultSummary, VerifyRow } from "@/components/exercises/ExerciseShell";

type Segment = { text: string; errorIndex: number | null };

function highlight(text: string, errors: ErrorHuntData["errors"]): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  errors.forEach((e, i) => {
    const idx = text.indexOf(e.wrong, cursor);
    if (idx === -1) return;
    if (idx > cursor) segments.push({ text: text.slice(cursor, idx), errorIndex: null });
    segments.push({ text: e.wrong, errorIndex: i });
    cursor = idx + e.wrong.length;
  });
  if (cursor < text.length) segments.push({ text: text.slice(cursor), errorIndex: null });
  return segments;
}

export function ErrorHuntRunner({
  data,
  onResult,
}: {
  data: ErrorHuntData;
  onResult: (result: ExerciseRunnerResult) => void;
}) {
  const [corrections, setCorrections] = useState(() => data.errors.map(() => ""));
  const [resolved, setResolved] = useState(() => data.errors.map(() => false));
  const [attempted, setAttempted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const segments = highlight(data.text, data.errors);
  const allResolved = resolved.every(Boolean);
  const canVerify = !allResolved && resolved.every((r, i) => r || corrections[i].trim() !== "");

  function finalize(finalResolved: boolean[]) {
    setRevealed(true);
    const correctCount = finalResolved.filter(Boolean).length;
    onResult({
      points: correctCount * data.scoring.points_per_correct_find,
      of: data.scoring.total_points,
    });
  }

  function verify() {
    setAttempted(true);
    const next = resolved.map((r, i) => r || compareAnswers(corrections[i], data.errors[i].correct));
    setResolved(next);
    if (next.every(Boolean)) finalize(next);
  }

  return (
    <div>
      <p className="mb-4 rounded-md bg-bg p-3.5 text-sm leading-[1.6] text-navy">
        {segments.map((seg, i) =>
          seg.errorIndex === null ? (
            <span key={i}>{seg.text}</span>
          ) : (
            <mark key={i} className="rounded-sm bg-amber-soft px-0.5 text-navy">
              {seg.text}
              <sup className="ml-0.5 font-mono text-[10px]">{seg.errorIndex + 1}</sup>
            </mark>
          ),
        )}
      </p>

      <div className="flex flex-col gap-2.5">
        {data.errors.map((e, i) => {
          const isResolved = resolved[i];
          const isWrong = attempted && !isResolved;
          return (
            <div key={i} className="flex items-center gap-2.5">
              <span className="w-5 shrink-0 font-mono text-xs text-slate">{i + 1}.</span>
              <input
                type="text"
                value={corrections[i]}
                disabled={isResolved || revealed}
                onChange={(ev) =>
                  setCorrections((prev) => prev.map((v, idx) => (idx === i ? ev.target.value : v)))
                }
                placeholder="Escribe la corrección"
                className={
                  "flex-1 rounded border px-3 py-2 text-sm text-navy outline-none disabled:bg-bg " +
                  (isResolved
                    ? "border-success bg-success/10"
                    : isWrong
                      ? "border-danger focus:border-danger"
                      : "border-border bg-white focus:border-accent")
                }
              />
              {isResolved && <Check className="h-4 w-4 shrink-0 text-success" />}
              {isWrong && <X className="h-4 w-4 shrink-0 text-danger" />}
            </div>
          );
        })}
      </div>

      {revealed && (
        <div className="mt-3 flex flex-col gap-1">
          {data.errors.map((e, i) =>
            resolved[i] ? null : (
              <p key={i} className="text-xs text-slate">
                <span className="font-semibold text-danger">{i + 1}.</span> {e.correct} — {e.explanation}
              </p>
            ),
          )}
        </div>
      )}

      <VerifyRow
        onVerify={verify}
        onReveal={() => finalize(resolved)}
        verifyDisabled={!canVerify}
        showReveal={attempted && !allResolved}
        revealed={revealed}
      />
      {revealed && (
        <ResultSummary
          points={resolved.filter(Boolean).length * data.scoring.points_per_correct_find}
          of={data.scoring.total_points}
        />
      )}
    </div>
  );
}
