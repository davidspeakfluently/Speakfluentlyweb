"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

export async function toggleCompleted(resourceId: string) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("progress")
    .select("resource_id")
    .eq("user_id", user.id)
    .eq("resource_id", resourceId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("progress")
      .delete()
      .eq("user_id", user.id)
      .eq("resource_id", resourceId);
  } else {
    await supabase.from("progress").insert({ user_id: user.id, resource_id: resourceId });
  }

  revalidatePath(`/recursos/${resourceId}`);
}
