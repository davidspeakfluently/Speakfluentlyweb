"use client";

import { useEffect, useRef, useState } from "react";
import { CircleCheck, XCircle } from "lucide-react";
import { submitGameAttempt } from "@/lib/actions/game-attempts";
import type { GameWord } from "@/lib/types";

const MAX_WRONG = 6;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function HangmanGame({
  resourceId,
  words,
}: {
  resourceId: string;
  words: GameWord[];
}) {
  // El orden se baraja al azar — se hace solo en el cliente (useEffect)
  // para que el HTML del servidor y el del cliente coincidan en la primera
  // pintada y no falle la hidratación de React.
  const [order, setOrder] = useState<GameWord[] | null>(null);
  const [index, setIndex] = useState(0);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState(0);
  const [solved, setSolved] = useState(0);
  const [resolved, setResolved] = useState(false);
  const [done, setDone] = useState(false);
  const submittedRef = useRef(false);

  // Solo al montar: mismo motivo que en WordSearchGame — no reordenar si
  // la página se revalida (ej. al enviar el puntaje).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setOrder(shuffle(words));
  }, []);

  // Derivados "seguros" incluso antes de que `order` exista, para poder
  // usarlos en el effect de abajo sin romper las Reglas de Hooks (todos los
  // hooks tienen que llamarse en el mismo orden en cada render, así que el
  // effect no puede ir después del `return` temprano de "Preparando...").
  const current = order?.[index];
  const upper = current?.en.toUpperCase() ?? "";
  const wordLetters = upper.split("").filter((ch) => /[A-Z]/.test(ch));
  const won = current ? wordLetters.every((ch) => guessed.has(ch)) : false;

  useEffect(() => {
    if (!current || resolved) return;
    if (won || wrong >= MAX_WRONG) setResolved(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guessed, wrong, current]);

  if (!order) {
    return (
      <div className="rounded-lg border border-border bg-white p-8 text-center text-slate">
        Preparando el juego…
      </div>
    );
  }

  const total = order.length;
  const currentWord = order[index];

  // Updates funcionales (no leen `guessed`/`wrong` del closure) para que
  // dos clics no puedan pisarse si React todavía no repintó entre uno y
  // otro. "Resuelta" (ganada o perdida) se deriva en el effect de arriba en
  // vez de calcularla a mano acá, por la misma razón.
  function guess(letter: string) {
    if (resolved || done) return;
    setGuessed((prev) => {
      if (prev.has(letter)) return prev;
      const next = new Set(prev);
      next.add(letter);
      return next;
    });
    if (!upper.includes(letter)) {
      setWrong((prev) => prev + 1);
    }
  }

  function next() {
    const wonThisWord = won;
    const nextSolved = wonThisWord ? solved + 1 : solved;
    if (wonThisWord) setSolved(nextSolved);

    if (index + 1 >= total) {
      if (!submittedRef.current) {
        submittedRef.current = true;
        submitGameAttempt(resourceId, nextSolved, total);
      }
      setDone(true);
      return;
    }

    setIndex(index + 1);
    setGuessed(new Set());
    setWrong(0);
    setResolved(false);
  }

  if (done) {
    return (
      <div className="rounded-md border border-accent bg-accent px-5 py-4 text-sm font-semibold text-white">
        Puntaje enviado: {solved}/{total} palabras resueltas
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1 rounded-lg border border-border bg-white p-6">
        <div className="mb-1 font-mono text-xs uppercase tracking-[0.06em] text-slate">
          Palabra {index + 1} de {total}
        </div>
        <div className="mb-4 text-lg font-bold text-accent">Pista: {currentWord.es}</div>

        <div className="mb-5 flex flex-wrap gap-2">
          {upper.split("").map((ch, i) =>
            /[A-Z]/.test(ch) ? (
              <div
                key={i}
                className="flex h-10 w-8 items-center justify-center rounded-sm border-b-2 border-navy font-mono text-lg font-bold"
              >
                {guessed.has(ch) || resolved ? ch : ""}
              </div>
            ) : (
              <div key={i} className="w-3" />
            ),
          )}
        </div>

        <div className="mb-4 flex items-center gap-1.5">
          {Array.from({ length: MAX_WRONG }).map((_, i) => (
            <div
              key={i}
              className={
                "h-2 flex-1 rounded-full " + (i < wrong ? "bg-[#c1121f]" : "bg-border")
              }
            />
          ))}
        </div>

        {resolved && (
          <div
            className={
              "mb-4 flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold " +
              (won ? "bg-nivel-avanzado-bg text-nivel-avanzado-text" : "bg-border text-navy")
            }
          >
            {won ? <CircleCheck className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {won ? "¡Correcto!" : `La palabra era: ${upper}`}
          </div>
        )}

        <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-9">
          {ALPHABET.map((letter) => {
            const used = guessed.has(letter);
            const isCorrect = used && upper.includes(letter);
            return (
              <button
                key={letter}
                type="button"
                disabled={used || resolved}
                onClick={() => guess(letter)}
                className={
                  "rounded-sm border px-1 py-2 font-mono text-sm font-bold transition-colors duration-[var(--transition-hover)] disabled:cursor-not-allowed " +
                  (used
                    ? isCorrect
                      ? "border-accent bg-accent text-white"
                      : "border-border bg-border text-slate"
                    : "border-border bg-white text-navy hover:border-slate")
                }
              >
                {letter}
              </button>
            );
          })}
        </div>

        {resolved && (
          <button
            type="button"
            onClick={next}
            className="mt-5 rounded-md bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-navy"
          >
            {index + 1 >= total ? "Ver resultado" : "Siguiente palabra"}
          </button>
        )}
      </div>
    </div>
  );
}
