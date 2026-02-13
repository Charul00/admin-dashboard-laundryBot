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

const COLORS = ["#38bdf8", "#34d399", "#fbbf24", "#f472b6", "#a78bfa", "#64748b"];

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
  if (!mounted) return <div className="h-64 w-full min-w-0 rounded-lg bg-slate-800/50" />;
  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => v.slice(5)} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155" }} />
          <Line type="monotone" dataKey="orders" stroke="#38bdf8" name="Orders" strokeWidth={2} />
          <Line type="monotone" dataKey="revenue" stroke="#34d399" name="Revenue (₹)" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusPieChart({ data }: { data: StatusPoint[] }) {
  const mounted = useMounted();
  if (!mounted) return <div className="h-64 w-full min-w-0 rounded-lg bg-slate-800/50" />;
  if (data.length === 0) return <p className="text-slate-500 flex items-center h-64 justify-center">No order data</p>;
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
          <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OutletBarChart({ data }: { data: OutletPoint[] }) {
  const mounted = useMounted();
  if (!mounted) return <div className="h-72 w-full min-w-0 rounded-lg bg-slate-800/50" />;
  if (data.length === 0) return <p className="text-slate-500 flex items-center h-72 justify-center">No outlet data</p>;
  return (
    <div className="h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155" }} />
          <Bar dataKey="orders" fill="#38bdf8" name="Orders" radius={[4, 4, 0, 0]} />
          <Bar dataKey="revenue" fill="#34d399" name="Revenue (₹)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
