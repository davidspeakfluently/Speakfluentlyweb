"use client";

import { useState } from "react";
import type { ExerciseRunnerResult, MultipleChoiceData } from "@/lib/exercise-content";
import { ResultSummary, VerifyRow } from "@/components/exercises/ExerciseShell";

export function MultipleChoiceRunner({
  data,
  onResult,
}: {
  data: MultipleChoiceData;
  onResult: (result: ExerciseRunnerResult) => void;
}) {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [resolved, setResolved] = useState<Record<number, boolean>>({});
  const [attempted, setAttempted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const allResolved = data.questions.every((q) => resolved[q.id]);
  const canVerify =
    !allResolved && data.questions.every((q) => resolved[q.id] || selected[q.id] !== undefined);

  function finalize(finalResolved: Record<number, boolean>) {
    setRevealed(true);
    const points = data.questions.filter((q) => finalResolved[q.id]).length;
    onResult({ points, of: data.questions.length });
  }

  function verify() {
    setAttempted(true);
    const next = { ...resolved };
    data.questions.forEach((q) => {
      if (!next[q.id] && selected[q.id] === q.correct_index) next[q.id] = true;
    });
    setResolved(next);
    if (data.questions.every((q) => next[q.id])) finalize(next);
  }

  return (
    <div>
      <div className="flex flex-col gap-5">
        {data.questions.map((q) => {
          const picked = selected[q.id];
          const isResolved = resolved[q.id];
          const showCorrect = revealed && !isResolved;
          return (
            <div key={q.id}>
              <div className="mb-2 text-sm text-navy">{q.question}</div>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt, idx) => {
                  const isPicked = picked === idx;
                  let cls = "border-border bg-white text-navy hover:border-slate";
                  if (isResolved && isPicked) cls = "border-success bg-success/10 text-success";
                  else if (showCorrect && idx === q.correct_index) cls = "border-success bg-success/10 text-success";
                  else if (attempted && !isResolved && isPicked) cls = "border-danger bg-danger/10 text-danger";
                  else if (isPicked) cls = "border-accent bg-accent text-white";
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isResolved || revealed}
                      onClick={() => setSelected((prev) => ({ ...prev, [q.id]: idx }))}
                      className={
                        "rounded-md border px-3.5 py-2 text-sm transition-colors duration-[var(--transition-hover)] disabled:cursor-not-allowed " +
                        cls
                      }
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
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
          points={data.questions.filter((q) => resolved[q.id]).length}
          of={data.questions.length}
        />
      )}
    </div>
  );
}
