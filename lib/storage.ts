import "server-only";
import { createAdminSupabase } from "@/lib/supabase/admin";

const BUCKET = "recursos";

export async function getSignedFileUrl(path: string, expiresIn = 3600) {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) return null;
  return data.signedUrl;
}

/**
 * URL + token de un solo uso para que el navegador suba el archivo
 * directamente a Storage (bypass del límite de body de Server Actions).
 */
export async function createUploadTarget(path: string) {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) return null;
  return { path: data.path, token: data.token };
}

export async function deleteResourceFile(path: string) {
  const supabase = createAdminSupabase();
  await supabase.storage.from(BUCKET).remove([path]);
}
