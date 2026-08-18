"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { ExerciseRunnerResult, TransformationChainData } from "@/lib/exercise-content";
import { compareAnswers } from "@/lib/exercise-grading";
import { ResultSummary, VerifyRow } from "@/components/exercises/ExerciseShell";

const FIELD_LABEL: Record<string, string> = {
  negative: "Negativa",
  question: "Pregunta",
  short_answer: "Respuesta corta",
};

export function TransformationChainRunner({
  data,
  onResult,
}: {
  data: TransformationChainData;
  onResult: (result: ExerciseRunnerResult) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, Record<string, string>>>(() =>
    Object.fromEntries(
      data.items.map((item) => [
        item.id,
        Object.fromEntries(data.input_fields_per_item.map((f) => [f, ""])),
      ]),
    ),
  );
  const [resolved, setResolved] = useState<Record<number, Record<string, boolean>>>(() =>
    Object.fromEntries(
      data.items.map((item) => [item.id, Object.fromEntries(data.input_fields_per_item.map((f) => [f, false]))]),
    ),
  );
  const [attempted, setAttempted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const allResolved = data.items.every((item) =>
    data.input_fields_per_item.every((f) => resolved[item.id][f]),
  );
  const canVerify =
    !allResolved &&
    data.items.every((item) =>
      data.input_fields_per_item.every((f) => resolved[item.id][f] || answers[item.id][f].trim() !== ""),
    );

  function countResolved(r: Record<number, Record<string, boolean>>) {
    return data.items.reduce(
      (sum, item) => sum + data.input_fields_per_item.filter((f) => r[item.id][f]).length,
      0,
    );
  }

  function finalize(finalResolved: Record<number, Record<string, boolean>>) {
    setRevealed(true);
    onResult({
      points: countResolved(finalResolved),
      of: data.items.length * data.input_fields_per_item.length,
    });
  }

  function verify() {
    setAttempted(true);
    const next: Record<number, Record<string, boolean>> = {};
    data.items.forEach((item) => {
      next[item.id] = {};
      data.input_fields_per_item.forEach((f) => {
        next[item.id][f] = resolved[item.id][f] || compareAnswers(answers[item.id][f], item[f]);
      });
    });
    setResolved(next);
    const done = data.items.every((item) => data.input_fields_per_item.every((f) => next[item.id][f]));
    if (done) finalize(next);
  }

  return (
    <div>
      <div className="mb-4 rounded-md bg-bg p-3 text-xs text-slate">
        <span className="font-semibold text-accent">Ejemplo:</span> {data.example.base} →{" "}
        {data.example.negative} · {data.example.question} · {data.example.short_answer}
      </div>

      <div className="flex flex-col gap-5">
        {data.items.map((item) => (
          <div key={item.id}>
            <div className="mb-2 text-sm font-semibold text-navy">{item.base}</div>
            <div className="flex flex-col gap-2">
              {data.input_fields_per_item.map((f) => {
                const isResolved = resolved[item.id][f];
                const isWrong = attempted && !isResolved;
                return (
                  <div key={f} className="flex items-center gap-2">
                    <span className="w-32 shrink-0 text-xs text-slate">{FIELD_LABEL[f] ?? f}</span>
                    <input
                      type="text"
                      value={answers[item.id][f]}
                      disabled={isResolved || revealed}
                      onChange={(ev) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], [f]: ev.target.value },
                        }))
                      }
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
              {revealed && data.input_fields_per_item.some((f) => !resolved[item.id][f]) && (
                <div className="text-xs text-slate">
                  Respuesta esperada:{" "}
                  {data.input_fields_per_item
                    .filter((f) => !resolved[item.id][f])
                    .map((f) => item[f])
                    .join(" · ")}
                </div>
              )}
            </div>
          </div>
        ))}
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
          points={countResolved(resolved)}
          of={data.items.length * data.input_fields_per_item.length}
        />
      )}
    </div>
  );
}
