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

export type ExerciseRunnerResult = { points: number; of: number };
