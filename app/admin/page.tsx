import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";

export default async function AdminPage() {
  const { profile } = await requireStaff();
  const supabase = await createServerSupabase();

  const [{ count: studentCount }, { count: resourceCount }, { count: teacherCount }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "estudiante"),
      supabase.from("resources").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "profesor"),
    ]);

  return (
    <div>
      <AppHeader>
        <Link
          href="/biblioteca"
          className="self-start rounded border border-accent bg-navy-2 px-4 py-[9px] text-[13px] text-bg hover:bg-accent sm:ml-auto sm:self-auto"
        >
          ← Volver a la biblioteca
        </Link>
      </AppHeader>

      <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-10">
        <div className="mb-8 text-[22px] font-bold">Administración</div>

        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
          <Link
            href="/admin/usuarios"
            className="rounded border border-border bg-white p-6 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,4,60,0.12)]"
          >
            <div className="font-mono text-xs uppercase tracking-[0.06em] text-slate">
              Estudiantes
            </div>
            <div className="mt-2 text-2xl font-bold">{studentCount ?? 0}</div>
            <div className="mt-2 text-sm text-accent">
              Crear, editar y resetear contraseñas de estudiantes.
            </div>
          </Link>

          <Link
            href="/admin/recursos"
            className="rounded border border-border bg-white p-6 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,4,60,0.12)]"
          >
            <div className="font-mono text-xs uppercase tracking-[0.06em] text-slate">
              Recursos
            </div>
            <div className="mt-2 text-2xl font-bold">{resourceCount ?? 0}</div>
            <div className="mt-2 text-sm text-accent">
              Crear, editar, subir archivos y eliminar recursos.
            </div>
          </Link>

          {profile.role === "admin" && (
            <Link
              href="/admin/profesores"
              className="rounded border border-border bg-white p-6 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,4,60,0.12)]"
            >
              <div className="font-mono text-xs uppercase tracking-[0.06em] text-slate">
                Profesores
              </div>
              <div className="mt-2 text-2xl font-bold">{teacherCount ?? 0}</div>
              <div className="mt-2 text-sm text-accent">
                Crear y gestionar cuentas de profesores.
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
