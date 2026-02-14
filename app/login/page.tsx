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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-slate-700 p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-sky-400 mb-1">LaundryOps Admin</h1>
        <p className="text-slate-400 text-sm mb-6">Sign in as Owner or Manager</p>

        <LoginForm outlets={outlets} />

        <p className="mt-4 text-xs text-slate-500">
          Owner: <code className="bg-slate-700 px-1 rounded">owner@laundryops.com</code> / <code className="bg-slate-700 px-1 rounded">owner123</code>
          {" · "}
          Manager: <code className="bg-slate-700 px-1 rounded">manager@laundryops.com</code> + outlet / <code className="bg-slate-700 px-1 rounded">manager123</code>
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-sky-400 hover:underline">
            Register here
          </a>
          {" "}— wait until we approve your request to sign in.
        </p>
      </div>
    </div>
  );
}
