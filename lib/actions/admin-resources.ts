"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { deleteResourceFile, uploadResourceFile } from "@/lib/storage";
import type { Nivel, Tipo } from "@/lib/types";

function readFields(formData: FormData) {
  return {
    titulo: String(formData.get("titulo") ?? "").trim(),
    descripcion: String(formData.get("descripcion") ?? "").trim(),
    tipo: String(formData.get("tipo") ?? "") as Tipo,
    tema: String(formData.get("tema") ?? "").trim(),
    nivel: String(formData.get("nivel") ?? "") as Nivel,
    autor: String(formData.get("autor") ?? "").trim(),
    meta: String(formData.get("meta") ?? "").trim(),
  };
}

export async function createResource(formData: FormData) {
  const { user } = await requireAdmin();
  const fields = readFields(formData);

  if (!fields.titulo || !fields.descripcion || !fields.tipo || !fields.tema || !fields.nivel) {
    redirect("/admin/recursos/nuevo?error=1");
  }

  const admin = createAdminSupabase();
  const { data: resource, error } = await admin
    .from("resources")
    .insert({ ...fields, created_by: user.id })
    .select()
    .single();

  if (error || !resource) {
    redirect("/admin/recursos/nuevo?error=1");
  }

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const path = `${resource.id}/${crypto.randomUUID()}-${file.name}`;
    await uploadResourceFile(path, file);
    await admin.from("resources").update({ storage_path: path }).eq("id", resource.id);
  }

  revalidatePath("/admin/recursos");
  revalidatePath("/biblioteca");
  redirect("/admin/recursos");
}

export async function updateResource(id: string, formData: FormData) {
  await requireAdmin();
  const fields = readFields(formData);

  if (!fields.titulo || !fields.descripcion || !fields.tipo || !fields.tema || !fields.nivel) {
    redirect(`/admin/recursos/${id}/editar?error=1`);
  }

  const admin = createAdminSupabase();
  const { data: current } = await admin
    .from("resources")
    .select("storage_path")
    .eq("id", id)
    .single();

  await admin.from("resources").update(fields).eq("id", id);

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    if (current?.storage_path) await deleteResourceFile(current.storage_path);
    const path = `${id}/${crypto.randomUUID()}-${file.name}`;
    await uploadResourceFile(path, file);
    await admin.from("resources").update({ storage_path: path }).eq("id", id);
  } else if (formData.get("remove_file") === "on" && current?.storage_path) {
    await deleteResourceFile(current.storage_path);
    await admin.from("resources").update({ storage_path: null }).eq("id", id);
  }

  revalidatePath("/admin/recursos");
  revalidatePath("/biblioteca");
  revalidatePath(`/recursos/${id}`);
  redirect("/admin/recursos");
}

export async function deleteResource(id: string) {
  await requireAdmin();
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
