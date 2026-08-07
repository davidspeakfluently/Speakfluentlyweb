import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";
import { createTeacher } from "@/lib/actions/admin-teachers";

export default async function NuevoProfesorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;

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
        <div className="mb-6 text-[22px] font-bold">Nuevo profesor</div>

        <form action={createTeacher} className="flex flex-col gap-[18px]">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs uppercase tracking-[0.04em] text-accent">
              Nombre
            </label>
            <input
              name="display_name"
              type="text"
              required
              className="rounded border border-border bg-white px-3.5 py-[13px] text-[15px] text-navy outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs uppercase tracking-[0.04em] text-accent">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="profesor@correo.com"
              className="rounded border border-border bg-white px-3.5 py-[13px] text-[15px] text-navy outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs uppercase tracking-[0.04em] text-accent">
              Contraseña inicial
            </label>
            <input
              name="password"
              type="text"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="rounded border border-border bg-white px-3.5 py-[13px] text-[15px] text-navy outline-none focus:border-accent"
            />
          </div>

          {error && (
            <div className="text-[13px] text-[#c1121f]">
              No se pudo crear el profesor. Revisa los datos e intenta de nuevo.
            </div>
          )}

          <button
            type="submit"
            className="mt-2 rounded bg-accent p-3.5 text-[15px] font-semibold text-white hover:bg-navy"
          >
            Crear profesor
          </button>
        </form>
      </div>
    </div>
  );
}
