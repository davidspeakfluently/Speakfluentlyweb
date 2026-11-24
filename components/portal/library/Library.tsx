"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { useSearchParams } from "next/navigation";
import type { Nivel } from "@/lib/types";
import {
  NIVEL_ORDER,
  SHELF_ORDER,
  TEMA_ICON,
  plural,
  type CatalogItem,
  type TipoMeta,
} from "@/lib/portal/catalog";
import { createSearch, type SearchResult } from "@/lib/portal/search";
import {
  applyDoneOverrides,
  clearLibraryScroll,
  landFlight,
  markIntroSeen,
  markOpenedFromLibrary,
  peekLibraryScroll,
  rememberItems,
  saveLibraryScroll,
  seenIntro,
  setLibraryHref,
} from "@/lib/portal/client-store";
import { Icon, LevelBars } from "@/components/portal/Icon";
import { ResourceCard } from "@/components/portal/ResourceCard";
import { SearchBox } from "@/components/portal/library/SearchBox";
import { Shelf, type ShelfGroup } from "@/components/portal/library/Shelf";

const PAGE = 24;
const HINTS = ["present perfect", "condicionales", "viajes", "phrasal verbs", "pasado simple", "restaurante", "used to", "pronunciación"];

type View = { q: string; tema: string; nivel: string; ver: string };
type Filter = { q: string; tema: string; nivel: string };

const noopSubscribe = () => () => {};

