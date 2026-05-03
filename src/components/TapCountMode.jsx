"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { addToTodayCountWithoutLog, appendLogEntryOnly } from "@/lib/storage";

/**
 * Full-screen tap mode: +1 updates today's total without logging each tap;
 * closing writes a single entry log line for the session total.
 */
export default function TapCountMode({ open, onClose, count, goal, onTick }) {
  const lastAt = useRef(0);
  const sessionTicksRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    sessionTicksRef.current = 0;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const closeAndFlush = useCallback(() => {
    const n = sessionTicksRef.current;
    sessionTicksRef.current = 0;
    if (n > 0) appendLogEntryOnly(n);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") closeAndFlush();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeAndFlush]);

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
      addToTodayCountWithoutLog(1);
      sessionTicksRef.current += 1;
      onTick?.();
    },
    [onTick]
  );

  if (!open || typeof document === "undefined") return null;

  const pct = goal > 0 ? Math.min((count / goal) * 100, 100) : 0;
  const metGoal = count >= goal;

  const overlay = (
    <div
      className="fixed inset-0 z-[200] isolate flex h-[100dvh] min-h-[100dvh] w-screen max-w-none touch-manipulation flex-col overflow-hidden overscroll-none bg-background select-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Tap to count"
      onPointerDown={handlePointerDown}
    >
      <div
        className="pointer-events-none absolute inset-0 min-h-full"
        style={{
          background:
            "radial-gradient(ellipse 110% 90% at 50% 15%, color-mix(in oklch, var(--color-brand) 22%, transparent) 0%, color-mix(in oklch, var(--color-brand) 7%, transparent) 42%, transparent 62%)",
        }}
        aria-hidden
      />

      <div className="relative z-20 flex shrink-0 justify-end px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <button
          type="button"
          data-tap-ui
          onPointerDown={(e) => e.stopPropagation()}
          onClick={closeAndFlush}
          className="flex size-11 items-center justify-center rounded-full border border-border/70 bg-card/90 text-foreground shadow-md ring-1 ring-foreground/[0.06] backdrop-blur-sm transition-colors hover:bg-muted/80"
          aria-label="Close tap count mode"
        >
          <X className="size-5" strokeWidth={2.5} />
        </button>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-6 pb-6">
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

  return createPortal(overlay, document.body);
}
