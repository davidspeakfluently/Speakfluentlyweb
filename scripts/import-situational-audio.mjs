#!/usr/bin/env node
// Carga en un solo paso: crea el resource de audio, sube el mp3 a Storage,
// y adjunta transcript + exercise_items — a diferencia de import-audios.mjs
// (solo crea+sube) e import-listening.mjs (solo enriquece un resource ya
// existente), este script hace las dos cosas para contenido que llega
// completamente nuevo (audio + script) al mismo tiempo.
//
// Reutiliza el patrón de "heredar nivel/related_resource_id de un recurso
// ya existente" de import-ejercicios.mjs/import-listening.mjs: cada audio
// situacional tiene un banco de vocabulario (tipo='vocab') ya publicado
// con el mismo tema — se reusa su título exacto (para verse como una sola
// familia en la biblioteca), su nivel, y se linkea como related_resource_id.
//
// La descripción SÍ se escribe a mano por tema (DESCRIPTIONS abajo) — no
// hay forma de derivarla del nombre del archivo, y el banco de vocabulario
// describe el PDF, no el audio.
//
// Uso:
//   node scripts/import-situational-audio.mjs "<carpeta-audios>" "<carpeta-scripts>"

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { extname, join, resolve } from "node:path";
import { load as parseYaml } from "js-yaml";

config({ path: ".env.local" });

const SCHEMA_VERSION = "1.0";
const AUTOR = "Teacher David Pa";
const TEMA = "Listening";
const BUCKET = "recursos";
const TYPE_REMAP = {
  listening_comprehension: "multiple_choice",
  vocabulary_context: "multiple_choice",
  reflection_response: "free_writing",
};
const TYPE_LABEL = {
  sequencing: "Sequencing",
  listening_comprehension: "Listening Comprehension",
  gap_fill_dictation: "Gap-Fill Dictation",
  vocabulary_context: "Vocabulary in Context",
  reflection_response: "Reflection Response",
  true_false: "True or False",
  minimal_pairs_practice: "Minimal Pairs Practice",
};

// Tanda actual: los 14 audios de Vocabulario Situacional.
const DESCRIPTIONS = {
  "Small Talk & Social Conversation":
    "Un audio narrando una conversación de small talk en una fiesta, con frases naturales para romper el hielo y conocer gente nueva.",
  "Asking for Directions":
    "Un audio narrando una situación real pidiendo indicaciones en la calle, con frases útiles para preguntar y entender direcciones.",
  "Public Transportation & Rideshares":
    "Un audio narrando un día usando transporte público y apps de viajes compartidos, con frases para comprar boletos y pedir ayuda.",
  "At the Restaurant":
    "Un audio narrando una cena completa en un restaurante, desde reservar mesa hasta pedir la cuenta.",
  "Ordering Food (Phone & Drive-Thru)":
    "Un audio narrando cómo pedir comida por teléfono y en un drive-thru, con frases clave para cada situación.",
  "Shopping for Clothes":
    "Un audio narrando una compra de ropa completa: probarte prendas, preguntar por tallas y hacer una devolución.",
  "Hair Salon & Personal Care":
    "Un audio narrando una visita a la peluquería, desde agendar la cita hasta pedir exactamente el corte que quieres.",
  "At the Bank":
    "Un audio narrando trámites bancarios reales: abrir una cuenta, usar el cajero y reportar un problema.",
  "Bookings & Appointments":
    "Un audio narrando cómo reservar un hotel y manejar citas que cambian de última hora.",
  "Customer Service & Complaints":
    "Un audio narrando cómo resolver un problema con un producto llamando a servicio al cliente.",
  "At the Doctor's":
    "Un audio narrando una consulta médica completa, desde agendar la cita hasta describir síntomas.",
  "Emergencies & Safety":
    "Un audio con frases clave para pedir ayuda en distintas situaciones de emergencia.",
  "Airport & Immigration":
    "Un audio narrando todo el proceso de un vuelo internacional, desde el check-in hasta la llegada.",
  "Travel Vocabulary":
    "Un audio narrando la planeación de un viaje y algunos imprevistos comunes en el camino.",
};

function parseArgs() {
  const audioDir = process.argv[2];
  const scriptDir = process.argv[3];
  if (!audioDir || !scriptDir) {
    console.error('Uso: node scripts/import-situational-audio.mjs "<carpeta-audios>" "<carpeta-scripts>"');
    process.exit(1);
  }
  return { audioDir: resolve(audioDir), scriptDir: resolve(scriptDir) };
}

