"use client";

import { useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * Full-screen minimal mode: each tap (except the close control) adds +1 to today via `onTap`.
 */
export default function TapCountMode({ open, onClose, count, goal, onTap }) {
  const lastAt = useRef(0);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handlePointerDown = useCallback(
    (e) => {
      const t = e.target;
      if (t instanceof Element && t.closest("[data-tap-ui]")) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const now = performance.now();
      if (now - lastAt.current < 32) return;
      lastAt.current = now;
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(6);
        } catch {
          /* ignore */
        }
      }
      onTap();
    },
    [onTap]
  );

  if (!open) return null;

  const pct = goal > 0 ? Math.min((count / goal) * 100, 100) : 0;
  const metGoal = count >= goal;

  return (
    <div
      className="fixed inset-0 z-[100] isolate flex touch-manipulation flex-col bg-background select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Tap to count"
      onPointerDown={handlePointerDown}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 110% 90% at 50% 15%, color-mix(in oklch, var(--color-brand) 22%, transparent) 0%, color-mix(in oklch, var(--color-brand) 7%, transparent) 42%, transparent 62%)",
        }}
        aria-hidden
      />

      <div className="relative z-20 flex justify-end px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <button
          type="button"
          data-tap-ui
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-full border border-border/70 bg-card/90 text-foreground shadow-md ring-1 ring-foreground/[0.06] backdrop-blur-sm transition-colors hover:bg-muted/80"
          aria-label="Close tap count mode"
        >
          <X className="size-5" strokeWidth={2.5} />
        </button>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <p className="pointer-events-none text-[clamp(3.25rem,18vw,5.5rem)] font-black tabular-nums leading-none tracking-tighter text-foreground">
          {count.toLocaleString()}
        </p>

        <div className="pointer-events-none w-full max-w-[14rem] space-y-2">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-foreground/[0.08] ring-1 ring-inset ring-foreground/[0.06]">
            <div
              className={
                metGoal
                  ? "h-full rounded-full bg-foreground transition-[width] duration-300 ease-out"
                  : "h-full rounded-full bg-gradient-to-r from-brand via-orange-500 to-foreground transition-[width] duration-300 ease-out"
              }
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {metGoal ? "Goal reached" : `${Math.round(pct)}% of ${goal.toLocaleString()}`}
          </p>
        </div>

        <p className="pointer-events-none max-w-[16rem] text-center text-xs font-medium leading-relaxed text-muted-foreground">
          Tap anywhere to add one.
        </p>
      </div>
    </div>
  );
}
