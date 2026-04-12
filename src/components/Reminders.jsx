"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Moon, Clock } from "lucide-react";

const INTERVAL_OPTIONS = [1, 2, 3];

export default function Reminders({ settings, onChange }) {
  function update(path, value) {
    const next = structuredClone(settings);
    const keys = path.split(".");
    let obj = next;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = value;
    onChange(next);
  }

  const switchClass =
    "data-checked:bg-brand data-checked:border-brand/50 shrink-0 data-unchecked:border-border/80";

  return (
    <section className="space-y-2.5">
      <h2 className="px-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        Reminders
      </h2>
      <div className="space-y-0 divide-y divide-border/60 rounded-[1.75rem] border border-border/60 bg-card p-1 shadow-[0_16px_40px_-28px_rgba(30,20,15,0.14)]">
        <div className="flex items-start justify-between gap-3 px-4 py-4">
          <div className="flex min-w-0 gap-3">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-muted text-brand">
              <Clock className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1">
              <Label className="text-[15px] font-bold leading-tight">Hourly check-in</Label>
              <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                Nudge while this tab is open
              </p>
              {settings.hourly.enabled && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {INTERVAL_OPTIONS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => update("hourly.interval", h)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                        settings.hourly.interval === h
                          ? "bg-foreground text-primary-foreground shadow-md"
                          : "border-2 border-foreground/10 bg-muted/30 text-muted-foreground hover:border-foreground/20"
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Switch
            className={switchClass}
            checked={settings.hourly.enabled}
            onCheckedChange={(v) => update("hourly.enabled", v)}
          />
        </div>

        <div className="flex items-start justify-between gap-3 px-4 py-4">
          <div className="flex min-w-0 gap-3">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-muted text-brand">
              <Bell className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1">
              <Label className="text-[15px] font-bold leading-tight">Evening check-in</Label>
              <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                8 PM if you&apos;re below goal
              </p>
            </div>
          </div>
          <Switch
            className={switchClass}
            checked={settings.evening.enabled}
            onCheckedChange={(v) => update("evening.enabled", v)}
          />
        </div>

        <div className="flex items-start justify-between gap-3 px-4 py-4">
          <div className="flex min-w-0 gap-3">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-muted text-brand">
              <Moon className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1">
              <Label className="text-[15px] font-bold leading-tight">Late night push</Label>
              <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                10 PM if under half your goal
              </p>
            </div>
          </div>
          <Switch
            className={switchClass}
            checked={settings.lateNight.enabled}
            onCheckedChange={(v) => update("lateNight.enabled", v)}
          />
        </div>
      </div>
    </section>
  );
}
