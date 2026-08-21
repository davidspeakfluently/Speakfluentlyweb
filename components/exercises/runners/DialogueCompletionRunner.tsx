"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import type { DialogueCompletionData, ExerciseRunnerResult } from "@/lib/exercise-content";
import { compareAnswers } from "@/lib/exercise-grading";
import { VerifyRow } from "@/components/exercises/ExerciseShell";

type Segment = { text: string; blankId: string | null };

function splitLine(text: string): Segment[] {
  const segments: Segment[] = [];
  const re = /___([A-Za-z0-9]+)___/g;
  let cursor = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > cursor) segments.push({ text: text.slice(cursor, m.index), blankId: null });
    segments.push({ text: m[0], blankId: m[1] });
    cursor = m.index + m[0].length;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), blankId: null });
  return segments;
}

export function DialogueCompletionRunner({
  data,
  onResult,
}: {
  data: DialogueCompletionData;
  onResult: (result: ExerciseRunnerResult) => void;
}) {
  const fixedBlanks = data.blanks.filter((b) => b.type === "fixed");
  const freeBlanks = data.blanks.filter((b) => b.type === "free");

  const [fixedAnswers, setFixedAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(fixedBlanks.map((b) => [b.id, ""])),
  );
  const [fixedResolved, setFixedResolved] = useState<Record<string, boolean>>({});
  const [fixedAttempted, setFixedAttempted] = useState(false);
  const [fixedRevealed, setFixedRevealed] = useState(false);

  const [freeAnswers, setFreeAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(freeBlanks.map((b) => [b.id, ""])),
  );
  const [freeRevealed, setFreeRevealed] = useState<Record<string, boolean>>({});
  const [freeMarks, setFreeMarks] = useState<Record<string, boolean | null>>(() =>
    Object.fromEntries(freeBlanks.map((b) => [b.id, null])),
  );

  const reportedRef = useRef(false);

  const allFixedResolved = fixedBlanks.every((b) => fixedResolved[b.id]);
  const canVerifyFixed =
    !allFixedResolved &&
    fixedBlanks.every((b) => fixedResolved[b.id] || fixedAnswers[b.id].trim() !== "");
  const allFreeMarked = freeBlanks.every((b) => freeMarks[b.id] !== null);

  function verifyFixed() {
    setFixedAttempted(true);
    const next: Record<string, boolean> = { ...fixedResolved };
    fixedBlanks.forEach((b) => {
      if (!next[b.id]) next[b.id] = compareAnswers(fixedAnswers[b.id], b.correct_answer);
    });
    setFixedResolved(next);
    if (fixedBlanks.every((b) => next[b.id])) setFixedRevealed(true);
  }

  function revealFixed() {
    setFixedRevealed(true);
  }

  function markFree(blankId: string, correct: boolean) {
    setFreeMarks((prev) => ({ ...prev, [blankId]: correct }));
  }

  useEffect(() => {
    if (reportedRef.current) return;
    const fixedDone = fixedBlanks.length === 0 || fixedRevealed;
    if (!fixedDone || !allFreeMarked) return;
    reportedRef.current = true;
    const fixedPoints = fixedBlanks.filter((b) => fixedResolved[b.id]).length;
    const freePoints = freeBlanks.filter((b) => freeMarks[b.id]).length;
    onResult({
      points: fixedPoints + freePoints,
      of: fixedBlanks.length + freeBlanks.length,
      selfAssessed: freeBlanks.length > 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixedRevealed, freeMarks, allFreeMarked]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 rounded-md bg-bg p-4">
        {data.lines.map((line, i) => (
          <div key={i} className="text-sm text-navy">
            <span className="font-semibold">{line.speaker}: </span>
            {splitLine(line.text).map((seg, j) => {
              if (seg.blankId === null) return <span key={j}>{seg.text}</span>;
              const blank = data.blanks.find((b) => b.id === seg.blankId);
              if (!blank) return <span key={j}>{seg.text}</span>;

              if (blank.type === "fixed") {
                const resolved = fixedResolved[blank.id];
                const wrong = fixedAttempted && !resolved;
                return (
                  <input
                    key={j}
                    type="text"
                    value={fixedAnswers[blank.id]}
                    disabled={resolved || fixedRevealed}
                    onChange={(ev) =>
                      setFixedAnswers((prev) => ({ ...prev, [blank.id]: ev.target.value }))
                    }
                    className={
                      "mx-1 w-28 rounded border px-2 py-0.5 text-sm outline-none disabled:bg-white " +
                      (resolved
                        ? "border-success bg-success/10"
                        : wrong
                          ? "border-danger"
                          : "border-border bg-white focus:border-accent")
                    }
                  />
                );
              }

              return (
                <input
                  key={j}
                  type="text"
                  value={freeAnswers[blank.id]}
                  disabled={freeRevealed[blank.id]}
                  onChange={(ev) => setFreeAnswers((prev) => ({ ...prev, [blank.id]: ev.target.value }))}
                  placeholder={blank.prompt_es}
                  className="mx-1 w-48 rounded border border-border bg-white px-2 py-0.5 text-sm outline-none focus:border-accent disabled:bg-white"
                />
              );
            })}
          </div>
        ))}
      </div>

      {fixedBlanks.length > 0 && (
        <div className="mb-5">
          <VerifyRow
            onVerify={verifyFixed}
            onReveal={revealFixed}
            verifyDisabled={!canVerifyFixed}
            showReveal={fixedAttempted && !allFixedResolved}
            revealed={fixedRevealed}
          />
        </div>
      )}

      {freeBlanks.map((b) => {
        const revealed = freeRevealed[b.id];
        const marked = freeMarks[b.id];
        return (
          <div key={b.id} className="rounded-md bg-bg p-3.5">
            <div className="mb-2 text-xs text-slate">{b.prompt_es}</div>
            {!revealed ? (
              <button
                type="button"
                onClick={() => setFreeRevealed((prev) => ({ ...prev, [b.id]: true }))}
                disabled={freeAnswers[b.id].trim() === ""}
                className="rounded-md border border-border bg-white px-4 py-2 text-xs text-navy transition-colors duration-[var(--transition-hover)] hover:border-slate disabled:cursor-not-allowed disabled:opacity-50"
              >
                Comparar con el ejemplo
              </button>
            ) : (
              <div className="flex flex-col gap-2.5">
                <div className="text-sm text-navy">
                  <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-accent">Ejemplo</span>
                  <p className="mt-1">{b.sample_answer}</p>
                </div>
                <ul className="flex flex-col gap-1">
                  {b.must_include.map((word, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-slate">
                      {freeAnswers[b.id].toLowerCase().includes(word.toLowerCase()) ? (
                        <Check className="h-3 w-3 shrink-0 text-success" />
                      ) : (
                        <X className="h-3 w-3 shrink-0 text-danger" />
                      )}
                      incluye &ldquo;{word}&rdquo;
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate">¿Cómo te fue?</span>
                  <button
                    type="button"
                    onClick={() => markFree(b.id, true)}
                    className={
                      "rounded-md border px-4 py-2 text-sm transition-colors duration-[var(--transition-hover)] " +
                      (marked === true
                        ? "border-success bg-success/10 text-success"
                        : "border-border bg-white text-navy hover:border-success")
                    }
                  >
                    Lo hice bien
                  </button>
                  <button
                    type="button"
                    onClick={() => markFree(b.id, false)}
                    className={
                      "rounded-md border px-4 py-2 text-sm transition-colors duration-[var(--transition-hover)] " +
                      (marked === false
                        ? "border-danger bg-danger/10 text-danger"
                        : "border-border bg-white text-navy hover:border-danger")
                    }
                  >
                    Necesito practicar más
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
