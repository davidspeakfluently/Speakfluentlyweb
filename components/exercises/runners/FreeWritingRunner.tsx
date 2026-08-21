"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import type { ExerciseRunnerResult, FreeWritingData } from "@/lib/exercise-content";
import { SelfAssessBlock } from "@/components/exercises/ExerciseShell";

function countSentences(text: string) {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean).length;
}

export function FreeWritingRunner({
  data,
  onResult,
}: {
  data: FreeWritingData;
  onResult: (result: ExerciseRunnerResult) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [marked, setMarked] = useState<boolean | null>(null);
  const sentenceCount = useMemo(() => countSentences(answer), [answer]);
  const inRange = sentenceCount >= data.min_sentences && sentenceCount <= data.max_sentences;

  function mark(correct: boolean) {
    setMarked(correct);
    onResult({ points: correct ? 1 : 0, of: 1, selfAssessed: true });
  }

  return (
    <div>
      <div className="mb-3 text-sm font-semibold text-navy">{data.prompt}</div>

      <ul className="mb-3 flex flex-col gap-1.5">
        {data.requirements.map((r, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-slate">
            <Check className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
            {r}
          </li>
        ))}
      </ul>

      <SelfAssessBlock
        value={answer}
        onChange={setAnswer}
        placeholder="Escribe tu respuesta aquí"
        compareLabel="Comparar con el ejemplo"
        example={data.model_answer}
        marked={marked}
        onMark={mark}
      />

      {marked === null && (
        <div className={"mt-2 text-xs " + (inRange ? "text-slate" : "text-accent")}>
          {sentenceCount} {sentenceCount === 1 ? "oración" : "oraciones"} (entre {data.min_sentences} y{" "}
          {data.max_sentences} sugeridas)
        </div>
      )}
    </div>
  );
}
