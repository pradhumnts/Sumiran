"use client";

import { useState, useEffect, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, Moon, Clock } from "lucide-react";
import {
  getNotificationSupport,
  getNotificationPermission,
  requestPermissionFromUserGesture,
} from "@/lib/notifications";

const INTERVAL_OPTIONS = [1, 2, 3];
const TEST_SEC_OPTIONS = [
  { sec: null, label: "Off" },
  { sec: 30, label: "30s" },
  { sec: 60, label: "1m" },
];

export default function Reminders({ settings, onChange }) {
  const [perm, setPerm] = useState("default");

  const syncPerm = useCallback(() => {
    setPerm(getNotificationPermission());
  }, []);

  useEffect(() => {
    syncPerm();
  }, [syncPerm]);

  useEffect(() => {
    function onVisibility() {
      if (!document.hidden) syncPerm();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [syncPerm]);

  function update(path, value) {
    const next = structuredClone(settings);
    const keys = path.split(".");
    let obj = next;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = value;
    onChange(next);
  }

  function patchHourly(partial) {
    const next = structuredClone(settings);
    next.hourly = { ...next.hourly, ...partial };
    onChange(next);
  }

  async function ensurePermissionWhenEnabling() {
    const p = await requestPermissionFromUserGesture();
    setPerm(p);
    return p === "granted";
  }

  async function handleAllowNotifications() {
    const p = await requestPermissionFromUserGesture();
    setPerm(p);
  }

  async function handleHourlyToggle(v) {
    if (v) await ensurePermissionWhenEnabling();
    update("hourly.enabled", v);
  }

  async function handleEveningToggle(v) {
    if (v) await ensurePermissionWhenEnabling();
    update("evening.enabled", v);
  }

  async function handleLateToggle(v) {
    if (v) await ensurePermissionWhenEnabling();
    update("lateNight.enabled", v);
  }

  const support = typeof window !== "undefined" ? getNotificationSupport() : "unsupported";
  const switchClass =
    "data-checked:bg-brand data-checked:border-brand/50 shrink-0 data-unchecked:border-border/80";

  return (
    <section className="space-y-2.5">
      <h2 className="px-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        Reminders
      </h2>

      {support === "unsupported" && (
        <div className="rounded-[1.75rem] border border-border/60 bg-card p-4 shadow-[0_16px_40px_-28px_rgba(30,20,15,0.14)]">
          <p className="text-sm font-medium text-muted-foreground">
            This browser does not support notifications. Try Safari or Chrome on a recent iPhone.
          </p>
        </div>
      )}

      {support === "supported" && perm !== "granted" && (
        <div className="rounded-[1.75rem] border border-border/60 bg-card p-4 shadow-[0_16px_40px_-28px_rgba(30,20,15,0.14)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold">Browser notifications</p>
              <p className="text-xs font-medium text-muted-foreground">
                {perm === "denied" &&
                  "Blocked — enable in system Settings → Sumiran / Safari → Notifications."}
                {perm === "default" && "Tap below to allow notifications."}
              </p>
            </div>
            {perm === "default" && (
              <Button
                type="button"
                className="h-10 shrink-0 rounded-full px-4 font-bold"
                onClick={handleAllowNotifications}
              >
                Allow notifications
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-0 divide-y divide-border/60 rounded-[1.75rem] border border-border/60 bg-card p-1 shadow-[0_16px_40px_-28px_rgba(30,20,15,0.14)]">
        <div className="flex items-start justify-between gap-3 px-4 py-4">
          <div className="flex min-w-0 gap-3">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-muted text-brand">
              <Clock className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1">
              <Label className="text-[15px] font-bold leading-tight">Hourly check-in</Label>
              <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                Periodic reminder while you use Sumiran.
              </p>
              {settings.hourly.enabled && (
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Every (hours)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {INTERVAL_OPTIONS.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => patchHourly({ interval: h, testEverySec: null })}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                          settings.hourly.interval === h && !settings.hourly.testEverySec
                            ? "bg-foreground text-primary-foreground shadow-md"
                            : "border-2 border-foreground/10 bg-muted/30 text-muted-foreground hover:border-foreground/20"
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Test interval (debug)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TEST_SEC_OPTIONS.map(({ sec, label }) => (
                      <button
                        key={String(sec)}
                        type="button"
                        onClick={() => patchHourly({ testEverySec: sec })}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                          (settings.hourly.testEverySec ?? null) === sec
                            ? "bg-foreground text-primary-foreground shadow-md"
                            : "border-2 border-foreground/10 bg-muted/30 text-muted-foreground hover:border-foreground/20"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <Switch
            className={switchClass}
            checked={settings.hourly.enabled}
            onCheckedChange={handleHourlyToggle}
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
                8 PM local if you&apos;re below goal.
              </p>
            </div>
          </div>
          <Switch
            className={switchClass}
            checked={settings.evening.enabled}
            onCheckedChange={handleEveningToggle}
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
                10 PM local if under half your goal.
              </p>
            </div>
          </div>
          <Switch
            className={switchClass}
            checked={settings.lateNight.enabled}
            onCheckedChange={handleLateToggle}
          />
        </div>
      </div>
    </section>
  );
}
