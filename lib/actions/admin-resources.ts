"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createUploadTarget, deleteResourceFile } from "@/lib/storage";
import type { Nivel } from "@/lib/types";

export interface ResourceFieldsInput {
  titulo: string;
  descripcion: string;
  tipo: string;
  tema: string;
  nivel: Nivel;
  autor: string;
  meta: string;
  video_url: string | null;
}

export type ActionResult<T = Record<string, never>> = { error: string } | T;

function validate(fields: ResourceFieldsInput) {
  return Boolean(
    fields.titulo && fields.descripcion && fields.tipo && fields.tema && fields.nivel,
  );
}

/** Crea el recurso (solo metadatos, sin archivo) y devuelve su id. */
export async function createResourceRecord(
  fields: ResourceFieldsInput,
): Promise<ActionResult<{ id: string }>> {
  const { user } = await requireStaff();
  if (!validate(fields)) return { error: "Faltan campos obligatorios." };

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("resources")
    .insert({ ...fields, created_by: user.id })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "No se pudo crear el recurso." };

  revalidatePath("/admin/recursos");
  revalidatePath("/biblioteca");
  return { id: data.id };
}

export async function updateResourceRecord(
  id: string,
  fields: ResourceFieldsInput,
): Promise<ActionResult> {
  await requireStaff();
  if (!validate(fields)) return { error: "Faltan campos obligatorios." };

  const admin = createAdminSupabase();
  const { error } = await admin.from("resources").update(fields).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/recursos");
  revalidatePath("/biblioteca");
  revalidatePath(`/recursos/${id}`);
  return {};
}

/**
 * Genera una URL firmada de subida: el archivo va del navegador directo a
 * Supabase Storage, sin pasar por la función serverless (que en Vercel
 * limita el body a unos pocos MB — insuficiente para audio/video reales).
 */
export async function getResourceUploadTarget(
  resourceId: string,
  fileName: string,
): Promise<ActionResult<{ path: string; token: string }>> {
  await requireStaff();
  const path = `${resourceId}/${crypto.randomUUID()}-${fileName}`;
  const target = await createUploadTarget(path);
  if (!target) return { error: "No se pudo preparar la subida." };
  return target;
}

/** Tras subir el archivo directo a Storage, guarda la ruta final en el recurso. */
export async function finalizeResourceFile(
  resourceId: string,
  path: string,
  previousPath?: string | null,
): Promise<ActionResult> {
  await requireStaff();
  if (previousPath) await deleteResourceFile(previousPath);

  const admin = createAdminSupabase();
  const { error } = await admin
    .from("resources")
    .update({ storage_path: path })
    .eq("id", resourceId);

  if (error) return { error: error.message };

  revalidatePath("/admin/recursos");
  revalidatePath("/biblioteca");
  revalidatePath(`/recursos/${resourceId}`);
  return {};
}

export async function removeResourceFile(
  resourceId: string,
  currentPath: string,
): Promise<ActionResult> {
  await requireStaff();
  await deleteResourceFile(currentPath);

  const admin = createAdminSupabase();
  const { error } = await admin
    .from("resources")
    .update({ storage_path: null })
    .eq("id", resourceId);

  if (error) return { error: error.message };

  revalidatePath("/admin/recursos");
  revalidatePath("/biblioteca");
  revalidatePath(`/recursos/${resourceId}`);
  return {};
}

export async function deleteResource(id: string) {
  await requireStaff();
  const admin = createAdminSupabase();
  const { data: current } = await admin
    .from("resources")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (current?.storage_path) await deleteResourceFile(current.storage_path);
  await admin.from("resources").delete().eq("id", id);

  revalidatePath("/admin/recursos");
  revalidatePath("/biblioteca");
}
