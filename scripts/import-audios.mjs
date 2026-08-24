#!/usr/bin/env node
// Carga audios "Short Story" (mp3) a resources + Storage. Sigue exactamente
// el patrón ya usado para los audios de Básico/Intermedio: tipo 'audio',
// tema 'Listening', meta '2 minutos', titulo "<Historia> - Short Story",
// storage_path "<resource_id>/<uuid>-audio-<n>-<slug>.mp3".
//
// El mapeo de qué estructura gramatical practica cada audio no se puede
// derivar del nombre del archivo — lo confirma el dueño cada vez. Editar
// STORY_TOPICS abajo para la siguiente tanda (ej. audios de B1).
//
// Uso:
//   node scripts/import-audios.mjs "<carpeta-con-mp3>" <Nivel>

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";

config({ path: ".env.local" });

const AUTOR = "Teacher David Pa";
const TEMA = "Listening";
const META = "2 minutos";
const BUCKET = "recursos";

// Tanda actual: los 8 audios de B2 (nivel Avanzado), con la estructura
// gramatical que practica cada uno, confirmada por el dueño.
const STORY_TOPICS = {
  "Getting Things Done": "la estructura causativa (have/get something done)",
  "Setting the Record Straight": "oraciones hendidas (cleft sentences) para dar énfasis",
  "Projecting My Future": "future perfect y future continuous",
  "An Experience I'll Never Forget": "inversión para dar énfasis",
  "A Difficult Decision at Work": "conectores avanzados de contraste y consecuencia",
  "How My Past Explains My Present": "condicionales mixtos",
  "What If I Had Chosen Differently?": "el tercer condicional",
  "Wishes and Regrets": "wish / if only",
};

function parseArgs() {
  const dir = process.argv[2];
  const nivel = process.argv[3];
  if (!dir || !nivel) {
    console.error('Uso: node scripts/import-audios.mjs "<carpeta-con-mp3>" <Nivel>');
    process.exit(1);
  }
  if (!["Básico", "Intermedio", "Avanzado"].includes(nivel)) {
    console.error(`Nivel "${nivel}" inválido — debe ser Básico, Intermedio o Avanzado.`);
    process.exit(1);
  }
  return { dir: resolve(dir), nivel };
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseFilename(filename) {
  const m = filename.match(/^Audio #(\d+) \([^)]+\) [-—] Short Story "(.+)"\.mp3$/);
  if (!m) return null;
  return { n: Number(m[1]), title: m[2] };
}

async function importFile(supabase, filePath, nivel) {
  const filename = filePath.split("/").pop();
  const parsed = parseFilename(filename);
  if (!parsed) throw new Error(`${filename}: nombre de archivo no coincide con el patrón esperado`);

  const { n, title } = parsed;
  const topic = STORY_TOPICS[title];
  if (!topic) throw new Error(`${filename}: no hay tema gramatical mapeado para "${title}" en STORY_TOPICS`);

  const titulo = `${title} - Short Story`;
  const descripcion = `Una historia corta, practicando ${topic}.`;

  const { data: existing } = await supabase
    .from("resources")
    .select("id, storage_path")
    .eq("tipo", "audio")
    .eq("titulo", titulo)
    .maybeSingle();

  const resourceFields = {
    titulo,
    descripcion,
    tipo: "audio",
    tema: TEMA,
    nivel,
    autor: AUTOR,
    meta: META,
  };

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

  const storagePath = `${resourceId}/${crypto.randomUUID()}-audio-${n}-${slugify(title)}.mp3`;
  const fileBuffer = readFileSync(filePath);
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, { contentType: "audio/mpeg", upsert: false });
  if (uploadError) throw new Error(`${filename}: error subiendo a Storage — ${uploadError.message}`);

  if (existing?.storage_path) {
    await supabase.storage.from(BUCKET).remove([existing.storage_path]);
  }

  const { error: pathError } = await supabase
    .from("resources")
    .update({ storage_path: storagePath })
    .eq("id", resourceId);
  if (pathError) throw new Error(`${filename}: error guardando storage_path — ${pathError.message}`);

  console.log(`  ✓ ${filename} → resource ${resourceId} (${titulo})`);
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env.local");
    process.exit(1);
  }

  const { dir, nivel } = parseArgs();
  const files = readdirSync(dir)
    .filter((f) => extname(f) === ".mp3")
    .map((f) => join(dir, f));

  if (files.length === 0) {
    console.error(`No se encontraron archivos .mp3 en ${dir}`);
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Cargando ${files.length} archivo(s) desde ${dir} (nivel: ${nivel})\n`);

  let failed = 0;
  for (const filePath of files) {
    try {
      await importFile(supabase, filePath, nivel);
    } catch (err) {
      failed += 1;
      console.error(`  ✗ ${err.message}`);
    }
  }

  console.log(`\n${files.length - failed}/${files.length} archivo(s) cargados correctamente.`);
  if (failed > 0) process.exit(1);
}

main();
