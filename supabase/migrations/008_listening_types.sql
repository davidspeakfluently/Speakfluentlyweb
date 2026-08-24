-- Migración: dos tipos de ejercicio nuevos que aparecen en la segunda tanda
-- de contenido de listening — true_false (auto-calificable) y
-- minimal_pairs_practice (práctica de pronunciación sin respuesta que
-- calificar, se marca como "practicado").

alter table public.exercise_items drop constraint if exists exercise_items_type_check;
alter table public.exercise_items
  add constraint exercise_items_type_check
  check (type in (
    'error_hunt', 'multiple_choice', 'odd_one_out', 'sequencing',
    'transformation_chain', 'rewrite_improve', 'dialogue_completion',
    'free_writing', 'opinion_response', 'gap_fill_dictation',
    'true_false', 'minimal_pairs_practice'
  ));
