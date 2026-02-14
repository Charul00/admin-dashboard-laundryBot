"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/auth";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");
  return createClient(url, key);
}

export async function approveRequest(formData: FormData) {
  const userId = formData.get("userId") as string;
  if (!userId) throw new Error("Missing user");
  const session = await getSession();
  if (!session || session.role !== "owner") throw new Error("Unauthorized");
  const supabase = getSupabase();
  const { error } = await supabase
    .from("dashboard_users")
    .update({ status: "approved" })
    .eq("id", userId)
    .eq("status", "pending");
  if (error) throw new Error(error.message);
  revalidatePath("/pending-requests");
  revalidatePath("/");
}

export async function rejectRequest(formData: FormData) {
  const userId = formData.get("userId") as string;
  if (!userId) throw new Error("Missing user");
  const session = await getSession();
  if (!session || session.role !== "owner") throw new Error("Unauthorized");
  const supabase = getSupabase();
  const { error } = await supabase
    .from("dashboard_users")
    .update({ status: "rejected" })
    .eq("id", userId)
    .eq("status", "pending");
  if (error) throw new Error(error.message);
  revalidatePath("/pending-requests");
  revalidatePath("/");
}
