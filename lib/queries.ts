import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, GameAttempt, GameWord, Profile, Resource, Tema, TipoRecurso } from "@/lib/types";

type DB = SupabaseClient<Database>;

export async function getProfile(supabase: DB, userId: string): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data;
}

export async function getTemas(supabase: DB): Promise<Tema[]> {
  const { data } = await supabase.from("temas").select("*").order("orden");
  return data ?? [];
}

export async function getTiposRecurso(supabase: DB): Promise<TipoRecurso[]> {
  const { data } = await supabase.from("tipos_recurso").select("*").order("orden");
  return data ?? [];
}

export interface ResourceFilters {
  nivel?: string;
  tema?: string;
  tipo?: string; // key de tipos_recurso, ej. "guia"
  q?: string;
}

export async function getFilteredResources(
  supabase: DB,
  filters: ResourceFilters,
): Promise<Resource[]> {
  let query = supabase.from("resources").select("*").order("created_at", { ascending: false });

  if (filters.nivel && filters.nivel !== "Todos") {
    query = query.eq("nivel", filters.nivel as Resource["nivel"]);
  }
  if (filters.tema && filters.tema !== "Todos") {
    query = query.eq("tema", filters.tema);
  }
  if (filters.tipo && filters.tipo !== "Todos") {
    query = query.eq("tipo", filters.tipo);
  }
  if (filters.q?.trim()) {
    query = query.ilike("titulo", `%${filters.q.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getResource(supabase: DB, id: string): Promise<Resource | null> {
  const { data } = await supabase.from("resources").select("*").eq("id", id).single();
  return data;
}

export async function getRelatedResources(
  supabase: DB,
  tema: string,
  excludeId: string,
): Promise<Resource[]> {
  const { data } = await supabase
    .from("resources")
    .select("*")
    .eq("tema", tema)
    .neq("id", excludeId)
    .order("created_at", { ascending: false })
    .limit(3);
  return data ?? [];
}

export async function isCompleted(
  supabase: DB,
  userId: string,
  resourceId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("progress")
    .select("resource_id")
    .eq("user_id", userId)
    .eq("resource_id", resourceId)
    .maybeSingle();
  return !!data;
}

export async function getCompletedResourceIds(
  supabase: DB,
  userId: string,
): Promise<Set<string>> {
  const { data } = await supabase.from("progress").select("resource_id").eq("user_id", userId);
  return new Set((data ?? []).map((row) => row.resource_id));
}

export async function getGameWords(supabase: DB, resourceId: string): Promise<GameWord[]> {
  const { data } = await supabase
    .from("game_words")
    .select("*")
    .eq("resource_id", resourceId)
    .order("orden");
  return data ?? [];
}

/** Mejor puntaje del estudiante en este juego, si ya lo jugó. */
export async function getBestGameAttempt(
  supabase: DB,
  userId: string,
  resourceId: string,
): Promise<GameAttempt | null> {
  const { data } = await supabase
    .from("game_attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("resource_id", resourceId)
    .order("score", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

/** Intentos recientes de cualquier estudiante, para la vista de staff. */
export async function getRecentGameAttempts(
  supabase: DB,
  limit = 100,
): Promise<GameAttempt[]> {
  const { data } = await supabase
    .from("game_attempts")
    .select("*")
    .order("completed_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
