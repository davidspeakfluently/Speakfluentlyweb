import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { updateTeacher } from "@/lib/actions/admin-teachers";

export default async function EditarProfesorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createServerSupabase();
  const { data: teacher } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (!teacher) notFound();

  const boundUpdate = updateTeacher.bind(null, id);

  return (
    <div>
      <AppHeader>
        <Link
          href="/admin/profesores"
          className="self-start rounded border border-accent bg-navy-2 px-4 py-[9px] text-[13px] text-bg hover:bg-accent sm:ml-auto sm:self-auto"
        >
          ← Profesores
        </Link>
      </AppHeader>

      <div className="mx-auto max-w-[480px] p-4 sm:p-6 lg:p-10">
        <div className="mb-1.5 text-[22px] font-bold">{teacher.display_name}</div>
        <div className="mb-6 text-sm text-accent">{teacher.email}</div>

        <form action={boundUpdate} className="flex flex-col gap-[18px]">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs uppercase tracking-[0.04em] text-accent">
              Nombre
            </label>
            <input
              name="display_name"
              type="text"
              defaultValue={teacher.display_name}
              className="rounded border border-border bg-white px-3.5 py-[13px] text-[15px] text-navy outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs uppercase tracking-[0.04em] text-accent">
              Nueva contraseña (opcional)
            </label>
            <input
              name="password"
              type="text"
              minLength={8}
              placeholder="Dejar en blanco para no cambiarla"
              className="rounded border border-border bg-white px-3.5 py-[13px] text-[15px] text-navy outline-none focus:border-accent"
            />
          </div>

          {error && (
            <div className="text-[13px] text-[#c1121f]">
              La contraseña debe tener al menos 8 caracteres.
            </div>
          )}

          <button
            type="submit"
            className="mt-2 rounded bg-accent p-3.5 text-[15px] font-semibold text-white hover:bg-navy"
          >
            Guardar cambios
          </button>
        </form>
      </div>
    </div>
  );
}
