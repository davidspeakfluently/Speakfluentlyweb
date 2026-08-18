#!/usr/bin/env node
// Carga cuadernillos de ejercicios interactivos (formato MD con bloques YAML,
// schema_version "1.1") a las tablas resources/exercise_items. Reutilizable:
// se vuelve a correr cada vez que llega un nuevo nivel (A2, B1, B2...) con el
// mismo formato, o para recargar un archivo editado — es idempotente por
// (resource.titulo) y (resource_id, source_exercise_id).
//
// Uso:
//   node scripts/import-ejercicios.mjs "/ruta/a/una/carpeta/con/archivos.md"

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { load as parseYaml } from "js-yaml";

config({ path: ".env.local" });

const SCHEMA_VERSION = "1.1";
const AUTOR = "Teacher David Pa"; // mismo valor usado en las cartillas existentes
const TEMA_DEFAULT = "Gramática"; // todos los niveles A1 provistos hasta ahora son de gramática
const NIVEL_BY_LEVEL = {
  A1: "Básico",
  A2: "Básico",
  B1: "Intermedio",
  B2: "Avanzado",
};

function parseArgs() {
  const dir = process.argv[2];
  if (!dir) {
    console.error('Uso: node scripts/import-ejercicios.mjs "<carpeta-con-archivos-md>"');
    process.exit(1);
  }
  return resolve(dir);
}

function splitFrontmatter(raw, filename) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`${filename}: no se encontró frontmatter YAML válido`);
  const frontmatter = parseYaml(match[1]);
  if (frontmatter.schema_version !== SCHEMA_VERSION) {
    throw new Error(
      `${filename}: schema_version "${frontmatter.schema_version}" no soportado (se espera "${SCHEMA_VERSION}")`,
    );
  }
  return { frontmatter, body: match[2] };
}

/** Extrae cada sección "## Heading\n\n```yaml ... ```" del cuerpo del documento. */
function extractSections(body) {
  const sectionRe = /^## (.+)\n\n```yaml\n([\s\S]*?)\n```/gm;
  const sections = [];
  let m;
  while ((m = sectionRe.exec(body))) {
    sections.push({ heading: m[1].trim(), data: parseYaml(m[2]) });
  }
  return sections;
}

function titleFromHeading(heading) {
  const parts = heading.split("—");
  return (parts.length > 1 ? parts.slice(1).join("—") : heading).trim();
}

function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Fuzzy-match del topic del cuadernillo contra el título de un recurso existente
 * (las cartillas siguen el patrón "<Topic> - Estructura, usos y contexto real").
 * Usa solapamiento de tokens en vez de exigir que todos los tokens del topic
 * estén en el título — el topic a veces trae una palabra extra (ej. "Future:
 * Going to vs Will" vs. la cartilla "Going to vs. Will") que con un match
 * estricto haría fallar una coincidencia real. */
function findRelatedCartilla(topic, candidates) {
  const topicNorm = normalize(topic);
  const exact = candidates.find((c) => normalize(c.titulo.split(" - ")[0]) === topicNorm);
  if (exact) return exact;

  const topicTokens = new Set(topicNorm.split(" ").filter(Boolean));
  let best = null;
  let bestRatio = 0;
  for (const c of candidates) {
    const titleTokens = new Set(normalize(c.titulo).split(" ").filter(Boolean));
    const overlap = [...topicTokens].filter((t) => titleTokens.has(t)).length;
    const ratio = overlap / Math.min(topicTokens.size, titleTokens.size);
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = c;
    }
  }
  return bestRatio >= 0.6 ? best : null;
}

