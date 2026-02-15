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

  const navClass = (path: string) =>
    pathname === path ? "nav-link nav-link-active" : "nav-link nav-link-inactive";

  return (
    <div className="flex min-h-screen relative z-10">
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-sm">
        <div className="p-5 border-b border-[var(--border)]">
          <h1 className="font-bold text-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
            LaundryOps
          </h1>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            {session?.role === "owner" ? "Owner" : "Manager"} Dashboard
          </p>
          {session?.outletName && (
            <p className="text-xs text-slate-400 mt-1 truncate" title={session.outletName}>
              {session.outletName}
            </p>
          )}
        </div>

        {session?.role === "owner" && outlets.length > 0 && (
          <div className="p-3 border-b border-[var(--border)]">
            <form action={setSelectedOutlet} className="space-y-2">
              <input type="hidden" name="redirect" value={pathname || "/"} />
              <label className="block text-xs font-medium text-[var(--muted)]">View outlet</label>
              <select
                name="outlet_id"
                defaultValue={session.selectedOutletId ?? ""}
                onChange={(e) => e.target.form?.requestSubmit()}
                className="input-field w-full text-sm py-2"
              >
                <option value="">All outlets</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>{o.outlet_name}</option>
                ))}
              </select>
            </form>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-0.5">
          <Link href="/" className={navClass("/")}>Overview</Link>
          <Link href="/outlets" className={navClass("/outlets")}>Outlets</Link>
          <Link href="/orders" className={navClass("/orders")}>Orders</Link>
          <Link href="/staff" className={navClass("/staff")}>Staff</Link>
          <Link href="/feedback" className={navClass("/feedback")}>Feedback</Link>
          {session?.role === "owner" && (
            <Link href="/pending-requests" className={navClass("/pending-requests")}>
              Pending requests
            </Link>
          )}
        </nav>

        <div className="p-3 border-t border-[var(--border)]">
          <form action={logout}>
            <button
              type="submit"
              className="nav-link w-full text-left text-[var(--muted)] hover:text-[var(--error)] hover:bg-red-500/10"
            >
              Logout
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6 bg-transparent">{children}</main>
    </div>
  );
}
