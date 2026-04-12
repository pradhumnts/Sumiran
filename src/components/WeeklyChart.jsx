"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

export default function WeeklyChart({ data }) {
  if (!data || data.length === 0) return null;

  const goal = data[0]?.goal || 5000;
  const maxVal = Math.max(...data.map((d) => d.count), goal);

  return (
    <section className="space-y-2.5">
      <h2 className="px-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        Last 7 days
      </h2>
      <div className="rounded-[1.75rem] border border-border/60 bg-card p-5 pb-2 shadow-[0_16px_40px_-28px_rgba(30,20,15,0.14)]">
        <ResponsiveContainer width="100%" height={172}>
          <BarChart data={data} barCategoryGap="22%" margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontWeight: 600, fill: "var(--color-muted-foreground)" }}
              dy={6}
            />
            <YAxis hide domain={[0, maxVal * 1.12]} />
            <ReferenceLine
              y={goal}
              stroke="var(--color-foreground)"
              strokeDasharray="5 6"
              strokeOpacity={0.2}
              strokeWidth={1}
            />
            <Bar dataKey="count" radius={[14, 14, 6, 6]} maxBarSize={40}>
              {data.map((entry) => (
                <Cell
                  key={entry.date}
                  fill={
                    entry.isToday
                      ? "var(--color-ink)"
                      : entry.metGoal
                        ? "var(--color-chart-1)"
                        : "var(--color-muted)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
