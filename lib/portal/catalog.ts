import type { Kind, Nivel, Resource, TipoRecurso } from "@/lib/types";

/**
 * Datos de presentación del portal de estudiantes. Todo lo de este archivo es
 * puro (sin Supabase ni DOM) para que lo usen tanto las páginas del servidor
 * como los componentes del navegador.
 */

export type IconName =
  | "search"
  | "search-x"
  | "x"
  | "arrow"
  | "arrow-l"
  | "chev-l"
  | "chev-r"
  | "check"
  | "grid"
  | "book"
  | "type"
  | "checks"
  | "headphones"
  | "video"
  | "compass"
  | "pen"
  | "chat"
  | "mic"
  | "case"
  | "plane"
  | "tag"
  | "logout"
  | "play"
  | "pause"
  | "puzzle"
  | "download"
  | "external"
  | "clock";

/** Ilustración de portada. Se elige por tipo y, si el tipo es nuevo, por su comportamiento. */
export type ArtKey = "audio" | "cartilla" | "ejercicio" | "vocab" | "video" | "guia" | "juego";

export type TipoMeta = {
  key: string;
  /** "Cartilla" */
  one: string;
  /** "Cartillas" */
  many: string;
  /** Título del estante en la biblioteca */
  shelf: string;
  icon: IconName;
  kind: Kind;
  art: ArtKey;
  orden: number;
};

export type CatalogItem = {
  id: string;
  titulo: string;
  /** Tema en inglés, la parte antes del guion del título */
  en: string;
  /** Subtítulo en español, la parte después del guion */
  es: string;
  descripcion: string;
  tipo: string;
  tipoLabel: string;
  icon: IconName;
  art: ArtKey;
  kind: Kind;
  tema: string;
  nivel: Nivel;
  meta: string;
  autor: string;
  href: string;
};

export const NIVEL_ORDER: Nivel[] = ["Básico", "Intermedio", "Avanzado"];
export const NIVEL_STEP: Record<Nivel, number> = { Básico: 1, Intermedio: 2, Avanzado: 3 };

const KNOWN_TIPOS: Record<string, Omit<TipoMeta, "key" | "kind" | "orden">> = {
  cartilla: { one: "Cartilla", many: "Cartillas", shelf: "Cartillas", icon: "book", art: "cartilla" },
  guia: { one: "Guía", many: "Guías", shelf: "Guías", icon: "compass", art: "guia" },
  vocab: { one: "Vocabulario", many: "Vocabulario", shelf: "Vocabulario", icon: "type", art: "vocab" },
  ejercicio: { one: "Ejercicio", many: "Ejercicios", shelf: "Ejercicios", icon: "checks", art: "ejercicio" },
  video: { one: "Video", many: "Videos", shelf: "Videos", icon: "video", art: "video" },
  audio: { one: "Nota de voz", many: "Notas de voz", shelf: "Listening", icon: "headphones", art: "audio" },
};

const KIND_FALLBACK: Record<Kind, { icon: IconName; art: ArtKey }> = {
  documento: { icon: "book", art: "cartilla" },
  audio: { icon: "headphones", art: "audio" },
  video: { icon: "video", art: "video" },
  juego: { icon: "puzzle", art: "juego" },
  ejercicio: { icon: "checks", art: "ejercicio" },
};

/** Orden de los estantes cuando no hay búsqueda: primero lo que más se usa. */
export const SHELF_ORDER = ["audio", "cartilla", "ejercicio", "vocab", "guia", "video"];

export const TEMA_ICON: Record<string, IconName> = {
  Gramática: "pen",
  Vocabulario: "type",
  Conversación: "chat",
  Pronunciación: "mic",
  "Business English": "case",
  Viajes: "plane",
  Listening: "headphones",
};

/** "NOTA DE VOZ" → "Nota de voz" */
function sentenceCase(label: string) {
  const lower = label.trim().toLocaleLowerCase("es");
  return lower.charAt(0).toLocaleUpperCase("es") + lower.slice(1);
}

export function buildTipoMetas(tipos: TipoRecurso[]): Record<string, TipoMeta> {
  const out: Record<string, TipoMeta> = {};
  for (const t of tipos) {
    const known = KNOWN_TIPOS[t.key];
    const fallback = KIND_FALLBACK[t.kind] ?? KIND_FALLBACK.documento;
    const label = sentenceCase(t.label || t.key);
    out[t.key] = {
      key: t.key,
      kind: t.kind,
      orden: t.orden,
      one: known?.one ?? label,
      many: known?.many ?? label,
      shelf: known?.shelf ?? label,
      icon: known?.icon ?? fallback.icon,
      art: known?.art ?? fallback.art,
    };
  }
  return out;
}

export function tipoMetaFor(key: string, metas: Record<string, TipoMeta>): TipoMeta {
  return (
    metas[key] ?? {
      key,
      kind: "documento",
      orden: 999,
      one: sentenceCase(key),
      many: sentenceCase(key),
      shelf: sentenceCase(key),
      icon: "tag",
      art: "cartilla",
    }
  );
}

/** "Travel Vocabulary - Todo lo que necesitas para viajar" → tema en inglés + subtítulo. */
export function splitTitle(titulo: string) {
  const m = titulo.match(/^(.*?)\s+[-–—]\s+(.*)$/);
  const en = m ? m[1].trim() : titulo.trim();
  let es = m ? m[2].trim() : "";
  if (/^workbook$/i.test(es)) es = "";
  return { en, es };
}

export function hrefFor(id: string, kind: Kind) {
  if (kind === "ejercicio") return `/ejercicios/${id}`;
  if (kind === "juego") return `/juegos/${id}`;
  return `/recursos/${id}`;
}

export type ResourceLike = Pick<Resource, "id" | "titulo" | "descripcion" | "tipo" | "tema" | "nivel" | "meta" | "autor">;

export function toCatalogItem(r: ResourceLike, metas: Record<string, TipoMeta>): CatalogItem {
  const t = tipoMetaFor(r.tipo, metas);
  const { en, es } = splitTitle(r.titulo);
  return {
    id: r.id,
    titulo: r.titulo,
    en,
    es,
    descripcion: r.descripcion ?? "",
    tipo: r.tipo,
    tipoLabel: t.one,
    icon: t.icon,
    art: t.art,
    kind: t.kind,
    tema: r.tema,
    nivel: r.nivel,
    meta: r.meta ?? "",
    autor: r.autor ?? "",
    href: hrefFor(r.id, t.kind),
  };
}

export function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export function firstName(displayName: string | null | undefined) {
  const name = (displayName ?? "").trim().split(/\s+/)[0];
  return name || "";
}

export function initials(displayName: string | null | undefined) {
  const parts = (displayName ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "SF";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toLocaleUpperCase("es");
}
