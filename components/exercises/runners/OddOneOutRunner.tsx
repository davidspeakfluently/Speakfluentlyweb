"use client";

import { useState } from "react";
import type { ExerciseRunnerResult, OddOneOutData } from "@/lib/exercise-content";
import { ResultSummary, VerifyRow } from "@/components/exercises/ExerciseShell";

export function OddOneOutRunner({
  data,
  onResult,
}: {
  data: OddOneOutData;
  onResult: (result: ExerciseRunnerResult) => void;
}) {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [resolved, setResolved] = useState<Record<number, boolean>>({});
  const [attempted, setAttempted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const allResolved = data.groups.every((g) => resolved[g.id]);
  const canVerify =
    !allResolved && data.groups.every((g) => resolved[g.id] || selected[g.id] !== undefined);

  function finalize(finalResolved: Record<number, boolean>) {
    setRevealed(true);
    const points = data.groups.filter((g) => finalResolved[g.id]).length;
    onResult({ points, of: data.groups.length });
  }

  function verify() {
    setAttempted(true);
    const next = { ...resolved };
    data.groups.forEach((g) => {
      if (!next[g.id] && selected[g.id] === g.odd_index) next[g.id] = true;
    });
    setResolved(next);
    if (data.groups.every((g) => next[g.id])) finalize(next);
  }

  return (
    <div>
      <div className="flex flex-col gap-5">
        {data.groups.map((g) => {
          const picked = selected[g.id];
          const isResolved = resolved[g.id];
          const showCorrect = revealed && !isResolved;
          const showExplanation = isResolved || showCorrect;
          return (
            <div key={g.id}>
              <div className="mb-2 text-xs text-slate">Elige el intruso</div>
              <div className="flex flex-wrap gap-2">
                {g.items.map((item, idx) => {
                  const isPicked = picked === idx;
                  let cls = "border-border bg-white text-navy hover:border-slate";
                  if (isResolved && isPicked) cls = "border-success bg-success/10 text-success";
                  else if (showCorrect && idx === g.odd_index) cls = "border-success bg-success/10 text-success";
                  else if (attempted && !isResolved && isPicked) cls = "border-danger bg-danger/10 text-danger";
                  else if (isPicked) cls = "border-accent bg-accent text-white";
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isResolved || revealed}
                      onClick={() => setSelected((prev) => ({ ...prev, [g.id]: idx }))}
                      className={
                        "rounded-md border px-3.5 py-2 text-sm transition-colors duration-[var(--transition-hover)] disabled:cursor-not-allowed " +
                        cls
                      }
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
              {showExplanation && (
                <div className="mt-1.5 text-xs text-slate">
                  {g.shared_use} · <span className="text-accent">el intruso: {g.odd_use}</span>
                </div>
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
        <ResultSummary points={data.groups.filter((g) => resolved[g.id]).length} of={data.groups.length} />
      )}
    </div>
  );
}
