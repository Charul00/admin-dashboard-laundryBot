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
    <tr className="border-b border-slate-700/50">
      <td className="py-3 px-4 font-medium text-slate-200">{email}</td>
      <td className="py-3 px-4 capitalize">{role}</td>
      <td className="py-3 px-4">{outletName}</td>
      <td className="py-3 px-4 text-slate-400">{createdAt?.slice(0, 10) ?? "—"}</td>
      <td className="py-3 px-4 flex gap-2">
        <form action={approveRequest} className="inline">
          <input type="hidden" name="userId" value={id} />
          <button
            type="submit"
            className="rounded bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 text-xs font-medium"
          >
            Approve
          </button>
        </form>
        <form action={rejectRequest} className="inline">
          <input type="hidden" name="userId" value={id} />
          <button
            type="submit"
            className="rounded bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 text-xs font-medium"
          >
            Reject
          </button>
        </form>
      </td>
    </tr>
  );
}
