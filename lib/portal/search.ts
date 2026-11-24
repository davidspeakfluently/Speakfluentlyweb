import type { CatalogItem } from "@/lib/portal/catalog";

/**
 * Buscador de la biblioteca. Corre en el navegador sobre todo el catálogo
 * (son pocos cientos de recursos), así que responde al instante y entiende:
 *  - palabras clave en español o inglés ("presente" encuentra "Present Perfect"),
 *  - errores de escritura ("condittinals" → "conditionals"),
 *  - ideas relacionadas (grupos de sinónimos de abajo).
 * Si ninguna coincidencia tiene todas las palabras, devuelve las que tienen
 * alguna y lo marca como "relacionado" en vez de dejar la página vacía.
 */

export const normalize = (s: string) =>
  String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export const tokenize = (s: string) =>
  normalize(s)
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const STOP = new Set(
  (
    "a al ante con de del desde el en entre es esta este esto la las lo los me mi mis o para por que se sin su sus te tu tus un una uno unos unas y ya " +
    "an and are as at be by for from i in is it my of on or the to with your you"
  ).split(" "),
);

/** Grupos de palabras equivalentes (español e inglés). Escribir cualquiera de ellas busca todas. */
const GROUPS: string[][] = [
  ["present", "presente", "presentes"],
  ["past", "pasado", "pasados", "preterito"],
  ["future", "futuro", "futuros", "will", "going to"],
  ["perfect", "perfecto", "perfecta", "perfectos"],
  ["continuous", "continuo", "continua", "progresivo", "progressive"],
  ["simple", "simples"],
  ["conditional", "conditionals", "condicional", "condicionales", "hipotetico", "hipoteticas", "hipoteticos", "if"],
  ["first", "primer", "primero", "primera"],
  ["second", "segundo", "segunda"],
  ["third", "tercer", "tercero", "tercera"],
  ["mixed", "mixto", "mixtos", "mixtas"],
  ["wish", "wishes", "deseo", "deseos", "arrepentimiento", "arrepentimientos", "regrets", "if only"],
  ["used to", "would", "solia", "solias", "habitos pasados"],
  ["passive", "pasiva", "pasivo", "voz pasiva"],
  ["reported", "reported speech", "indirecto", "estilo indirecto", "reportado"],
  ["modals", "modal", "modales", "should", "must", "have to", "deber", "obligacion", "consejos"],
  ["deduction", "deduccion", "probabilidad", "might", "especulando"],
  ["can", "poder", "habilidades", "capacidades"],
  ["phrasal verbs", "phrasal", "frasales", "verbos frasales"],
  ["comparatives", "comparative", "comparativos", "comparativo", "comparar", "comparando", "superlatives", "superlativos"],
  ["prepositions", "preposiciones", "preposicion", "ubicacion"],
  ["pronouns", "pronombres", "pronombre"],
  ["relative", "relativas", "relativos", "clausulas", "relative clauses"],
  ["gerunds", "gerundios", "gerundio", "infinitives", "infinitivos", "infinitivo"],
  ["linking words", "linking", "conectores", "conector", "connectors"],
  ["causative", "causativa", "causativo"],
  ["cleft", "hendidas", "enfasis", "emphasis", "inversion"],
  ["quantifiers", "cuantificadores", "contables", "incontables", "much", "many"],
  ["there is", "there are", "hay"],
  ["verb to be", "to be", "verbo ser", "ser", "estar"],
  ["numbers", "numeros", "hora", "time", "clock"],
  ["travel", "viaje", "viajes", "viajar", "trip", "airport", "aeropuerto", "vuelo"],
  ["airport", "aeropuerto", "immigration", "inmigracion", "vuelo", "flight", "check in"],
  ["restaurant", "restaurante", "comida", "food", "ordering", "cena", "menu", "kitchen", "cocina"],
  ["shopping", "compras", "comprar", "ropa", "clothes", "tienda"],
  ["bank", "banco", "dinero", "money", "cajero", "cajeros", "cuentas"],
  ["doctor", "medico", "salud", "health", "sintomas", "consulta"],
  ["emergencies", "emergencia", "emergencias", "safety", "seguridad", "robos", "ayuda"],
  ["directions", "direcciones", "indicaciones", "perdido", "calle"],
  ["transportation", "transporte", "bus", "taxi", "uber", "rideshares", "metro"],
  ["bookings", "reservas", "reservar", "appointments", "citas", "hotel", "hoteles"],
  ["work", "trabajo", "job", "oficina", "office", "professional", "profesional", "liderazgo", "negocios", "business"],
  ["small talk", "conversacion", "charla", "social", "romper el hielo"],
  ["customer service", "servicio al cliente", "quejas", "queja", "complaints", "reclamo"],
  ["hair", "peluqueria", "salon", "corte"],
  ["meet", "conocer", "conociendose", "saludos", "saludar", "presentarse", "greetings"],
  ["day", "dia", "rutina", "routine", "diaria", "diario"],
  ["family", "familia", "house", "casa"],
  ["emotions", "emociones", "feelings", "sentimientos"],
  ["adjetivos", "adjectives", "describing", "describir", "describiendo"],
  ["adverbios", "adverbs"],
  ["idioms", "modismos", "expresiones", "expressions"],
  ["collocations", "colocaciones", "combinaciones"],
  ["verbs", "verbos", "verbo"],
  ["pronunciation", "pronunciacion", "pronunciar", "minimal pairs", "pares minimos", "sonidos", "trabalenguas"],
  ["warm up", "calentamiento", "motivacion"],
  ["short story", "historia", "cuento", "story"],
  ["listening", "escuchar", "escucha", "audio", "audios", "nota de voz", "notas de voz", "podcast"],
  ["workbook", "ejercicio", "ejercicios", "practicar", "practica", "quiz"],
  ["cartilla", "cartillas", "teoria", "explicacion", "guia", "pdf"],
  ["vocabulary", "vocabulario", "palabras", "frases"],
  ["basico", "principiante", "principiantes", "beginner", "facil"],
  ["intermedio", "intermediate"],
  ["avanzado", "advanced", "dificil"],
];

