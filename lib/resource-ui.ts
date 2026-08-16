import { FileText, Headphones, Music, Play, Video } from "lucide-react";
import type { Kind, Nivel } from "@/lib/types";

export function previewClassFor(kind: Kind) {
  if (kind === "video") {
    return "bg-[repeating-linear-gradient(135deg,#00043c,#00043c_12px,#060e4b_12px,#060e4b_24px)]";
  }
  if (kind === "audio") {
    return "bg-[repeating-linear-gradient(90deg,#152364,#152364_4px,#00043c_4px,#00043c_8px)]";
  }
  return "bg-[repeating-linear-gradient(45deg,#e1e1ef,#e1e1ef_14px,#b2c4d8_14px,#b2c4d8_28px)]";
}

export function previewLabelFor(kind: Kind) {
  if (kind === "video") return "Vista previa del video";
  if (kind === "audio") return "Reproductor de audio";
  return "Vista previa del documento";
}

/** Ícono usado dentro del placeholder de preview (detalle de recurso). */
export function previewIconFor(kind: Kind) {
  if (kind === "video") return Play;
  if (kind === "audio") return Music;
  return FileText;
}

/** Ícono usado en el badge de tipo de recurso (tarjetas, detalle). */
export function kindIconFor(kind: Kind) {
  if (kind === "video") return Video;
  if (kind === "audio") return Headphones;
  return FileText;
}

/** Clases de fondo/texto por nivel, derivadas de la paleta navy existente. */
export function nivelBadgeClassFor(nivel: Nivel) {
  if (nivel === "Avanzado") return "bg-nivel-avanzado-bg text-nivel-avanzado-text";
  if (nivel === "Intermedio") return "bg-nivel-intermedio-bg text-nivel-intermedio-text";
  return "bg-nivel-basico-bg text-nivel-basico-text";
}
