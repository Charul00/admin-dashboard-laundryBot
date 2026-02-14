import { unstable_noStore } from "next/cache";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getSession, getEffectiveOutletId } from "@/lib/auth";
import { setOutletActive } from "./actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;
const COMPLETED_STATUSES = ["Delivered", "Cancelled"];

const OUTLETS_SELECT =
  "id, outlet_name, is_active, city, electricity_usage_kwh, detergent_usage_kg";

type OutletRow = {
  id: string;
  outlet_name: string;
  is_active: boolean;
  city?: string;
  orders: number;
  revenue: number;
  delivered: number;
  running: number;
  electricity_usage_kwh: number | null;
  detergent_usage_kg: number | null;
};

async function getOutletsWithStats(
  supabase: NonNullable<typeof import("@/lib/supabase").supabase>,
  page: number,
  outletId: string | null
): Promise<{ list: OutletRow[]; total: number; totalPages: number }> {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let outletsQuery = supabase
    .from("outlets")
    .select(OUTLETS_SELECT, { count: "exact" })
    .order("outlet_name");
  if (outletId) outletsQuery = outletsQuery.eq("id", outletId);
  else outletsQuery = outletsQuery.range(from, to);
  const { data: outletsRaw, error: outletsError, count } = await outletsQuery;
  const outlets = outletsRaw ?? [];

  const total = outletId ? outlets.length : (count ?? 0);
  const totalPages = outletId ? 1 : Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (outletsError) {
    const fallbackCols = "id, outlet_name, is_active, city";
    const { data: fallback, error: fallbackError } = await supabase
      .from("outlets")
      .select(fallbackCols)
      .order("outlet_name");
    if (fallbackError) throw new Error(outletsError.message);
    const all = fallback ?? [];
    const totalFallback = all.length;
    const totalPagesFallback = Math.max(1, Math.ceil(totalFallback / PAGE_SIZE));
    const list = all.slice(from, from + PAGE_SIZE);
    const { data: orders } = await supabase.from("orders").select("outlet_id, total_price, status");
    const byOutlet: Record<string, { orders: number; revenue: number; delivered: number; running: number }> = {};
    list.forEach((o) => { byOutlet[o.id] = { orders: 0, revenue: 0, delivered: 0, running: 0 }; });
    orders?.forEach((o) => {
      if (!byOutlet[o.outlet_id]) return;
      byOutlet[o.outlet_id].orders += 1;
      byOutlet[o.outlet_id].revenue += Number(o.total_price) || 0;
      if (o.status === "Delivered") byOutlet[o.outlet_id].delivered += 1;
      if (!COMPLETED_STATUSES.includes(o.status ?? "")) byOutlet[o.outlet_id].running += 1;
    });
    return {
      list: list.map((o) => ({
        id: o.id,
        outlet_name: o.outlet_name,
        is_active: o.is_active,
        city: o.city,
        orders: byOutlet[o.id]?.orders ?? 0,
        revenue: byOutlet[o.id]?.revenue ?? 0,
        delivered: byOutlet[o.id]?.delivered ?? 0,
        running: byOutlet[o.id]?.running ?? 0,
        electricity_usage_kwh: null as number | null,
        detergent_usage_kg: null as number | null,
      })),
      total: totalFallback,
      totalPages: totalPagesFallback,
    };
  }

  const list = outlets;
  const { data: orders } = await supabase.from("orders").select("outlet_id, total_price, status");
  const byOutlet: Record<string, { orders: number; revenue: number; delivered: number; running: number }> = {};
  list.forEach((o) => { byOutlet[o.id] = { orders: 0, revenue: 0, delivered: 0, running: 0 }; });
  orders?.forEach((o) => {
    if (!byOutlet[o.outlet_id]) return;
    byOutlet[o.outlet_id].orders += 1;
    byOutlet[o.outlet_id].revenue += Number(o.total_price) || 0;
    if (o.status === "Delivered") byOutlet[o.outlet_id].delivered += 1;
    if (!COMPLETED_STATUSES.includes(o.status ?? "")) byOutlet[o.outlet_id].running += 1;
  });

  const rows: OutletRow[] = list.map((o) => {
    const row = o as Record<string, unknown>;
    const elec = row.electricity_usage_kwh;
    const det = row.detergent_usage_kg;
    return {
      id: o.id,
      outlet_name: o.outlet_name,
      is_active: o.is_active,
      city: o.city,
      orders: byOutlet[o.id]?.orders ?? 0,
      revenue: byOutlet[o.id]?.revenue ?? 0,
      delivered: byOutlet[o.id]?.delivered ?? 0,
      running: byOutlet[o.id]?.running ?? 0,
      electricity_usage_kwh: elec !== undefined && elec !== null && elec !== "" ? Number(elec) : null,
      detergent_usage_kg: det !== undefined && det !== null && det !== "" ? Number(det) : null,
    };
  });

  return { list: rows, total, totalPages };
}

