"use server";

import { redirect } from "next/navigation";
import { getSession, setSession } from "@/lib/auth";

export async function setSelectedOutlet(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "owner") return;
  const outletId = (formData.get("outlet_id") as string)?.trim() || null;
  await setSession({ ...session, selectedOutletId: outletId });
  const redirectTo = (formData.get("redirect") as string)?.trim() || "/";
  redirect(redirectTo.startsWith("/") ? redirectTo : "/");
}
