"use server";

import { createClient } from "@supabase/supabase-js";
import { hashPassword } from "@/lib/auth";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");
  return createClient(url, key);
}

export type RegisterResult = { error?: string; success?: boolean };

export async function register(_prevState: RegisterResult, formData: FormData): Promise<RegisterResult> {
  const role = (formData.get("role") as string)?.trim();
  const email = (formData.get("email") as string)?.trim()?.toLowerCase();
  const password = formData.get("password") as string;

  if (!role || !email || !password) {
    return { error: "Role, email and password are required." };
  }
  if (role !== "owner" && role !== "manager") {
    return { error: "Invalid role." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const outletId = role === "manager" ? (formData.get("outlet_id") as string)?.trim() : null;
  if (role === "manager" && !outletId) {
    return { error: "Please select an outlet." };
  }

  const supabase = getSupabase();
  const pwdHash = hashPassword(password);

  try {
    const { error } = await supabase.from("dashboard_users").insert({
      email,
      password_hash: pwdHash,
      role,
      outlet_id: outletId || null,
      status: "pending",
    });
    if (error) {
      if (error.code === "23505") return { error: "This email (and outlet) is already registered." };
      return { error: error.message };
    }
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Registration failed." };
  }
}
