import { supabase } from "@/lib/supabase";
import { getSession, getEffectiveOutletId } from "@/lib/auth";
import { TrendChart, StatusPieChart, OutletBarChart } from "@/components/DashboardCharts";

async function getDashboardData(
  supabase: NonNullable<typeof import("@/lib/supabase").supabase>,
  outletId: string | null
) {
  let outletsQuery = supabase.from("outlets").select("id, outlet_name, is_active").order("outlet_name");
  let ordersQuery = supabase.from("orders").select("id, order_number, outlet_id, status, total_price, created_at, priority_type");
  if (outletId) {
    outletsQuery = outletsQuery.eq("id", outletId);
    ordersQuery = ordersQuery.eq("outlet_id", outletId);
  }
  const [outletsRes, ordersRes, staffRes] = await Promise.all([
    outletsQuery,
    ordersQuery,
    outletId
      ? supabase.from("staff").select("id", { count: "exact", head: true }).eq("outlet_id", outletId)
      : supabase.from("staff").select("id", { count: "exact", head: true }),
  ]);
  const outlets = outletsRes.data ?? [];
  const orders = ordersRes.data ?? [];
  const staffCount = staffRes.count ?? 0;

  let totalCustomers: number;
  let totalFeedback: number;
  if (outletId) {
    const orderIds = orders.map((o) => o.id);
    if (orderIds.length > 0) {
      const [custRows, fbRes] = await Promise.all([
        supabase.from("orders").select("customer_id").in("id", orderIds),
        supabase.from("feedback").select("id", { count: "exact", head: true }).in("order_id", orderIds),
      ]);
      totalCustomers = custRows.data ? Array.from(new Set(custRows.data.map((o) => o.customer_id).filter(Boolean))).length : 0;
      totalFeedback = fbRes.count ?? 0;
    } else {
      totalCustomers = 0;
      totalFeedback = 0;
    }
  } else {
    const [custRes, fbRes] = await Promise.all([
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase.from("feedback").select("id", { count: "exact", head: true }),
    ]);
    totalCustomers = custRes.count ?? 0;
    totalFeedback = fbRes.count ?? 0;
  }

  const totalRevenue = orders.reduce((s, o) => s + (Number(o.total_price) || 0), 0);
  const ordersByStatus: Record<string, number> = {};
  const ordersByOutlet: Record<string, number> = {};
  const revenueByOutlet: Record<string, number> = {};
  const last7Days: Record<string, { orders: number; revenue: number }> = {};

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    last7Days[key] = { orders: 0, revenue: 0 };
  }

  orders.forEach((o) => {
    ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;
    ordersByOutlet[o.outlet_id] = (ordersByOutlet[o.outlet_id] ?? 0) + 1;
    revenueByOutlet[o.outlet_id] = (revenueByOutlet[o.outlet_id] ?? 0) + (Number(o.total_price) || 0);
    const created = o.created_at?.slice(0, 10);
    if (created && last7Days[created]) {
      last7Days[created].orders += 1;
      last7Days[created].revenue += Number(o.total_price) || 0;
    }
  });

  const outletNames: Record<string, string> = {};
  outlets.forEach((o) => {
    outletNames[o.id] = o.outlet_name;
  });

  const activeOutlets = outlets.filter((o) => o.is_active !== false);
  const ordersByOutletChart = activeOutlets.map((o) => ({
    name: o.outlet_name,
    orders: ordersByOutlet[o.id] ?? 0,
    revenue: Math.round((revenueByOutlet[o.id] ?? 0) * 100) / 100,
  }));

  const statusChart = Object.entries(ordersByStatus).map(([name, value]) => ({ name, value }));
  const trendData = Object.entries(last7Days)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({ date, orders: d.orders, revenue: d.revenue }));

  const expressCount = orders.filter((o) => o.priority_type === "express").length;

  return {
    totalOrders: orders.length,
    totalRevenue,
    totalCustomers,
    totalFeedback,
    outletsCount: outlets.length,
    staffCount,
    expressCount,
    ordersByOutletChart,
    statusChart,
    trendData,
    recentOrders: orders.slice(-5).reverse(),
    outlets,
  };
}

