#!/usr/bin/env node
// Carga transcript + ejercicios de listening sobre un recurso de audio YA
// EXISTENTE (localizado por `audio_title` del frontmatter contra
// resources.titulo, tipo='audio') — a diferencia de import-ejercicios.mjs,
// este script no crea el resource, solo lo enriquece: setea `transcript` y
// cuelga exercise_items del mismo resource_id. No toca titulo/descripcion/
// nivel/tema/meta del recurso, que ya existen de antes.
//
// Formato fuente: schema_version "1.0" (distinto al "1.1" de los
// cuadernillos de gramática) — trae un bloque `# Transcript` antes de los
// ejercicios, y usa nombres de tipo propios de listening
// (listening_comprehension, vocabulary_context, reflection_response) que
// se remapean a multiple_choice/free_writing al ingerir, porque su forma de
// datos es idéntica — evita duplicar tipos en el constraint y en el motor
// de runners por una diferencia que es solo de nombre.
//
// Uso:
//   node scripts/import-listening.mjs "<carpeta-con-archivos.md>"

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { load as parseYaml } from "js-yaml";

config({ path: ".env.local" });

const SCHEMA_VERSION = "1.0";
const TYPE_REMAP = {
  listening_comprehension: "multiple_choice",
  vocabulary_context: "multiple_choice",
  reflection_response: "free_writing",
};

function parseArgs() {
  const dir = process.argv[2];
  if (!dir) {
    console.error('Uso: node scripts/import-listening.mjs "<carpeta-con-archivos.md>"');
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

function extractSections(body) {
  const sectionRe = /^#{1,2} (.+)\n\n```yaml\n([\s\S]*?)\n```/gm;
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

/** Localiza el recurso de audio por audio_title contra resources.titulo.
 * No siempre coincide exacto: algunos títulos reales llevan un sufijo
 * ("<audio_title> - Diálogo conversacional") y al menos uno tiene las
 * palabras en otro orden ("Minimal Pairs - Pronunciation Drills" vs.
 * "Pronunciation Drills: Minimal Pairs") — por eso, igual que con las
 * cartillas relacionadas de los ejercicios, se usa solapamiento de tokens
 * en vez de exigir coincidencia exacta. */
function findAudioResource(audioTitle, candidates) {
  const targetNorm = normalize(audioTitle);
  const exact = candidates.find((c) => normalize(c.titulo) === targetNorm);
  if (exact) return exact;

  const prefixed = candidates.find((c) => normalize(c.titulo).startsWith(targetNorm + " "));
  if (prefixed) return prefixed;

  const targetTokens = new Set(targetNorm.split(" ").filter(Boolean));
  let best = null;
  let bestRatio = 0;
  for (const c of candidates) {
    const titleTokens = new Set(normalize(c.titulo).split(" ").filter(Boolean));
    const overlap = [...targetTokens].filter((t) => titleTokens.has(t)).length;
    const ratio = overlap / Math.min(targetTokens.size, titleTokens.size);
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = c;
    }
  }
  return bestRatio >= 0.8 ? best : null;
}

async function importFile(supabase, filePath, audioCandidates) {
  const filename = filePath.split("/").pop();
  const raw = readFileSync(filePath, "utf8");
  const { frontmatter, body } = splitFrontmatter(raw, filename);
  const sections = extractSections(body);

  const transcriptSection = sections.find((s) => s.data?.transcript)?.data?.transcript;
  if (!transcriptSection) throw new Error(`${filename}: no se encontró el bloque de transcript`);

  const exerciseSections = sections.filter((s) => /^Exercise\s+\d+/i.test(s.heading));
  const metadataSection = sections.find((s) => s.heading === "Metadata for platform integration");

  if (exerciseSections.length === 0) throw new Error(`${filename}: no se encontraron ejercicios`);
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

  const resource = findAudioResource(frontmatter.audio_title, audioCandidates);
  if (!resource) {
    throw new Error(
      `${filename}: no se encontró un recurso de audio para "${frontmatter.audio_title}" — este script solo enriquece audios ya subidos, no crea nuevos`,
    );
  }
  const resourceId = resource.id;

  const { error: transcriptError } = await supabase
    .from("resources")
    .update({ transcript: transcriptSection })
    .eq("id", resourceId);
  if (transcriptError) throw new Error(`${filename}: error guardando transcript — ${transcriptError.message}`);

  const items = exerciseSections.map((s, i) => {
    const type = TYPE_REMAP[s.data.type] ?? s.data.type;
    return {
      resource_id: resourceId,
      source_exercise_id: s.data.id,
      orden: i,
      type,
      title: titleFromHeading(s.heading),
      data: s.data,
    };
  });

  const { error: itemsError } = await supabase
    .from("exercise_items")
    .upsert(items, { onConflict: "resource_id,source_exercise_id" });
  if (itemsError) throw new Error(`${filename}: error insertando exercise_items — ${itemsError.message}`);

  console.log(
    `  ✓ ${filename} (audio_title: "${frontmatter.audio_title}") → resource ${resourceId} "${resource.titulo}" (transcript + ${items.length} ejercicios)`,
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

  const { data: audioCandidates, error: candidatesError } = await supabase
    .from("resources")
    .select("id, titulo")
    .eq("tipo", "audio");
  if (candidatesError) {
    console.error("Error cargando recursos de audio existentes:", candidatesError.message);
    process.exit(1);
  }

  console.log(`Cargando ${files.length} archivo(s) desde ${dir}\n`);

  let failed = 0;
  for (const filePath of files) {
    try {
      await importFile(supabase, filePath, audioCandidates ?? []);
    } catch (err) {
      failed += 1;
      console.error(`  ✗ ${err.message}`);
    }
  }

  console.log(`\n${files.length - failed}/${files.length} archivo(s) cargados correctamente.`);
  if (failed > 0) process.exit(1);
}

main();
