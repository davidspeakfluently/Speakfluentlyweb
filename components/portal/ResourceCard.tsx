import Link from "next/link";
import type { CSSProperties } from "react";
import type { CatalogItem } from "@/lib/portal/catalog";
import { Cover, Hi, Morph } from "@/components/portal/Cover";
import { Icon, LevelBars } from "@/components/portal/Icon";
import { PendingLine } from "@/components/portal/PendingLine";

/** Tarjeta de la biblioteca: portada ilustrada + nivel, tema y subtítulo. */
export function ResourceCard({
  item,
  done = false,
  hits,
  index = 0,
  onOpen,
}: {
  item: CatalogItem;
  done?: boolean;
  hits?: string[] | null;
  index?: number;
  onOpen?: (item: CatalogItem) => void;
}) {
  const line = item.es || item.descripcion;
  return (
    <Link
      href={item.href}
      className="sf-card"
      style={{ "--i": index } as CSSProperties}
      onClick={onOpen ? () => onOpen(item) : undefined}
      draggable={false}
    >
      <Morph id={item.id}>
        <Cover item={item} mode="card" done={done} title={<Hi text={item.en} hits={hits} />} />
      </Morph>
      <div className="sf-card__body">
        <div className="sf-kicker">
          <LevelBars nivel={item.nivel} />
          <span>{item.nivel}</span>
          <span className="sf-dot" />
          <span>{item.tema}</span>
        </div>
        <p className="sf-card__title">
          <Hi text={line} hits={hits} />
        </p>
        <div className="sf-card__foot">
          <span>{item.meta}</span>
          <span className="sf-go">
            Abrir <Icon name="arrow" />
          </span>
        </div>
      </div>
      <PendingLine />
    </Link>
  );
}

/** Miniatura para "También te puede servir". */
export function MiniCard({ item, done = false, index = 0 }: { item: CatalogItem; done?: boolean; index?: number }) {
  return (
    <Link href={item.href} className="sf-mini" style={{ "--d": index } as CSSProperties}>
      <Morph id={item.id}>
        <div className="sf-mini__cv">
          <Cover item={item} mode="thumb" />
        </div>
      </Morph>
      <div className="sf-mini__body">
        <p className="sf-mini__t">{item.en}</p>
        <p className="sf-mini__m">
          {item.tipoLabel} · {item.nivel}
          {item.meta ? ` · ${item.meta}` : ""}
        </p>
      </div>
      {done && (
        <span className="sf-mini__done" title="Completado">
          <Icon name="check" />
          <span className="sf-sr">Completado</span>
        </span>
      )}
      <PendingLine />
    </Link>
  );
}