export default async function DashboardPage() {
  const session = await getSession();
  const outletId = session ? getEffectiveOutletId(session) : null;
  if (!supabase) {
    return (
      <div className="rounded-lg bg-amber-900/30 border border-amber-600/50 p-4 text-amber-200">
        <p className="font-medium">Configure environment</p>
        <p className="text-sm mt-1">Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY to .env.local</p>
      </div>
    );
  }
  let data: Awaited<ReturnType<typeof getDashboardData>>;
  let error: string | null = null;
  try {
    data = await getDashboardData(supabase, outletId);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load dashboard";
    data = {
      totalOrders: 0,
      totalRevenue: 0,
      totalCustomers: 0,
      totalFeedback: 0,
      outletsCount: 0,
      staffCount: 0,
      expressCount: 0,
      ordersByOutletChart: [],
      statusChart: [],
      trendData: [],
      recentOrders: [],
      outlets: [],
    };
  }

  if (error) {
    return (
      <div className="rounded-lg bg-amber-900/30 border border-amber-600/50 p-4 text-amber-200">
        <p className="font-medium">Cannot load dashboard</p>
        <p className="text-sm mt-1">{error}</p>
        <p className="text-sm mt-2">Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY to .env.local</p>
      </div>
    );
  }

  const kpis = [
    { label: "Total Orders", value: data.totalOrders },
    { label: "Total Revenue", value: `₹${data.totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` },
    { label: "Customers", value: data.totalCustomers },
    { label: "Outlets", value: data.outletsCount },
    { label: "Express Orders", value: data.expressCount },
    { label: "Feedback", value: data.totalFeedback },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  let projectHint = "not set";
  try {
    if (supabaseUrl) projectHint = new URL(supabaseUrl).hostname;
  } catch {
    projectHint = "invalid URL";
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-100">Overview</h1>

      <div className="rounded-lg bg-slate-800/80 border border-slate-600 px-4 py-3 text-sm text-slate-300">
        <span className="font-medium text-slate-200">Connected to:</span> {projectHint}
        {" · "}
        <span className="font-medium text-slate-200">Outlets:</span> {data.outletsCount}
        {" · "}
        <span className="font-medium text-slate-200">Staff:</span> {data.staffCount}
        {data.outletsCount <= 3 || data.staffCount === 0 ? (
          <p className="mt-2 text-amber-200/90">
            If numbers are low, run <code className="bg-slate-700 px-1 rounded">007_outlets_one_per_area.sql</code> and{" "}
            <code className="bg-slate-700 px-1 rounded">008_staff_table_and_seed.sql</code> in{" "}
            <strong>this project’s</strong> Supabase SQL Editor (same project as the URL above).
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-xl bg-slate-800 border border-slate-700 p-4"
          >
            <p className="text-slate-400 text-sm">{k.label}</p>
            <p className="text-xl font-semibold text-sky-400 mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-4">
          <h2 className="font-semibold text-slate-200 mb-4">Orders & Revenue (last 7 days)</h2>
          <TrendChart data={data.trendData} />
        </div>

        <div className="rounded-xl bg-slate-800 border border-slate-700 p-4">
          <h2 className="font-semibold text-slate-200 mb-4">Orders by status</h2>
          <StatusPieChart data={data.statusChart} />
        </div>
      </div>

      <div className="rounded-xl bg-slate-800 border border-slate-700 p-4">
        <h2 className="font-semibold text-slate-200 mb-4">Orders & Revenue by outlet</h2>
        <OutletBarChart data={data.ordersByOutletChart} />
      </div>

      <div className="rounded-xl bg-slate-800 border border-slate-700 p-4">
        <h2 className="font-semibold text-slate-200 mb-4">Recent orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-600">
                <th className="text-left py-2">Order #</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Priority</th>
                <th className="text-right py-2">Total (₹)</th>
                <th className="text-left py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-slate-500 text-center">
                    No orders yet
                  </td>
                </tr>
              ) : (
                data.recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-700/50">
                    <td className="py-2 font-mono text-sky-400">{o.order_number}</td>
                    <td className="py-2">{o.status}</td>
                    <td className="py-2">{o.priority_type}</td>
                    <td className="py-2 text-right">{Number(o.total_price).toFixed(2)}</td>
                    <td className="py-2 text-slate-400">{o.created_at?.slice(0, 10)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <a href="/orders" className="text-sky-400 hover:underline text-sm">
            View all orders →
          </a>
        </div>
      </div>
    </div>
  );
}
