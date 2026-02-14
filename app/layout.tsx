import type { Metadata } from "next";
import "./globals.css";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { DashboardShell } from "@/components/DashboardShell";

export const metadata: Metadata = {
  title: "LaundryOps Admin",
  description: "Owner and Manager dashboard for LaundryOps outlets, orders, and analytics",
};

async function getOutlets() {
  if (!supabase) return [];
  const { data } = await supabase.from("outlets").select("id, outlet_name").order("outlet_name");
  return data ?? [];
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session: Awaited<ReturnType<typeof getSession>> = null;
  let outlets: Awaited<ReturnType<typeof getOutlets>> = [];
  try {
    session = await getSession();
    if (session?.role === "owner") {
      outlets = await getOutlets();
    }
  } catch {
    session = null;
    outlets = [];
  }
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-slate-900">
        <DashboardShell session={session} outlets={outlets}>
          {children}
        </DashboardShell>
      </body>
    </html>
  );
}
