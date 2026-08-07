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
      <div className="flex flex-col gap-1.5">
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
                "rounded px-3 py-[9px] text-left text-sm " +
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
