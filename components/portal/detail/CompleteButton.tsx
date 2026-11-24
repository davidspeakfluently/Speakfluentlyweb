"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toggleCompleted } from "@/lib/actions/progress";
import { setDoneOverride } from "@/lib/portal/client-store";
import { Icon } from "@/components/portal/Icon";

/** Marca el recurso como completado al instante; el servidor confirma por detrás. */
export function CompleteButton({ resourceId, completed }: { resourceId: string; completed: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(completed);
  const [pending, startTransition] = useTransition();
  const [pop, setPop] = useState(false);

  return (
    <button
      type="button"
      className={"sf-btn-line" + (optimistic ? " is-done" : "") + (pop ? " just-done" : "")}
      aria-pressed={optimistic}
      aria-busy={pending}
      onClick={() => {
        if (pending) return;
        const next = !optimistic;
        setDoneOverride(resourceId, next);
        setPop(next);
        startTransition(async () => {
          setOptimistic(next);
          await toggleCompleted(resourceId);
        });
      }}
      onAnimationEnd={() => setPop(false)}
    >
      <span className="sf-done-ic">
        <Icon name="check" />
      </span>
      {optimistic ? "Completado" : "Marcar como completado"}
    </button>
  );
}