export default async function OutletsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  unstable_noStore();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  if (!supabase) {
    return (
      <div className="rounded-lg bg-amber-900/30 border border-amber-600/50 p-4 text-amber-200">
        <p>Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY to .env.local</p>
      </div>
    );
  }
  const session = await getSession();
  const outletId = session ? getEffectiveOutletId(session) : null;
  let data: Awaited<ReturnType<typeof getOutletsWithStats>> = { list: [], total: 0, totalPages: 1 };
  let error: string | null = null;
  try {
    data = await getOutletsWithStats(supabase, page, outletId);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load outlets";
  }

  if (error) {
    return (
      <div className="rounded-lg bg-amber-900/30 border border-amber-600/50 p-4 text-amber-200">
        <p>{error}</p>
      </div>
    );
  }

  const { list: outlets, total, totalPages } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Outlets</h1>
      <p className="text-slate-400 text-sm">
        <strong className="text-slate-200">{total}</strong> outlet{total !== 1 ? "s" : ""} total · Page {page} of {totalPages}.
        Each card shows orders, revenue, delivered, and monitoring (electricity, detergent, orders running).
      </p>
      {outlets.length > 0 && outlets.some((o) => o.electricity_usage_kwh == null && o.detergent_usage_kg == null) && (
        <p className="text-amber-200/90 text-sm rounded-lg bg-amber-900/20 border border-amber-700/40 px-4 py-2">
          Electricity/detergent showing —? Run the full <code className="bg-slate-800 px-1 rounded">009_outlet_monitoring.sql</code> in Supabase SQL Editor (same project as .env.local). Then in Table Editor → outlets confirm columns <code className="bg-slate-700 px-1 rounded">electricity_usage_kwh</code> and <code className="bg-slate-700 px-1 rounded">detergent_usage_kg</code> exist and have numbers. Hard-refresh (Cmd+Shift+R) after.
        </p>
      )}
      {outlets.length === 0 && (
        <div className="rounded-lg bg-slate-800/80 border border-slate-600 p-4 text-slate-300 space-y-2">
          <p>No outlets in this project. Check Supabase:</p>
          <ul className="list-disc list-inside text-sm text-slate-400">
            <li>Table Editor → <code className="bg-slate-700 px-1 rounded">outlets</code> — confirm this is the same project as in .env.local (Overview shows its outlet count).</li>
            <li>Run <code className="bg-slate-700 px-1 rounded">007_outlets_one_per_area.sql</code> in this project’s SQL Editor to create one outlet per area.</li>
            <li>If RLS is enabled on <code className="bg-slate-700 px-1 rounded">outlets</code>, add a policy that allows <code className="bg-slate-700 px-1 rounded">service_role</code> to SELECT, or disable RLS for this table.</li>
          </ul>
        </div>
      )}
      {total > 0 && total <= 3 && (
        <p className="text-amber-200/90 text-sm rounded-lg bg-amber-900/20 border border-amber-700/40 px-4 py-2">
          Only {total} outlet(s)? Run <code className="bg-slate-800 px-1 rounded">007_outlets_one_per_area.sql</code> in
          Supabase SQL Editor to add one outlet per area (Kothrud, FC Road, Kondhwa, Viman Nagar, etc.).
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {outlets.length === 0 ? null : (
          outlets.map((o) => (
            <div key={o.id} className="rounded-xl bg-slate-800 border border-slate-700 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-slate-100">{o.outlet_name}</h2>
                  {o.city && <p className="text-sm text-slate-400">{o.city}</p>}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    o.is_active ? "bg-emerald-900/50 text-emerald-400" : "bg-amber-900/50 text-amber-400"
                  }`}
                >
                  {o.is_active ? "Active" : "Maintenance"}
                </span>
              </div>
              <form action={setOutletActive} className="mt-2">
                <input type="hidden" name="outletId" value={o.id} />
                <input type="hidden" name="isActive" value={String(!o.is_active)} />
                <button
                  type="submit"
                  className={`text-xs px-3 py-1.5 rounded border ${
                    o.is_active
                      ? "border-amber-600 text-amber-400 hover:bg-amber-900/30"
                      : "border-emerald-600 text-emerald-400 hover:bg-emerald-900/30"
                  }`}
                >
                  {o.is_active ? "Set to maintenance" : "Activate outlet"}
                </button>
              </form>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-2xl font-semibold text-sky-400">{o.orders}</p>
                  <p className="text-xs text-slate-500">Orders</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-emerald-400">₹{(o.revenue / 1000).toFixed(1)}k</p>
                  <p className="text-xs text-slate-500">Revenue</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-300">{o.delivered}</p>
                  <p className="text-xs text-slate-500">Delivered</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-600">
                <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Monitoring</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-semibold text-amber-400">
                      {o.electricity_usage_kwh != null ? o.electricity_usage_kwh.toLocaleString() : "—"}
                    </p>
                    <p className="text-xs text-slate-500">Electricity (kWh)</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-violet-400">
                      {o.detergent_usage_kg != null ? o.detergent_usage_kg.toLocaleString() : "—"}
                    </p>
                    <p className="text-xs text-slate-500">Detergent (kg)</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-cyan-400">{o.running}</p>
                    <p className="text-xs text-slate-500">Orders running</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {totalPages > 1 && (
        <nav className="flex items-center justify-between gap-4 flex-wrap">
          <span className="text-slate-400 text-sm">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Link
              href={page <= 1 ? "/outlets" : `/outlets?page=${page - 1}`}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:pointer-events-none"
              aria-disabled={page <= 1}
            >
              Previous
            </Link>
            <Link
              href={page >= totalPages ? `/outlets?page=${totalPages}` : `/outlets?page=${page + 1}`}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:pointer-events-none"
              aria-disabled={page >= totalPages}
            >
              Next
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
