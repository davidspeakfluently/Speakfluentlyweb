"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";

export type ActionResult<T = Record<string, never>> = { error: string } | T;

/** Reemplaza toda la lista de palabras de un recurso de tipo juego. */
export async function setGameWords(
  resourceId: string,
  words: { en: string; es: string }[],
): Promise<ActionResult> {
  await requireStaff();

  const cleaned = words
    .map((w) => ({ en: w.en.trim(), es: w.es.trim() }))
    .filter((w) => w.en && w.es);
  if (cleaned.length === 0) return { error: "Agrega al menos una palabra." };

  const admin = createAdminSupabase();

  const { error: deleteError } = await admin
    .from("game_words")
    .delete()
    .eq("resource_id", resourceId);
  if (deleteError) return { error: deleteError.message };

  const { error: insertError } = await admin.from("game_words").insert(
    cleaned.map((w, i) => ({ resource_id: resourceId, en: w.en, es: w.es, orden: i })),
  );
  if (insertError) return { error: insertError.message };

  revalidatePath(`/admin/recursos/${resourceId}/palabras`);
  revalidatePath(`/juegos/${resourceId}`);
  return {};
}
