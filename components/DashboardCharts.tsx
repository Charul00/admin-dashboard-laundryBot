"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#2dd4bf", "#34d399", "#fbbf24", "#a78bfa", "#22d3ee", "#94a3b8"];
const TOOLTIP_BG = "#151b28";
const TOOLTIP_BORDER = "#2d3748";
const AXIS_STROKE = "#94a3b8";

type TrendPoint = { date: string; orders: number; revenue: number };
type StatusPoint = { name: string; value: number };
type OutletPoint = { name: string; orders: number; revenue: number };

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const mounted = useMounted();
  if (!mounted) return <div className="h-64 w-full min-w-0 rounded-xl bg-[var(--card)]/50" />;
  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" stroke={AXIS_STROKE} fontSize={12} tickFormatter={(v) => v.slice(5)} />
          <YAxis stroke={AXIS_STROKE} fontSize={12} />
          <Tooltip contentStyle={{ background: TOOLTIP_BG, border: `1px solid ${TOOLTIP_BORDER}`, borderRadius: 12 }} />
          <Line type="monotone" dataKey="orders" stroke="#2dd4bf" name="Orders" strokeWidth={2} />
          <Line type="monotone" dataKey="revenue" stroke="#34d399" name="Revenue (₹)" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusPieChart({ data }: { data: StatusPoint[] }) {
  const mounted = useMounted();
  if (!mounted) return <div className="h-64 w-full min-w-0 rounded-xl bg-[var(--card)]/50" />;
  if (data.length === 0) return <p className="text-[var(--muted)] flex items-center h-64 justify-center">No order data</p>;
  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, value }) => `${name}: ${value}`}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: TOOLTIP_BG, border: `1px solid ${TOOLTIP_BORDER}`, borderRadius: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OutletBarChart({ data }: { data: OutletPoint[] }) {
  const mounted = useMounted();
  if (!mounted) return <div className="h-72 w-full min-w-0 rounded-xl bg-[var(--card)]/50" />;
  if (data.length === 0) return <p className="text-[var(--muted)] flex items-center h-72 justify-center">No outlet data</p>;
  return (
    <div className="h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
          <XAxis dataKey="name" stroke={AXIS_STROKE} fontSize={12} />
          <YAxis stroke={AXIS_STROKE} fontSize={12} />
          <Tooltip contentStyle={{ background: TOOLTIP_BG, border: `1px solid ${TOOLTIP_BORDER}`, borderRadius: 12 }} />
          <Bar dataKey="orders" fill="#2dd4bf" name="Orders" radius={[6, 6, 0, 0]} />
          <Bar dataKey="revenue" fill="#34d399" name="Revenue (₹)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
