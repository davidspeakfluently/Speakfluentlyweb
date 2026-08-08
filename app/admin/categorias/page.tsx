import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getTemas, getTiposRecurso } from "@/lib/queries";
import { AppHeader } from "@/components/AppHeader";
import { TemasManager, TiposManager } from "@/components/admin/CategoriasManager";

export default async function AdminCategoriasPage() {
  await requireStaff();
  const supabase = await createServerSupabase();
  const [temas, tipos] = await Promise.all([getTemas(supabase), getTiposRecurso(supabase)]);

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
        <div className="mb-6 text-[22px] font-bold">Categorías</div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TemasManager temas={temas} />
          <TiposManager tipos={tipos} />
        </div>
      </div>
    </div>
  );
}
