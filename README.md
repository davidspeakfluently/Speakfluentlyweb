# Handoff: Portal de Recursos Speakfluently

## Overview
Portal web para que estudiantes de la academia Speakfluently accedan a material de apoyo (cartillas, guías, listas de vocabulario, ejercicios, notas de voz y videos) organizado por nivel, tema y tipo. Incluye login de estudiantes, biblioteca con filtros/búsqueda, y vista de detalle de cada recurso con recursos relacionados.

## Sobre los archivos de diseño
El archivo incluido (`Speakfluently Portal.dc.html`) es un **prototipo de referencia de diseño**, construido en HTML/React con datos de ejemplo (hardcodeados) y sin backend real. No es código de producción para copiar tal cual. La tarea es **recrear esta experiencia en una aplicación real con backend**, usando el stack que elijas (recomendado: Next.js + una base de datos como Supabase/Postgres, por simplicidad de auth + storage + hosting integrados). Este prototipo no tiene login real, no sube archivos, y no persiste nada — es la referencia visual y de flujo.

## Fidelidad
**Alta fidelidad (hifi)**: colores, tipografía, spacing y layout están definidos y deben respetarse. El copy (textos) del prototipo es final, en español, tono cercano y motivador — mantenerlo tal cual salvo que el usuario pida cambiarlo.

## Esto NO es solo una interfaz — requiere backend
El prototipo resuelve la cara visual. Para que funcione de verdad, Claude Code debe construir:

1. **Autenticación real** con roles: `admin` (el dueño de la academia y profesores) y `estudiante`.
2. **Panel de administración** donde el admin cree/edite/elimine usuarios estudiantes y les asigne contraseña inicial (o envíe invitación por email).
3. **Carga de archivos**: profesores y admin deben poder subir PDFs, audios y videos (no solo linkear datos de ejemplo). Recomendado: storage tipo S3/Supabase Storage/Cloudinary según el stack elegido.
4. **CRUD de recursos**: crear/editar/eliminar cada recurso con sus metadatos (título, descripción, tipo, tema, nivel, autor).
5. **Persistencia**: base de datos relacional simple (usuarios, recursos, tal vez progreso del estudiante si se quiere marcar "completado").
6. **Permisos**: estudiantes solo ven/leen recursos; profesores/admin pueden crear y editar.

## Pantallas

### 1. Login
- **Propósito**: autenticar estudiante o staff.
- **Layout**: grid de 2 columnas a pantalla completa. Columna izquierda panel de marca (fondo `#00043c`), columna derecha formulario sobre fondo `#e1e1ef`.
- **Panel izquierdo**: logo "Speakfluently" (mono, mayúsculas, tracking amplio, color `#b2c4d8`) + subtítulo "Academia de inglés online" (`#e1e1ef`). Titular grande (40px/700, blanco): "Todo tu material de práctica, en un solo lugar." + párrafo de apoyo (`#b2c4d8`, 17px). Dos círculos decorativos sutiles (no gradientes).
- **Formulario**: título "Bienvenido de nuevo" (26px/700) + subtítulo. Campos "Usuario" y "Contraseña" (label mono mayúscula 12px color `#152364`, input con borde `#b2c4d8`, radio 4px). Botón primario "Entrar a mis recursos" (fondo `#152364`, hover `#00043c`, texto blanco). Link secundario "¿Olvidaste tu contraseña? Contacta a tu profesor" (`#6687bb`).
- **Comportamiento real necesario**: validar contra base de datos, manejar error de credenciales inválidas, recuperación de contraseña real (no solo un link decorativo).

### 2. Biblioteca de recursos
- **Propósito**: explorar y filtrar el material.
- **Header sticky**: fondo `#00043c`, logo + separador "/ Recursos", buscador central (placeholder "Buscar por título…", fondo `#060e4b`, borde `#152364`), nombre de usuario a la derecha (mono, `#b2c4d8`).
- **Layout body**: grid `240px | 1fr`, max-width 1400px centrado, padding 40px.
- **Sidebar de filtros** (single-select por grupo): Nivel (Todos/Básico/Intermedio/Avanzado), Tema (Todos + 6 temas: Gramática, Vocabulario, Conversación, Pronunciación, Business English, Viajes), Tipo de recurso (Todos + Cartilla/Guía/Vocabulario/Ejercicio/Video/Nota de voz). Pills en columna: activo = fondo `#152364` texto blanco; inactivo = fondo blanco borde `#b2c4d8` texto `#00043c`.
- **Grid de tarjetas**: `repeat(auto-fill, minmax(260px,1fr))`, gap 18px. Cada tarjeta: fondo blanco, borde `#b2c4d8`, radio 4px, padding 20px, hover eleva 2px + sombra suave. Contenido: chip de tipo (mono 11px, fondo `#152364`, texto blanco) + nivel (mono, `#6687bb`) arriba; título 16px/700; descripción 13px `#152364`; línea de meta (tema · páginas/duración) 12px `#6687bb`.
- **Sin resultados**: mensaje centrado en `#6687bb`.
- **Comportamiento real necesario**: filtros y búsqueda deben consultar la base de datos (no un array en memoria); paginación si la biblioteca crece mucho.

### 3. Detalle de recurso
- **Header**: igual al de biblioteca + botón "← Volver a la biblioteca" a la derecha.
- **Layout**: grid `1fr 300px`, max-width 1400px, padding 40px.
- **Columna principal**: chips de tipo/nivel/tema, título 30px/800, descripción, línea "Por {autor} · {meta}". Bloque de preview (fondo con patrón a rayas como placeholder — para video patrón diagonal oscuro con "▶ vista previa del video", para audio patrón de barras con "♪ reproductor de audio", para documentos patrón diagonal claro con "vista previa del documento"). Debajo, botones "Descargar PDF" / "Ver video completo" / "Reproducir audio" (según tipo, fondo `#152364`) y "Marcar como completado" (secundario, borde).
- **Sidebar**: "También te puede servir" — hasta 3 recursos del mismo tema en tarjetas compactas clicables.
- **Comportamiento real necesario**: el bloque de preview debe reproducir el archivo real (visor de PDF embebido, reproductor de video/audio) en vez del placeholder rayado; el botón de descarga debe servir el archivo real desde storage; "marcar como completado" debe persistir el progreso del estudiante.

## Design tokens
- **Colores**: `#00043c` (navy primario, fondos de header/panel), `#060e4b` (navy secundario, fondos de input en header), `#152364` (acento/botones/activos), `#6687bb` (texto secundario, bordes activos, meta), `#b2c4d8` (bordes neutros, texto claro), `#e1e1ef` (fondo general de la app).
- **Tipografía**: Manrope (400/500/600/700/800) para todo el texto de UI y contenido; IBM Plex Mono (400/500/600) para labels, chips, metadatos y elementos "de sistema" (mayúsculas, tracking amplio).
- **Radios**: 4px en inputs/botones/tarjetas, 6px en el bloque de preview.
- **Sombra hover de tarjeta**: `0 8px 20px rgba(0,4,60,0.12)`.

## Datos de ejemplo incluidos (para poblar la base de datos inicial)
El prototipo trae 24 recursos de ejemplo con título, descripción, tipo, tema, nivel, autor y metadato — están en la constante `RESOURCES` dentro del archivo `.dc.html`. Úsalos como semilla (seed data) real al montar la base de datos, o pide al usuario que suba su material real de una vez.

## Archivos
- `Speakfluently Portal.dc.html` — prototipo completo (login + biblioteca + detalle) con datos de ejemplo, sin backend.
