import "server-only";
import { cache } from "react";
import { createServerSupabase } from "@/lib/supabase/server";
import { getProfile, getTemas, getTiposRecurso } from "@/lib/queries";
import { buildTipoMetas, toCatalogItem, type CatalogItem, type ResourceLike } from "@/lib/portal/catalog";
import type { Nivel } from "@/lib/types";

/**
 * Sesión y catálogos compartidos por el encabezado y las páginas del portal.
 * `cache` evita repetir las mismas consultas dentro de una misma carga.
 */
export const getViewer = cache(async () => {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getProfile(supabase, user.id) : null;
  return { supabase, user, profile };
});

export const getTipoMetas = cache(async () => {
  const { supabase } = await getViewer();
  const tipos = await getTiposRecurso(supabase);
  return { tipos, metas: buildTipoMetas(tipos) };
});

export const getTemaNames = cache(async () => {
  const { supabase } = await getViewer();
  const temas = await getTemas(supabase);
  return temas.map((t) => t.nombre);
});

const CARD_COLUMNS = "id, titulo, descripcion, tipo, tema, nivel, meta, autor";

/** Todo el catálogo, solo con lo que necesitan las tarjetas (sin transcripts). */
export async function getCatalog(): Promise<CatalogItem[]> {
  const { supabase } = await getViewer();
  const [{ metas }, { data, error }] = await Promise.all([
    getTipoMetas(),
    supabase.from("resources").select(CARD_COLUMNS).order("created_at", { ascending: false }),
  ]);
  if (error) throw error;
  return ((data ?? []) as ResourceLike[]).map((r) => toCatalogItem(r, metas));
}

/**
 * Recomendaciones del mismo tema, primero las del mismo nivel. `skip` excluye
 * recursos que ya se muestran en la página (el propio y, por ejemplo, su cartilla).
 */
export async function getRelatedItems(tema: string, nivel: Nivel, skip: string[], limit = 3): Promise<CatalogItem[]> {
  const { supabase } = await getViewer();
  const recent = (sameLevel: boolean) => {
    let q = supabase.from("resources").select(CARD_COLUMNS).eq("tema", tema);
    if (sameLevel) q = q.eq("nivel", nivel);
    return q.order("created_at", { ascending: false }).limit(limit + skip.length);
  };
  const [{ metas }, same, any] = await Promise.all([getTipoMetas(), recent(true), recent(false)]);
  const seen = new Set(skip);
  const out: ResourceLike[] = [];
  for (const r of [...((same.data ?? []) as ResourceLike[]), ...((any.data ?? []) as ResourceLike[])]) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
    if (out.length === limit) break;
  }
  return out.map((r) => toCatalogItem(r, metas));
}