async function importFile(supabase, filePath, relatedCandidates) {
  const filename = filePath.split("/").pop();
  const raw = readFileSync(filePath, "utf8");
  const { frontmatter, body } = splitFrontmatter(raw, filename);
  const sections = extractSections(body);

  const exerciseSections = sections.filter((s) => /^Exercise\s+\d+/i.test(s.heading));
  const metadataSection = sections.find((s) => s.heading === "Metadata for platform integration");

  if (exerciseSections.length === 0) {
    throw new Error(`${filename}: no se encontraron ejercicios`);
  }
  if (exerciseSections.length !== frontmatter.exercise_count) {
    console.warn(
      `  ! ${filename}: exercise_count del frontmatter (${frontmatter.exercise_count}) no coincide con los ejercicios encontrados (${exerciseSections.length})`,
    );
  }
  if (metadataSection) {
    const usedTypes = exerciseSections.map((s) => s.data.type).sort();
    const declaredTypes = [...(metadataSection.data.exercise_types_used ?? [])].sort();
    if (JSON.stringify(usedTypes) !== JSON.stringify(declaredTypes)) {
      console.warn(
        `  ! ${filename}: exercise_types_used del metadata no coincide con los tipos realmente parseados`,
      );
    }
  }

  const defaultNivel = NIVEL_BY_LEVEL[frontmatter.level];
  if (!defaultNivel) throw new Error(`${filename}: nivel "${frontmatter.level}" sin mapeo a Nivel de la app`);

  const relatedCartilla = frontmatter.related_cartilla
    ? findRelatedCartilla(frontmatter.topic, relatedCandidates)
    : null;
  // El nivel CEFR no mapea 1:1 a Básico/Intermedio/Avanzado (confirmado con
  // datos reales: varios temas A2 ya están clasificados "Intermedio" en sus
  // cartillas). Cuando hay una cartilla relacionada con match confiable, se
  // hereda su nivel — es la fuente más confiable de la dificultad real del
  // tema en este currículo — y solo se usa el mapeo CEFR como respaldo.
  const nivel = relatedCartilla?.nivel ?? defaultNivel;

  const resourceFields = {
    titulo: frontmatter.title,
    descripcion: frontmatter.description.trim(),
    tipo: "ejercicio",
    tema: TEMA_DEFAULT,
    nivel,
    autor: AUTOR,
    meta: `${frontmatter.exercise_count} ejercicios`,
    related_resource_id: relatedCartilla?.id ?? null,
  };

  const { data: existing } = await supabase
    .from("resources")
    .select("id")
    .eq("tipo", "ejercicio")
    .eq("titulo", resourceFields.titulo)
    .maybeSingle();

  let resourceId = existing?.id;
  if (resourceId) {
    const { error } = await supabase.from("resources").update(resourceFields).eq("id", resourceId);
    if (error) throw new Error(`${filename}: error actualizando resource — ${error.message}`);
  } else {
    const { data: created, error } = await supabase
      .from("resources")
      .insert(resourceFields)
      .select("id")
      .single();
    if (error) throw new Error(`${filename}: error creando resource — ${error.message}`);
    resourceId = created.id;
  }

  const items = exerciseSections.map((s, i) => ({
    resource_id: resourceId,
    source_exercise_id: s.data.id,
    orden: i,
    type: s.data.type,
    title: titleFromHeading(s.heading),
    data: s.data,
  }));

  const { error: itemsError } = await supabase
    .from("exercise_items")
    .upsert(items, { onConflict: "resource_id,source_exercise_id" });
  if (itemsError) throw new Error(`${filename}: error insertando exercise_items — ${itemsError.message}`);

  console.log(
    `  ✓ ${filename} → resource ${resourceId} (${items.length} ejercicios, nivel: ${nivel}${
      relatedCartilla ? `, cartilla relacionada: "${relatedCartilla.titulo}"` : ", sin cartilla relacionada"
    })`,
  );
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env.local");
    process.exit(1);
  }

  const dir = parseArgs();
  const files = readdirSync(dir)
    .filter((f) => extname(f) === ".md")
    .map((f) => join(dir, f));

  if (files.length === 0) {
    console.error(`No se encontraron archivos .md en ${dir}`);
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: relatedCandidates } = await supabase
    .from("resources")
    .select("id, titulo, nivel")
    .eq("tipo", "cartilla");

  console.log(`Cargando ${files.length} archivo(s) desde ${dir}\n`);

  let failed = 0;
  for (const filePath of files) {
    try {
      await importFile(supabase, filePath, relatedCandidates ?? []);
    } catch (err) {
      failed += 1;
      console.error(`  ✗ ${err.message}`);
    }
  }

  console.log(`\n${files.length - failed}/${files.length} archivo(s) cargados correctamente.`);
  if (failed > 0) process.exit(1);
}

main();
