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

async function importFile(supabase, filePath) {
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

  const { data: resource, error: findError } = await supabase
    .from("resources")
    .select("id")
    .eq("tipo", "audio")
    .eq("titulo", frontmatter.audio_title)
    .maybeSingle();
  if (findError) throw new Error(`${filename}: error buscando el recurso — ${findError.message}`);
  if (!resource) {
    throw new Error(
      `${filename}: no existe un recurso de audio con titulo "${frontmatter.audio_title}" — este script solo enriquece audios ya subidos, no crea nuevos`,
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

  console.log(`  ✓ ${filename} → resource ${resourceId} (transcript + ${items.length} ejercicios)`);
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

  console.log(`Cargando ${files.length} archivo(s) desde ${dir}\n`);

  let failed = 0;
  for (const filePath of files) {
    try {
      await importFile(supabase, filePath);
    } catch (err) {
      failed += 1;
      console.error(`  ✗ ${err.message}`);
    }
  }

  console.log(`\n${files.length - failed}/${files.length} archivo(s) cargados correctamente.`);
  if (failed > 0) process.exit(1);
}

main();