const GROUP_OF = new Map<string, number[]>();
const GROUP_PHRASES: [string, number][] = [];
GROUPS.forEach((grp, gi) =>
  grp.forEach((w) => {
    const n = tokenize(w).join(" ");
    if (n.includes(" ")) GROUP_PHRASES.push([n, gi]);
    else {
      if (!GROUP_OF.has(n)) GROUP_OF.set(n, []);
      GROUP_OF.get(n)!.push(gi);
    }
  }),
);

/** Distancia de edición (con transposiciones), cortando apenas supera el máximo. */
function dist(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[b.length];
}
const maxEdits = (len: number) => (len <= 3 ? 0 : len <= 5 ? 1 : 2);

function groupAlts(gis: number[], self?: string) {
  const m = new Map<string, number>();
  for (const gi of new Set(gis))
    for (const w of GROUPS[gi]) {
      const n = tokenize(w).join(" ");
      if (!m.has(n)) m.set(n, n === self ? 1 : 0.85);
    }
  return m;
}

type Entry = {
  id: string;
  tArr: string[];
  sArr: string[];
  dArr: string[];
  tTok: Set<string>;
  sTok: Set<string>;
  dTok: Set<string>;
  gTok: Set<string>;
  tStr: string;
  sStr: string;
  dStr: string;
  gStr: string;
  fullStr: string;
};

export type SearchResult = {
  /** id → posición en el ranking */
  rank: Map<string, number>;
  /** true cuando ningún recurso tiene todas las palabras y se muestran los parecidos */
  related: boolean;
  /** la búsqueda corregida ("conditionals") o "" si no hubo correcciones */
  fixed: string;
  /** palabras a resaltar en los resultados */
  hits: string[];
};

