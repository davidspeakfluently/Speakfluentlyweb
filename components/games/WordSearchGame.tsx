"use client";

import { useEffect, useRef, useState } from "react";
import { CircleCheck } from "lucide-react";
import { submitGameAttempt } from "@/lib/actions/game-attempts";
import type { GameWord } from "@/lib/types";

const DIRECTIONS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

type PlacedWord = {
  id: string;
  es: string;
  letters: string;
  cells: [number, number][];
};

type Grid = string[][];

function buildGrid(words: GameWord[]): { grid: Grid; placed: PlacedWord[] } {
  const candidates = words
    .map((w) => ({
      id: w.id,
      es: w.es,
      letters: w.en.toUpperCase().replace(/[^A-Z]/g, ""),
    }))
    .filter((w) => w.letters.length > 0)
    .sort((a, b) => b.letters.length - a.letters.length);

  const longest = candidates.reduce((max, w) => Math.max(max, w.letters.length), 0);
  const cellsNeeded = candidates.reduce((sum, w) => sum + w.letters.length, 0);
  const sizeForCount = Math.ceil(Math.sqrt(cellsNeeded * 2.2));
  const size = Math.min(20, Math.max(12, longest + 2, sizeForCount));

  for (let attempt = 0; attempt < 20; attempt++) {
    const grid: Grid = Array.from({ length: size }, () => Array(size).fill(""));
    const placed: PlacedWord[] = [];
    let ok = true;

    for (const word of candidates) {
      let placedThisWord = false;

      for (let tries = 0; tries < 150 && !placedThisWord; tries++) {
        const [dr, dc] = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
        const len = word.letters.length;
        const maxRow = dr === 1 ? size - len : dr === -1 ? size - 1 : size - 1;
        const maxCol = dc === 1 ? size - len : dc === -1 ? size - 1 : size - 1;
        const minRow = dr === -1 ? len - 1 : 0;
        const minCol = dc === -1 ? len - 1 : 0;
        if (maxRow < minRow || maxCol < minCol) continue;

        const startRow = minRow + Math.floor(Math.random() * (maxRow - minRow + 1));
        const startCol = minCol + Math.floor(Math.random() * (maxCol - minCol + 1));

        const cells: [number, number][] = [];
        let fits = true;
        for (let i = 0; i < len; i++) {
          const r = startRow + dr * i;
          const c = startCol + dc * i;
          const existing = grid[r][c];
          if (existing && existing !== word.letters[i]) {
            fits = false;
            break;
          }
          cells.push([r, c]);
        }
        if (!fits) continue;

        cells.forEach(([r, c], i) => {
          grid[r][c] = word.letters[i];
        });
        placed.push({ id: word.id, es: word.es, letters: word.letters, cells });
        placedThisWord = true;
      }

      if (!placedThisWord) {
        ok = false;
        break;
      }
    }

    if (ok) {
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (!grid[r][c]) grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
      }
      return { grid, placed };
    }
  }

  // Última salida (muy improbable con ~25 palabras): grid más grande, un solo intento.
  const size2 = Math.min(24, longest + 6);
  const grid: Grid = Array.from({ length: size2 }, () => Array(size2).fill(""));
  const placed: PlacedWord[] = [];
  for (const word of candidates) {
    for (let tries = 0; tries < 300; tries++) {
      const [dr, dc] = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const len = word.letters.length;
      const startRow = Math.floor(Math.random() * size2);
      const startCol = Math.floor(Math.random() * size2);
      const endRow = startRow + dr * (len - 1);
      const endCol = startCol + dc * (len - 1);
      if (endRow < 0 || endRow >= size2 || endCol < 0 || endCol >= size2) continue;
      const cells: [number, number][] = [];
      let fits = true;
      for (let i = 0; i < len; i++) {
        const r = startRow + dr * i;
        const c = startCol + dc * i;
        const existing = grid[r][c];
        if (existing && existing !== word.letters[i]) {
          fits = false;
          break;
        }
        cells.push([r, c]);
      }
      if (!fits) continue;
      cells.forEach(([r, c], i) => {
        grid[r][c] = word.letters[i];
      });
      placed.push({ id: word.id, es: word.es, letters: word.letters, cells });
      break;
    }
  }
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < size2; r++) {
    for (let c = 0; c < size2; c++) {
      if (!grid[r][c]) grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }
  return { grid, placed };
}

function cellKey(r: number, c: number) {
  return `${r},${c}`;
}

