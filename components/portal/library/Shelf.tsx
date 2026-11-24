"use client";

import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import type { CatalogItem, IconName } from "@/lib/portal/catalog";
import { plural } from "@/lib/portal/catalog";
import type { Nivel } from "@/lib/types";
import { Icon, LevelBars } from "@/components/portal/Icon";
import { ResourceCard } from "@/components/portal/ResourceCard";

export type ShelfGroup = { key: string; title: string; icon?: IconName; lvl?: Nivel; items: CatalogItem[] };

const ROW_MAX = 14;

/**
 * Estante deslizable: se arrastra con el mouse o el dedo, las tarjetas de los
 * extremos giran un poco (efecto de profundidad) y una barra fina muestra
 * cuánto falta por ver.
 */
export function Shelf({
  group,
  index,
  hits,
  done,
  onOpen,
  onSeeAll,
  initialLeft,
  registerRow,
}: {
  group: ShelfGroup;
  index: number;
  hits: string[] | null;
  done: Set<string>;
  onOpen: (item: CatalogItem) => void;
  onSeeAll: (key: string) => void;
  initialLeft?: number;
  registerRow: (key: string, el: HTMLDivElement | null) => void;
}) {
  const shelfRef = useRef<HTMLElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const n = group.items.length;
  const more = n - ROW_MAX;

  useLayoutEffect(() => {
    const row = rowRef.current;
    const shelf = shelfRef.current;
    if (!row || !shelf) return;
    registerRow(group.key, row);
    if (initialLeft) row.scrollLeft = initialLeft;
    flow(row, shelf);
    return () => registerRow(group.key, null);
    // Solo al montar: la posición inicial se restaura una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mientras las tarjetas entran deslizándose, el ajuste automático del
  // desplazamiento (scroll-snap) se pausa: si no, el estante queda corrido.
  useEffect(() => {
    const row = rowRef.current;
    const shelf = shelfRef.current;
    if (!row || !shelf || !shelf.closest(".sf-shelves.is-in")) return;
    row.classList.add("is-settling");
    let touched = false;
    const mark = () => {
      touched = true;
    };
    row.addEventListener("pointerdown", mark, { once: true });
    row.addEventListener("wheel", mark, { once: true, passive: true });
    row.addEventListener("touchstart", mark, { once: true, passive: true });
    const t = setTimeout(() => {
      if (!touched) row.scrollLeft = initialLeft ?? 0;
      row.classList.remove("is-settling");
      flow(row, shelf);
    }, 700 + index * 90 + 6 * 50);
    return () => {
      clearTimeout(t);
      row.classList.remove("is-settling");
      row.removeEventListener("pointerdown", mark);
      row.removeEventListener("wheel", mark);
      row.removeEventListener("touchstart", mark);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const row = rowRef.current;
    const shelf = shelfRef.current;
    if (!row || !shelf) return;
    let raf = 0;
    let idle: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          flow(row, shelf);
        });
      shelf.classList.add("is-scrolling");
      clearTimeout(idle);
      idle = setTimeout(() => shelf.classList.remove("is-scrolling"), 800);
    };
    row.addEventListener("scroll", onScroll, { passive: true });

    // Arrastrar con el mouse (en pantallas táctiles el desplazamiento es nativo).
    let sx = 0;
    let sl = 0;
    let active = false;
    let moved = false;
    let pid = 0;
    let swallow = false;
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      active = true;
      moved = false;
      sx = e.clientX;
      sl = row.scrollLeft;
      pid = e.pointerId;
    };
    const move = (e: PointerEvent) => {
      if (!active) return;
      const dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 6) {
        moved = true;
        row.classList.add("is-drag");
        try {
          row.setPointerCapture(pid);
        } catch {
          /* sin captura: el arrastre igual funciona mientras el puntero esté encima */
        }
      }
      if (moved) row.scrollLeft = sl - dx;
    };
    const end = () => {
      if (!active) return;
      active = false;
      if (moved) {
        row.classList.remove("is-drag");
        swallow = true;
        setTimeout(() => {
          swallow = false;
        }, 0);
      }
    };
    // Si fue un arrastre, el clic final no abre la tarjeta.
    const click = (e: MouseEvent) => {
      if (swallow) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const noDrag = (e: DragEvent) => e.preventDefault();
    row.addEventListener("pointerdown", down);
    row.addEventListener("pointermove", move);
    row.addEventListener("pointerup", end);
    row.addEventListener("pointercancel", end);
    row.addEventListener("click", click, true);
    row.addEventListener("dragstart", noDrag);

    const ro = new ResizeObserver(() => flow(row, shelf));
    ro.observe(row);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(idle);
      ro.disconnect();
      row.removeEventListener("scroll", onScroll);
      row.removeEventListener("pointerdown", down);
      row.removeEventListener("pointermove", move);
      row.removeEventListener("pointerup", end);
      row.removeEventListener("pointercancel", end);
      row.removeEventListener("click", click, true);
      row.removeEventListener("dragstart", noDrag);
    };
  }, []);

  function step(dir: number) {
    const row = rowRef.current;
    if (!row) return;
    row.scrollBy({ left: dir * row.clientWidth * 0.8, behavior: reduceMotion() ? "auto" : "smooth" });
  }

  return (
    <section ref={shelfRef} className="sf-shelf" style={{ "--s": index } as CSSProperties} aria-label={group.title}>
      <div className="sf-shelf__head">
        <h2 className="sf-shelf__title">
          <span className="sf-shelf__ic">{group.lvl ? <LevelBars nivel={group.lvl} /> : <Icon name={group.icon ?? "tag"} />}</span>
          {group.title}
        </h2>
        <span className="sf-shelf__sub">{plural(n, "recurso", "recursos")}</span>
        <div className="sf-shelf__nav">
          <button type="button" className="sf-icobtn sf-shelf__prev" onClick={() => step(-1)} aria-label={`Anteriores en ${group.title}`}>
            <Icon name="chev-l" />
          </button>
          <button type="button" className="sf-icobtn sf-shelf__next" onClick={() => step(1)} aria-label={`Siguientes en ${group.title}`}>
            <Icon name="chev-r" />
          </button>
          <button type="button" className="sf-btn-chip" onClick={() => onSeeAll(group.key)}>
            Ver todo <Icon name="arrow" />
          </button>
        </div>
      </div>
      <div ref={rowRef} className="sf-row">
        {group.items.slice(0, ROW_MAX).map((item, k) => (
          <ResourceCard key={item.id} item={item} index={k} done={done.has(item.id)} hits={hits} onOpen={onOpen} />
        ))}
        {more > 0 && (
          <button
            type="button"
            className="sf-more"
            style={{ "--i": ROW_MAX } as CSSProperties}
            onClick={() => onSeeAll(group.key)}
          >
            <span className="sf-more__n">+{more}</span>
            <span>Ver los {n}</span>
            <Icon name="arrow" />
          </button>
        )}
      </div>
      <div className="sf-shelf__track" aria-hidden="true">
        <i />
      </div>
    </section>
  );
}

function reduceMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Profundidad de las tarjetas según qué tan lejos están del centro, y progreso del estante. */
function flow(row: HTMLElement, shelf: HTMLElement) {
  const w = row.clientWidth;
  if (!w) return;
  const sl = row.scrollLeft;
  const cx = sl + w / 2;
  const half = w / 2;
  if (!reduceMotion()) {
    for (const c of Array.from(row.children) as HTMLElement[]) {
      const d = Math.max(-1.5, Math.min(1.5, (c.offsetLeft + c.offsetWidth / 2 - cx) / half));
      const ad = Math.abs(d);
      c.style.setProperty("--ry", `${(d * -6).toFixed(2)}deg`);
      c.style.setProperty("--sc", (1 - Math.max(0, ad - 0.5) * 0.07).toFixed(3));
      c.style.setProperty("--op", (1 - Math.max(0, ad - 1) * 1.2).toFixed(3));
    }
  }
  const max = row.scrollWidth - w;
  shelf.style.setProperty("--prog", max > 0 ? (sl / max).toFixed(3) : "0");
  shelf.style.setProperty("--vis", Math.min(1, w / row.scrollWidth).toFixed(3));
  shelf.classList.toggle("at-start", sl < 6);
  shelf.classList.toggle("at-end", sl > max - 6);
}
