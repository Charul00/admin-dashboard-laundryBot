import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getSession, getEffectiveOutletId } from "@/lib/auth";
import { OrderStatusSelect } from "@/components/OrderStatusSelect";

const PAGE_SIZE = 10;

async function getOrders(
  supabase: NonNullable<typeof import("@/lib/supabase").supabase>,
  page: number,
  outletId: string | null
) {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let ordersQuery = supabase
    .from("orders")
    .select(
      "id, order_number, customer_id, outlet_id, status, priority_type, total_price, payment_status, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);
  if (outletId) ordersQuery = ordersQuery.eq("outlet_id", outletId);

  const [{ data: orders, count }, outletsRes, customersRes] = await Promise.all([
    ordersQuery,
    supabase.from("outlets").select("id, outlet_name"),
    supabase.from("customers").select("id, full_name"),
  ]);

  const total = count ?? 0;
  const outletMap: Record<string, string> = {};
  outletsRes.data?.forEach((o) => (outletMap[o.id] = o.outlet_name));
  const customerMap: Record<string, string> = {};
  customersRes.data?.forEach((c) => (customerMap[c.id] = c.full_name));

  const list = (orders ?? []).map((o) => ({
    ...o,
    outlet_name: outletMap[o.outlet_id] ?? "—",
    customer_name: customerMap[o.customer_id] ?? "—",
  }));

  return { list, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  if (!supabase) {
    return (
      <div className="rounded-lg bg-amber-900/30 border border-amber-600/50 p-4 text-amber-200">
        <p>Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY to .env.local</p>
      </div>
    );
  }
  let data: Awaited<ReturnType<typeof getOrders>> = {
    list: [],
    total: 0,
    page: 1,
    totalPages: 1,
  };
  let error: string | null = null;
  const session = await getSession();
  const outletId = session ? getEffectiveOutletId(session) : null;
  try {
    data = await getOrders(supabase, page, outletId);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load orders";
  }

  if (error) {
    return (
      <div className="rounded-lg bg-amber-900/30 border border-amber-600/50 p-4 text-amber-200">
        <p>{error}</p>
      </div>
    );
  }

  const { list: orders, total, totalPages } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Orders</h1>
      <p className="text-slate-400 text-sm">
        {total} order{total !== 1 ? "s" : ""} total · Page {data.page} of {totalPages}
      </p>
      <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-600 bg-slate-800/80">
                <th className="text-left py-3 px-4">Order #</th>
                <th className="text-left py-3 px-4">Customer</th>
                <th className="text-left py-3 px-4">Outlet</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Priority</th>
                <th className="text-right py-3 px-4">Total (₹)</th>
                <th className="text-left py-3 px-4">Payment</th>
                <th className="text-left py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-slate-500 text-center">
                    No orders yet
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-4 font-mono text-sky-400">{o.order_number}</td>
                    <td className="py-3 px-4">{o.customer_name}</td>
                    <td className="py-3 px-4">{o.outlet_name}</td>
                    <td className="py-3 px-4">
                      <OrderStatusSelect orderId={o.id} currentStatus={o.status} />
                    </td>
                    <td className="py-3 px-4">{o.priority_type}</td>
                    <td className="py-3 px-4 text-right">{Number(o.total_price).toFixed(2)}</td>
                    <td className="py-3 px-4">{o.payment_status ?? "—"}</td>
                    <td className="py-3 px-4 text-slate-400">{o.created_at?.slice(0, 10)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {totalPages > 1 && (
        <nav className="flex items-center justify-between gap-4 flex-wrap">
          <span className="text-slate-400 text-sm">
            Page {data.page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Link
              href={data.page <= 1 ? "/orders" : `/orders?page=${data.page - 1}`}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:pointer-events-none"
              aria-disabled={data.page <= 1}
            >
              Previous
            </Link>
            <Link
              href={data.page >= totalPages ? `/orders?page=${totalPages}` : `/orders?page=${data.page + 1}`}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:pointer-events-none"
              aria-disabled={data.page >= totalPages}
            >
              Next
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
