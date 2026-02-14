import { unstable_noStore } from "next/cache";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getSession, getEffectiveOutletId } from "@/lib/auth";
import { addStaff, setStaffActiveForm } from "./actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;
const STAFF_ROLES = ["washer", "ironer", "manager", "delivery"] as const;

async function getStaff(
  supabase: NonNullable<typeof import("@/lib/supabase").supabase>,
  page: number,
  outletId: string | null
) {
  try {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let staffQuery = supabase
      .from("staff")
      .select("*", { count: "exact" })
      .order("id", { ascending: true });
    if (outletId) staffQuery = staffQuery.eq("outlet_id", outletId);
    const { data, error, count } = await staffQuery.range(from, to);

    if (error) return { staff: [], total: 0, totalPages: 1, error: error.message };

    const raw = data ?? [];
    type StaffRow = {
      id: string;
      full_name: string;
      role: string;
      outlet_id: string | null;
      phone_number: string | null;
      is_active: boolean;
    };
    const staff: StaffRow[] = raw.map((row: Record<string, unknown>) => ({
      id: String(row.id ?? ""),
      full_name: String(row.full_name ?? row.fullname ?? "—"),
      role: String(row.role ?? "—"),
      outlet_id: row.outlet_id != null ? String(row.outlet_id) : null,
      phone_number: row.phone_number != null ? String(row.phone_number) : null,
      is_active: row.is_active !== false,
    }));

    const outletIds = Array.from(new Set(staff.map((s) => s.outlet_id).filter(Boolean))) as string[];
    const outletMap: Record<string, string> = {};
    if (outletIds.length > 0) {
      const { data: outlets } = await supabase
        .from("outlets")
        .select("id, outlet_name")
        .in("id", outletIds);
      outlets?.forEach((o) => (outletMap[o.id] = o.outlet_name));
    }
    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    return {
      staff: staff.map((s) => ({
        ...s,
        outlet_name: s.outlet_id ? (outletMap[s.outlet_id] ?? "—") : "—",
      })),
      total,
      totalPages,
      error: null,
    };
  } catch (e) {
    return { staff: [], total: 0, totalPages: 1, error: e instanceof Error ? e.message : "Failed to load staff" };
  }
}

async function getOutlets(
  supabase: NonNullable<typeof import("@/lib/supabase").supabase>,
  outletId: string | null
) {
  let q = supabase.from("outlets").select("id, outlet_name").order("outlet_name");
  if (outletId) q = q.eq("id", outletId);
  const { data } = await q;
  return data ?? [];
}

export default async function StaffPage({
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
  const [{ staff, total, totalPages, error }, outlets] = await Promise.all([
    getStaff(supabase, page, outletId),
    getOutlets(supabase, outletId),
  ]);

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-100">Staff</h1>
        <div className="rounded-lg bg-amber-900/30 border border-amber-600/50 p-4 text-amber-200">
          <p>Staff table may not exist in your database.</p>
          <p className="text-sm mt-1">{error}</p>
          <p className="text-sm mt-2">
            To track staff, add a <code className="bg-slate-800 px-1 rounded">staff</code> table in Supabase with
            columns: id, full_name, role, outlet_id (optional), phone_number, is_active.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Staff</h1>
      <p className="text-slate-400 text-sm">
        <strong className="text-slate-200">{total}</strong> staff total · Page {page} of {totalPages}. Add staff below or activate/deactivate and edit from the table.
      </p>

      <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Add staff</h2>
        <form action={addStaff} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Name</label>
            <input type="text" name="full_name" required className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200 text-sm" placeholder="Full name" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Role</label>
            <select name="role" required className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200 text-sm">
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Outlet</label>
            <select name="outlet_id" className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200 text-sm">
              <option value="">— No outlet —</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>{o.outlet_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Phone</label>
            <input type="text" name="phone_number" className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200 text-sm" placeholder="Optional" />
          </div>
          <button type="submit" className="rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 text-sm font-medium">
            Add staff
          </button>
        </form>
      </div>

      {staff.length === 0 && (
        <div className="rounded-lg bg-slate-800/80 border border-slate-600 p-4 text-slate-300 space-y-2">
          <p>No staff in this project. Check Supabase:</p>
          <ul className="list-disc list-inside text-sm text-slate-400">
            <li>Table Editor → <code className="bg-slate-700 px-1 rounded">staff</code> — confirm this is the same project as in .env.local (Overview shows its staff count).</li>
            <li>Run <code className="bg-slate-700 px-1 rounded">008_staff_table_and_seed.sql</code> in this project’s SQL Editor to create the staff table and seed data.</li>
            <li>If RLS is enabled on <code className="bg-slate-700 px-1 rounded">staff</code>, add a policy that allows <code className="bg-slate-700 px-1 rounded">service_role</code> to SELECT, or disable RLS for this table.</li>
          </ul>
        </div>
      )}
      <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
        {staff.length === 0 ? null : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-600 bg-slate-800/80">
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-left py-3 px-4">Outlet</th>
                <th className="text-left py-3 px-4">Phone</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-b border-slate-700/50">
                  <td className="py-3 px-4 font-medium text-slate-200">{s.full_name}</td>
                  <td className="py-3 px-4">{s.role ?? "—"}</td>
                  <td className="py-3 px-4">{s.outlet_name}</td>
                  <td className="py-3 px-4">{s.phone_number ?? "—"}</td>
                  <td className="py-3 px-4">
                    <span className={s.is_active ? "text-emerald-400" : "text-slate-500"}>
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-4 flex flex-wrap gap-2">
                    <form action={setStaffActiveForm} className="inline">
                      <input type="hidden" name="staffId" value={s.id} />
                      <input type="hidden" name="isActive" value={String(!s.is_active)} />
                      <button
                        type="submit"
                        className={`text-xs px-2 py-1 rounded border ${
                          s.is_active ? "border-amber-600 text-amber-400 hover:bg-amber-900/30" : "border-emerald-600 text-emerald-400 hover:bg-emerald-900/30"
                        }`}
                      >
                        {s.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                    <Link
                      href={`/staff/${s.id}/edit`}
                      className="text-xs px-2 py-1 rounded border border-sky-600 text-sky-400 hover:bg-sky-900/30"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {totalPages > 1 && (
        <nav className="flex items-center justify-between gap-4 flex-wrap">
          <span className="text-slate-400 text-sm">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Link
              href={page <= 1 ? "/staff" : `/staff?page=${page - 1}`}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:pointer-events-none"
              aria-disabled={page <= 1}
            >
              Previous
            </Link>
            <Link
              href={page >= totalPages ? `/staff?page=${totalPages}` : `/staff?page=${page + 1}`}
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
