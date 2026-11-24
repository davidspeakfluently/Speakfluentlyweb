import { getCompletedResourceIds } from "@/lib/queries";
import { firstName } from "@/lib/portal/catalog";
import { getCatalog, getTemaNames, getTipoMetas, getViewer } from "@/lib/portal/server";
import { Library } from "@/components/portal/library/Library";

export default async function BibliotecaPage() {
  const { supabase, user, profile } = await getViewer();
  const [items, temas, { tipos, metas }, completed] = await Promise.all([
    getCatalog(),
    getTemaNames(),
    getTipoMetas(),
    user ? getCompletedResourceIds(supabase, user.id) : Promise.resolve(new Set<string>()),
  ]);

  return (
    <Library
      items={items}
      tipos={tipos.map((t) => metas[t.key])}
      temas={temas}
      doneIds={[...completed]}
      firstName={firstName(profile?.display_name)}
    />
  );
}
