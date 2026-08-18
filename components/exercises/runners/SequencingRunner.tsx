"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ExerciseRunnerResult, SequencingData } from "@/lib/exercise-content";
import { ResultSummary, VerifyRow } from "@/components/exercises/ExerciseShell";

export function SequencingRunner({
  data,
  onResult,
}: {
  data: SequencingData;
  onResult: (result: ExerciseRunnerResult) => void;
}) {
  const [order, setOrder] = useState(() => data.items_shuffled.map((i) => i.id));
  const [attempted, setAttempted] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [revealed, setRevealed] = useState(false);

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
    setAttempted(true);
    const correct = order.every((id, i) => id === data.correct_order[i]);
    if (correct) {
      setResolved(true);
      setRevealed(true);
      onResult({ points: 1, of: 1 });
    }
  }

  function reveal() {
    setOrder(data.correct_order);
    setRevealed(true);
    onResult({ points: 0, of: 1 });
  }

  const showWrongHint = attempted && !resolved && !revealed;

  return (
    <div>
      <div className="flex flex-col gap-2">
        {order.map((id, i) => (
          <div
            key={id}
            className={
              "flex items-center gap-2 rounded-md border px-3.5 py-2.5 text-sm " +
              (resolved
                ? "border-success bg-success/10 text-success"
                : revealed
                  ? "border-border bg-white text-navy"
                  : "border-border bg-white text-navy")
            }
          >
            <span className="font-mono text-xs text-slate">{i + 1}.</span>
            <span className="flex-1">{textById[id]}</span>
            {!revealed && (
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

      {showWrongHint && (
        <div className="mt-2 text-xs text-danger">Todavía no está en el orden correcto — sigue intentando.</div>
      )}

      <VerifyRow
        onVerify={verify}
        onReveal={reveal}
        showReveal={showWrongHint}
        revealed={revealed}
      />
      {revealed && <ResultSummary points={resolved ? 1 : 0} of={1} />}
    </div>
  );
}
