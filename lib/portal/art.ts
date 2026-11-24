import type { ArtKey } from "@/lib/portal/catalog";

/**
 * Ilustraciones de portada, generadas con los colores de la marca. Cada recurso
 * tiene la suya (se deriva de su id), así que dos cartillas nunca se ven iguales.
 *
 * El dibujo vive en su propia franja de la portada: el título ocupa otra, de
 * modo que nunca se superponen (antes las rayas, casillas y fichas podían
 * quedar debajo del título en computador).
 */

export type ArtMode = "card" | "page" | "thumb";

const C = {
  ink: "#00043c",
  ink3: "#152364",
  blue: "#6687bb",
  mist: "#b2c4d8",
  white: "#ffffff",
};

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let x = seed || 7;
  return () => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    return x / 4294967296;
  };
}

const f1 = (n: number) => n.toFixed(1);

type Art = { viewBox: string; par: string; inner: string };

const SIZE: Record<ArtMode, [number, number]> = { card: [320, 90], page: [240, 200], thumb: [200, 200] };

function bars(R: () => number, W: number, H: number, n: number) {
  const bw = W / n;
  let s = "";
  for (let i = 0; i < n; i++) {
    const env = 0.35 + 0.65 * Math.abs(Math.sin(i * 0.42 + R() * 0.6));
    const h = Math.max(6, (H - 6) * env * (0.55 + 0.45 * R()));
    const x = i * bw + bw * 0.2;
    const w = bw * 0.6;
    s += `<rect class="sf-b" style="--k:${i}" x="${f1(x)}" y="${f1((H - h) / 2)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(w / 2)}" fill="${i % 7 === 3 ? C.mist : C.blue}" opacity="${(0.45 + 0.5 * R()).toFixed(2)}"/>`;
  }
  return s;
}

function audio(R: () => number, mode: ArtMode): Art {
  const [W, H] = SIZE[mode];
  const n = mode === "thumb" ? 16 : mode === "page" ? 22 : 38;
  return { viewBox: `0 0 ${W} ${H}`, par: "none", inner: bars(R, W, H, n) };
}

/** Renglones de texto con frases subrayadas con marcador. */
function cartilla(R: () => number, mode: ArtMode): Art {
  const [W, H] = SIZE[mode];
  const rows = mode === "card" ? 3 : mode === "page" ? 6 : 4;
  const gap = H / rows;
  const marked = new Set<number>();
  while (marked.size < Math.min(3, rows)) marked.add(Math.floor(R() * rows));
  let s = "";
  let k = 0;
  for (let j = 0; j < rows; j++) {
    const y = gap * j + gap / 2;
    const lineW = W * (0.62 + R() * 0.34);
    s += `<rect x="2" y="${f1(y - 2)}" width="${f1(lineW)}" height="4" rx="2" fill="${C.mist}" fill-opacity=".28"/>`;
    if (marked.has(j)) {
      const x = 2 + R() * W * 0.25;
      const w = Math.min(lineW - (x - 2), W * (0.25 + R() * 0.3));
      s += `<rect class="sf-hl" style="--k:${k++}" x="${f1(x)}" y="${f1(y - 7)}" width="${f1(Math.max(28, w))}" height="14" rx="7" fill="${C.blue}" fill-opacity=".55"/>`;
    }
  }
  return { viewBox: `0 0 ${W} ${H}`, par: "xMinYMid meet", inner: s };
}

/** Casillas marcadas, como un cuadernillo de ejercicios. */
function ejercicio(R: () => number, mode: ArtMode): Art {
  const [W, H] = SIZE[mode];
  const rows = mode === "page" ? 5 : 3;
  const size = mode === "thumb" ? 34 : mode === "page" ? 22 : 18;
  const gap = H / rows;
  let s = "";
  for (let j = 0; j < rows; j++) {
    const y = gap * j + gap / 2;
    const checked = j === 0 || R() < 0.6;
    s += `<rect x="2" y="${f1(y - size / 2)}" width="${size}" height="${size}" rx="${f1(size * 0.28)}" fill="${checked ? C.white : "none"}" fill-opacity=".92" stroke="${C.white}" stroke-opacity=".85" stroke-width="1.8"/>`;
    if (checked)
      s += `<path class="sf-ck" style="--k:${j}" pathLength="1" d="M${f1(2 + size * 0.24)} ${f1(y)} l${f1(size * 0.18)} ${f1(size * 0.2)} l${f1(size * 0.36)} -${f1(size * 0.4)}" fill="none" stroke="${C.blue}" stroke-width="${f1(size * 0.16)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const lw = (W - size - 20) * (0.45 + R() * 0.5);
    s += `<rect x="${size + 14}" y="${f1(y - 3.5)}" width="${f1(lw)}" height="7" rx="3.5" fill="${C.white}" fill-opacity=".45"/>`;
  }
  return { viewBox: `0 0 ${W} ${H}`, par: "xMinYMid meet", inner: s };
}

/** Fichas de palabras y una "Aa" de fondo. */
function vocab(R: () => number, mode: ArtMode): Art {
  const [W, H] = SIZE[mode];
  const rows = mode === "card" ? 2 : mode === "page" ? 4 : 3;
  const h = mode === "thumb" ? 30 : 26;
  const gap = H / rows;
  const maxX = W * (mode === "card" ? 0.66 : 0.78);
  const fs = mode === "card" ? 88 : mode === "page" ? 130 : 120;
  let s = `<text x="${W - 4}" y="${H - 4}" text-anchor="end" font-family="Instrument Serif, Georgia, serif" font-style="italic" font-size="${fs}" fill="${C.ink3}" fill-opacity=".12">Aa</text>`;
  let k = 0;
  for (let j = 0; j < rows; j++) {
    const y = gap * j + (gap - h) / 2;
    let x = 2 + R() * 18;
    while (true) {
      const w = 42 + R() * 54;
      if (x + w > maxX) break;
      s += `<g class="sf-vc" style="--k:${k++}"><rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${h}" rx="${h / 2}" fill="${C.white}" fill-opacity=".78" stroke="${C.blue}" stroke-opacity=".55"/><rect x="${f1(x + 11)}" y="${f1(y + h / 2 - 2)}" width="${f1(w - 22)}" height="4" rx="2" fill="${C.blue}" fill-opacity=".5"/></g>`;
      x += w + 10;
    }
  }
  return { viewBox: `0 0 ${W} ${H}`, par: "xMinYMid meet", inner: s };
}

