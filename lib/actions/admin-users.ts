"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function createStudent(formData: FormData) {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !displayName || password.length < 8) {
    redirect("/admin/usuarios/nuevo?error=1");
  }

  const admin = createAdminSupabase();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName, role: "estudiante" },
  });

  if (error) {
    redirect(`/admin/usuarios/nuevo?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function updateStudent(userId: string, formData: FormData) {
  await requireAdmin();

  const displayName = String(formData.get("display_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const admin = createAdminSupabase();

  if (displayName) {
    await admin.from("profiles").update({ display_name: displayName }).eq("id", userId);
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: { display_name: displayName },
    });
  }

  if (password) {
    if (password.length < 8) {
      redirect(`/admin/usuarios/${userId}/editar?error=1`);
    }
    await admin.auth.admin.updateUserById(userId, { password });
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function deleteStudent(userId: string) {
  await requireAdmin();
  const admin = createAdminSupabase();
  await admin.auth.admin.deleteUser(userId);
  revalidatePath("/admin/usuarios");
}
