"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#06b6d4", "#22c55e", "#f59e0b", "#8b5cf6", "#ef4444", "#3366ff"];

export function UsageHeatmap({
  matrix,
  rowLabels,
}: {
  matrix: number[][]; // rows x 24
  rowLabels: string[];
}) {
  const max = Math.max(1, ...matrix.flat());
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="flex gap-1 ps-10">
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="w-4 text-center text-[9px] text-gray-400">
              {h % 3 === 0 ? h : ""}
            </div>
          ))}
        </div>
        {matrix.map((row, ri) => (
          <div key={ri} className="mt-1 flex items-center gap-1">
            <div className="w-9 text-end text-[10px] text-gray-400">{rowLabels[ri]}</div>
            {row.map((v, ci) => {
              const intensity = v / max;
              return (
                <div
                  key={ci}
                  title={`${rowLabels[ri]} ${ci}:00 — ${v.toFixed(2)} kWh`}
                  className="h-4 w-4 rounded-[3px]"
                  style={{
                    backgroundColor:
                      intensity < 0.02
                        ? "rgba(148,163,184,0.12)"
                        : `rgba(6,182,212,${0.15 + intensity * 0.85})`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function EnergyAreaChart({ data }: { data: { date: string; energyKwh: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3366ff" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#3366ff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb33" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => String(d).slice(5)} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
          formatter={(v: number) => [`${v.toFixed(2)} kWh`, "Energy"]}
        />
        <Area type="monotone" dataKey="energyKwh" stroke="#3366ff" strokeWidth={2} fill="url(#energyGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CostLineChart({ data }: { data: { date: string; cost: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb33" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => String(d).slice(5)} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
          formatter={(v: number) => [`$${v.toFixed(2)}`, "Cost"]}
        />
        <Line type="monotone" dataKey="cost" stroke="#22c55e" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ForecastBarChart({ data }: { data: { hour_of_day: number; predicted_kwh: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb33" />
        <XAxis dataKey="hour_of_day" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
          formatter={(v: number) => [`${v.toFixed(2)} kWh`, "Forecast"]}
          labelFormatter={(h) => `Hour ${h}:00`}
        />
        <Bar dataKey="predicted_kwh" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
