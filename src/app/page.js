"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import CounterDisplay from "@/components/CounterDisplay";
import TallyButtons from "@/components/TallyButtons";
import WeeklyChart from "@/components/WeeklyChart";
import EntryLog from "@/components/EntryLog";
import Reminders from "@/components/Reminders";
import {
  getTodayCount,
  addToTodayCount,
  getAllTimeTotal,
  getDailyGoal,
  setDailyGoal,
  getLast7Days,
  getReminderSettings,
  setReminderSettings,
} from "@/lib/storage";
import { initReminders, ensureReminderVisibilityBinding } from "@/lib/notifications";
import { shouldSkipClientHourlyTimer, syncPushWithReminders } from "@/lib/push-client";

export default function Home() {
  const [count, setCount] = useState(0);
  const [allTime, setAllTime] = useState(0);
  const [goal, setGoal] = useState(5000);
  const [chartData, setChartData] = useState([]);
  const [reminders, setReminders] = useState(null);
  const [mounted, setMounted] = useState(false);

  const refreshAll = useCallback(() => {
    setCount(getTodayCount());
    setAllTime(getAllTimeTotal());
    setGoal(getDailyGoal());
    setChartData(getLast7Days());
    setReminders(getReminderSettings());
  }, []);

  const refreshCounts = useCallback(() => {
    setCount(getTodayCount());
    setAllTime(getAllTimeTotal());
    setChartData(getLast7Days());
  }, []);

  useEffect(() => {
    refreshAll();
    ensureReminderVisibilityBinding();
    setMounted(true);
  }, [refreshAll]);

  useEffect(() => {
    if (reminders) initReminders(reminders);
  }, [reminders]);

  useEffect(() => {
    if (!reminders) return;
    let cancelled = false;
    (async () => {
      const beforeSkip = shouldSkipClientHourlyTimer(reminders);
      await syncPushWithReminders(reminders);
      if (cancelled) return;
      const afterSkip = shouldSkipClientHourlyTimer(reminders);
      if (beforeSkip !== afterSkip) initReminders(reminders);
    })();
    return () => {
      cancelled = true;
    };
  }, [reminders, count, goal]);

  function handleAdd(n) {
    addToTodayCount(n);
    refreshCounts();
  }

  function handleGoalSave(newGoal) {
    setDailyGoal(newGoal);
    setGoal(newGoal);
    setChartData(getLast7Days());
  }

  function handleReminders(next) {
    setReminderSettings(next);
    setReminders(next);
  }

  if (!mounted) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <div className="size-8 animate-spin rounded-full border-[3px] border-brand/30 border-t-brand" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-7 px-4 py-8 pb-16 sm:space-y-8 sm:py-10">
      <Header />
      <CounterDisplay
        count={count}
        goal={goal}
        allTimeTotal={allTime}
        onGoalSave={handleGoalSave}
      />
      <TallyButtons onAdd={handleAdd} />
      <EntryLog onChange={refreshCounts} />
      <WeeklyChart data={chartData} />
      <Reminders settings={reminders} onChange={handleReminders} />
    </div>
  );
}
