"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function SearchInput({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setValue(defaultValue), [defaultValue]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setValue(next);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set("q", next);
      else params.delete("q");
      router.replace(`${pathname}?${params.toString()}`);
    }, 250);
  }

  return (
    <div className="relative max-w-[420px] flex-1">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Buscar por título…"
        className="w-full rounded-md border border-accent bg-navy-2 py-[11px] pr-4 pl-10 text-sm text-white outline-none transition-shadow duration-[var(--transition-hover)] focus:border-slate focus:shadow-[var(--shadow-card)]"
      />
    </div>
  );
}
