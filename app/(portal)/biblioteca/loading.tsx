import type { CSSProperties } from "react";
import { Icon } from "@/components/portal/Icon";
import { TopBar } from "@/components/portal/TopBar";

/** Mientras llega la biblioteca: barra de progreso y el esqueleto de los estantes. */
export default function Loading() {
  return (
    <>
      <TopBar />
      <p className="sf-sr" role="status">
        Cargando la biblioteca…
      </p>
      <section className="sf-hero" aria-hidden="true">
        <div className="sf-wrap sf-gut sf-hero__in">
          <span className="sf-sk sf-skl" style={{ width: 120, height: 30, borderRadius: 999 }} />
          <div className="sf-h1-sk">
            <span className="sf-sk sf-skl" style={{ width: "min(560px, 92%)" }} />
            <span className="sf-sk sf-skl" style={{ width: "min(300px, 60%)" }} />
          </div>
          <div className="sf-hero__search">
            <div className="sf-search is-sk">
              <Icon name="search" />
              <span className="sf-search__fake">Cargando tus recursos…</span>
            </div>
          </div>
        </div>
      </section>
      <div className="sf-bar" aria-hidden="true">
        <div className="sf-wrap sf-gut sf-bar__in">
          <div className="sf-tabs is-sk">
            {[70, 112, 118, 98].map((w) => (
              <span key={w} className="sf-sk sf-pill-sk" style={{ width: w }} />
            ))}
          </div>
          <div className="sf-seg is-sk">
            {[64, 70, 92, 84].map((w) => (
              <span key={w} className="sf-sk sf-pill-sk" style={{ width: w, height: 32 }} />
            ))}
          </div>
        </div>
      </div>
      <div className="sf-wrap sf-gut sf-main" aria-hidden="true">
        <div className="sf-shelves">
          {[0, 1, 2].map((k) => (
            <section key={k} className="sf-shelf" style={{ "--s": k } as CSSProperties}>
              <div className="sf-shelf__head">
                <span className="sf-sk sf-skl" style={{ width: 220, height: 34, borderRadius: 10 }} />
              </div>
              <div className="sf-row">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="sf-card sf-card--sk">
                    <div className="sf-cover sf-sk" />
                    <div className="sf-card__body">
                      <span className="sf-sk sf-skl" style={{ width: "44%" }} />
                      <span className="sf-sk sf-skl" style={{ width: "88%", height: 14 }} />
                      <span className="sf-sk sf-skl" style={{ width: "66%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
