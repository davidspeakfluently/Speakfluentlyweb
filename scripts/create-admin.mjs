#!/usr/bin/env node
// Bootstrap del primer usuario admin. No hay registro público, así que
// este script usa la service role key directamente contra la Admin API
// de Supabase Auth. Solo hace falta correrlo una vez.
//
// Uso:
//   npm run create-admin -- --email tu@correo.com --nombre "David" --password "unaClaveSegura"
// o de forma interactiva, sin flags.

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, "");
    out[key] = args[i + 1];
  }
  return out;
}

async function prompt(rl, question, hidden = false) {
  if (!hidden) return rl.question(question);
  // readline/promises no soporta input oculto nativo; suficiente para un
  // script de bootstrap de un solo uso.
  return rl.question(question);
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env.local",
    );
    process.exit(1);
  }

  const args = parseArgs();
  const rl = readline.createInterface({ input: stdin, output: stdout });

  const email = args.email || (await prompt(rl, "Email del admin: "));
  const nombre = args.nombre || (await prompt(rl, "Nombre a mostrar: "));
  const password =
    args.password || (await prompt(rl, "Contraseña inicial (mín. 8 caracteres): ", true));

  rl.close();

  if (!email || !nombre || !password || password.length < 8) {
    console.error("Datos inválidos: revisa email, nombre y que la contraseña tenga 8+ caracteres.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: nombre, role: "admin" },
  });

  if (error) {
    console.error("Error creando el usuario:", error.message);
    process.exit(1);
  }

  console.log(`Admin creado: ${data.user.email} (id: ${data.user.id})`);
  console.log("El perfil se crea automáticamente vía trigger (role: admin).");
  console.log("Ya puedes iniciar sesión en /login con este email y contraseña.");
}

main();
