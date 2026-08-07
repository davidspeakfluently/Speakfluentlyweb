import Link from "next/link";
import type { Resource } from "@/lib/types";
import { TIPO_LABELS } from "@/lib/types";

export function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Link
      href={`/recursos/${resource.id}`}
      className="group flex flex-col gap-3 rounded border border-border bg-white p-5 transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,4,60,0.12)]"
    >
      <div className="flex items-center justify-between">
        <span className="rounded-[3px] bg-accent px-2 py-1 font-mono text-[11px] tracking-[0.06em] text-white">
          {TIPO_LABELS[resource.tipo]}
        </span>
        <span className="font-mono text-[11px] text-slate">{resource.nivel}</span>
      </div>
      <div className="text-base font-bold leading-[1.35]">{resource.titulo}</div>
      <div className="text-[13px] leading-[1.4] text-accent">{resource.descripcion}</div>
      <div className="mt-auto text-xs text-slate">
        {resource.tema} · {resource.meta}
      </div>
    </Link>
  );
}