function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function findByTitle(target, candidates) {
  const targetNorm = normalize(target);
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

function audioDurationMinutes(filePath) {
  const out = execFileSync("afinfo", [filePath], { encoding: "utf8" });
  const m = out.match(/estimated duration:\s*([\d.]+)\s*sec/);
  if (!m) throw new Error(`no se pudo leer la duración de ${filePath}`);
  return Math.max(1, Math.round(Number(m[1]) / 60));
}

function findAudioFile(audioTitle, audioDir) {
  const files = readdirSync(audioDir).filter((f) => extname(f) === ".mp3");
  const re = /^Audio #(\d+) — (.+?) Nivel (A1|A2|B1|B2)\s*\.mp3$/;
  for (const f of files) {
    const m = f.match(re);
    if (m && normalize(m[2]) === normalize(audioTitle)) return join(audioDir, f);
  }
  return null;
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

function titleFromHeading(heading, type) {
  const parts = heading.split("—");
  const afterDash = (parts.length > 1 ? parts.slice(1).join("—") : heading).trim();
  if (afterDash.startsWith("(") && afterDash.endsWith(")")) return TYPE_LABEL[type] ?? type;
  return afterDash;
}

async function importFile(supabase, filePath, audioDir, vocabCandidates, audioResourceCandidates) {
  const filename = filePath.split("/").pop();
  const raw = readFileSync(filePath, "utf8");
  const { frontmatter, body } = splitFrontmatter(raw, filename);
  const sections = extractSections(body);

  const transcript = sections.find((s) => s.data?.transcript)?.data?.transcript;
  if (!transcript) throw new Error(`${filename}: no se encontró el bloque de transcript`);

  const exerciseSections = sections.filter((s) => /^(?:Mini-)?Exercise\s+\d+/i.test(s.heading));
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
      console.warn(`  ! ${filename}: exercise_types_used del metadata no coincide con los tipos parseados`);
    }
  }

  const audioTitle = frontmatter.audio_title;
  const description = DESCRIPTIONS[audioTitle];
  if (!description) throw new Error(`${filename}: no hay descripción mapeada para "${audioTitle}" en DESCRIPTIONS`);

  const vocabMatch = findByTitle(audioTitle, vocabCandidates);
  if (!vocabMatch) {
    throw new Error(`${filename}: no se encontró un banco de vocabulario para heredar título/nivel de "${audioTitle}"`);
  }

  const audioFilePath = findAudioFile(audioTitle, audioDir);
  if (!audioFilePath) throw new Error(`${filename}: no se encontró el archivo .mp3 para "${audioTitle}"`);

  const resourceFields = {
    titulo: vocabMatch.titulo,
    descripcion: description,
    tipo: "audio",
    tema: TEMA,
    nivel: vocabMatch.nivel,
    autor: AUTOR,
    meta: `${audioDurationMinutes(audioFilePath)} minutos`,
    related_resource_id: vocabMatch.id,
  };

  const existing = audioResourceCandidates.find((c) => normalize(c.titulo) === normalize(vocabMatch.titulo));
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

  const slug = normalize(audioTitle).replace(/ /g, "-");
  const storagePath = `${resourceId}/${crypto.randomUUID()}-${slug}.mp3`;
  const fileBuffer = readFileSync(audioFilePath);
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, { contentType: "audio/mpeg", upsert: false });
  if (uploadError) throw new Error(`${filename}: error subiendo a Storage — ${uploadError.message}`);

  if (existing?.storage_path) await supabase.storage.from(BUCKET).remove([existing.storage_path]);

  const { error: pathError } = await supabase
    .from("resources")
    .update({ storage_path: storagePath, transcript })
    .eq("id", resourceId);
  if (pathError) throw new Error(`${filename}: error guardando storage_path/transcript — ${pathError.message}`);

  const items = exerciseSections.map((s, i) => {
    const type = TYPE_REMAP[s.data.type] ?? s.data.type;
    return {
      resource_id: resourceId,
      source_exercise_id: s.data.id,
      orden: i,
      type,
      title: titleFromHeading(s.heading, type),
      data: s.data,
    };
  });

  const { error: itemsError } = await supabase
    .from("exercise_items")
    .upsert(items, { onConflict: "resource_id,source_exercise_id" });
  if (itemsError) throw new Error(`${filename}: error insertando exercise_items — ${itemsError.message}`);

  console.log(
    `  ✓ ${filename} → resource ${resourceId} "${resourceFields.titulo}" (nivel: ${resourceFields.nivel}, ${resourceFields.meta}, ${items.length} ejercicios, related: "${vocabMatch.titulo}")`,
  );
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env.local");
    process.exit(1);
  }

  const { audioDir, scriptDir } = parseArgs();
  const files = readdirSync(scriptDir)
    .filter((f) => extname(f) === ".md" && f !== "README.md")
    .map((f) => join(scriptDir, f));

  if (files.length === 0) {
    console.error(`No se encontraron archivos .md en ${scriptDir}`);
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const [{ data: vocabCandidates, error: vocabError }, { data: audioCandidates, error: audioError }] =
    await Promise.all([
      supabase.from("resources").select("id, titulo, nivel").eq("tipo", "vocab"),
      supabase.from("resources").select("id, titulo, storage_path").eq("tipo", "audio"),
    ]);
  if (vocabError || audioError) {
    console.error("Error cargando recursos existentes:", vocabError?.message ?? audioError?.message);
    process.exit(1);
  }

  console.log(`Cargando ${files.length} archivo(s) desde ${scriptDir}\n`);

  let failed = 0;
  for (const filePath of files) {
    try {
      await importFile(supabase, filePath, audioDir, vocabCandidates ?? [], audioCandidates ?? []);
    } catch (err) {
      failed += 1;
      console.error(`  ✗ ${err.message}`);
    }
  }

  console.log(`\n${files.length - failed}/${files.length} archivo(s) cargados correctamente.`);
  if (failed > 0) process.exit(1);
}

main();
