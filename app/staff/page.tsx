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
      <div className="card-surface border-amber-500/40 bg-amber-500/10 p-4 text-amber-200">
        <p>Service temporarily unavailable. Please try again later.</p>
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
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Staff</h1>
        <div className="card-surface border-amber-500/40 bg-amber-500/10 p-4 text-amber-200">
          <p>Could not load staff. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Staff</h1>
      <p className="text-[var(--muted)] text-sm">
        <strong className="text-slate-200">{total}</strong> staff total · Page {page} of {totalPages}. Add staff below or activate/deactivate and edit from the table.
      </p>

      <div className="card-surface p-5">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Add staff</h2>
        <form action={addStaff} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Name</label>
            <input type="text" name="full_name" required className="input-field w-full text-sm" placeholder="Full name" />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Role</label>
            <select name="role" required className="input-field w-full text-sm">
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Outlet</label>
            <select name="outlet_id" className="input-field w-full text-sm">
              <option value="">— No outlet —</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>{o.outlet_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Phone</label>
            <input type="text" name="phone_number" className="input-field w-full text-sm" placeholder="Optional" />
          </div>
          <button type="submit" className="rounded-xl bg-[var(--success)]/20 hover:bg-[var(--success)]/30 border border-[var(--success)]/40 text-emerald-300 px-4 py-2.5 text-sm font-semibold transition-colors">
            Add staff
          </button>
        </form>
      </div>

      {staff.length === 0 && (
        <div className="card-surface p-4 text-slate-300">
          <p>No staff found.</p>
        </div>
      )}
      <div className="card-surface overflow-hidden">
        {staff.length === 0 ? null : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[var(--muted)] border-b border-[var(--border)] bg-[var(--card-hover)]/50">
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
                <tr key={s.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--card-hover)]/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-200">{s.full_name}</td>
                  <td className="py-3 px-4">{s.role ?? "—"}</td>
                  <td className="py-3 px-4">{s.outlet_name}</td>
                  <td className="py-3 px-4">{s.phone_number ?? "—"}</td>
                  <td className="py-3 px-4">
                    <span className={s.is_active ? "text-[var(--success)]" : "text-[var(--muted)]"}>
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-4 flex flex-wrap gap-2">
                    <form action={setStaffActiveForm} className="inline">
                      <input type="hidden" name="staffId" value={s.id} />
                      <input type="hidden" name="isActive" value={String(!s.is_active)} />
                      <button
                        type="submit"
                        className={`text-xs px-2.5 py-1 rounded-xl border font-medium transition-colors ${
                          s.is_active ? "border-amber-500/40 text-amber-400 hover:bg-amber-500/20" : "border-[var(--success)]/40 text-emerald-400 hover:bg-[var(--success)]/20"
                        }`}
                      >
                        {s.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                    <Link
                      href={`/staff/${s.id}/edit`}
                      className="text-xs px-2.5 py-1 rounded-xl border border-[var(--border-accent)] text-[var(--accent)] hover:bg-[var(--accent-glow)] transition-colors font-medium"
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
          <span className="text-[var(--muted)] text-sm">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Link
              href={page <= 1 ? "/staff" : `/staff?page=${page - 1}`}
              className="rounded-xl bg-[var(--card-hover)] border border-[var(--border)] px-4 py-2 text-sm text-slate-200 hover:border-[var(--border-accent)] hover:bg-[var(--accent-glow)] transition-colors disabled:opacity-50 disabled:pointer-events-none"
              aria-disabled={page <= 1}
            >
              Previous
            </Link>
            <Link
              href={page >= totalPages ? `/staff?page=${totalPages}` : `/staff?page=${page + 1}`}
              className="rounded-xl bg-[var(--card-hover)] border border-[var(--border)] px-4 py-2 text-sm text-slate-200 hover:border-[var(--border-accent)] hover:bg-[var(--accent-glow)] transition-colors disabled:opacity-50 disabled:pointer-events-none"
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
