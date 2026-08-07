import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getProfile } from "@/lib/queries";

async function requireRole(allowed: Array<"admin" | "profesor">) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfile(supabase, user.id);
  if (!profile || !allowed.includes(profile.role as "admin" | "profesor")) {
    redirect("/biblioteca");
  }

  return { user, profile };
}

/** Admin o profesor — gestión de estudiantes y recursos. */
export async function requireStaff() {
  return requireRole(["admin", "profesor"]);
}

/** Solo admin — gestión de cuentas de profesores. */
export async function requireAdmin() {
  return requireRole(["admin"]);
}
