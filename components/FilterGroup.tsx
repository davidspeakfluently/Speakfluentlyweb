import Link from "next/link";

export interface FilterOption {
  value: string;
  label: string;
}

export function FilterGroup({
  label,
  options,
  current,
  paramKey,
  searchParams,
}: {
  label: string;
  options: FilterOption[];
  current: string;
  paramKey: string;
  searchParams: Record<string, string | undefined>;
}) {
  return (
    <div>
      <div className="mb-2.5 font-mono text-xs uppercase tracking-[0.06em] text-accent">
        {label}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {options.map((option) => {
          const active = current === option.value;
          const params = new URLSearchParams(
            Object.entries(searchParams).filter(([, v]) => v !== undefined) as [
              string,
              string,
            ][],
          );
          if (option.value === "Todos") params.delete(paramKey);
          else params.set(paramKey, option.value);
          const qs = params.toString();

          return (
            <Link
              key={option.value}
              href={qs ? `/biblioteca?${qs}` : "/biblioteca"}
              className={
                "shrink-0 whitespace-nowrap rounded-md px-3 py-[9px] text-left text-sm transition-colors duration-[var(--transition-hover)] lg:shrink lg:whitespace-normal " +
                (active
                  ? "border border-accent bg-accent font-bold text-white"
                  : "border border-border bg-white font-medium text-navy hover:border-slate")
              }
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
