"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAIN = 108;
const PRESETS_ROW = [1000, 2000, 5000];

export default function TallyButtons({ onAdd }) {
  const [custom, setCustom] = useState("");

  function handleCustom() {
    const n = parseInt(custom, 10);
    if (n > 0) {
      onAdd(n);
      setCustom("");
    }
  }

  return (
    <section className="space-y-3">
      <p className="px-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Log count</p>
      <div className="space-y-3">
        <Button
          size="lg"
          className="h-[3.75rem] w-full rounded-full text-base font-bold tracking-tight shadow-lg shadow-foreground/15 transition-transform active:scale-[0.98]"
          onClick={() => onAdd(MAIN)}
        >
          <span className="flex items-center justify-center gap-1.5 leading-tight">
            <span className="text-lg">+{MAIN.toLocaleString()}</span>
            <span className="text-xs font-semibold tabular-nums opacity-90">(1 Mala)</span>
          </span>
        </Button>

        <div className="grid grid-cols-3 gap-2.5">
          {PRESETS_ROW.map((n) => (
            <Button
              key={n}
              variant="outline"
              className="h-12 rounded-full border-2 border-foreground/10 bg-card text-sm font-bold tabular-nums shadow-sm transition-colors hover:border-foreground/20 hover:bg-muted/40 sm:text-[0.95rem]"
              onClick={() => onAdd(n)}
            >
              +{n.toLocaleString()}
            </Button>
          ))}
        </div>

        <div className="flex gap-2.5">
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="Custom amount"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustom()}
            className="h-12 flex-1 rounded-full border-2 border-border/80 bg-card px-4 text-base font-medium shadow-inner"
          />
          <Button
            variant="secondary"
            className="h-12 shrink-0 rounded-full border-2 border-transparent bg-foreground px-6 font-bold text-primary-foreground shadow-md shadow-foreground/15 hover:bg-foreground/90 disabled:opacity-40"
            onClick={handleCustom}
            disabled={!custom || parseInt(custom, 10) <= 0}
          >
            Add
          </Button>
        </div>
      </div>
    </section>
  );
}
