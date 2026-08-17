"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createTema,
  createTipo,
  deleteTema,
  deleteTipo,
  updateTema,
  updateTipo,
} from "@/lib/actions/admin-taxonomies";
import type { Kind, Tema, TipoRecurso } from "@/lib/types";

const inputClass =
  "rounded border border-border bg-white px-3 py-2 text-sm text-navy outline-none focus:border-accent";
const KIND_LABELS: Record<Kind, string> = {
  documento: "Documento",
  audio: "Audio",
  video: "Video",
  juego: "Juego",
};

export function TemasManager({ temas }: { temas: Tema[] }) {
  const router = useRouter();
  const [items, setItems] = useState(temas);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    setError(null);
    const result = await createTema(newName);
    setBusy(false);
    if ("error" in result) return setError(result.error);
    setNewName("");
    router.refresh();
    setItems((prev) => [...prev, { id: result.id, nombre: newName.trim(), orden: prev.length, created_at: "" }]);
  }

  async function handleSave(id: string) {
    setBusy(true);
    setError(null);
    const result = await updateTema(id, draft);
    setBusy(false);
    if ("error" in result) return setError(result.error);
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, nombre: draft.trim() } : t)));
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setBusy(true);
    setError(null);
    const result = await deleteTema(id);
    setBusy(false);
    if ("error" in result) return setError(result.error);
    setItems((prev) => prev.filter((t) => t.id !== id));
    router.refresh();
  }

  return (
    <div className="rounded border border-border bg-white p-5">
      <div className="mb-4 text-base font-bold">Temas</div>
      <div className="flex flex-col gap-2">
        {items.map((t) => (
          <div key={t.id} className="flex items-center gap-2 border-b border-border py-2 last:border-0">
            {editingId === t.id ? (
              <>
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className={`${inputClass} flex-1`}
                />
                <button
                  disabled={busy}
                  onClick={() => handleSave(t.id)}
                  className="text-sm text-accent hover:underline"
                >
                  Guardar
                </button>
                <button onClick={() => setEditingId(null)} className="text-sm text-slate hover:underline">
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <div className="flex-1 text-sm">{t.nombre}</div>
                <button
                  onClick={() => {
                    setEditingId(t.id);
                    setDraft(t.nombre);
                    setError(null);
                  }}
                  className="text-sm text-accent hover:underline"
                >
                  Editar
                </button>
                <button
                  disabled={busy}
                  onClick={() => handleDelete(t.id)}
                  className="text-sm text-[#c1121f] hover:underline"
                >
                  Eliminar
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nuevo tema…"
          className={`${inputClass} flex-1`}
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-navy disabled:opacity-60"
        >
          + Agregar
        </button>
      </form>

      {error && <div className="mt-2 text-[13px] text-[#c1121f]">{error}</div>}
    </div>
  );
}

export function TiposManager({ tipos }: { tipos: TipoRecurso[] }) {
  const router = useRouter();
  const [items, setItems] = useState(tipos);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftKind, setDraftKind] = useState<Kind>("documento");
  const [newLabel, setNewLabel] = useState("");
  const [newKind, setNewKind] = useState<Kind>("documento");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setBusy(true);
    setError(null);
    const result = await createTipo(newLabel, newKind);
    setBusy(false);
    if ("error" in result) return setError(result.error);
    setItems((prev) => [
      ...prev,
      { key: result.key, label: newLabel.trim(), kind: newKind, orden: prev.length, created_at: "" },
    ]);
    setNewLabel("");
    router.refresh();
  }

  async function handleSave(key: string) {
    setBusy(true);
    setError(null);
    const result = await updateTipo(key, draftLabel, draftKind);
    setBusy(false);
    if ("error" in result) return setError(result.error);
    setItems((prev) =>
      prev.map((t) => (t.key === key ? { ...t, label: draftLabel.trim(), kind: draftKind } : t)),
    );
    setEditingKey(null);
    router.refresh();
  }

  async function handleDelete(key: string) {
    setBusy(true);
    setError(null);
    const result = await deleteTipo(key);
    setBusy(false);
    if ("error" in result) return setError(result.error);
    setItems((prev) => prev.filter((t) => t.key !== key));
    router.refresh();
  }

  return (
    <div className="rounded border border-border bg-white p-5">
      <div className="mb-4 text-base font-bold">Tipos de recurso</div>
      <div className="flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.key}
            className="flex flex-wrap items-center gap-2 border-b border-border py-2 last:border-0"
          >
            {editingKey === t.key ? (
              <>
                <input
                  autoFocus
                  value={draftLabel}
                  onChange={(e) => setDraftLabel(e.target.value)}
                  className={`${inputClass} flex-1`}
                />
                <select
                  value={draftKind}
                  onChange={(e) => setDraftKind(e.target.value as Kind)}
                  className={inputClass}
                >
                  {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
                    <option key={k} value={k}>
                      {KIND_LABELS[k]}
                    </option>
                  ))}
                </select>
                <button
                  disabled={busy}
                  onClick={() => handleSave(t.key)}
                  className="text-sm text-accent hover:underline"
                >
                  Guardar
                </button>
                <button onClick={() => setEditingKey(null)} className="text-sm text-slate hover:underline">
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <div className="flex-1 text-sm">{t.label}</div>
                <span className="rounded-[3px] border border-border px-2 py-1 font-mono text-[11px] text-accent">
                  {KIND_LABELS[t.kind]}
                </span>
                <button
                  onClick={() => {
                    setEditingKey(t.key);
                    setDraftLabel(t.label);
                    setDraftKind(t.kind);
                    setError(null);
                  }}
                  className="text-sm text-accent hover:underline"
                >
                  Editar
                </button>
                <button
                  disabled={busy}
                  onClick={() => handleDelete(t.key)}
                  className="text-sm text-[#c1121f] hover:underline"
                >
                  Eliminar
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-wrap gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Nuevo tipo (ej. Podcast)…"
          className={`${inputClass} flex-1`}
        />
        <select value={newKind} onChange={(e) => setNewKind(e.target.value as Kind)} className={inputClass}>
          {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-navy disabled:opacity-60"
        >
          + Agregar
        </button>
      </form>

      {error && <div className="mt-2 text-[13px] text-[#c1121f]">{error}</div>}
    </div>
  );
}
