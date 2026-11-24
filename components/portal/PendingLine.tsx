"use client";

import { useLinkStatus } from "next/link";

/** Línea ámbar que recorre la tarjeta mientras se abre el recurso (si tarda). */
export function PendingLine() {
  const { pending } = useLinkStatus();
  return <span aria-hidden="true" className={"sf-pending" + (pending ? " is-on" : "")} />;
}
