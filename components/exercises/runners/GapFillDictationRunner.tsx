"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { ExerciseRunnerResult, GapFillDictationData } from "@/lib/exercise-content";
import { compareAnswers } from "@/lib/exercise-grading";
import { ResultSummary, VerifyRow } from "@/components/exercises/ExerciseShell";

function splitBlank(text: string): [string, string] {
  const idx = text.indexOf("___");
  if (idx === -1) return [text, ""];
  return [text.slice(0, idx), text.slice(idx + 3)];
}

export function GapFillDictationRunner({
  data,
  onResult,
}: {
  data: GapFillDictationData;
  onResult: (result: ExerciseRunnerResult) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>(() =>
    Object.fromEntries(data.items.map((item) => [item.id, ""])),
  );
  const [resolved, setResolved] = useState<Record<number, boolean>>({});
  const [attempted, setAttempted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const allResolved = data.items.every((item) => resolved[item.id]);
  const canVerify =
    !allResolved && data.items.every((item) => resolved[item.id] || answers[item.id].trim() !== "");

  function finalize(finalResolved: Record<number, boolean>) {
    setRevealed(true);
    const points = data.items.filter((item) => finalResolved[item.id]).length;
    onResult({ points, of: data.items.length });
  }

  function verify() {
    setAttempted(true);
    const next = { ...resolved };
    data.items.forEach((item) => {
      if (!next[item.id]) next[item.id] = compareAnswers(answers[item.id], item.correct_answer);
    });
    setResolved(next);
    if (data.items.every((item) => next[item.id])) finalize(next);
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        {data.items.map((item) => {
          const [before, after] = splitBlank(item.text_with_blank);
          const isResolved = resolved[item.id];
          const isWrong = attempted && !isResolved;
          return (
            <div key={item.id} className="flex flex-wrap items-center gap-1.5 text-sm text-navy">
              <span>{before}</span>
              <input
                type="text"
                value={answers[item.id]}
                disabled={isResolved || revealed}
                onChange={(ev) => setAnswers((prev) => ({ ...prev, [item.id]: ev.target.value }))}
                className={
                  "w-28 rounded border px-2 py-1 text-sm outline-none disabled:bg-bg " +
                  (isResolved
                    ? "border-success bg-success/10"
                    : isWrong
                      ? "border-danger focus:border-danger"
                      : "border-border bg-white focus:border-accent")
                }
              />
              <span>{after}</span>
              {isResolved && <Check className="h-4 w-4 shrink-0 text-success" />}
              {isWrong && <X className="h-4 w-4 shrink-0 text-danger" />}
              {revealed && !isResolved && (
                <span className="text-xs text-slate">Respuesta esperada: {item.correct_answer}</span>
              )}
            </div>
          );
        })}
      </div>

      <VerifyRow
        onVerify={verify}
        onReveal={() => finalize(resolved)}
        verifyDisabled={!canVerify}
        showReveal={attempted && !allResolved}
        revealed={revealed}
      />
      {revealed && (
        <ResultSummary
          points={data.items.filter((item) => resolved[item.id]).length}
          of={data.items.length}
        />
      )}
    </div>
  );
}
