"use client";

import { Hand } from "lucide-react";

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
            className="group relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-foreground/10 bg-brand-muted shadow-md ring-2 ring-background transition-[transform,box-shadow,background-color,border-color] active:scale-[0.96] hover:border-brand/45 hover:bg-brand-muted/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Hand
              className="size-7 text-brand transition-transform group-hover:scale-105 group-active:scale-95"
              strokeWidth={2.25}
              aria-hidden
            />
          </button>
        )}
      </div>
    </header>
  );
}
