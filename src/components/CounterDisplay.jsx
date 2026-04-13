"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function CounterDisplay({ count, goal, allTimeTotal, onGoalSave }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(String(goal));

  const pct = Math.min((count / goal) * 100, 100);
  const metGoal = count >= goal;

  useEffect(() => {
    if (open) setDraft(String(goal));
  }, [open, goal]);

  const parsedDraft = parseInt(String(draft).replace(/,/g, ""), 10);
  const draftValid = Number.isFinite(parsedDraft) && parsedDraft >= 1;

  function handleSave() {
    if (draftValid) {
      onGoalSave(parsedDraft);
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="relative isolate rounded-[1.75rem] border border-border/60 bg-card p-7 shadow-[0_20px_50px_-24px_rgba(30,20,15,0.18)]">
        {/*
          Safari: filter:blur() draws outside overflow:hidden + border-radius. Use a CSS-only
          radial gradient (no filter) so nothing paints past the rounded rect.
        */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[1.75rem]"
          style={{
            background:
              "radial-gradient(ellipse 110% 85% at 100% 0%, color-mix(in oklch, var(--color-brand) 26%, transparent) 0%, color-mix(in oklch, var(--color-brand) 8%, transparent) 44%, transparent 64%)",
          }}
          aria-hidden
        />
        <div className="relative z-10 flex flex-col items-center gap-5">
          <p className="text-[clamp(3rem,14vw,4.25rem)] font-black tabular-nums leading-none tracking-tighter text-foreground">
            {count.toLocaleString()}
          </p>

          <div className="w-full max-w-[17rem] space-y-2.5">
            <div className="h-4 w-full overflow-hidden rounded-full bg-foreground/[0.07] ring-1 ring-inset ring-foreground/[0.06]">
              <div
                className={
                  metGoal
                    ? "h-full rounded-full bg-foreground transition-[width] duration-500 ease-out"
                    : "h-full rounded-full bg-gradient-to-r from-brand via-orange-500 to-foreground transition-[width] duration-500 ease-out"
                }
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-end justify-between gap-2 text-xs font-medium">
              <span className="leading-snug text-muted-foreground">
                {metGoal ? (
                  <span className="font-semibold text-foreground">Goal reached</span>
                ) : (
                  <>
                    <span className="tabular-nums text-foreground">{Math.round(pct)}%</span>
                    <span className="text-muted-foreground"> of daily goal</span>
                  </>
                )}
              </span>
              <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
                <span className="tabular-nums">{goal.toLocaleString()}</span>
                <DialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="h-7 rounded-full px-2.5 text-[11px] font-bold uppercase tracking-wide text-foreground hover:bg-foreground/[0.06]"
                    >
                      Goal
                    </Button>
                  }
                />
              </div>
            </div>
          </div>

          <div className="rounded-full border border-border/80 bg-muted/35 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            All-time <span className="ml-1.5 text-foreground tabular-nums">{allTimeTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <DialogContent className="gap-5 rounded-[1.75rem] border-border/70 p-6 shadow-2xl sm:max-w-sm">
        <DialogHeader className="gap-2 text-left">
          <DialogTitle className="text-xl font-bold tracking-tight">Daily goal</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            How many repetitions you want to aim for each day.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
          }}
          className="h-12 rounded-2xl border-2 border-border/80 bg-muted/20 text-base font-semibold"
          autoFocus
        />
        <div className="flex flex-col-reverse gap-2.5 pt-0 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-full border-2"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-11 rounded-full px-6 font-bold shadow-md shadow-foreground/10"
            onClick={handleSave}
            disabled={!draftValid}
          >
            Save goal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
