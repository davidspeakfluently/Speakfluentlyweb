-- Migración: nuevo tipo de ejercicio 'opinion_response' (introducido por los
-- cuadernillos de nivel A2 — no existía en los de A1). Es un tipo de
-- respuesta abierta, igual que rewrite_improve/dialogue_completion/
-- free_writing: cae automáticamente en la rama "Próximamente" del
-- ExerciseWorkbookRunner sin necesitar cambios de UI.

alter table public.exercise_items drop constraint if exists exercise_items_type_check;
alter table public.exercise_items
  add constraint exercise_items_type_check
  check (type in (
    'error_hunt', 'multiple_choice', 'odd_one_out', 'sequencing',
    'transformation_chain', 'rewrite_improve', 'dialogue_completion',
    'free_writing', 'opinion_response'
  ));
