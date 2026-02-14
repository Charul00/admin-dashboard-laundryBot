import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { RegisterForm } from "./RegisterForm";

export const dynamic = "force-dynamic";

async function getOutlets() {
  if (!supabase) return [];
  const { data } = await supabase.from("outlets").select("id, outlet_name").order("outlet_name");
  return data ?? [];
}

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/");

  const outlets = await getOutlets();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-slate-700 p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-sky-400 mb-1">Request access</h1>
        <p className="text-slate-400 text-sm mb-6">
          Register as Owner or Manager. Your request will be reviewed — you can log in after approval.
        </p>
        <RegisterForm outlets={outlets} />
        <p className="mt-4 text-xs text-slate-500">
          Already have an account?{" "}
          <a href="/login" className="text-sky-400 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
