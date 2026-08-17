"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setGameWords } from "@/lib/actions/admin-games";
import type { GameWord } from "@/lib/types";

const inputClass =
  "rounded border border-border bg-white px-3 py-2 text-sm text-navy outline-none focus:border-accent";

type Row = { en: string; es: string };

export function GameWordsManager({
  resourceId,
  words,
}: {
  resourceId: string;
  words: GameWord[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(
    words.length > 0 ? words.map((w) => ({ en: w.en, es: w.es })) : [{ en: "", es: "" }],
  );
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function updateRow(index: number, field: keyof Row, value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { en: "", es: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    setStatus(null);
    const result = await setGameWords(resourceId, rows);
    setBusy(false);
    if ("error" in result) return setError(result.error);
    setStatus("Guardado.");
    router.refresh();
  }

  return (
    <div className="rounded border border-border bg-white p-5">
      <div className="mb-4 text-base font-bold">Palabras ({rows.filter((r) => r.en && r.es).length})</div>

      <div className="mb-2 flex gap-2 font-mono text-xs uppercase tracking-[0.06em] text-slate">
        <div className="flex-1">Inglés</div>
        <div className="flex-1">Español</div>
        <div className="w-16" />
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={row.en}
              onChange={(e) => updateRow(i, "en", e.target.value)}
              placeholder="check in"
              className={`${inputClass} flex-1`}
            />
            <input
              value={row.es}
              onChange={(e) => updateRow(i, "es", e.target.value)}
              placeholder="hacer el check-in"
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="w-16 text-sm text-[#c1121f] hover:underline"
            >
              Quitar
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={addRow}
          className="rounded border border-border bg-white px-4 py-2 text-sm text-navy hover:border-slate"
        >
          + Agregar palabra
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleSave}
          className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-navy disabled:opacity-60"
        >
          Guardar lista
        </button>
        {status && <span className="text-sm text-accent">{status}</span>}
      </div>

      {error && <div className="mt-2 text-[13px] text-[#c1121f]">{error}</div>}
    </div>
  );
}
