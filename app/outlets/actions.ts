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

export async function setOutletActive(formData: FormData) {
  const outletId = formData.get("outletId") as string;
  const isActive = formData.get("isActive") === "true";
  if (!outletId) throw new Error("Missing outlet");
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const scopeOutletId = getEffectiveOutletId(session);
  if (scopeOutletId && scopeOutletId !== outletId) throw new Error("You can only update your outlet");
  const supabase = getSupabase();
  const { error } = await supabase
    .from("outlets")
    .update({ is_active: isActive })
    .eq("id", outletId);
  if (error) throw new Error(error.message);
  revalidatePath("/outlets");
  revalidatePath("/");
}
