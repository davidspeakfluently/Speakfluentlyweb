"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  clearFlightNames,
  getLibraryHref,
  nameForFlight,
  openedFromLibrary,
  waitForLibrary,
} from "@/lib/portal/client-store";
import { Icon } from "@/components/portal/Icon";

/**
 * Si el recurso se abrió desde la biblioteca, volver es retroceder: la
 * biblioteca reaparece al instante, con los mismos filtros y en el mismo punto,
 * y la portada vuela de regreso a su tarjeta.
 */
export function BackToLibrary() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <Link
      href="/biblioteca"
      className="sf-back"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (openedFromLibrary(pathname) && window.history.length > 1) {
          e.preventDefault();
          flyBack(pathname, () => router.back());
          return;
        }
        const href = getLibraryHref();
        if (href !== "/biblioteca") {
          e.preventDefault();
          router.push(href);
        }
      }}
    >
      <Icon name="arrow-l" /> Volver a la biblioteca
    </Link>
  );
}

function flyBack(pathname: string, go: () => void) {
  const id = pathname.split("/").filter(Boolean).pop() ?? "";
  const hero = id ? document.querySelector<HTMLElement>(`.sf-detail__main [data-morph="${CSS.escape(id)}"]`) : null;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!hero || reduce || typeof document.startViewTransition !== "function") {
    go();
    return;
  }
  nameForFlight(hero);
  try {
    const vt = document.startViewTransition(() => {
      // La portada del detalle ya quedó fotografiada; sin nombre, no choca con la tarjeta.
      clearFlightNames();
      go();
      return waitForLibrary(id);
    });
    vt.finished.finally(clearFlightNames);
  } catch {
    clearFlightNames();
    go();
  }
}
