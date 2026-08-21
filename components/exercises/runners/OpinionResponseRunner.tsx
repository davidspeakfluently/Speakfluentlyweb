"use client";

import { useEffect, useRef, useState } from "react";
import type { ExerciseRunnerResult, OpinionResponseData } from "@/lib/exercise-content";
import { SelfAssessBlock } from "@/components/exercises/ExerciseShell";

export function OpinionResponseRunner({
  data,
  onResult,
}: {
  data: OpinionResponseData;
  onResult: (result: ExerciseRunnerResult) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>(() =>
    Object.fromEntries(data.prompts.map((p) => [p.id, ""])),
  );
  const [marks, setMarks] = useState<Record<number, boolean | null>>(() =>
    Object.fromEntries(data.prompts.map((p) => [p.id, null])),
  );
  const reportedRef = useRef(false);

  // Actualización funcional — ver el comentario equivalente en
  // RewriteImproveRunner: sin esto, dos autoevaluaciones resueltas en el
  // mismo ciclo de React pueden pisarse entre sí.
  function mark(promptId: number, correct: boolean) {
    setMarks((prev) => ({ ...prev, [promptId]: correct }));
  }

  useEffect(() => {
    if (reportedRef.current) return;
    if (!data.prompts.every((p) => marks[p.id] !== null)) return;
    reportedRef.current = true;
    onResult({
      points: data.prompts.filter((p) => marks[p.id]).length,
      of: data.prompts.length,
      selfAssessed: true,
    });
  }, [marks, data.prompts, onResult]);

  return (
    <div className="flex flex-col gap-6">
      {data.prompts.map((p) => (
        <div key={p.id}>
          <div className="mb-1 text-sm text-navy">{p.statement}</div>
          <div className="mb-2 text-xs text-slate">{p.target_structure_hint}</div>
          <SelfAssessBlock
            value={answers[p.id]}
            onChange={(v) => setAnswers((prev) => ({ ...prev, [p.id]: v }))}
            placeholder="Escribe tu respuesta"
            compareLabel="Comparar con el ejemplo"
            example={p.model_answer}
            marked={marks[p.id]}
            onMark={(correct) => mark(p.id, correct)}
          />
        </div>
      ))}
    </div>
  );
}
