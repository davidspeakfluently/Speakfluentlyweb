import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { deleteResource } from "@/lib/actions/admin-resources";
import { getTiposRecurso } from "@/lib/queries";

export default async function AdminRecursosPage() {
  await requireStaff();
  const supabase = await createServerSupabase();
  const [{ data: resources }, tipos] = await Promise.all([
    supabase.from("resources").select("*").order("created_at", { ascending: false }),
    getTiposRecurso(supabase),
  ]);
  const tipoLabelByKey = Object.fromEntries(tipos.map((t) => [t.key, t.label]));

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
          <div className="text-[22px] font-bold">Recursos</div>
          <Link
            href="/admin/recursos/nuevo"
            className="rounded bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-navy"
          >
            + Nuevo recurso
          </Link>
        </div>

        <div className="overflow-x-auto rounded border border-border bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/60">
                <th className="px-5 py-3 font-mono text-xs uppercase tracking-[0.06em] text-slate">
                  Título
                </th>
                <th className="px-5 py-3 font-mono text-xs uppercase tracking-[0.06em] text-slate">
                  Tipo
                </th>
                <th className="px-5 py-3 font-mono text-xs uppercase tracking-[0.06em] text-slate">
                  Tema
                </th>
                <th className="px-5 py-3 font-mono text-xs uppercase tracking-[0.06em] text-slate">
                  Nivel
                </th>
                <th className="px-5 py-3 font-mono text-xs uppercase tracking-[0.06em] text-slate">
                  Archivo
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {resources?.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-4 font-semibold">{r.titulo}</td>
                  <td className="px-5 py-4 text-accent">{tipoLabelByKey[r.tipo] ?? r.tipo}</td>
                  <td className="px-5 py-4 text-accent">{r.tema}</td>
                  <td className="px-5 py-4 text-accent">{r.nivel}</td>
                  <td className="px-5 py-4">
                    {r.video_url ? (
                      <span className="text-accent">Link</span>
                    ) : r.storage_path ? (
                      <span className="text-accent">Sí</span>
                    ) : (
                      <span className="text-slate">Pendiente</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-4">
                      <Link
                        href={`/admin/recursos/${r.id}/editar`}
                        className="text-accent hover:underline"
                      >
                        Editar
                      </Link>
                      <form action={deleteResource.bind(null, r.id)}>
                        <button type="submit" className="text-[#c1121f] hover:underline">
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {resources?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate">
                    Todavía no hay recursos. Crea el primero.
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
