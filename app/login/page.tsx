import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

async function getOutlets() {
  if (!supabase) return [];
  const { data } = await supabase.from("outlets").select("id, outlet_name").order("outlet_name");
  return data ?? [];
}

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");

  const outlets = await getOutlets();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4 relative z-10">
      <div className="card-surface-accent w-full max-w-md p-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] bg-clip-text text-transparent mb-1">
          LaundryOps Admin
        </h1>
        <p className="text-[var(--muted)] text-sm mb-6">Sign in as Owner or Manager</p>

        <LoginForm outlets={outlets} />

        <p className="mt-4 text-xs text-[var(--muted)]">
          Owner: <code className="bg-[var(--card-hover)] px-1.5 py-0.5 rounded text-[var(--accent)]">owner@laundryops.com</code> / <code className="bg-[var(--card-hover)] px-1.5 py-0.5 rounded">owner123</code>
          {" · "}
          Manager: <code className="bg-[var(--card-hover)] px-1.5 py-0.5 rounded text-[var(--accent)]">manager@laundryops.com</code> + outlet / <code className="bg-[var(--card-hover)] px-1.5 py-0.5 rounded">manager123</code>
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-[var(--accent)] hover:underline font-medium">
            Register here
          </a>
          {" "}— wait until we approve your request to sign in.
        </p>
      </div>
    </div>
  );
}
