import type { ReactNode } from "react";

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

export function VerifyButton({
  onClick,
  disabled,
  verified,
}: {
  onClick: () => void;
  disabled?: boolean;
  verified: boolean;
}) {
  if (verified) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-4 rounded-md border border-border bg-white px-5 py-2.5 text-sm text-navy transition-colors duration-[var(--transition-hover)] hover:border-slate disabled:cursor-not-allowed disabled:opacity-50"
    >
      Verificar
    </button>
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
