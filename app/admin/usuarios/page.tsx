import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { deleteStudent } from "@/lib/actions/admin-users";

export default async function AdminUsuariosPage() {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { data: students } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "estudiante")
    .order("created_at", { ascending: false });

  return (
    <div>
      <AppHeader>
        <div className="flex gap-3 self-start sm:ml-auto sm:self-auto">
          <Link
            href="/admin"
            className="rounded border border-accent bg-navy-2 px-4 py-[9px] text-[13px] text-bg hover:bg-accent"
          >
            ← Admin
          </Link>
        </div>
      </AppHeader>

      <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-[22px] font-bold">Estudiantes</div>
          <Link
            href="/admin/usuarios/nuevo"
            className="rounded bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-navy"
          >
            + Nuevo estudiante
          </Link>
        </div>

        <div className="overflow-x-auto rounded border border-border bg-white">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/60">
                <th className="px-5 py-3 font-mono text-xs uppercase tracking-[0.06em] text-slate">
                  Nombre
                </th>
                <th className="px-5 py-3 font-mono text-xs uppercase tracking-[0.06em] text-slate">
                  Email
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {students?.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-4 font-semibold">{s.display_name}</td>
                  <td className="px-5 py-4 text-accent">{s.email}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-4">
                      <Link
                        href={`/admin/usuarios/${s.id}/editar`}
                        className="text-accent hover:underline"
                      >
                        Editar
                      </Link>
                      <form action={deleteStudent.bind(null, s.id)}>
                        <button type="submit" className="text-[#c1121f] hover:underline">
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {students?.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-slate">
                    Todavía no hay estudiantes. Crea el primero.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
