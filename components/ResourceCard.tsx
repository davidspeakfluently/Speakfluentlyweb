import Link from "next/link";
import { CircleCheck } from "lucide-react";
import type { Kind, Resource } from "@/lib/types";
import { kindIconFor, nivelBadgeClassFor } from "@/lib/resource-ui";

export function ResourceCard({
  resource,
  tipoLabel,
  kind = "documento",
  completed = false,
  variant = "grid",
}: {
  resource: Resource;
  tipoLabel: string;
  kind?: Kind;
  completed?: boolean;
  variant?: "grid" | "compact";
}) {
  const KindIcon = kindIconFor(kind);
  const compact = variant === "compact";

  return (
    <Link
      href={`/recursos/${resource.id}`}
      className={
        "group relative flex flex-col gap-3 rounded-md border border-border bg-white transition-[transform,box-shadow,border-color] duration-[var(--transition-hover)] hover:-translate-y-0.5 hover:border-slate hover:shadow-[var(--shadow-card)] " +
        (compact ? "p-3.5" : "p-5")
      }
    >
      {completed && (
        <CircleCheck
          className="absolute top-3 right-3 h-[18px] w-[18px] fill-accent text-white"
          aria-label="Completado"
        />
      )}

      <div className="flex items-center justify-between gap-2 pr-5">
        <span className="flex items-center gap-1.5 rounded-sm bg-accent px-2 py-1 font-mono text-[11px] tracking-[0.06em] text-white">
          <KindIcon className="h-3 w-3" />
          {tipoLabel}
        </span>
        <span
          className={
            "rounded-sm px-2 py-1 font-mono text-[11px] " + nivelBadgeClassFor(resource.nivel)
          }
        >
          {resource.nivel}
        </span>
      </div>

      <div className={"font-bold leading-[1.35] " + (compact ? "text-sm" : "text-base")}>
        {resource.titulo}
      </div>

      {!compact && (
        <div className="text-[13px] leading-[1.4] text-accent">{resource.descripcion}</div>
      )}

      <div className="mt-auto text-xs text-slate">
        {resource.tema} · {resource.meta}
      </div>
    </Link>
  );
}
