import type { Kind } from "@/lib/types";

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
  if (kind === "video") return "▶ vista previa del video";
  if (kind === "audio") return "♪ reproductor de audio";
  return "vista previa del documento";
}
