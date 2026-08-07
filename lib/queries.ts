import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Profile, Resource, Tipo } from "@/lib/types";
import { TIPO_LABELS } from "@/lib/types";

type DB = SupabaseClient<Database>;

export async function getProfile(supabase: DB, userId: string): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data;
}

export interface ResourceFilters {
  nivel?: string;
  tema?: string;
  tipo?: string; // TIPO_LABEL, e.g. "GUÍA"
  q?: string;
}

function tipoKeyFromLabel(label: string): Tipo | null {
  const entry = Object.entries(TIPO_LABELS).find(([, v]) => v === label);
  return (entry?.[0] as Tipo) ?? null;
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
    const key = tipoKeyFromLabel(filters.tipo);
    if (key) query = query.eq("tipo", key);
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
