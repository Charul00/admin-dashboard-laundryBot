"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { getSession, getEffectiveOutletId } from "@/lib/auth";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");
  return createClient(url, key);
}

export async function updateOrderStatus(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  const status = (formData.get("status") as string)?.trim();
  if (!orderId || !status) throw new Error("Missing order or status");
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const outletId = getEffectiveOutletId(session);
  const supabase = getSupabase();
  let query = supabase.from("orders").update({ status }).eq("id", orderId);
  if (outletId) query = query.eq("outlet_id", outletId);
  const { data, error } = await query.select("id").single();
  if (error || !data) throw new Error("Order not found or not in your outlet");
  revalidatePath("/orders");
  revalidatePath("/");
}