export function Library({
  items,
  tipos,
  temas,
  doneIds,
  firstName,
}: {
  items: CatalogItem[];
  tipos: TipoMeta[];
  temas: string[];
  doneIds: string[];
  firstName: string;
}) {
  const sp = useSearchParams();

  /* ---------- Datos derivados ---------- */
  const temasOn = useMemo(() => {
    const inUse = new Set(items.map((r) => r.tema));
    const ordered = temas.filter((t) => inUse.has(t));
    inUse.forEach((t) => {
      if (!ordered.includes(t)) ordered.push(t);
    });
    return ordered;
  }, [items, temas]);
  const tipoByKey = useMemo(() => new Map(tipos.map((t) => [t.key, t])), [tipos]);
  const search = useMemo(() => createSearch(items), [items]);
  const [done] = useState(() => applyDoneOverrides(new Set(doneIds)));

  useEffect(() => rememberItems(items), [items]);

  const filterBy = useCallback(
    (f: Filter) => {
      const s = f.q ? search(f.q) : null;
      const out = items.filter(
        (r) => (!f.nivel || r.nivel === f.nivel) && (!f.tema || r.tema === f.tema) && (!s || s.rank.has(r.id)),
      );
      if (s) out.sort((a, b) => s.rank.get(a.id)! - s.rank.get(b.id)!);
      return out;
    },
    [items, search],
  );

  const hints = useMemo(() => HINTS.filter((h) => filterBy({ q: h, tema: "", nivel: "" }).length > 0), [filterBy]);

  /* ---------- Estado (se refleja en la dirección para poder volver) ---------- */
  const [view, setView] = useState<View>(() => {
    const tema = sp.get("tema") ?? "";
    const nivel = sp.get("nivel") ?? "";
    const ver = sp.get("ver") ?? "";
    return {
      q: (sp.get("q") ?? "").trim(),
      tema: temasOn.includes(tema) ? tema : "",
      nivel: (NIVEL_ORDER as string[]).includes(nivel) ? nivel : "",
      ver: /^(tp|lv):/.test(ver) ? ver : "",
    };
  });
  const [text, setText] = useState(view.q);
  const [shown, setShown] = useState(PAGE);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams();
    if (view.q) p.set("q", view.q);
    if (view.tema) p.set("tema", view.tema);
    if (view.nivel) p.set("nivel", view.nivel);
    if (view.ver) p.set("ver", view.ver);
    const qs = p.toString();
    const url = qs ? `/biblioteca?${qs}` : "/biblioteca";
    setLibraryHref(url);
    if (window.location.pathname + window.location.search !== url) window.history.replaceState(null, "", url);
  }, [view]);

  const update = useCallback((patch: Partial<View>) => {
    setAnimate(true);
    setShown(PAGE);
    setView((v) => ({ ...v, ...patch }));
  }, []);

  // La búsqueda se aplica cuando el estudiante deja de escribir un momento.
  useEffect(() => {
    const q = text.trim();
    if (q === view.q) return;
    const t = setTimeout(() => update({ q, ver: "" }), 220);
    return () => clearTimeout(t);
  }, [text, view.q, update]);

  /* ---------- Resultados ---------- */
  const s: SearchResult | null = view.q ? search(view.q) : null;
  const hits = s ? s.hits : null;
  const res = useMemo(() => filterBy(view), [filterBy, view]);

  const shelfTitle = useCallback((key: string) => tipoByKey.get(key)?.shelf ?? key, [tipoByKey]);
  const groups = useMemo((): ShelfGroup[] | null => {
    const byType = () => {
      const present = new Set(res.map((r) => r.tipo));
      const keys = view.q
        ? [...new Set(res.map((r) => r.tipo))]
        : [
            ...SHELF_ORDER.filter((k) => present.has(k)),
            ...tipos.filter((t) => present.has(t.key) && !SHELF_ORDER.includes(t.key)).map((t) => t.key),
            ...[...present].filter((k) => !tipoByKey.has(k) && !SHELF_ORDER.includes(k)),
          ];
      return keys.map((k) => ({
        key: `tp:${k}`,
        title: shelfTitle(k),
        icon: tipoByKey.get(k)?.icon ?? "tag",
        items: res.filter((r) => r.tipo === k),
      }));
    };
    if (view.q) return res.length > 8 ? byType() : null;
    if (!view.tema) return byType();
    if (new Set(res.map((r) => r.tipo)).size > 1) return byType();
    if (!view.nivel)
      return NIVEL_ORDER.map((n) => ({ key: `lv:${n}`, title: n, lvl: n, items: res.filter((r) => r.nivel === n) })).filter(
        (g) => g.items.length,
      );
    return null;
  }, [res, view.q, view.tema, view.nivel, tipos, tipoByKey, shelfTitle]);

  const groupItems = useCallback(
    (key: string) => {
      const [k, val] = key.split(":");
      return res.filter((r) => (k === "tp" ? r.tipo === val : r.nivel === val));
    },
    [res],
  );
  const groupTitle = (key: string) => {
    const [k, val] = key.split(":");
    return k === "tp" ? shelfTitle(val) : val;
  };
  const verItems = view.ver ? groupItems(view.ver) : [];
  const ver = verItems.length ? view.ver : "";

  /* ---------- Volver al mismo punto al regresar de un recurso ---------- */
  const [saved] = useState(() =>
    typeof window === "undefined" ? null : peekLibraryScroll(window.location.pathname + window.location.search),
  );
  useLayoutEffect(() => {
    if (saved) window.scrollTo(0, saved.y);
    clearLibraryScroll();
    // Si venimos del botón "Volver", la portada aterriza en su tarjeta (si está a la vista).
    landFlight((id) => {
      const el = document.querySelector<HTMLElement>(`.sf-main [data-morph="${CSS.escape(id)}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const row = el.closest(".sf-row")?.getBoundingClientRect();
      const inRow = !row || (r.right > row.left + 24 && r.left < row.right - 24);
      return inRow && r.bottom > 0 && r.top < window.innerHeight ? el : null;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const rows = useRef(new Map<string, HTMLDivElement>());
  const registerRow = useCallback((key: string, el: HTMLDivElement | null) => {
    if (el) rows.current.set(key, el);
    else rows.current.delete(key);
  }, []);
  const onOpen = useCallback((item: CatalogItem) => {
    const left: Record<string, number> = {};
    rows.current.forEach((el, key) => {
      left[key] = el.scrollLeft;
    });
    saveLibraryScroll(window.location.pathname + window.location.search, left);
    markOpenedFromLibrary(item.href);
  }, []);

  /* ---------- Bienvenida animada (solo la primera vez de la sesión) ---------- */
  const clientNav = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const [intro] = useState(() => clientNav && !seenIntro());
  useEffect(() => markIntroSeen(), []);

  /* ---------- Sugerencia que se escribe sola dentro del buscador ---------- */
  const hintSpans = useRef(new Set<HTMLSpanElement>());
  const tw = useRef({ i: 0, ch: 0, dir: 1, text: "" });
  const hintRef = useCallback((el: HTMLSpanElement | null) => {
    if (!el) return;
    el.textContent = tw.current.text;
    hintSpans.current.add(el);
    return () => {
      hintSpans.current.delete(el);
    };
  }, []);
  useEffect(() => {
    if (!hints.length) return;
    const write = (t: string) => {
      tw.current.text = t;
      hintSpans.current.forEach((el) => {
        el.textContent = t;
      });
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      write(hints.slice(0, 3).join(", "));
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const stepType = () => {
      const st = tw.current;
      const word = hints[st.i % hints.length];
      let delay = st.dir > 0 ? 75 : 30;
      st.ch += st.dir;
      if (st.ch >= word.length) {
        st.ch = word.length;
        st.dir = -1;
        delay = 1800;
      } else if (st.ch <= 0) {
        st.ch = 0;
        st.dir = 1;
        st.i++;
        delay = 380;
      }
      write(word.slice(0, st.ch));
      timer = setTimeout(stepType, delay);
    };
    timer = setTimeout(stepType, intro ? 1100 : 400);
    return () => clearTimeout(timer);
  }, [hints, intro]);

  const acceptHint = () => {
    const h = hints[tw.current.i % Math.max(1, hints.length)];
    if (!h) return;
    setText(h);
    update({ q: h, ver: "" });
  };
  const clearSearch = () => {
    setText("");
    update({ q: "", ver: "" });
  };

  /* ---------- Barra fija: buscador compacto cuando el grande queda arriba ---------- */
  const heroSearch = useRef<HTMLDivElement>(null);
  const heroInput = useRef<HTMLInputElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const hero = heroSearch.current;
    const bar = barRef.current;
    if (!hero || !bar) return;
    const obs = new IntersectionObserver(
      ([en]) => {
        const above = en.rootBounds ? en.boundingClientRect.top < en.rootBounds.top : true;
        setStuck(!en.isIntersecting && above);
      },
      { rootMargin: `-${bar.offsetHeight}px 0px 0px 0px` },
    );
    obs.observe(hero);
    return () => obs.disconnect();
  }, []);

  // "/" lleva al buscador desde cualquier parte de la página.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable='true']")) return;
      e.preventDefault();
      const input = stuck ? document.getElementById("sf-q2") : heroInput.current;
      (input as HTMLInputElement | null)?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stuck]);

  const scrollToMain = () => {
    const main = mainRef.current;
    const bar = barRef.current;
    if (!main || !bar) return;
    const top = main.getBoundingClientRect().top + window.scrollY - bar.offsetHeight - 6;
    if (window.scrollY > top + 4) window.scrollTo({ top, behavior: "smooth" });
  };
  const pick = (patch: Partial<View>) => {
    update({ ...patch, ver: "" });
    requestAnimationFrame(scrollToMain);
  };
  const seeAll = (key: string) => {
    update({ ver: key });
    requestAnimationFrame(scrollToMain);
  };

  /* ---------- Conteos de pestañas y niveles ---------- */
  const temaCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of ["", ...temasOn]) m.set(t, filterBy({ q: view.q, nivel: view.nivel, tema: t }).length);
    return m;
  }, [filterBy, temasOn, view.q, view.nivel]);
  const nivelCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of ["", ...NIVEL_ORDER]) m.set(n, filterBy({ q: view.q, tema: view.tema, nivel: n }).length);
    return m;
  }, [filterBy, view.q, view.tema]);

  // Los conteos cambian el ancho de las pestañas, así que la píldora se recoloca con cada filtro.
  const tabsRef = useInk(`${view.tema}|${view.nivel}|${view.q}`);
  const levelsRef = useInk(`${view.nivel}|${view.tema}|${view.q}`);

  /* ---------- Render ---------- */
  const mainKey = `${view.q}|${view.tema}|${view.nivel}|${ver}`;
  const name = firstName ? `Hola, ${firstName}` : "Hola";
  const words = ["Tu", "próximo", "paso", "en", "inglés"];

  let main: React.ReactNode;
  if (!res.length) {
    main = (
      <>
        {view.q && <ResultsHead q={view.q} s={s} n={0} />}
        <Empty
          view={view}
          hints={hints}
          countWithout={(patch) => filterBy({ ...view, ...patch }).length}
          onRemove={(patch) => pick(patch)}
          onHint={(h) => {
            setText(h);
            pick({ q: h, tema: "", nivel: "" });
          }}
          onReset={() => {
            setText("");
            pick({ q: "", tema: "", nivel: "" });
          }}
        />
      </>
    );
  } else if (groups && !ver) {
    main = (
      <>
        {view.q && <ResultsHead q={view.q} s={s} n={res.length} />}
        <div className={"sf-shelves" + (animate ? " is-in" : "")}>
          {groups.map((g, k) => (
            <Shelf
              key={g.key}
              group={g}
              index={k}
              hits={hits}
              done={done}
              onOpen={onOpen}
              onSeeAll={seeAll}
              initialLeft={saved?.rows[g.key]}
              registerRow={registerRow}
            />
          ))}
        </div>
      </>
    );
  } else {
    const list = ver ? verItems : res;
    let head: React.ReactNode;
    if (ver)
      head = (
        <div className="sf-gridhead">
          <button type="button" className="sf-back" onClick={() => update({ ver: "" })}>
            <Icon name="arrow-l" /> Todos los estantes
          </button>
          <h2 className="sf-gridhead__t">
            {groupTitle(ver)}
            {view.q && <em> «{view.q}»</em>}
          </h2>
          <p className="sf-gridhead__c">{plural(list.length, "recurso", "recursos")}</p>
        </div>
      );
    else if (view.q) head = <ResultsHead q={view.q} s={s} n={res.length} />;
    else
      head = (
        <div className="sf-gridhead">
          <h2 className="sf-gridhead__t">{[view.tema, view.nivel].filter(Boolean).join(" · ") || "Todos los recursos"}</h2>
          <p className="sf-gridhead__c">{plural(list.length, "recurso", "recursos")}</p>
        </div>
      );
    main = (
      <>
        {head}
        <div className={"sf-grid" + (animate ? " is-in" : "")}>
          {list.slice(0, shown).map((item, k) => (
            <ResourceCard key={item.id} item={item} index={k % PAGE} done={done.has(item.id)} hits={hits} onOpen={onOpen} />
          ))}
        </div>
        {list.length > shown && (
          <div className="sf-showmore">
            <button type="button" className="sf-btn-ghost" onClick={() => setShown((n) => n + PAGE)}>
              Mostrar más <span>· quedan {list.length - shown}</span>
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <section className={"sf-hero" + (intro ? " is-intro" : "")}>
        <div className="sf-wrap sf-gut sf-hero__in">
          <span className="sf-eyebrow">{name}</span>
          <h1 className="sf-h1">
            {words.map((w, k) => (
              <Fragment key={w}>
                <span className="sf-w" style={{ "--w": k } as CSSProperties}>
                  {w}
                </span>{" "}
              </Fragment>
            ))}
            <em>
              <span className="sf-w" style={{ "--w": 5 } as CSSProperties}>
                está
              </span>{" "}
              <span className="sf-w" style={{ "--w": 6 } as CSSProperties}>
                aquí
              </span>
            </em>
          </h1>
          <div ref={heroSearch} className="sf-hero__search">
            <SearchBox
              id="sf-q"
              variant="hero"
              value={text}
              onChange={setText}
              onAcceptHint={acceptHint}
              onClear={clearSearch}
              hintRef={hintRef}
              inputRef={heroInput}
            />
          </div>
        </div>
      </section>

      <div ref={barRef} className={"sf-bar" + (stuck ? " has-search" : "")}>
        <div className="sf-wrap sf-gut sf-bar__in">
          <div ref={tabsRef} className="sf-tabs" role="group" aria-label="Temas">
            <span className="sf-ink" aria-hidden="true" />
            {["", ...temasOn].map((t) => {
              const n = temaCount.get(t) ?? 0;
              const on = view.tema === t;
              return (
                <button
                  key={t || "todo"}
                  type="button"
                  className={"sf-tab" + (on ? " is-on" : "")}
                  aria-pressed={on}
                  disabled={!on && !n}
                  onClick={() => pick({ tema: t })}
                >
                  <Icon name={t ? (TEMA_ICON[t] ?? "tag") : "grid"} />
                  <span>{t || "Todo"}</span>
                  <span className="sf-tab__n">{n}</span>
                </button>
              );
            })}
          </div>
          <div ref={levelsRef} className="sf-seg" role="group" aria-label="Nivel">
            <span className="sf-ink" aria-hidden="true" />
            {["", ...NIVEL_ORDER].map((lv) => {
              const n = nivelCount.get(lv) ?? 0;
              const on = view.nivel === lv;
              return (
                <button
                  key={lv || "todos"}
                  type="button"
                  className={"sf-seg__b" + (on ? " is-on" : "")}
                  aria-pressed={on}
                  disabled={!on && !n}
                  title={plural(n, "recurso", "recursos")}
                  onClick={() => pick({ nivel: lv })}
                >
                  {lv ? <LevelBars nivel={lv as Nivel} /> : null}
                  <span>{lv || "Todos"}</span>
                </button>
              );
            })}
          </div>
          <div className="sf-bar__search" aria-hidden={!stuck}>
            <SearchBox
              id="sf-q2"
              variant="bar"
              value={text}
              onChange={setText}
              onAcceptHint={acceptHint}
              onClear={clearSearch}
              hintRef={hintRef}
              hidden={!stuck}
            />
          </div>
          <button
            type="button"
            className="sf-icobtn sf-bar__find"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              setTimeout(() => heroInput.current?.focus({ preventScroll: true }), 350);
            }}
            aria-label="Ir al buscador"
          >
            <Icon name="search" />
          </button>
        </div>
      </div>

      <div ref={mainRef} className="sf-wrap sf-gut sf-main">
        <div key={mainKey} className="sf-main__in">
          {main}
        </div>
      </div>
    </>
  );
}

/** Píldora que se desliza hasta la opción activa. */
function useInk(active: string) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const g = ref.current;
    if (!g) return;
    const place = () => {
      const on = g.querySelector<HTMLElement>(".is-on");
      const ink = g.querySelector<HTMLElement>(".sf-ink");
      if (!ink) return;
      if (!on) {
        ink.style.width = "0px";
        return;
      }
      ink.style.width = `${on.offsetWidth}px`;
      ink.style.transform = `translateX(${on.offsetLeft}px)`;
      if (on.offsetLeft < g.scrollLeft || on.offsetLeft + on.offsetWidth > g.scrollLeft + g.clientWidth)
        g.scrollTo({ left: Math.max(0, on.offsetLeft - 24), behavior: "smooth" });
    };
    place();
    const ready = requestAnimationFrame(() => g.classList.add("is-ready"));
    const ro = new ResizeObserver(place);
    ro.observe(g);
    document.fonts?.ready.then(place).catch(() => {});
    return () => {
      cancelAnimationFrame(ready);
      ro.disconnect();
    };
  }, [active]);
  return ref;
}

function ResultsHead({ q, s, n }: { q: string; s: SearchResult | null; n: number }) {
  return (
    <div className="sf-res">
      <h2 className="sf-res__t">
        Resultados para <em>«{q}»</em>
      </h2>
      <p className="sf-res__c" aria-live="polite">
        {plural(n, "recurso", "recursos")}
        {s?.fixed ? (
          <span className="sf-fix">
            <Icon name="check" />
            Mostrando resultados para «{s.fixed}»
          </span>
        ) : null}
        {s?.related ? (
          <span className="sf-fix sf-fix--rel">No hay coincidencias exactas. Estos se relacionan con tu búsqueda</span>
        ) : null}
      </p>
    </div>
  );
}

function Empty({
  view,
  hints,
  countWithout,
  onRemove,
  onHint,
  onReset,
}: {
  view: View;
  hints: string[];
  countWithout: (patch: Partial<Filter>) => number;
  onRemove: (patch: Partial<View>) => void;
  onHint: (h: string) => void;
  onReset: () => void;
}) {
  const fixes: React.ReactNode[] = [];
  const noNivel = view.nivel ? countWithout({ nivel: "" }) : 0;
  const noTema = view.tema ? countWithout({ tema: "" }) : 0;
  if (noNivel)
    fixes.push(
      <button key="nivel" type="button" className="sf-sug" onClick={() => onRemove({ nivel: "" })}>
        Quitar «{view.nivel}» <span>· {noNivel}</span>
      </button>,
    );
  if (noTema)
    fixes.push(
      <button key="tema" type="button" className="sf-sug" onClick={() => onRemove({ tema: "" })}>
        Buscar en todos los temas <span>· {noTema}</span>
      </button>,
    );
  return (
    <div className="sf-empty">
      <Icon name="search-x" />
      <p className="sf-empty__t">{view.q ? <>No encontramos «{view.q}»</> : "No hay recursos con esta combinación"}</p>
      <p className="sf-empty__p">
        {fixes.length
          ? "Hay resultados si amplías la búsqueda:"
          : view.q
            ? "Revisa cómo está escrito o prueba con uno de estos temas:"
            : "Prueba con otro nivel o tema."}
      </p>
      <div className="sf-empty__acts">
        {fixes.length
          ? fixes
          : view.q
            ? hints.slice(0, 5).map((h) => (
                <button key={h} type="button" className="sf-sug" onClick={() => onHint(h)}>
                  {h}
                </button>
              ))
            : (
                <button type="button" className="sf-sug" onClick={onReset}>
                  Ver todos los recursos
                </button>
              )}
      </div>
    </div>
  );
}
