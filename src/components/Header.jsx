"use client";

import { Sparkles } from "lucide-react";

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default function Header({ onOpenTapMode }) {
  return (
    <header className="space-y-1 px-0.5 pt-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Today
          </p>
          <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight text-foreground">Sumiran</h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{formatToday()}</p>
        </div>
        {onOpenTapMode && (
          <button
            type="button"
            onClick={onOpenTapMode}
            aria-label="Open tap to count"
            className="group relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-gradient-to-b from-card to-muted/20 shadow-[0_10px_30px_-18px_rgba(30,20,15,0.16)] ring-1 ring-foreground/[0.04] transition-[transform,box-shadow,border-color] active:scale-[0.97] hover:border-border hover:shadow-[0_14px_38px_-18px_rgba(30,20,15,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span
              className="pointer-events-none absolute inset-0 opacity-[0.35] transition-opacity group-hover:opacity-50"
              style={{
                background:
                  "radial-gradient(circle at 32% 22%, color-mix(in oklch, var(--color-brand) 14%, transparent) 0%, transparent 55%)",
              }}
              aria-hidden
            />
            <span
              className="pointer-events-none absolute inset-[2px] rounded-full ring-1 ring-inset ring-foreground/[0.05]"
              aria-hidden
            />
            <Sparkles
              className="relative size-[1.375rem] text-muted-foreground transition-[color,transform] group-hover:text-foreground/65 group-hover:scale-[1.04] group-active:scale-[0.98]"
              strokeWidth={1.15}
              aria-hidden
            />
          </button>
        )}
      </div>
    </header>
  );
}
