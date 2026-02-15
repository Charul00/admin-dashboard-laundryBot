import { unstable_noStore } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getSession, getEffectiveOutletId } from "@/lib/auth";
import { updateStaffForm } from "../../actions";

const STAFF_ROLES = ["washer", "ironer", "manager", "delivery"] as const;

export const dynamic = "force-dynamic";

async function getStaffById(
  supabase: NonNullable<typeof import("@/lib/supabase").supabase>,
  id: string
) {
  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    full_name: (row.full_name ?? row.fullname ?? "") as string,
    role: (row.role ?? "") as string,
    outlet_id: (row.outlet_id ?? null) as string | null,
    phone_number: (row.phone_number ?? null) as string | null,
    is_active: row.is_active !== false,
  };
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

export default async function StaffEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  unstable_noStore();
  const { id } = await params;
  const session = await getSession();
  const outletId = session ? getEffectiveOutletId(session) : null;
  if (!supabase) {
    return (
      <div className="card-surface border-amber-500/40 bg-amber-500/10 p-4 text-amber-200">
        <p>Service temporarily unavailable. Please try again later.</p>
      </div>
    );
  }
  const [staff, outlets] = await Promise.all([getStaffById(supabase, id), getOutlets(supabase, outletId)]);
  if (!staff) notFound();
  if (outletId && staff.outlet_id !== outletId) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/staff" className="text-[var(--muted)] hover:text-[var(--accent)] text-sm font-medium transition-colors">
          ← Back to staff
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Edit staff</h1>
      <p className="text-[var(--muted)] text-sm">
        Update name, role, outlet assignment, or phone.
      </p>
      <div className="card-surface p-5 max-w-xl">
        <form action={updateStaffForm} className="space-y-4">
          <input type="hidden" name="staffId" value={staff.id} />
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Name</label>
            <input type="text" name="full_name" defaultValue={staff.full_name} required className="input-field w-full text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Role</label>
            <select name="role" defaultValue={staff.role} required className="input-field w-full text-sm">
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Outlet</label>
            <select name="outlet_id" defaultValue={staff.outlet_id ?? ""} className="input-field w-full text-sm">
              <option value="">— No outlet —</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>{o.outlet_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Phone</label>
            <input type="text" name="phone_number" defaultValue={staff.phone_number ?? ""} className="input-field w-full text-sm" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="rounded-xl bg-[var(--success)]/20 hover:bg-[var(--success)]/30 border border-[var(--success)]/40 text-emerald-300 px-4 py-2.5 text-sm font-semibold transition-colors">
              Save changes
            </button>
            <Link href="/staff" className="rounded-xl bg-[var(--card-hover)] border border-[var(--border)] hover:border-[var(--border-accent)] text-slate-200 px-4 py-2.5 text-sm font-medium transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
