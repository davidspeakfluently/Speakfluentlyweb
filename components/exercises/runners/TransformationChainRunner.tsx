"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { ExerciseRunnerResult, TransformationChainData } from "@/lib/exercise-content";
import { compareAnswers } from "@/lib/exercise-grading";
import { ResultSummary, VerifyButton } from "@/components/exercises/ExerciseShell";

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
  const [checked, setChecked] = useState(false);

  const allFilled = data.items.every((item) =>
    data.input_fields_per_item.every((f) => answers[item.id]?.[f]?.trim() !== ""),
  );

  function verify() {
    setChecked(true);
    let points = 0;
    for (const item of data.items) {
      for (const f of data.input_fields_per_item) {
        if (compareAnswers(answers[item.id][f], item[f])) points += 1;
      }
    }
    onResult({ points, of: data.items.length * data.input_fields_per_item.length });
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
                const ok = checked && compareAnswers(answers[item.id][f], item[f]);
                return (
                  <div key={f} className="flex items-center gap-2">
                    <span className="w-32 shrink-0 text-xs text-slate">{FIELD_LABEL[f] ?? f}</span>
                    <input
                      type="text"
                      value={answers[item.id][f]}
                      disabled={checked}
                      onChange={(ev) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], [f]: ev.target.value },
                        }))
                      }
                      className="flex-1 rounded border border-border bg-white px-3 py-2 text-sm text-navy outline-none focus:border-accent disabled:bg-bg"
                    />
                    {checked &&
                      (ok ? (
                        <Check className="h-4 w-4 shrink-0 text-success" />
                      ) : (
                        <X className="h-4 w-4 shrink-0 text-danger" />
                      ))}
                  </div>
                );
              })}
              {checked && (
                <div className="text-xs text-slate">
                  Respuesta esperada: {data.input_fields_per_item.map((f) => item[f]).join(" · ")}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <VerifyButton onClick={verify} verified={checked} disabled={!allFilled} />
      {checked && (
        <ResultSummary
          points={data.items.reduce(
            (sum, item) =>
              sum + data.input_fields_per_item.filter((f) => compareAnswers(answers[item.id][f], item[f])).length,
            0,
          )}
          of={data.items.length * data.input_fields_per_item.length}
        />
      )}
    </div>
  );
}
