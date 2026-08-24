"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import type { ExerciseRunnerResult, MinimalPairsPracticeData } from "@/lib/exercise-content";

export function MinimalPairsPracticeRunner({
  data,
  onResult,
}: {
  data: MinimalPairsPracticeData;
  onResult: (result: ExerciseRunnerResult) => void;
}) {
  const [practiced, setPracticed] = useState<Record<number, boolean>>({});
  const reportedRef = useRef(false);

  function togglePracticed(pairId: number) {
    setPracticed((prev) => ({ ...prev, [pairId]: !prev[pairId] }));
  }

  useEffect(() => {
    if (reportedRef.current) return;
    if (!data.pairs.every((p) => practiced[p.id])) return;
    reportedRef.current = true;
    onResult({ points: data.pairs.length, of: data.pairs.length, selfAssessed: true });
  }, [practiced, data.pairs, onResult]);

  return (
    <div>
      {data.production_challenge && (
        <div className="mb-4 rounded-md bg-bg p-3.5 text-sm text-navy">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-accent">Reto</span>
          <p className="mt-1">{data.production_challenge}</p>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {data.pairs.map((pair) => {
          const done = !!practiced[pair.id];
          return (
            <button
              key={pair.id}
              type="button"
              onClick={() => togglePracticed(pair.id)}
              className={
                "flex items-center gap-3 rounded-md border px-4 py-3 text-left text-sm transition-colors duration-[var(--transition-hover)] " +
                (done ? "border-success bg-success/10" : "border-border bg-white hover:border-slate")
              }
            >
              <span
                className={
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded border " +
                  (done ? "border-success bg-success text-white" : "border-border bg-white")
                }
              >
                {done && <Check className="h-3.5 w-3.5" />}
              </span>
              <span className="flex-1">
                <span className="font-semibold text-navy">
                  {pair.word_a} / {pair.word_b}
                </span>
                <span className="mt-0.5 block text-xs text-slate">
                  {pair.example_a} · {pair.example_b}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
