import { NIVELES, TEMAS, TIPO_LABELS, TIPO_ORDER } from "@/lib/types";
import type { Resource } from "@/lib/types";

const inputClass =
  "rounded border border-border bg-white px-3.5 py-[13px] text-[15px] text-navy outline-none focus:border-accent";
const labelClass = "font-mono text-xs uppercase tracking-[0.04em] text-accent";

export function ResourceFields({ resource }: { resource?: Resource }) {
  return (
    <>
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
            defaultValue={resource?.tipo ?? ""}
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
    </>
  );
}
