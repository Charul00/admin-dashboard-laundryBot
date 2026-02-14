"use client";

import { updateOrderStatus } from "@/app/orders/actions";

const ORDER_STATUSES = ["Received", "In Progress", "Ready", "Out for Delivery", "Delivered", "Cancelled"];

type Props = {
  orderId: string;
  currentStatus: string;
};

export function OrderStatusSelect({ orderId, currentStatus }: Props) {
  return (
    <form action={updateOrderStatus} className="inline">
      <input type="hidden" name="orderId" value={orderId} />
      <select
        name="status"
        defaultValue={currentStatus}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </form>
  );
}
