"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { hashPassword, setSession } from "@/lib/auth";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");
  return createClient(url, key);
}

export type LoginResult = { error?: string };

export async function login(_prevState: LoginResult, formData: FormData): Promise<LoginResult> {
  const role = (formData.get("role") as string)?.trim();
  const email = (formData.get("email") as string)?.trim()?.toLowerCase();
  const password = formData.get("password") as string;

  if (!role || !email || !password) {
    return { error: "Role, email and password are required." };
  }
  if (role !== "owner" && role !== "manager") {
    return { error: "Invalid role." };
  }

  const supabase = getSupabase();
  const pwdHash = hashPassword(password);

  if (role === "owner") {
    const { data, error } = await supabase
      .from("dashboard_users")
      .select("id, email, status")
      .eq("email", email)
      .eq("role", "owner")
      .is("outlet_id", null)
      .single();

    if (error || !data) {
      return { error: "Invalid email or password." };
    }
    if ((data.status || "approved") !== "approved") {
      return { error: "Your registration is pending. Please wait until we approve your request." };
    }
    const { data: row } = await supabase
      .from("dashboard_users")
      .select("password_hash")
      .eq("id", data.id)
      .single();
    if (!row || row.password_hash !== pwdHash) {
      return { error: "Invalid email or password." };
    }
    await setSession({
      role: "owner",
      outletId: null,
      outletName: null,
      email: data.email,
      selectedOutletId: null,
    });
    redirect("/");
  }

  // Manager: must select outlet
  const outletId = (formData.get("outlet_id") as string)?.trim();
  if (!outletId) {
    return { error: "Please select an outlet." };
  }

  const { data: user, error } = await supabase
    .from("dashboard_users")
    .select("id, email, outlet_id, status, outlets(outlet_name)")
    .eq("email", email)
    .eq("role", "manager")
    .eq("outlet_id", outletId)
    .single();

  if (error || !user) {
    return { error: "Invalid email, outlet or password." };
  }
  if ((user.status || "approved") !== "approved") {
    return { error: "Your registration is pending. Please wait until we approve your request." };
  }

  const { data: pwdRow } = await supabase
    .from("dashboard_users")
    .select("password_hash")
    .eq("id", user.id)
    .single();

  if (!pwdRow || pwdRow.password_hash !== pwdHash) {
    return { error: "Invalid email, outlet or password." };
  }

  const outletName =
    (user.outlets as { outlet_name?: string } | null)?.outlet_name ?? null;

  await setSession({
    role: "manager",
    outletId: user.outlet_id as string,
    outletName,
    email: user.email,
  });
  redirect("/");
}
