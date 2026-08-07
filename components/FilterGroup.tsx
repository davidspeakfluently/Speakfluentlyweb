import Link from "next/link";

export function FilterGroup({
  label,
  options,
  current,
  paramKey,
  searchParams,
}: {
  label: string;
  options: readonly string[];
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
          const active = current === option;
          const params = new URLSearchParams(
            Object.entries(searchParams).filter(([, v]) => v !== undefined) as [
              string,
              string,
            ][],
          );
          if (option === "Todos") params.delete(paramKey);
          else params.set(paramKey, option);
          const qs = params.toString();

          return (
            <Link
              key={option}
              href={qs ? `/biblioteca?${qs}` : "/biblioteca"}
              className={
                "shrink-0 whitespace-nowrap rounded px-3 py-[9px] text-left text-sm lg:shrink lg:whitespace-normal " +
                (active
                  ? "border border-accent bg-accent font-bold text-white"
                  : "border border-border bg-white font-medium text-navy")
              }
            >
              {option}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
