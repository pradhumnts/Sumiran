"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getEntryLog, removeEntry } from "@/lib/storage";
import { ScrollText } from "lucide-react";

function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function EntryLog({ onChange }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (open) setEntries(getEntryLog());
  }, [open]);

  function handleRemove(id) {
    if (!removeEntry(id)) return;
    setEntries(getEntryLog());
    onChange?.();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border-2 border-foreground/10 bg-card text-sm font-bold shadow-sm"
          >
            <ScrollText className="size-4 opacity-70" aria-hidden />
            Entry log
          </Button>
        }
      />

      <DialogContent className="max-h-[min(85vh,32rem)] gap-4 rounded-[1.75rem] border-border/70 p-6 sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl font-bold tracking-tight">Entry log</DialogTitle>
          <DialogDescription>
            Recent additions. Remove a row to undo that amount for that day.
          </DialogDescription>
        </DialogHeader>

        {entries.length === 0 ? (
          <p className="rounded-2xl bg-muted/40 px-4 py-6 text-center text-sm font-medium text-muted-foreground">
            No entries yet. Tallies you add from now on show up here.
          </p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {entries.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/25 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="font-bold tabular-nums text-foreground">+{e.amount.toLocaleString()}</p>
                  <p className="text-xs font-medium text-muted-foreground">{formatWhen(e.at)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleRemove(e.id)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
