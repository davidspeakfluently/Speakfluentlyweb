import "./portal.css";
import type { ReactNode } from "react";
import type { Viewport } from "next";
import Link from "next/link";
import { LogoWordmark } from "@/components/Logo";
import { Icon } from "@/components/portal/Icon";
import { initials } from "@/lib/portal/catalog";
import { getViewer } from "@/lib/portal/server";
import { signOut } from "@/lib/actions/auth";

export const viewport: Viewport = {
  themeColor: "#00043c",
};

/** Marco del portal de estudiantes: fondo azul noche, luz de fondo y encabezado. */
export default async function PortalLayout({ children }: { children: ReactNode }) {
  const { profile } = await getViewer();
  const staff = profile?.role === "admin" || profile?.role === "profesor";
  const name = profile?.display_name ?? "Estudiante";

  return (
    <div className="sf-portal">
      <div className="sf-aura" aria-hidden="true">
        <i />
        <i />
      </div>
      <header className="sf-head">
        <div className="sf-wrap sf-gut sf-head__in">
          <Link href="/biblioteca" className="sf-brand" aria-label="Speakfluently, ir a la biblioteca">
            <LogoWordmark className="sf-wm" />
          </Link>
          <span className="sf-head__div" aria-hidden="true" />
          <span className="sf-head__label">Recursos</span>
          <div className="sf-user">
            {staff && (
              <Link href="/admin" className="sf-user__admin">
                Admin
              </Link>
            )}
            <span className="sf-avatar" aria-hidden="true">
              {initials(name)}
            </span>
            <span className="sf-user__name">{name}</span>
            <form action={signOut}>
              <button type="submit" className="sf-user__out">
                <Icon name="logout" />
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="sf-body">{children}</main>
    </div>
  );
}
