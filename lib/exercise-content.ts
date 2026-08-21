// Formas exactas de `exercise_items.data` para los 5 tipos auto-calificables
// construidos en esta fase. Reflejan verbatim el YAML de los cuadernillos
// fuente (ver /Ejercicios/Ejercicios A1/*.md) — no adivinar campos nuevos.

export type ErrorHuntData = {
  instructions: string;
  text: string;
  errors: { wrong: string; correct: string; explanation: string }[];
  scoring: { points_per_correct_find: number; total_points: number };
};

export type MultipleChoiceData = {
  instructions: string;
  index_base: number;
  questions: { id: number; question: string; options: string[]; correct_index: number }[];
};

export type OddOneOutData = {
  instructions: string;
  index_base: number;
  groups: {
    id: number;
    items: string[];
    odd_index: number;
    shared_use: string;
    odd_use: string;
  }[];
};

export type SequencingData = {
  instructions: string;
  items_shuffled: { id: string; text: string }[];
  correct_order: string[];
};

export type TransformationField = "negative" | "question" | "short_answer";

export type TransformationChainData = {
  instructions: string;
  example: { base: string; negative: string; question: string; short_answer: string };
  items: { id: number; base: string; negative: string; question: string; short_answer: string }[];
  input_fields_per_item: TransformationField[];
};

export type ExerciseRunnerResult = { points: number; of: number; selfAssessed?: boolean };

// Formas de `exercise_items.data` para los 4 tipos de respuesta abierta —
// sin comparación exacta posible, calificados por autoevaluación del propio
// estudiante en vez de comparación de texto.

export type RewriteImproveData = {
  instructions: string;
  items: { id: number; original: string; improved_example: string }[];
};

export type OpinionResponseData = {
  instructions: string;
  prompts: {
    id: number;
    statement: string;
    target_structure_hint: string;
    model_answer: string;
  }[];
};

export type FreeWritingData = {
  instructions: string;
  prompt: string;
  requirements: string[];
  min_sentences: number;
  max_sentences: number;
  model_answer: string;
};

export type DialogueBlankFixed = { id: string; type: "fixed"; correct_answer: string };
export type DialogueBlankFree = {
  id: string;
  type: "free";
  prompt_es: string;
  sample_answer: string;
  must_include: string[];
  grading_note: string;
};

export type DialogueCompletionData = {
  instructions: string;
  lines: { speaker: string; text: string }[];
  blanks: (DialogueBlankFixed | DialogueBlankFree)[];
};
