"use client";

import { useState } from "react";
import type { ExerciseRunnerResult, MultipleChoiceData } from "@/lib/exercise-content";
import { ResultSummary, VerifyButton } from "@/components/exercises/ExerciseShell";

export function MultipleChoiceRunner({
  data,
  onResult,
}: {
  data: MultipleChoiceData;
  onResult: (result: ExerciseRunnerResult) => void;
}) {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);

  const allAnswered = data.questions.every((q) => selected[q.id] !== undefined);

  function verify() {
    setChecked(true);
    const points = data.questions.filter((q) => selected[q.id] === q.correct_index).length;
    onResult({ points, of: data.questions.length });
  }

  return (
    <div>
      <div className="flex flex-col gap-5">
        {data.questions.map((q) => {
          const picked = selected[q.id];
          const isCorrect = checked && picked === q.correct_index;
          return (
            <div key={q.id}>
              <div className="mb-2 text-sm text-navy">{q.question}</div>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt, idx) => {
                  const isPicked = picked === idx;
                  const showAsCorrect = checked && idx === q.correct_index;
                  const showAsWrong = checked && isPicked && idx !== q.correct_index;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={checked}
                      onClick={() => setSelected((prev) => ({ ...prev, [q.id]: idx }))}
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
                      {opt}
                    </button>
                  );
                })}
              </div>
              {checked && isCorrect === false && picked !== undefined && (
                <div className="mt-1 text-xs text-slate">
                  Respuesta correcta: {q.options[q.correct_index]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <VerifyButton onClick={verify} verified={checked} disabled={!allAnswered} />
      {checked && (
        <ResultSummary
          points={data.questions.filter((q) => selected[q.id] === q.correct_index).length}
          of={data.questions.length}
        />
      )}
    </div>
  );
}
