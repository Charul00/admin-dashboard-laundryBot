"use client";

import { approveRequest, rejectRequest } from "./actions";

export function PendingRequestRow({
  id,
  email,
  role,
  outletName,
  createdAt,
}: {
  id: string;
  email: string;
  role: string;
  outletName: string;
  createdAt: string | null;
}) {
  return (
    <tr className="border-b border-[var(--border)]/50 hover:bg-[var(--card-hover)]/50 transition-colors">
      <td className="py-3 px-4 font-medium text-slate-200">{email}</td>
      <td className="py-3 px-4 capitalize">{role}</td>
      <td className="py-3 px-4">{outletName}</td>
      <td className="py-3 px-4 text-[var(--muted)]">{createdAt?.slice(0, 10) ?? "—"}</td>
      <td className="py-3 px-4 flex gap-2">
        <form action={approveRequest} className="inline">
          <input type="hidden" name="userId" value={id} />
          <button
            type="submit"
            className="rounded-xl bg-[var(--success)]/20 hover:bg-[var(--success)]/30 border border-[var(--success)]/40 text-emerald-300 px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            Approve
          </button>
        </form>
        <form action={rejectRequest} className="inline">
          <input type="hidden" name="userId" value={id} />
          <button
            type="submit"
            className="rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            Reject
          </button>
        </form>
      </td>
    </tr>
  );
}
