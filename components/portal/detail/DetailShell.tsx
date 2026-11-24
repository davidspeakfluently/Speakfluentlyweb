import type { CSSProperties, ReactNode } from "react";
import type { CatalogItem } from "@/lib/portal/catalog";
import { Icon, LevelBars } from "@/components/portal/Icon";
import { MiniCard } from "@/components/portal/ResourceCard";
import { BackToLibrary } from "@/components/portal/detail/BackToLibrary";

/** Estructura común del detalle: encabezado, escenario del recurso y recomendaciones al lado. */
export function DetailShell({
  item,
  ready,
  byExtra,
  aside,
  children,
}: {
  item: CatalogItem;
  ready: boolean;
  byExtra?: ReactNode;
  aside: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={"sf-wrap sf-gut sf-detail" + (ready ? " is-ready" : "")}>
      <BackToLibrary />
      <div className="sf-detail__grid">
        <article className="sf-detail__main">
          <div className="sf-badges">
            <span className="sf-badge sf-badge--type">
              <Icon name={item.icon} />
              {item.tipoLabel}
            </span>
            <span className="sf-badge">
              <LevelBars nivel={item.nivel} />
              {item.nivel}
            </span>
            <span className="sf-badge">{item.tema}</span>
          </div>
          <h1 className="sf-detail__title">{item.en}</h1>
          {item.es ? <p className="sf-detail__sub">{item.es}</p> : null}
          {item.descripcion ? <p className="sf-detail__desc">{item.descripcion}</p> : null}
          <p className="sf-detail__by">
            {item.autor ? `Por ${item.autor}` : null}
            {item.autor && item.meta ? " · " : null}
            {item.meta}
            {byExtra}
          </p>
          {children}
        </article>
        <aside className="sf-detail__aside">{aside}</aside>
      </div>
    </div>
  );
}

export function RelatedAside({
  items,
  done,
  lead,
}: {
  items: CatalogItem[];
  done: Set<string>;
  lead?: ReactNode;
}) {
  return (
    <>
      {lead}
      {items.length > 0 && (
        <div className="sf-aside__block">
          <p className="sf-aside__label">También te puede servir</p>
          <div className="sf-minis">
            {items.map((r, k) => (
              <MiniCard key={r.id} item={r} done={done.has(r.id)} index={k} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export function AsideSkeleton() {
  return (
    <div className="sf-aside__block" aria-hidden="true">
      <p className="sf-aside__label">También te puede servir</p>
      <div className="sf-minis">
        {[0, 1, 2].map((k) => (
          <div key={k} className="sf-mini sf-mini--sk" style={{ "--d": k } as CSSProperties}>
            <div className="sf-mini__cv sf-sk" />
            <div className="sf-mini__body">
              <span className="sf-sk sf-skl" style={{ width: "80%" }} />
              <span className="sf-sk sf-skl" style={{ width: "55%" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StateLine({ ready, wait, ok }: { ready: boolean; wait: string; ok: string }) {
  return (
    <p className="sf-state" aria-live="polite">
      {ready ? (
        <span className="sf-state__ok">
          <Icon name="check" />
          {ok}
        </span>
      ) : (
        <span className="sf-state__wait">
          <span className="sf-spin" />
          {wait}
        </span>
      )}
    </p>
  );
}

/** Zona clara donde viven los ejercicios, el transcript y los juegos (como hojas sobre el escritorio). */
export function PaperSection({ id, kicker, title, children }: { id?: string; kicker: string; title?: string; children: ReactNode }) {
  return (
    <section id={id} className="sf-paper">
      <div className="sf-paper__head">
        <p className="sf-paper__k">{kicker}</p>
        {title ? <h2 className="sf-paper__t">{title}</h2> : null}
      </div>
      {children}
    </section>
  );
}
