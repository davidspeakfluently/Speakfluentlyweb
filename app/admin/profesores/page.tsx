import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { deleteTeacher } from "@/lib/actions/admin-teachers";

export default async function AdminProfesoresPage() {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { data: teachers } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "profesor")
    .order("created_at", { ascending: false });

  return (
    <div>
      <AppHeader>
        <Link
          href="/admin"
          className="self-start rounded border border-accent bg-navy-2 px-4 py-[9px] text-[13px] text-bg hover:bg-accent sm:ml-auto sm:self-auto"
        >
          ← Admin
        </Link>
      </AppHeader>

      <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-[22px] font-bold">Profesores</div>
          <Link
            href="/admin/profesores/nuevo"
            className="rounded bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-navy"
          >
            + Nuevo profesor
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
              {teachers?.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-4 font-semibold">{t.display_name}</td>
                  <td className="px-5 py-4 text-accent">{t.email}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-4">
                      <Link
                        href={`/admin/profesores/${t.id}/editar`}
                        className="text-accent hover:underline"
                      >
                        Editar
                      </Link>
                      <form action={deleteTeacher.bind(null, t.id)}>
                        <button type="submit" className="text-[#c1121f] hover:underline">
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {teachers?.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-slate">
                    Todavía no hay profesores. Crea el primero.
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
