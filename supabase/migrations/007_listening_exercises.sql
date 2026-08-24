-- Migración: transcript + ejercicios de listening sobre recursos de audio.
-- exercise_items/exercise_attempts ya no están restringidos a resources de
-- kind='ejercicio' — su resource_id nunca tuvo esa restricción, así que se
-- reutilizan tal cual para colgar ejercicios de un recurso de audio.

alter table public.resources
  add column if not exists transcript jsonb;

alter table public.exercise_items drop constraint if exists exercise_items_type_check;
alter table public.exercise_items
  add constraint exercise_items_type_check
  check (type in (
    'error_hunt', 'multiple_choice', 'odd_one_out', 'sequencing',
    'transformation_chain', 'rewrite_improve', 'dialogue_completion',
    'free_writing', 'opinion_response', 'gap_fill_dictation'
  ));
