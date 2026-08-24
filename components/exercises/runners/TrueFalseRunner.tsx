"use client";

import { useState } from "react";
import type { ExerciseRunnerResult, TrueFalseData } from "@/lib/exercise-content";
import { ResultSummary, VerifyRow } from "@/components/exercises/ExerciseShell";

export function TrueFalseRunner({
  data,
  onResult,
}: {
  data: TrueFalseData;
  onResult: (result: ExerciseRunnerResult) => void;
}) {
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [resolved, setResolved] = useState<Record<number, boolean>>({});
  const [attempted, setAttempted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const allResolved = data.statements.every((s) => resolved[s.id]);
  const canVerify =
    !allResolved && data.statements.every((s) => resolved[s.id] || selected[s.id] !== undefined);

  function finalize(finalResolved: Record<number, boolean>) {
    setRevealed(true);
    const points = data.statements.filter((s) => finalResolved[s.id]).length;
    onResult({ points, of: data.statements.length });
  }

  function verify() {
    setAttempted(true);
    const next = { ...resolved };
    data.statements.forEach((s) => {
      if (!next[s.id] && selected[s.id] === s.correct_answer) next[s.id] = true;
    });
    setResolved(next);
    if (data.statements.every((s) => next[s.id])) finalize(next);
  }

  return (
    <div>
      <div className="flex flex-col gap-4">
        {data.statements.map((s) => {
          const picked = selected[s.id];
          const isResolved = resolved[s.id];
          const showExplanation = isResolved || (revealed && !isResolved);
          return (
            <div key={s.id}>
              <div className="mb-2 text-sm text-navy">{s.statement}</div>
              <div className="flex gap-2">
                {[true, false].map((option) => {
                  const isPicked = picked === option;
                  let cls = "border-border bg-white text-navy hover:border-slate";
                  if (isResolved && isPicked) cls = "border-success bg-success/10 text-success";
                  else if (revealed && !isResolved && option === s.correct_answer)
                    cls = "border-success bg-success/10 text-success";
                  else if (attempted && !isResolved && isPicked) cls = "border-danger bg-danger/10 text-danger";
                  else if (isPicked) cls = "border-accent bg-accent text-white";
                  return (
                    <button
                      key={String(option)}
                      type="button"
                      disabled={isResolved || revealed}
                      onClick={() => setSelected((prev) => ({ ...prev, [s.id]: option }))}
                      className={
                        "rounded-md border px-4 py-2 text-sm transition-colors duration-[var(--transition-hover)] disabled:cursor-not-allowed " +
                        cls
                      }
                    >
                      {option ? "Verdadero" : "Falso"}
                    </button>
                  );
                })}
              </div>
              {showExplanation && <div className="mt-1.5 text-xs text-slate">{s.explanation}</div>}
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
          points={data.statements.filter((s) => resolved[s.id]).length}
          of={data.statements.length}
        />
      )}
    </div>
  );
}
