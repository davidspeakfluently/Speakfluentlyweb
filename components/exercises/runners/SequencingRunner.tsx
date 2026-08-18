"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ExerciseRunnerResult, SequencingData } from "@/lib/exercise-content";
import { ResultSummary, VerifyButton } from "@/components/exercises/ExerciseShell";

export function SequencingRunner({
  data,
  onResult,
}: {
  data: SequencingData;
  onResult: (result: ExerciseRunnerResult) => void;
}) {
  const [order, setOrder] = useState(() => data.items_shuffled.map((i) => i.id));
  const [checked, setChecked] = useState(false);

  const textById = Object.fromEntries(data.items_shuffled.map((i) => [i.id, i.text]));

  function move(index: number, dir: -1 | 1) {
    setOrder((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function verify() {
    setChecked(true);
    const correct = order.every((id, i) => id === data.correct_order[i]);
    onResult({ points: correct ? 1 : 0, of: 1 });
  }

  const isCorrect = checked && order.every((id, i) => id === data.correct_order[i]);

  return (
    <div>
      <div className="flex flex-col gap-2">
        {order.map((id, i) => (
          <div
            key={id}
            className={
              "flex items-center gap-2 rounded-md border px-3.5 py-2.5 text-sm " +
              (checked
                ? isCorrect
                  ? "border-success bg-success/10 text-success"
                  : "border-danger bg-danger/10 text-danger"
                : "border-border bg-white text-navy")
            }
          >
            <span className="font-mono text-xs text-slate">{i + 1}.</span>
            <span className="flex-1">{textById[id]}</span>
            {!checked && (
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  aria-label="Mover arriba"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="rounded border border-border p-1 hover:border-slate disabled:opacity-30"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Mover abajo"
                  onClick={() => move(i, 1)}
                  disabled={i === order.length - 1}
                  className="rounded border border-border p-1 hover:border-slate disabled:opacity-30"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <VerifyButton onClick={verify} verified={checked} />
      {checked && <ResultSummary points={isCorrect ? 1 : 0} of={1} />}
    </div>
  );
}
