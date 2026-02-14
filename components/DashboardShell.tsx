"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { Session } from "@/lib/auth";
import { setSelectedOutlet } from "@/app/select-outlet/actions";
import { logout } from "@/app/logout/actions";

type OutletOption = { id: string; outlet_name: string };

export function DashboardShell({
  children,
  session,
  outlets,
}: {
  children: React.ReactNode;
  session: Session | null;
  outlets: OutletOption[];
}) {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/register") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="font-bold text-lg text-sky-400">LaundryOps</h1>
          <p className="text-xs text-slate-400">
            {session?.role === "owner" ? "Owner" : "Manager"} Dashboard
          </p>
          {session?.outletName && (
            <p className="text-xs text-slate-300 mt-1 truncate" title={session.outletName}>
              {session.outletName}
            </p>
          )}
        </div>

        {session?.role === "owner" && outlets.length > 0 && (
          <div className="p-2 border-b border-slate-700">
            <form action={setSelectedOutlet} className="space-y-1">
              <input type="hidden" name="redirect" value={pathname || "/"} />
              <label className="block text-xs text-slate-400 mb-1">View outlet</label>
              <select
                name="outlet_id"
                defaultValue={session.selectedOutletId ?? ""}
                onChange={(e) => e.target.form?.requestSubmit()}
                className="w-full rounded bg-slate-700 border border-slate-600 px-2 py-1.5 text-slate-200 text-sm"
              >
                <option value="">All outlets</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>{o.outlet_name}</option>
                ))}
              </select>
            </form>
          </div>
        )}

        <nav className="flex-1 p-2">
          <Link
            href="/"
            className={`block px-3 py-2 rounded-lg mb-1 ${pathname === "/" ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-700 hover:text-white"}`}
          >
            Overview
          </Link>
          <Link
            href="/outlets"
            className={`block px-3 py-2 rounded-lg mb-1 ${pathname === "/outlets" ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-700 hover:text-white"}`}
          >
            Outlets
          </Link>
          <Link
            href="/orders"
            className={`block px-3 py-2 rounded-lg mb-1 ${pathname === "/orders" ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-700 hover:text-white"}`}
          >
            Orders
          </Link>
          <Link
            href="/staff"
            className={`block px-3 py-2 rounded-lg mb-1 ${pathname === "/staff" ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-700 hover:text-white"}`}
          >
            Staff
          </Link>
          <Link
            href="/feedback"
            className={`block px-3 py-2 rounded-lg mb-1 ${pathname === "/feedback" ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-700 hover:text-white"}`}
          >
            Feedback
          </Link>
          {session?.role === "owner" && (
            <Link
              href="/pending-requests"
              className={`block px-3 py-2 rounded-lg mb-1 ${pathname === "/pending-requests" ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-700 hover:text-white"}`}
            >
              Pending requests
            </Link>
          )}
        </nav>

        <div className="p-2 border-t border-slate-700">
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white text-sm"
            >
              Logout
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
