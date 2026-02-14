import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getSession, getEffectiveOutletId } from "@/lib/auth";

const PAGE_SIZE = 10;

async function getFeedback(
  supabase: NonNullable<typeof import("@/lib/supabase").supabase>,
  page: number,
  outletId: string | null
) {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let orderIds: string[] = [];
  if (outletId) {
    const { data: outletOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("outlet_id", outletId);
    orderIds = (outletOrders ?? []).map((o) => o.id);
  }

  let feedbackQuery = supabase
    .from("feedback")
    .select("id, order_id, rating, category, comment, created_at", { count: "exact" })
    .order("id", { ascending: false });
  if (outletId && orderIds.length > 0) feedbackQuery = feedbackQuery.in("order_id", orderIds);
  else if (outletId) {
    return { list: [], avgRating: 0, total: 0, page, totalPages: 1 };
  }
  const { data: feedback, count } = await feedbackQuery.range(from, to);

  const total = count ?? 0;
  const list = feedback ?? [];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  let avgRating = 0;
  if (outletId && orderIds.length > 0) {
    const { data: allRatings } = await supabase
      .from("feedback")
      .select("rating")
      .in("order_id", orderIds);
    const all = allRatings ?? [];
    avgRating = all.length ? all.reduce((s, f) => s + (f.rating ?? 0), 0) / all.length : 0;
  } else if (!outletId) {
    const { data: allRatings } = await supabase.from("feedback").select("rating");
    const all = allRatings ?? [];
    avgRating = all.length ? all.reduce((s, f) => s + (f.rating ?? 0), 0) / all.length : 0;
  }

  if (list.length === 0) {
    return { list: [], avgRating, total, page, totalPages };
  }

  const listOrderIds = Array.from(new Set(list.map((f) => f.order_id)));
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number")
    .in("id", listOrderIds);
  const orderMap: Record<string, string> = {};
  orders?.forEach((o) => (orderMap[o.id] = o.order_number));

  return {
    list: list.map((f) => ({ ...f, order_number: orderMap[f.order_id] ?? "—" })),
    avgRating,
    total,
    page,
    totalPages,
  };
}

export const dynamic = "force-dynamic";

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  let data: Awaited<ReturnType<typeof getFeedback>> = {
    list: [],
    avgRating: 0,
    total: 0,
    page: 1,
    totalPages: 1,
  };
  if (!supabase) {
    return (
      <div className="rounded-lg bg-amber-900/30 border border-amber-600/50 p-4 text-amber-200">
        <p>Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY to .env.local</p>
      </div>
    );
  }
  const session = await getSession();
  const outletId = session ? getEffectiveOutletId(session) : null;
  let error: string | null = null;
  try {
    data = await getFeedback(supabase, page, outletId);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load feedback";
  }

  if (error) {
    return (
      <div className="rounded-lg bg-amber-900/30 border border-amber-600/50 p-4 text-amber-200">
        <p>{error}</p>
      </div>
    );
  }

  const totalPages = data.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Feedback</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
          <p className="text-slate-400 text-sm">Average rating</p>
          <p className="text-3xl font-bold text-amber-400 mt-1">
            {data.avgRating.toFixed(1)} / 5
          </p>
        </div>
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
          <p className="text-slate-400 text-sm">Total responses</p>
          <p className="text-3xl font-bold text-sky-400 mt-1">{data.total}</p>
        </div>
      </div>
      <p className="text-slate-400 text-sm">
        Page {data.page} of {totalPages} · {data.total} total
      </p>
      <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-600 bg-slate-800/80">
                <th className="text-left py-3 px-4">Order</th>
                <th className="text-left py-3 px-4">Rating</th>
                <th className="text-left py-3 px-4">Category</th>
                <th className="text-left py-3 px-4">Comment</th>
                <th className="text-left py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-slate-500 text-center">
                    No feedback yet
                  </td>
                </tr>
              ) : (
                data.list.map((f) => (
                  <tr key={f.id} className="border-b border-slate-700/50">
                    <td className="py-3 px-4 font-mono text-sky-400">{f.order_number}</td>
                    <td className="py-3 px-4">
                      <span className="text-amber-400">{f.rating} ★</span>
                    </td>
                    <td className="py-3 px-4">{f.category ?? "—"}</td>
                    <td className="py-3 px-4 max-w-xs truncate">{f.comment ?? "—"}</td>
                    <td className="py-3 px-4 text-slate-400">{f.created_at?.slice(0, 10)}</td>
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
              href={data.page <= 1 ? "/feedback" : `/feedback?page=${data.page - 1}`}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:pointer-events-none"
              aria-disabled={data.page <= 1}
            >
              Previous
            </Link>
            <Link
              href={data.page >= totalPages ? `/feedback?page=${totalPages}` : `/feedback?page=${data.page + 1}`}
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
