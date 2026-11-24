import type { CatalogItem } from "@/lib/portal/catalog";

/**
 * Memoria del portal mientras el estudiante navega (vive solo en esta
 * pestaña; al recargar se reinicia). Permite que la pantalla de carga de un
 * recurso muestre su portada y título al instante, y que "Volver a la
 * biblioteca" regrese al mismo punto donde estaba.
 */

const items = new Map<string, CatalogItem>();

export function rememberItems(list: CatalogItem[]) {
  for (const it of list) items.set(it.id, it);
}

export function recallItem(id: string) {
  return items.get(id) ?? null;
}

/** "Marcar como completado" se refleja en las tarjetas sin esperar al servidor. */
const doneOverrides = new Map<string, boolean>();

export function setDoneOverride(id: string, done: boolean) {
  doneOverrides.set(id, done);
}

export function applyDoneOverrides(ids: Set<string>) {
  if (!doneOverrides.size) return ids;
  const out = new Set(ids);
  doneOverrides.forEach((done, id) => (done ? out.add(id) : out.delete(id)));
  return out;
}

let libraryHref = "/biblioteca";
let openedFrom: string | null = null;

export function setLibraryHref(href: string) {
  libraryHref = href;
}

export function getLibraryHref() {
  return libraryHref;
}

/** Se llama al abrir un recurso desde la biblioteca. */
export function markOpenedFromLibrary(href: string) {
  openedFrom = href;
}

/** ¿Este recurso se abrió directamente desde la biblioteca? Entonces "volver" es retroceder. */
export function openedFromLibrary(pathname: string) {
  return openedFrom === pathname;
}

const SCROLL_KEY = "sf:biblioteca";

type SavedScroll = { url: string; y: number; rows: Record<string, number>; at: number };

export function saveLibraryScroll(url: string, rows: Record<string, number>) {
  try {
    const data: SavedScroll = { url, y: window.scrollY, rows, at: Date.now() };
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify(data));
  } catch {
    /* sin almacenamiento: solo se pierde la posición */
  }
}

/** La posición guardada, si corresponde a esta misma vista (no la borra). */
export function peekLibraryScroll(url: string): SavedScroll | null {
  try {
    const raw = sessionStorage.getItem(SCROLL_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedScroll;
    if (data.url !== url || Date.now() - data.at > 30 * 60 * 1000) return null;
    return data;
  } catch {
    return null;
  }
}

/** Se usa una sola vez: después de restaurarla se olvida. */
export function clearLibraryScroll() {
  try {
    sessionStorage.removeItem(SCROLL_KEY);
  } catch {
    /* nada que borrar */
  }
}

/** La animación de bienvenida del encabezado se ve solo la primera vez de la sesión. */
export function seenIntro() {
  try {
    return sessionStorage.getItem("sf:intro") === "1";
  } catch {
    return true;
  }
}

export function markIntroSeen() {
  try {
    sessionStorage.setItem("sf:intro", "1");
  } catch {
    /* sin almacenamiento: la bienvenida se verá de nuevo, nada grave */
  }
}

/*
 * Vuelo de regreso: al volver a la biblioteca con el botón del detalle, la
 * portada viaja de nuevo hasta su tarjeta. (Retroceder con el navegador no
 * dispara la animación automática de React, así que se hace a mano con la
 * API de transiciones del navegador.)
 */
let returning: { id: string; resolve: () => void } | null = null;
const named: HTMLElement[] = [];

export function nameForFlight(el: HTMLElement) {
  el.style.setProperty("view-transition-name", "sf-return");
  named.push(el);
}

export function clearFlightNames() {
  while (named.length) named.pop()?.style.removeProperty("view-transition-name");
}

/** Espera a que la biblioteca vuelva a estar en pantalla (o se rinde al segundo y medio). */
export function waitForLibrary(id: string) {
  return new Promise<void>((resolve) => {
    returning = { id, resolve };
    setTimeout(() => {
      if (returning?.resolve === resolve) {
        returning = null;
        resolve();
      }
    }, 1500);
  });
}

/** La biblioteca, ya restaurada, marca la tarjeta de destino y deja seguir la animación. */
export function landFlight(find: (id: string) => HTMLElement | null) {
  if (!returning) return;
  const { id, resolve } = returning;
  returning = null;
  const el = find(id);
  if (el) nameForFlight(el);
  resolve();
}
