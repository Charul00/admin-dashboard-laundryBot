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
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4 relative z-10">
      <div className="card-surface-accent w-full max-w-md p-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] bg-clip-text text-transparent mb-1">
          Request access
        </h1>
        <p className="text-[var(--muted)] text-sm mb-6">
          Register as Owner or Manager. Your request will be reviewed — you can log in after approval.
        </p>
        <RegisterForm outlets={outlets} />
        <p className="mt-4 text-xs text-[var(--muted)]">
          Already have an account?{" "}
          <a href="/login" className="text-[var(--accent)] hover:underline font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
