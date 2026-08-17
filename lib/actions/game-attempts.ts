"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

export async function submitGameAttempt(resourceId: string, score: number, total: number) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("game_attempts")
    .insert({ user_id: user.id, resource_id: resourceId, score, total });

  // Jugar una vez completa el recurso, igual que un documento/video. Un
  // estudiante puede jugar varias veces, así que a diferencia de progress.ts
  // (que hace delete-luego-insert) acá se necesita upsert para no violar la
  // PK compuesta (user_id, resource_id) en el segundo intento.
  await supabase.from("progress").upsert(
    { user_id: user.id, resource_id: resourceId },
    { onConflict: "user_id,resource_id", ignoreDuplicates: true },
  );

  revalidatePath(`/juegos/${resourceId}`);
  revalidatePath("/biblioteca");
}
