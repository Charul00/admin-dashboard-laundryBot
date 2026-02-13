"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

const STAFF_ROLES = ["washer", "ironer", "manager", "delivery"] as const;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");
  return createClient(url, key);
}

export async function setStaffActive(staffId: string, isActive: boolean) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("staff")
    .update({ is_active: isActive })
    .eq("id", staffId);
  if (error) throw new Error(error.message);
  revalidatePath("/staff");
  revalidatePath("/");
}

async function updateStaff(
  staffId: string,
  data: { full_name?: string; role?: string; outlet_id?: string | null; phone_number?: string | null }
) {
  const supabase = getSupabase();
  if (data.role && !STAFF_ROLES.includes(data.role as (typeof STAFF_ROLES)[number])) {
    throw new Error("Role must be one of: washer, ironer, manager, delivery");
  }
  const payload: Record<string, unknown> = {};
  if (data.full_name !== undefined) payload.full_name = data.full_name;
  if (data.role !== undefined) payload.role = data.role;
  if (data.outlet_id !== undefined) payload.outlet_id = data.outlet_id || null;
  if (data.phone_number !== undefined) payload.phone_number = data.phone_number || null;
  if (Object.keys(payload).length === 0) return;
  const { error } = await supabase.from("staff").update(payload).eq("id", staffId);
  if (error) throw new Error(error.message);
  revalidatePath("/staff");
  revalidatePath("/");
}

export async function addStaff(formData: FormData) {
  const full_name = (formData.get("full_name") as string)?.trim();
  const role = (formData.get("role") as string)?.trim();
  const outlet_id = (formData.get("outlet_id") as string) || null;
  const phone_number = (formData.get("phone_number") as string)?.trim() || null;
  if (!full_name) throw new Error("Name is required");
  if (!role || !STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])) {
    throw new Error("Role must be one of: washer, ironer, manager, delivery");
  }
  const supabase = getSupabase();
  const { error } = await supabase.from("staff").insert({
    full_name,
    role,
    outlet_id: outlet_id || null,
    phone_number: phone_number || null,
    is_active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/staff");
  revalidatePath("/");
}

export async function updateStaffForm(formData: FormData) {
  const staffId = formData.get("staffId") as string;
  const full_name = (formData.get("full_name") as string)?.trim();
  const role = formData.get("role") as string;
  const outlet_id = (formData.get("outlet_id") as string) || null;
  const phone_number = (formData.get("phone_number") as string)?.trim() || null;
  if (!staffId) throw new Error("Missing staff");
  return updateStaff(staffId, {
    full_name: full_name || undefined,
    role: role || undefined,
    outlet_id: outlet_id || null,
    phone_number: phone_number || null,
  });
}

export async function setStaffActiveForm(formData: FormData) {
  const staffId = formData.get("staffId") as string;
  const isActive = formData.get("isActive") === "true";
  if (!staffId) throw new Error("Missing staff");
  return setStaffActive(staffId, isActive);
}
