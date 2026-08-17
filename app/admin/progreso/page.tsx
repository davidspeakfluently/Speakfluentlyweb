import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { getRecentGameAttempts } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";

export default async function ProgresoPage() {
  await requireStaff();
  const supabase = await createServerSupabase();
  const attempts = await getRecentGameAttempts(supabase);

  const studentIds = [...new Set(attempts.map((a) => a.user_id))];
  const resourceIds = [...new Set(attempts.map((a) => a.resource_id))];

  const [{ data: profiles }, { data: resources }] = await Promise.all([
    studentIds.length
      ? supabase.from("profiles").select("id, display_name").in("id", studentIds)
      : Promise.resolve({ data: [] as { id: string; display_name: string }[] }),
    resourceIds.length
      ? supabase.from("resources").select("id, titulo").in("id", resourceIds)
      : Promise.resolve({ data: [] as { id: string; titulo: string }[] }),
  ]);

  const nameById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.display_name]));
  const tituloById = Object.fromEntries((resources ?? []).map((r) => [r.id, r.titulo]));

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
        <div className="mb-6 text-[22px] font-bold">Progreso en juegos</div>

        <div className="overflow-x-auto rounded border border-border bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/60">
                <th className="px-5 py-3 font-mono text-xs uppercase tracking-[0.06em] text-slate">
                  Estudiante
                </th>
                <th className="px-5 py-3 font-mono text-xs uppercase tracking-[0.06em] text-slate">
                  Juego
                </th>
                <th className="px-5 py-3 font-mono text-xs uppercase tracking-[0.06em] text-slate">
                  Puntaje
                </th>
                <th className="px-5 py-3 font-mono text-xs uppercase tracking-[0.06em] text-slate">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-4 font-semibold">
                    {nameById[a.user_id] ?? "Estudiante"}
                  </td>
                  <td className="px-5 py-4 text-accent">
                    {tituloById[a.resource_id] ?? "Recurso eliminado"}
                  </td>
                  <td className="px-5 py-4 text-accent">
                    {a.score}/{a.total}
                  </td>
                  <td className="px-5 py-4 text-slate">
                    {new Date(a.completed_at).toLocaleDateString("es", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
              {attempts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate">
                    Todavía no hay intentos de juegos registrados.
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
