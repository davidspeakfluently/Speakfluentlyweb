"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import {
  createResourceRecord,
  finalizeResourceFile,
  getResourceUploadTarget,
  removeResourceFile,
  updateResourceRecord,
} from "@/lib/actions/admin-resources";
import { NIVELES, TEMAS, TIPO_LABELS, TIPO_ORDER } from "@/lib/types";
import type { Nivel, Resource, Tipo } from "@/lib/types";

const inputClass =
  "rounded border border-border bg-white px-3.5 py-[13px] text-[15px] text-navy outline-none focus:border-accent";
const labelClass = "font-mono text-xs uppercase tracking-[0.04em] text-accent";

export function ResourceForm({ resource }: { resource?: Resource }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tipo, setTipo] = useState<Tipo | "">(resource?.tipo ?? "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const fields = {
      titulo: String(formData.get("titulo") ?? "").trim(),
      descripcion: String(formData.get("descripcion") ?? "").trim(),
      tipo: String(formData.get("tipo") ?? "") as Tipo,
      tema: String(formData.get("tema") ?? "").trim(),
      nivel: String(formData.get("nivel") ?? "") as Nivel,
      autor: String(formData.get("autor") ?? "").trim(),
      meta: String(formData.get("meta") ?? "").trim(),
      video_url:
        String(formData.get("tipo") ?? "") === "video"
          ? String(formData.get("video_url") ?? "").trim() || null
          : null,
    };

    setStatus("Guardando datos…");
    let resourceId: string;

    if (resource) {
      const result = await updateResourceRecord(resource.id, fields);
      if ("error" in result) {
        setError(result.error);
        setSubmitting(false);
        setStatus(null);
        return;
      }
      resourceId = resource.id;
    } else {
      const result = await createResourceRecord(fields);
      if ("error" in result) {
        setError(result.error);
        setSubmitting(false);
        setStatus(null);
        return;
      }
      resourceId = result.id;
    }

    const file = formData.get("file");

    if (file instanceof File && file.size > 0) {
      setStatus(`Subiendo archivo (${(file.size / 1024 / 1024).toFixed(1)} MB)…`);
      const target = await getResourceUploadTarget(resourceId, file.name);
      if ("error" in target) {
        setError(target.error);
        setSubmitting(false);
        setStatus(null);
        return;
      }

      const supabase = createBrowserSupabase();
      const { error: uploadError } = await supabase.storage
        .from("recursos")
        .uploadToSignedUrl(target.path, target.token, file);

      if (uploadError) {
        setError(`No se pudo subir el archivo: ${uploadError.message}`);
        setSubmitting(false);
        setStatus(null);
        return;
      }

      const finalizeResult = await finalizeResourceFile(
        resourceId,
        target.path,
        resource?.storage_path,
      );
      if ("error" in finalizeResult) {
        setError(finalizeResult.error);
        setSubmitting(false);
        setStatus(null);
        return;
      }
    } else if (resource && formData.get("remove_file") === "on" && resource.storage_path) {
      setStatus("Quitando archivo…");
      const removeResult = await removeResourceFile(resource.id, resource.storage_path);
      if ("error" in removeResult) {
        setError(removeResult.error);
        setSubmitting(false);
        setStatus(null);
        return;
      }
    }

    router.push("/admin/recursos");
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Título</label>
        <input
          name="titulo"
          type="text"
          required
          defaultValue={resource?.titulo}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Descripción</label>
        <textarea
          name="descripcion"
          required
          rows={3}
          defaultValue={resource?.descripcion}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Tipo</label>
          <select
            name="tipo"
            required
            value={tipo}
            onChange={(e) => setTipo(e.target.value as Tipo)}
            className={inputClass}
          >
            <option value="" disabled>
              Elige un tipo
            </option>
            {TIPO_ORDER.map((t) => (
              <option key={t} value={t}>
                {TIPO_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Nivel</label>
          <select
            name="nivel"
            required
            defaultValue={resource?.nivel ?? ""}
            className={inputClass}
          >
            <option value="" disabled>
              Elige un nivel
            </option>
            {NIVELES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Tema</label>
        <select name="tema" required defaultValue={resource?.tema ?? ""} className={inputClass}>
          <option value="" disabled>
            Elige un tema
          </option>
          {TEMAS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Autor</label>
          <input
            name="autor"
            type="text"
            required
            defaultValue={resource?.autor}
            placeholder="Prof. Nombre Apellido"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Meta</label>
          <input
            name="meta"
            type="text"
            required
            defaultValue={resource?.meta}
            placeholder="6 páginas / 8 min de audio"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>
          {resource?.storage_path ? "Reemplazar archivo" : "Archivo"} (PDF, audio o video)
        </label>
        <input
          name="file"
          type="file"
          accept=".pdf,audio/*,video/*"
          className="text-sm text-accent file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
        {resource?.storage_path && (
          <label className="mt-1 flex items-center gap-2 text-[13px] text-slate">
            <input type="checkbox" name="remove_file" />
            Quitar el archivo actual (sin reemplazo)
          </label>
        )}
      </div>

      {tipo === "video" && (
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>O link de YouTube / Vimeo</label>
          <input
            name="video_url"
            type="url"
            defaultValue={resource?.video_url ?? ""}
            placeholder="https://www.youtube.com/watch?v=…"
            className={inputClass}
          />
          <div className="text-[13px] text-slate">
            Si pegas un link, se usa en vez del archivo subido — no hace falta subir video.
          </div>
        </div>
      )}

      {error && <div className="text-[13px] text-[#c1121f]">{error}</div>}
      {status && !error && <div className="text-[13px] text-slate">{status}</div>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded bg-accent p-3.5 text-[15px] font-semibold text-white hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Guardando…" : resource ? "Guardar cambios" : "Crear recurso"}
      </button>
    </form>
  );
}
