"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ExerciseItem, Transcript } from "@/lib/types";
import { ExerciseWorkbookRunner } from "@/components/exercises/ExerciseWorkbookRunner";

export function ListeningExercises({
  resourceId,
  transcript,
  items,
}: {
  resourceId: string;
  transcript: Transcript | null;
  items: ExerciseItem[];
}) {
  const [showTranscript, setShowTranscript] = useState(false);

  if (!transcript && items.length === 0) return null;

  // Cuando el transcript viene dividido en secciones (varios clips
  // independientes en un solo archivo de audio, ej. "Warm-Up Diario") y hay
  // un ejercicio por sección, se etiqueta cada ejercicio con el número de
  // sección correspondiente — así queda clara la asociación sin necesitar
  // un toggle de transcript por clip.
  const sections = transcript?.sections;
  const labelBySection = sections && sections.length === items.length;
  const displayItems = labelBySection
    ? items.map((item, i) => ({ ...item, title: `Clip ${i + 1} — ${sections[i].section_title} · ${item.title}` }))
    : items;

  return (
    <div className="mt-8 flex flex-col gap-6">
      {transcript && (
        <div className="rounded-lg border border-border bg-white">
          <button
            type="button"
            onClick={() => setShowTranscript((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-5 py-4 text-sm font-semibold text-navy"
          >
            {showTranscript ? "Ocultar transcript" : "Mostrar transcript"}
            {showTranscript ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-slate" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-slate" />
            )}
          </button>
          {showTranscript && (
            <div className="border-t border-border px-5 py-4">
              {transcript.note && <p className="mb-3 text-xs italic text-slate">{transcript.note}</p>}

              {sections ? (
                <div className="flex flex-col gap-4">
                  {sections.map((section, i) => (
                    <div key={i}>
                      <div className="mb-1 font-mono text-xs uppercase tracking-[0.06em] text-accent">
                        {section.section_title}
                      </div>
                      <p className="whitespace-pre-line text-sm leading-[1.7] text-navy">{section.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="whitespace-pre-line text-sm leading-[1.7] text-navy">{transcript.text}</p>
              )}

              {transcript.key_vocabulary.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 font-mono text-xs uppercase tracking-[0.06em] text-accent">
                    Vocabulario clave
                  </div>
                  <ul className="flex flex-col gap-1">
                    {transcript.key_vocabulary.map((v, i) => (
                      <li key={i} className="text-sm text-slate">
                        {v}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {items.length > 0 && (
        <div>
          <p className="mb-5 text-sm text-slate">
            Escucha el audio completo primero, sin ver el transcript. Responde los ejercicios de
            memoria. Puedes reescuchar antes de revisar el transcript.
          </p>
          <ExerciseWorkbookRunner resourceId={resourceId} items={displayItems} />
        </div>
      )}
    </div>
  );
}