export function WordSearchGame({
  resourceId,
  words,
}: {
  resourceId: string;
  words: GameWord[];
}) {
  // La grilla usa posiciones aleatorias — se genera solo en el cliente
  // (useEffect) para que el HTML del servidor y el del cliente coincidan
  // en la primera pintada y no falle la hidratación de React.
  const [built, setBuilt] = useState<{ grid: Grid; placed: PlacedWord[] } | null>(null);
  const [selStart, setSelStart] = useState<[number, number] | null>(null);
  const [foundIds, setFoundIds] = useState<Set<string>>(new Set());
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);
  const submittedRef = useRef(false);

  // Solo al montar: si se regenerara cada vez que cambia la referencia de
  // `words` (por ejemplo cuando submitGameAttempt revalida la página al
  // terminar), la grilla se volvería a barajar debajo del estado ya
  // encontrado.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setBuilt(buildGrid(words));
  }, []);

  if (!built) {
    return (
      <div className="rounded-lg border border-border bg-white p-8 text-center text-slate">
        Preparando el juego…
      </div>
    );
  }

  const { grid, placed } = built;
  const total = placed.length;

  function submit(score: number) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setDone(true);
    submitGameAttempt(resourceId, score, total);
  }

  function handleCellClick(r: number, c: number) {
    if (done) return;
    if (!selStart) {
      setSelStart([r, c]);
      return;
    }

    const [r1, c1] = selStart;
    if (r1 === r && c1 === c) {
      setSelStart(null);
      return;
    }

    const dr = Math.sign(r - r1);
    const dc = Math.sign(c - c1);
    const aligned = r1 === r || c1 === c || Math.abs(r - r1) === Math.abs(c - c1);
    if (!aligned) {
      setSelStart([r, c]);
      return;
    }

    const len = Math.max(Math.abs(r - r1), Math.abs(c - c1)) + 1;
    const path: [number, number][] = [];
    for (let i = 0; i < len; i++) path.push([r1 + dr * i, c1 + dc * i]);
    const letters = path.map(([pr, pc]) => grid[pr][pc]).join("");
    const reversed = letters.split("").reverse().join("");

    const match = placed.find(
      (w) => !foundIds.has(w.id) && (w.letters === letters || w.letters === reversed),
    );

    if (match) {
      const nextFound = new Set(foundIds);
      nextFound.add(match.id);
      setFoundIds(nextFound);
      setFoundCells((prev) => {
        const next = new Set(prev);
        match.cells.forEach(([mr, mc]) => next.add(cellKey(mr, mc)));
        return next;
      });
      setSelStart(null);
      if (nextFound.size === total) submit(nextFound.size);
    } else {
      setSelStart(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="overflow-x-auto rounded-lg border border-border bg-white p-4">
        <div
          className="grid gap-[2px]"
          style={{ gridTemplateColumns: `repeat(${grid.length}, minmax(22px, 1fr))` }}
        >
          {grid.map((row, r) =>
            row.map((letter, c) => {
              const key = cellKey(r, c);
              const isFound = foundCells.has(key);
              const isSelected = selStart?.[0] === r && selStart?.[1] === c;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCellClick(r, c)}
                  className={
                    "flex aspect-square items-center justify-center rounded-sm font-mono text-xs font-bold transition-colors duration-[var(--transition-hover)] sm:text-sm " +
                    (isFound
                      ? "bg-nivel-avanzado-bg text-nivel-avanzado-text"
                      : isSelected
                        ? "bg-accent text-white"
                        : "bg-bg text-navy hover:bg-border")
                  }
                >
                  {letter}
                </button>
              );
            }),
          )}
        </div>
      </div>

      <div className="flex-1">
        <div className="mb-2 font-mono text-xs uppercase tracking-[0.06em] text-accent">
          Pistas ({foundIds.size}/{total})
        </div>
        <div className="flex flex-col gap-2">
          {placed.map((w) => (
            <div
              key={w.id}
              className={
                "flex items-center gap-2 rounded border border-border bg-white px-3 py-2 text-sm " +
                (foundIds.has(w.id) ? "text-slate line-through" : "text-navy")
              }
            >
              {foundIds.has(w.id) && <CircleCheck className="h-4 w-4 shrink-0 text-accent" />}
              {w.es}
            </div>
          ))}
        </div>

        {!done && foundIds.size > 0 && (
          <button
            type="button"
            onClick={() => submit(foundIds.size)}
            className="mt-4 rounded-md border border-border bg-white px-5 py-3 text-sm text-navy hover:border-slate"
          >
            Terminar aquí
          </button>
        )}

        {done && (
          <div className="mt-4 rounded-md border border-accent bg-accent px-5 py-3 text-sm font-semibold text-white">
            Puntaje enviado: {foundIds.size}/{total}
          </div>
        )}
      </div>
    </div>
  );
}