function video(_R: () => number, mode: ArtMode): Art {
  const [W, H] = SIZE[mode];
  const r = Math.min(W, H) * (mode === "card" ? 0.4 : 0.3);
  const cx = mode === "card" ? r + 4 : W / 2;
  const cy = H / 2;
  return {
    viewBox: `0 0 ${W} ${H}`,
    par: mode === "card" ? "xMinYMid meet" : "xMidYMid meet",
    inner: `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="none" stroke="${C.mist}" stroke-opacity=".45" stroke-width="2.5"/><path d="M${f1(cx - r * 0.3)} ${f1(cy - r * 0.42)}L${f1(cx + r * 0.45)} ${f1(cy)}L${f1(cx - r * 0.3)} ${f1(cy + r * 0.42)}Z" fill="${C.mist}" fill-opacity=".6"/>`,
  };
}

/** Brújula con anillos: guías para orientarse. */
function guia(R: () => number, mode: ArtMode): Art {
  const [W, H] = SIZE[mode];
  const cx = mode === "card" ? 46 : W / 2;
  const cy = H / 2;
  const max = Math.min(H / 2 - 4, mode === "card" ? 42 : 80);
  let s = "";
  for (let k = 1; k <= 4; k++)
    s += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1((max * k) / 4)}" fill="none" stroke="${C.mist}" stroke-opacity="${(0.42 - k * 0.07).toFixed(2)}" stroke-width="1.5"/>`;
  const a = R() * Math.PI;
  const dx = Math.cos(a) * max * 0.7;
  const dy = Math.sin(a) * max * 0.7;
  s += `<path d="M${f1(cx + dx)} ${f1(cy + dy)}L${f1(cx + dy * 0.18)} ${f1(cy - dx * 0.18)}L${f1(cx - dx)} ${f1(cy - dy)}L${f1(cx - dy * 0.18)} ${f1(cy + dx * 0.18)}Z" fill="${C.mist}" fill-opacity=".7"/>`;
  return { viewBox: `0 0 ${W} ${H}`, par: mode === "card" ? "xMinYMid meet" : "xMidYMid meet", inner: s };
}

/** Cuadrícula de letras de sopa de letras con una palabra encontrada. */
function juego(R: () => number, mode: ArtMode): Art {
  const [W, H] = SIZE[mode];
  const cols = mode === "card" ? 9 : mode === "page" ? 6 : 5;
  const rows = mode === "card" ? 2 : 5;
  const cell = Math.min((W - 4) / cols, (H - 4) / rows);
  const t = cell * 0.78;
  const row = Math.floor(R() * rows);
  const start = Math.floor(R() * Math.max(1, cols - 3));
  let s = "";
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const on = r === row && c >= start && c < start + 4;
      s += `<rect x="${f1(2 + c * cell)}" y="${f1(2 + r * cell)}" width="${f1(t)}" height="${f1(t)}" rx="${f1(t * 0.22)}" fill="${on ? C.mist : "none"}" fill-opacity=".75" stroke="${C.mist}" stroke-opacity="${on ? 0 : 0.35}" stroke-width="1.5"/>`;
    }
  return { viewBox: `0 0 ${W} ${H}`, par: "xMinYMid meet", inner: s };
}

const ART: Record<ArtKey, (R: () => number, mode: ArtMode) => Art> = { audio, cartilla, ejercicio, vocab, video, guia, juego };

export function artFor(key: ArtKey, mode: ArtMode, seed: string): Art {
  return (ART[key] ?? cartilla)(rng(hash(seed + mode)), mode);
}

/** Onda del reproductor: la misma forma en dos capas (base y parte ya escuchada). */
export function waveBars(seed: string) {
  const R = rng(hash(seed + "wave"));
  const n = 72;
  const W = 720;
  const H = 120;
  const bw = W / n;
  let s = "";
  for (let i = 0; i < n; i++) {
    const env = 0.3 + 0.7 * Math.abs(Math.sin(i * 0.29 + R() * 0.5));
    const h = Math.max(8, (H - 12) * env * (0.5 + 0.5 * R()));
    const x = i * bw + bw * 0.22;
    const w = bw * 0.56;
    s += `<rect class="sf-wb" style="animation-delay:${(-(i % 9) * 0.11).toFixed(2)}s" x="${f1(x)}" y="${f1((H - h) / 2)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(w / 2)}"/>`;
  }
  return { viewBox: `0 0 ${W} ${H}`, inner: s };
}
