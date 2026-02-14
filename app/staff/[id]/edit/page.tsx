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
      <div className="rounded-lg bg-amber-900/30 border border-amber-600/50 p-4 text-amber-200">
        <p>Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY to .env.local</p>
      </div>
    );
  }
  const [staff, outlets] = await Promise.all([getStaffById(supabase, id), getOutlets(supabase, outletId)]);
  if (!staff) notFound();
  if (outletId && staff.outlet_id !== outletId) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/staff" className="text-slate-400 hover:text-slate-200 text-sm">
          ← Back to staff
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-100">Edit staff</h1>
      <p className="text-slate-400 text-sm">
        Update name, role, outlet assignment, or phone.
      </p>
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-5 max-w-xl">
        <form action={updateStaffForm} className="space-y-4">
          <input type="hidden" name="staffId" value={staff.id} />
          <div>
            <label className="block text-xs text-slate-400 mb-1">Name</label>
            <input
              type="text"
              name="full_name"
              defaultValue={staff.full_name}
              required
              className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Role</label>
            <select
              name="role"
              defaultValue={staff.role}
              required
              className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200 text-sm"
            >
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Outlet</label>
            <select
              name="outlet_id"
              defaultValue={staff.outlet_id ?? ""}
              className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200 text-sm"
            >
              <option value="">— No outlet —</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.outlet_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Phone</label>
            <input
              type="text"
              name="phone_number"
              defaultValue={staff.phone_number ?? ""}
              className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200 text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 text-sm font-medium"
            >
              Save changes
            </button>
            <Link
              href="/staff"
              className="rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 text-sm font-medium"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