export function createSearch(items: CatalogItem[]) {
  const pad = (a: string[]) => ` ${a.join(" ")} `;
  const index: Entry[] = items.map((r) => {
    const t = tokenize(r.en);
    const s = tokenize(r.es);
    const d = tokenize(r.descripcion);
    const g = tokenize([r.tema, r.tipoLabel, r.nivel, r.kind === "ejercicio" ? "workbook ejercicios" : "", r.kind === "audio" ? "audio listening" : ""].join(" "));
    return {
      id: r.id,
      tArr: t,
      sArr: s,
      dArr: d,
      tTok: new Set(t),
      sTok: new Set(s),
      dTok: new Set(d),
      gTok: new Set(g),
      tStr: pad(t),
      sStr: pad(s),
      dStr: pad(d),
      gStr: pad(g),
      fullStr: pad(tokenize(r.titulo)),
    };
  });

  const prefVocab = new Set<string>();
  index.forEach((x) => {
    x.tArr.forEach((w) => prefVocab.add(w));
    x.sArr.forEach((w) => prefVocab.add(w));
  });
  GROUP_OF.forEach((_, w) => prefVocab.add(w));
  const descVocab = new Set<string>();
  index.forEach((x) => x.dArr.forEach((w) => descVocab.add(w)));

  function correct(tok: string) {
    if (prefVocab.has(tok) || descVocab.has(tok)) return null;
    if (tok.length >= 3) for (const w of prefVocab) if (w.startsWith(tok)) return null;
    const max = maxEdits(tok.length);
    if (!max) return null;
    for (const vocab of [prefVocab, descVocab]) {
      let best: string | null = null;
      let bestD = max + 1;
      for (const w of vocab) {
        if (w.length < 3) continue;
        const d = dist(tok, w, max);
        if (d < bestD) {
          bestD = d;
          best = w;
        }
      }
      if (best) return best;
    }
    return null;
  }

  function unitScore(x: Entry, alts: Map<string, number>) {
    let best = 0;
    for (const [term, w] of alts) {
      let s = 0;
      if (term.includes(" ")) {
        const p = ` ${term} `;
        if (x.tStr.includes(p)) s = 8;
        else if (x.sStr.includes(p)) s = 6;
        else if (x.gStr.includes(p)) s = 4;
        else if (x.dStr.includes(p)) s = 3;
      } else if (x.tTok.has(term)) s = 7;
      else if (w >= 0.9 && term.length >= 3 && x.tArr.some((t) => t.startsWith(term))) s = 5;
      else if (x.sTok.has(term)) s = 5;
      else if (w >= 0.9 && term.length >= 3 && x.sArr.some((t) => t.startsWith(term))) s = 3.5;
      else if (x.gTok.has(term)) s = 4;
      else if (x.dTok.has(term)) s = 2.5;
      else if (w >= 0.9 && term.length >= 4 && x.dArr.some((t) => t.startsWith(term))) s = 1.5;
      if (s * w > best) best = s * w;
    }
    return best;
  }

  const cache = new Map<string, SearchResult | null>();

  return function search(q: string): SearchResult | null {
    const key = tokenize(q).join(" ");
    if (cache.has(key)) return cache.get(key)!;
    const qStr = ` ${key} `;
    const units: { alts: Map<string, number> }[] = [];
    const consumed = new Set<string>();
    const corrections: [string, string][] = [];
    for (const [ph, gi] of GROUP_PHRASES) {
      if (qStr.includes(` ${ph} `) && !units.some((u) => u.alts.has(ph))) {
        units.push({ alts: groupAlts([gi], ph) });
        ph.split(" ").forEach((w) => consumed.add(w));
      }
    }
    for (const tok of key.split(" ")) {
      if (!tok || STOP.has(tok) || consumed.has(tok)) continue;
      const alts = new Map<string, number>([[tok, 1]]);
      const fix = correct(tok);
      if (fix) {
        alts.set(fix, 0.9);
        corrections.push([tok, fix]);
      }
      const gis = [...(GROUP_OF.get(tok) ?? []), ...(fix ? (GROUP_OF.get(fix) ?? []) : [])];
      if (!gis.length && tok.length >= 4)
        GROUP_OF.forEach((g, w) => {
          if (w.startsWith(tok)) gis.push(...g);
        });
      groupAlts(gis).forEach((wgt, w) => {
        if (!alts.has(w)) alts.set(w, wgt);
      });
      units.push({ alts });
    }
    if (!units.length) {
      cache.set(key, null);
      return null;
    }
    const scored: [string, number, number, number][] = [];
    index.forEach((x, order) => {
      let score = 0;
      let hit = 0;
      for (const u of units) {
        const s = unitScore(x, u.alts);
        if (s > 0) {
          hit++;
          score += s;
        }
      }
      if (hit) scored.push([x.id, score + (key.includes(" ") && x.fullStr.includes(qStr) ? 6 : 0), hit, order]);
    });
    const strict = scored.filter((s) => s[2] === units.length);
    const pick = strict.length ? strict : scored;
    pick.sort((a, b) => b[2] - a[2] || b[1] - a[1] || a[3] - b[3]);
    const hits = new Set<string>();
    units.forEach((u) =>
      u.alts.forEach((_, w) =>
        w.split(" ").forEach((p) => {
          if (!STOP.has(p) && p.length > 1) hits.add(p);
        }),
      ),
    );
    const out: SearchResult = {
      rank: new Map(pick.map((s, k) => [s[0], k])),
      related: !strict.length && pick.length > 0,
      fixed: corrections.length
        ? key
            .split(" ")
            .map((t) => (corrections.find((c) => c[0] === t) ?? [t, t])[1])
            .join(" ")
        : "",
      hits: [...hits],
    };
    cache.set(key, out);
    return out;
  };
}

/** ¿Esta palabra del texto coincide con alguna de las buscadas? */
export function isHit(part: string, hits: string[]) {
  const n = normalize(part);
  return /[a-z0-9]/.test(n) && hits.some((h) => n === h || (h.length >= 4 && n.startsWith(h)));
}
