import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { deleteResource } from "@/lib/actions/admin-resources";
import { TIPO_LABELS } from "@/lib/types";

export default async function AdminRecursosPage() {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <AppHeader>
        <Link
          href="/admin"
          className="ml-auto rounded border border-accent bg-navy-2 px-4 py-[9px] text-[13px] text-bg hover:bg-accent"
        >
          ← Admin
        </Link>
      </AppHeader>

      <div className="mx-auto max-w-[1400px] p-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-[22px] font-bold">Recursos</div>
          <Link
            href="/admin/recursos/nuevo"
            className="rounded bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-navy"
          >
            + Nuevo recurso
          </Link>
        </div>

        <div className="overflow-hidden rounded border border-border bg-white">
          <table className="w-full text-left text-sm">
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
                  <td className="px-5 py-4 text-accent">{TIPO_LABELS[r.tipo]}</td>
                  <td className="px-5 py-4 text-accent">{r.tema}</td>
                  <td className="px-5 py-4 text-accent">{r.nivel}</td>
                  <td className="px-5 py-4">
                    {r.storage_path ? (
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
