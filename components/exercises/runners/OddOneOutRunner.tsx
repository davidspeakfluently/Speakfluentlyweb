"use client";

import { useState } from "react";
import type { ExerciseRunnerResult, OddOneOutData } from "@/lib/exercise-content";
import { ResultSummary, VerifyButton } from "@/components/exercises/ExerciseShell";

export function OddOneOutRunner({
  data,
  onResult,
}: {
  data: OddOneOutData;
  onResult: (result: ExerciseRunnerResult) => void;
}) {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);

  const allAnswered = data.groups.every((g) => selected[g.id] !== undefined);

  function verify() {
    setChecked(true);
    const points = data.groups.filter((g) => selected[g.id] === g.odd_index).length;
    onResult({ points, of: data.groups.length });
  }

  return (
    <div>
      <div className="flex flex-col gap-5">
        {data.groups.map((g) => {
          const picked = selected[g.id];
          return (
            <div key={g.id}>
              <div className="mb-2 text-xs text-slate">Elige el intruso</div>
              <div className="flex flex-wrap gap-2">
                {g.items.map((item, idx) => {
                  const isPicked = picked === idx;
                  const showAsCorrect = checked && idx === g.odd_index;
                  const showAsWrong = checked && isPicked && idx !== g.odd_index;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={checked}
                      onClick={() => setSelected((prev) => ({ ...prev, [g.id]: idx }))}
                      className={
                        "rounded-md border px-3.5 py-2 text-sm transition-colors duration-[var(--transition-hover)] disabled:cursor-not-allowed " +
                        (showAsCorrect
                          ? "border-success bg-success/10 text-success"
                          : showAsWrong
                            ? "border-danger bg-danger/10 text-danger"
                            : isPicked
                              ? "border-accent bg-accent text-white"
                              : "border-border bg-white text-navy hover:border-slate")
                      }
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
              {checked && (
                <div className="mt-1.5 text-xs text-slate">
                  {g.shared_use} · <span className="text-accent">el intruso: {g.odd_use}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <VerifyButton onClick={verify} verified={checked} disabled={!allAnswered} />
      {checked && (
        <ResultSummary
          points={data.groups.filter((g) => selected[g.id] === g.odd_index).length}
          of={data.groups.length}
        />
      )}
    </div>
  );
}
