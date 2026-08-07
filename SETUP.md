# Setup — Portal de Recursos Speakfluently

## 1. Crear el proyecto en Supabase
1. Entra a [supabase.com](https://supabase.com) y crea una cuenta (o inicia sesión).
2. **New project** → elige un nombre (ej. `speakfluently-portal`), una contraseña de base de datos (guárdala) y la región más cercana.
3. Espera a que termine de aprovisionarse (~2 minutos).

## 2. Correr el esquema de base de datos
1. En el panel del proyecto, ve a **SQL Editor** → **New query**.
2. Copia y pega todo el contenido de [`supabase/schema.sql`](supabase/schema.sql) y ejecútalo (▶ Run). Esto crea las tablas (`profiles`, `resources`, `progress`), los triggers, las políticas de seguridad (RLS) y el bucket de storage `recursos`.
3. Opcional pero recomendado: copia y pega [`supabase/seed.sql`](supabase/seed.sql) y ejecútalo para precargar los 24 recursos de ejemplo (sin archivo — los subes después desde el panel admin).

## 3. Conseguir las API keys
1. Ve a **Project Settings → API**.
2. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (sección "Project API keys", botón "Reveal") → `SUPABASE_SERVICE_ROLE_KEY`
3. Duplica `.env.local.example` como `.env.local` en la raíz del proyecto y pega los 3 valores.

**Importante**: la `service_role key` tiene acceso total a tu base de datos sin restricciones (bypasea la seguridad RLS). Nunca la subas a git ni la compartas — por eso `.env.local` ya está en `.gitignore`.

## 4. Instalar dependencias y crear el primer admin
```bash
npm install
npm run create-admin
```
Te pedirá email, nombre y una contraseña inicial. Ese usuario queda con rol `admin` — es el dueño de la academia / profesores, y podrá entrar a `/admin` para gestionar estudiantes y recursos.

## 5. Levantar la app
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) — te redirige a `/login`. Entra con el admin que acabas de crear.

## 6. Flujo típico
- **Admin** entra en `/admin` → **Estudiantes** para crear las cuentas de tus alumnos (les asignas tú la contraseña inicial y se las compartes).
- **Admin** entra en `/admin` → **Recursos** para subir el material real (PDF, audio o video) reemplazando los recursos de ejemplo, o para agregar nuevos.
- **Estudiantes** inician sesión en `/login` con el email y contraseña que les diste, y navegan `/biblioteca`.

## Notas
- No hay registro público: solo el admin da de alta usuarios (`/admin/usuarios`). El link "¿Olvidaste tu contraseña?" del login es solo copy — el reset real lo hace el admin desde el panel.
- Los archivos se guardan en el bucket privado `recursos` de Supabase Storage. Nunca se exponen públicamente: todas las descargas/reproducciones pasan por URLs firmadas generadas en el servidor.
