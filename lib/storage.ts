import "server-only";
import { createAdminSupabase } from "@/lib/supabase/admin";

const BUCKET = "recursos";

export async function getSignedFileUrl(path: string, expiresIn = 3600) {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) return null;
  return data.signedUrl;
}

export async function uploadResourceFile(path: string, file: File) {
  const supabase = createAdminSupabase();
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });
  if (error) throw error;
}

export async function deleteResourceFile(path: string) {
  const supabase = createAdminSupabase();
  await supabase.storage.from(BUCKET).remove([path]);
}
