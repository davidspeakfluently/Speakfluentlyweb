"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import type { ExerciseResultDetail } from "@/lib/types";

export async function submitExerciseAttempt(
  resourceId: string,
  score: number,
  total: number,
  details: ExerciseResultDetail[],
) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("exercise_attempts")
    .insert({ user_id: user.id, resource_id: resourceId, score, total, details });

  // Igual que game-attempts.ts: los cuadernillos son reintentables, así que
  // se necesita upsert-ignore para no violar la PK compuesta de progress en
  // el segundo intento.
  await supabase.from("progress").upsert(
    { user_id: user.id, resource_id: resourceId },
    { onConflict: "user_id,resource_id", ignoreDuplicates: true },
  );

  revalidatePath(`/ejercicios/${resourceId}`);
  revalidatePath("/biblioteca");
}
