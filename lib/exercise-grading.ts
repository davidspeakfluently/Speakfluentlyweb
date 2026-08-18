/**
 * Normalización ligera para comparar respuestas de texto libre contra la
 * forma canónica del contenido: sin espacios extra, sin mayúsculas, sin
 * comillas curvas, sin puntuación final de oración. Deliberadamente sin
 * fuzzy matching — suficiente para drills de gramática A1 donde la forma
 * correcta es corta y no ambigua.
 */
export function normalizeAnswer(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .replace(/[.!?,;:]+$/g, "");
}

export function compareAnswers(given: string, correct: string): boolean {
  return normalizeAnswer(given) === normalizeAnswer(correct);
}
