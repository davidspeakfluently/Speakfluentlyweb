import type { ReactNode } from "react";
import { LogoMark } from "@/components/Logo";

export function AppHeader({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-navy-2 bg-navy px-4 py-3 sm:flex-row sm:items-center sm:gap-6 sm:px-10 sm:py-[18px]">
      <div className="flex shrink-0 items-center gap-2.5">
        <LogoMark className="h-[26px] w-auto text-white" />
        <div className="text-[15px] font-bold tracking-[0.01em] text-white">
          Speakfluently <span className="font-medium text-slate">/ Recursos</span>
        </div>
      </div>
      {children}
    </div>
  );
}
