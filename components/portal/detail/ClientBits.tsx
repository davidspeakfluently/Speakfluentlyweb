"use client";

import { useEffect, type ReactNode } from "react";
import type { CatalogItem } from "@/lib/portal/catalog";
import { rememberItems } from "@/lib/portal/client-store";

/** Guarda en memoria los recursos de la página para que abrirlos sea instantáneo. */
export function RememberItems({ items }: { items: CatalogItem[] }) {
  useEffect(() => rememberItems(items), [items]);
  return null;
}

/** Botón que baja con suavidad hasta una sección de la misma página. */
export function ScrollToButton({ targetId, className, children }: { targetId: string; className: string; children: ReactNode }) {
  return (
    <a
      href={`#${targetId}`}
      className={className}
      onClick={(e) => {
        const el = document.getElementById(targetId);
        if (!el) return;
        e.preventDefault();
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }}
    >
      {children}
    </a>
  );
}
