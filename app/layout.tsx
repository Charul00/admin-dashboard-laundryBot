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
  const session = await getSession();
  const outlets = session?.role === "owner" ? await getOutlets() : [];
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
