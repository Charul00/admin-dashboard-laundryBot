import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { PendingRequestRow } from "./PendingRequestRow";

export const dynamic = "force-dynamic";

async function getPendingUsers() {
  if (!supabase) return [];
  const { data } = await supabase
    .from("dashboard_users")
    .select("id, email, role, outlet_id, created_at, outlets(outlet_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    outlet_id: row.outlet_id,
    outlet_name: (row.outlets as { outlet_name?: string } | null)?.outlet_name ?? "—",
    created_at: row.created_at,
  }));
}

export default async function PendingRequestsPage() {
  const session = await getSession();
  if (!session || session.role !== "owner") redirect("/");

  const list = await getPendingUsers();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Pending requests</h1>
      <p className="text-slate-400 text-sm">
        Approve or reject registration requests. Approved users can log in.
      </p>
      {list.length === 0 ? (
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-6 text-slate-400 text-center">
          No pending requests.
        </div>
      ) : (
        <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-600 bg-slate-800/80">
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-left py-3 px-4">Outlet</th>
                <th className="text-left py-3 px-4">Requested</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <PendingRequestRow
                  key={u.id}
                  id={u.id}
                  email={u.email}
                  role={u.role}
                  outletName={u.outlet_name}
                  createdAt={u.created_at}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
