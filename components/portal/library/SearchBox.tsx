"use client";

import type { Ref } from "react";
import { Icon } from "@/components/portal/Icon";

/**
 * Buscador con la sugerencia escrita adentro, en letra tenue ("Prueba: …").
 * Con el campo vacío, → o Enter aceptan la sugerencia; Esc borra.
 */
export function SearchBox({
  id,
  variant,
  value,
  onChange,
  onAcceptHint,
  onClear,
  hintRef,
  inputRef,
  hidden = false,
}: {
  id: string;
  variant: "hero" | "bar";
  value: string;
  onChange: (v: string) => void;
  onAcceptHint: () => void;
  onClear: () => void;
  hintRef: (el: HTMLSpanElement | null) => void | (() => void);
  inputRef?: Ref<HTMLInputElement>;
  /** El buscador compacto queda fuera del orden de tabulación mientras no se ve. */
  hidden?: boolean;
}) {
  return (
    <div className={`sf-search sf-search--${variant}`} role="search">
      <Icon name="search" />
      <input
        ref={inputRef}
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            onClear();
          } else if ((e.key === "ArrowRight" || e.key === "Enter") && !value) {
            e.preventDefault();
            onAcceptHint();
          } else if (e.key === "Enter") {
            // En el celular, cierra el teclado para ver los resultados.
            e.currentTarget.blur();
          }
        }}
        placeholder=" "
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        aria-label="Buscar recursos por tema o palabra clave"
        tabIndex={hidden ? -1 : undefined}
      />
      <span className="sf-search__ph" aria-hidden="true">
        <span className="sf-search__pre">Prueba:</span> <span className="sf-search__hint" ref={hintRef} />
        <i className="sf-search__caret" />
      </span>
      {value ? (
        <button
          type="button"
          className="sf-search__clear"
          onClick={onClear}
          aria-label="Borrar búsqueda"
          tabIndex={hidden ? -1 : undefined}
        >
          <Icon name="x" />
        </button>
      ) : null}
      {variant === "hero" && (
        <kbd className="sf-search__kbd" aria-hidden="true">
          /
        </kbd>
      )}
    </div>
  );
}
