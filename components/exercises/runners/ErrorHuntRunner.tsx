"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { ErrorHuntData, ExerciseRunnerResult } from "@/lib/exercise-content";
import { compareAnswers } from "@/lib/exercise-grading";
import { ResultSummary, VerifyButton } from "@/components/exercises/ExerciseShell";

type Segment = { text: string; errorIndex: number | null };

function highlight(text: string, errors: ErrorHuntData["errors"]): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  errors.forEach((e, i) => {
    const idx = text.indexOf(e.wrong, cursor);
    if (idx === -1) return;
    if (idx > cursor) segments.push({ text: text.slice(cursor, idx), errorIndex: null });
    segments.push({ text: e.wrong, errorIndex: i });
    cursor = idx + e.wrong.length;
  });
  if (cursor < text.length) segments.push({ text: text.slice(cursor), errorIndex: null });
  return segments;
}

export function ErrorHuntRunner({
  data,
  onResult,
}: {
  data: ErrorHuntData;
  onResult: (result: ExerciseRunnerResult) => void;
}) {
  const [corrections, setCorrections] = useState(() => data.errors.map(() => ""));
  const [checked, setChecked] = useState<boolean[] | null>(null);

  const segments = highlight(data.text, data.errors);

  function verify() {
    const results = data.errors.map((e, i) => compareAnswers(corrections[i], e.correct));
    setChecked(results);
    const correctCount = results.filter(Boolean).length;
    onResult({
      points: correctCount * data.scoring.points_per_correct_find,
      of: data.scoring.total_points,
    });
  }

  return (
    <div>
      <p className="mb-4 rounded-md bg-bg p-3.5 text-sm leading-[1.6] text-navy">
        {segments.map((seg, i) =>
          seg.errorIndex === null ? (
            <span key={i}>{seg.text}</span>
          ) : (
            <mark key={i} className="rounded-sm bg-amber-soft px-0.5 text-navy">
              {seg.text}
              <sup className="ml-0.5 font-mono text-[10px]">{seg.errorIndex + 1}</sup>
            </mark>
          ),
        )}
      </p>

      <div className="flex flex-col gap-2.5">
        {data.errors.map((e, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="w-5 shrink-0 font-mono text-xs text-slate">{i + 1}.</span>
            <input
              type="text"
              value={corrections[i]}
              disabled={!!checked}
              onChange={(ev) =>
                setCorrections((prev) => prev.map((v, idx) => (idx === i ? ev.target.value : v)))
              }
              placeholder="Escribe la corrección"
              className="flex-1 rounded border border-border bg-white px-3 py-2 text-sm text-navy outline-none focus:border-accent disabled:bg-bg"
            />
            {checked &&
              (checked[i] ? (
                <Check className="h-4 w-4 shrink-0 text-success" />
              ) : (
                <X className="h-4 w-4 shrink-0 text-danger" />
              ))}
          </div>
        ))}
      </div>

      {checked && (
        <div className="mt-3 flex flex-col gap-1">
          {data.errors.map((e, i) =>
            checked[i] ? null : (
              <p key={i} className="text-xs text-slate">
                <span className="font-semibold text-danger">{i + 1}.</span> {e.correct} — {e.explanation}
              </p>
            ),
          )}
        </div>
      )}

      <VerifyButton
        onClick={verify}
        verified={!!checked}
        disabled={corrections.some((c) => c.trim() === "")}
      />
      {checked && (
        <ResultSummary
          points={checked.filter(Boolean).length * data.scoring.points_per_correct_find}
          of={data.scoring.total_points}
        />
      )}
    </div>
  );
}
