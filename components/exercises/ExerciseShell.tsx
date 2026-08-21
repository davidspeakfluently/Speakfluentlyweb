import { useState, type ReactNode } from "react";

export function ExerciseShell({
  number,
  title,
  instructions,
  children,
}: {
  number: number;
  title: string;
  instructions: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-5 sm:p-6">
      <div className="mb-1 font-mono text-xs uppercase tracking-[0.06em] text-accent">
        Ejercicio {number} · {title}
      </div>
      <p className="mb-4 text-[13px] leading-[1.5] text-slate">{instructions}</p>
      {children}
    </div>
  );
}

/**
 * Fila de acciones compartida por los runners auto-calificables. "Verificar"
 * queda disponible mientras queden campos sin resolver, para que el
 * estudiante pueda corregirse solo — esto es práctica, no examen. "Ver
 * respuesta" solo aparece tras un primer intento fallido, y es lo único que
 * revela la respuesta correcta/explicación (antes de eso, un campo
 * incorrecto solo se marca en rojo, sin decir cuál es la respuesta).
 */
export function VerifyRow({
  onVerify,
  onReveal,
  verifyDisabled,
  showReveal,
  revealed,
}: {
  onVerify: () => void;
  onReveal: () => void;
  verifyDisabled?: boolean;
  showReveal: boolean;
  revealed: boolean;
}) {
  if (revealed) return null;
  return (
    <div className="mt-4 flex items-center gap-4">
      <button
        type="button"
        onClick={onVerify}
        disabled={verifyDisabled}
        className="rounded-md border border-border bg-white px-5 py-2.5 text-sm text-navy transition-colors duration-[var(--transition-hover)] hover:border-slate disabled:cursor-not-allowed disabled:opacity-50"
      >
        Verificar
      </button>
      {showReveal && (
        <button
          type="button"
          onClick={onReveal}
          className="text-xs text-slate underline decoration-dotted hover:text-accent"
        >
          Ver la respuesta
        </button>
      )}
    </div>
  );
}

/**
 * Bloque de autoevaluación compartido por los tipos de respuesta abierta
 * (rewrite_improve, opinion_response, free_writing, dialogue_completion's
 * blanks libres). A diferencia de VerifyRow, no hay "incorrecto, reintenta"
 * — no hay forma de saber objetivamente si el texto libre está mal, así que
 * el flujo es: escribir → "Comparar con el ejemplo" revela la referencia →
 * el propio estudiante se marca.
 */
export function SelfAssessBlock({
  value,
  onChange,
  placeholder,
  compareLabel,
  example,
  marked,
  onMark,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  compareLabel: string;
  example: string;
  marked: boolean | null;
  onMark: (correct: boolean) => void;
}) {
  // `revealed` (¿ya se mostró el ejemplo?) es un paso previo y separado de
  // `marked` (el veredicto final del estudiante) — revelar el ejemplo NO
  // debe, por sí solo, contar como una autoevaluación.
  const [revealed, setRevealed] = useState(false);

  return (
    <div>
      <textarea
        value={value}
        disabled={revealed}
        onChange={(ev) => onChange(ev.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-y rounded border border-border bg-white px-3 py-2 text-sm text-navy outline-none focus:border-accent disabled:bg-bg"
      />

      {!revealed && (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          disabled={value.trim() === ""}
          className="mt-3 rounded-md border border-border bg-white px-5 py-2.5 text-sm text-navy transition-colors duration-[var(--transition-hover)] hover:border-slate disabled:cursor-not-allowed disabled:opacity-50"
        >
          {compareLabel}
        </button>
      )}

      {revealed && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="rounded-md bg-bg p-3 text-sm text-navy">
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-accent">Ejemplo</span>
            <p className="mt-1">{example}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate">¿Cómo te fue?</span>
            <button
              type="button"
              onClick={() => onMark(true)}
              className={
                "rounded-md border px-4 py-2 text-sm transition-colors duration-[var(--transition-hover)] " +
                (marked === true
                  ? "border-success bg-success/10 text-success"
                  : "border-border bg-white text-navy hover:border-success")
              }
            >
              Lo hice bien
            </button>
            <button
              type="button"
              onClick={() => onMark(false)}
              className={
                "rounded-md border px-4 py-2 text-sm transition-colors duration-[var(--transition-hover)] " +
                (marked === false
                  ? "border-danger bg-danger/10 text-danger"
                  : "border-border bg-white text-navy hover:border-danger")
              }
            >
              Necesito practicar más
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ResultSummary({ points, of }: { points: number; of: number }) {
  const ok = points === of;
  return (
    <div
      className={
        "mt-4 rounded-md border px-4 py-2.5 text-sm font-semibold " +
        (ok ? "border-success bg-success/10 text-success" : "border-danger bg-danger/10 text-danger")
      }
    >
      {points}/{of} correcto{of === 1 ? "" : "s"}
    </div>
  );
}
