"use client";

import { useRef, useState } from "react";
import { Clock } from "lucide-react";
import type { ExerciseItem, ExerciseResultDetail, ExerciseType } from "@/lib/types";
import { BUILT_EXERCISE_TYPES } from "@/lib/types";
import type { ExerciseRunnerResult } from "@/lib/exercise-content";
import { submitExerciseAttempt } from "@/lib/actions/exercise-attempts";
import { ExerciseShell } from "@/components/exercises/ExerciseShell";
import { ErrorHuntRunner } from "@/components/exercises/runners/ErrorHuntRunner";
import { MultipleChoiceRunner } from "@/components/exercises/runners/MultipleChoiceRunner";
import { OddOneOutRunner } from "@/components/exercises/runners/OddOneOutRunner";
import { SequencingRunner } from "@/components/exercises/runners/SequencingRunner";
import { TransformationChainRunner } from "@/components/exercises/runners/TransformationChainRunner";
import { RewriteImproveRunner } from "@/components/exercises/runners/RewriteImproveRunner";
import { OpinionResponseRunner } from "@/components/exercises/runners/OpinionResponseRunner";
import { FreeWritingRunner } from "@/components/exercises/runners/FreeWritingRunner";
import { DialogueCompletionRunner } from "@/components/exercises/runners/DialogueCompletionRunner";

const BUILT = new Set<ExerciseType>(BUILT_EXERCISE_TYPES);

function RunnerFor({
  item,
  onResult,
}: {
  item: ExerciseItem;
  onResult: (result: ExerciseRunnerResult) => void;
}) {
  switch (item.type) {
    case "error_hunt":
      return <ErrorHuntRunner data={item.data as never} onResult={onResult} />;
    case "multiple_choice":
      return <MultipleChoiceRunner data={item.data as never} onResult={onResult} />;
    case "odd_one_out":
      return <OddOneOutRunner data={item.data as never} onResult={onResult} />;
    case "sequencing":
      return <SequencingRunner data={item.data as never} onResult={onResult} />;
    case "transformation_chain":
      return <TransformationChainRunner data={item.data as never} onResult={onResult} />;
    case "rewrite_improve":
      return <RewriteImproveRunner data={item.data as never} onResult={onResult} />;
    case "opinion_response":
      return <OpinionResponseRunner data={item.data as never} onResult={onResult} />;
    case "free_writing":
      return <FreeWritingRunner data={item.data as never} onResult={onResult} />;
    case "dialogue_completion":
      return <DialogueCompletionRunner data={item.data as never} onResult={onResult} />;
    default:
      return null;
  }
}

export function ExerciseWorkbookRunner({
  resourceId,
  items,
}: {
  resourceId: string;
  items: ExerciseItem[];
}) {
  const [results, setResults] = useState<Record<string, ExerciseRunnerResult>>({});
  const [done, setDone] = useState(false);
  const submittedRef = useRef(false);

  const buildable = items.filter((item) => BUILT.has(item.type));
  const allReported = buildable.length > 0 && buildable.every((item) => results[item.id] !== undefined);

  const score = Object.values(results).reduce((sum, r) => sum + r.points, 0);
  const total = Object.values(results).reduce((sum, r) => sum + r.of, 0);

  function finish() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setDone(true);

    const details: ExerciseResultDetail[] = buildable.map((item) => ({
      exercise_item_id: item.id,
      type: item.type,
      points: results[item.id]?.points ?? 0,
      of: results[item.id]?.of ?? 0,
      self_assessed: results[item.id]?.selfAssessed ?? false,
    }));

    submitExerciseAttempt(resourceId, score, total, details);
  }

  return (
    <div className="flex flex-col gap-5">
      {items.map((item, i) => {
        const instructions = (item.data as { instructions?: string })?.instructions ?? "";

        if (!BUILT.has(item.type)) {
          return (
            <div
              key={item.id}
              className="flex items-center gap-2.5 rounded-lg border border-dashed border-border bg-bg/60 p-5 text-sm text-slate"
            >
              <Clock className="h-4 w-4 shrink-0" />
              <span>
                Ejercicio {i + 1} · {item.title} — este tipo de ejercicio llega próximamente.
              </span>
            </div>
          );
        }

        return (
          <ExerciseShell key={item.id} number={i + 1} title={item.title} instructions={instructions}>
            <RunnerFor
              item={item}
              onResult={(result) => setResults((prev) => ({ ...prev, [item.id]: result }))}
            />
          </ExerciseShell>
        );
      })}

      {buildable.length > 0 && (
        <div className="mt-2 flex justify-center">
          {done ? (
            <div className="rounded-md border border-accent bg-accent px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-card-lift)]">
              Cuadernillo terminado — puntaje: {score}/{total}
            </div>
          ) : (
            <button
              type="button"
              onClick={finish}
              disabled={!allReported}
              className="rounded-md bg-amber px-6 py-3 text-sm font-semibold text-navy shadow-[var(--shadow-card-lift)] transition-[background-color,box-shadow] duration-[var(--transition-standard)] ease-[var(--ease-standard)] hover:bg-amber-strong hover:text-white hover:shadow-[var(--glow-amber)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-amber disabled:hover:text-navy disabled:hover:shadow-[var(--shadow-card-lift)]"
            >
              {allReported ? "Finalizar ejercicio" : `Completa todos los ejercicios (${Object.keys(results).length}/${buildable.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
