"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { Kind } from "@/lib/types";

export type ActionResult<T = Record<string, never>> = { error: string } | T;

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function friendlyDbError(error: { code?: string; message: string }, inUseMessage: string) {
  if (error.code === "23503") return inUseMessage;
  if (error.code === "23505") return "Ya existe una categoría con ese nombre.";
  return error.message;
}

// ---------------------------------------------------------------- Temas

export async function createTema(nombre: string): Promise<ActionResult<{ id: string }>> {
  await requireStaff();
  const trimmed = nombre.trim();
  if (!trimmed) return { error: "Escribe un nombre." };

  const admin = createAdminSupabase();
  const { count } = await admin.from("temas").select("*", { count: "exact", head: true });
  const { data, error } = await admin
    .from("temas")
    .insert({ nombre: trimmed, orden: count ?? 0 })
    .select("id")
    .single();

  if (error || !data) {
    return { error: friendlyDbError(error!, "Ya existe un tema con ese nombre.") };
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/biblioteca");
  return { id: data.id };
}

export async function updateTema(id: string, nombre: string): Promise<ActionResult> {
  await requireStaff();
  const trimmed = nombre.trim();
  if (!trimmed) return { error: "Escribe un nombre." };

  const admin = createAdminSupabase();
  const { error } = await admin.from("temas").update({ nombre: trimmed }).eq("id", id);
  if (error) return { error: friendlyDbError(error, "Ya existe un tema con ese nombre.") };

  revalidatePath("/admin/categorias");
  revalidatePath("/biblioteca");
  return {};
}

export async function deleteTema(id: string): Promise<ActionResult> {
  await requireStaff();
  const admin = createAdminSupabase();
  const { error } = await admin.from("temas").delete().eq("id", id);
  if (error) {
    return {
      error: friendlyDbError(
        error,
        "Hay recursos usando este tema — reasígnalos a otro tema antes de eliminarlo.",
      ),
    };
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/biblioteca");
  return {};
}

// ------------------------------------------------------- Tipos de recurso

export async function createTipo(
  label: string,
  kind: Kind,
): Promise<ActionResult<{ key: string }>> {
  await requireStaff();
  const trimmed = label.trim();
  if (!trimmed) return { error: "Escribe un nombre." };

  const admin = createAdminSupabase();
  const baseKey = slugify(trimmed) || "tipo";
  let key = baseKey;
  for (let i = 2; ; i++) {
    const { data: existing } = await admin
      .from("tipos_recurso")
      .select("key")
      .eq("key", key)
      .maybeSingle();
    if (!existing) break;
    key = `${baseKey}_${i}`;
  }

  const { count } = await admin.from("tipos_recurso").select("*", { count: "exact", head: true });
  const { error } = await admin
    .from("tipos_recurso")
    .insert({ key, label: trimmed, kind, orden: count ?? 0 });

  if (error) return { error: friendlyDbError(error, "Ya existe un tipo con ese nombre.") };

  revalidatePath("/admin/categorias");
  revalidatePath("/biblioteca");
  return { key };
}

export async function updateTipo(
  key: string,
  label: string,
  kind: Kind,
): Promise<ActionResult> {
  await requireStaff();
  const trimmed = label.trim();
  if (!trimmed) return { error: "Escribe un nombre." };

  const admin = createAdminSupabase();
  const { error } = await admin
    .from("tipos_recurso")
    .update({ label: trimmed, kind })
    .eq("key", key);
  if (error) return { error: friendlyDbError(error, "Ya existe un tipo con ese nombre.") };

  revalidatePath("/admin/categorias");
  revalidatePath("/biblioteca");
  return {};
}

export async function deleteTipo(key: string): Promise<ActionResult> {
  await requireStaff();
  const admin = createAdminSupabase();
  const { error } = await admin.from("tipos_recurso").delete().eq("key", key);
  if (error) {
    return {
      error: friendlyDbError(
        error,
        "Hay recursos usando este tipo — reasígnalos a otro tipo antes de eliminarlo.",
      ),
    };
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/biblioteca");
  return {};
}
