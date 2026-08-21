"use client";

import { useEffect, useRef, useState } from "react";
import type { ExerciseRunnerResult, RewriteImproveData } from "@/lib/exercise-content";
import { SelfAssessBlock } from "@/components/exercises/ExerciseShell";

export function RewriteImproveRunner({
  data,
  onResult,
}: {
  data: RewriteImproveData;
  onResult: (result: ExerciseRunnerResult) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>(() =>
    Object.fromEntries(data.items.map((item) => [item.id, ""])),
  );
  const [marks, setMarks] = useState<Record<number, boolean | null>>(() =>
    Object.fromEntries(data.items.map((item) => [item.id, null])),
  );
  const reportedRef = useRef(false);

  // Actualización funcional: cada ítem se autoevalúa con su propio botón, así
  // que dos marcas pueden resolverse en el mismo ciclo de React sin que haya
  // habido un render entre medio — construir el siguiente estado a partir del
  // `marks` cerrado (en vez de `prev`) perdería marcas silenciosamente.
  function mark(itemId: number, correct: boolean) {
    setMarks((prev) => ({ ...prev, [itemId]: correct }));
  }

  useEffect(() => {
    if (reportedRef.current) return;
    if (!data.items.every((item) => marks[item.id] !== null)) return;
    reportedRef.current = true;
    onResult({
      points: data.items.filter((item) => marks[item.id]).length,
      of: data.items.length,
      selfAssessed: true,
    });
  }, [marks, data.items, onResult]);

  return (
    <div className="flex flex-col gap-6">
      {data.items.map((item) => (
        <div key={item.id}>
          <div className="mb-2 text-sm text-navy">{item.original}</div>
          <SelfAssessBlock
            value={answers[item.id]}
            onChange={(v) => setAnswers((prev) => ({ ...prev, [item.id]: v }))}
            placeholder="Escribe la oración corregida"
            compareLabel="Comparar con el ejemplo"
            example={item.improved_example}
            marked={marks[item.id]}
            onMark={(correct) => mark(item.id, correct)}
          />
        </div>
      ))}
    </div>
  );
}
