"use client";

import { useFormState } from "react-dom";
import { register, type RegisterResult } from "./actions";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Outlet = { id: string; outlet_name: string };

export function RegisterForm({ outlets }: { outlets: Outlet[] }) {
  const [state, formAction] = useFormState<RegisterResult, FormData>(register, {});
  const outletFieldRef = useRef<HTMLDivElement>(null);
  const outletSelectRef = useRef<HTMLSelectElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.push("/login?registered=1");
    }
  }, [state?.success, router]);

  useEffect(() => {
    const roleInputs = document.querySelectorAll('input[name="role"]');
    const toggle = () => {
      const isManager = (document.querySelector('input[name="role"]:checked') as HTMLInputElement)?.value === "manager";
      if (outletFieldRef.current) outletFieldRef.current.classList.toggle("hidden", !isManager);
      if (outletSelectRef.current) outletSelectRef.current.required = isManager;
    };
    roleInputs.forEach((r) => r.addEventListener("change", toggle));
    toggle();
    return () => roleInputs.forEach((r) => r.removeEventListener("change", toggle));
  }, []);

  if (state?.success) {
    return (
      <div className="rounded-lg bg-emerald-900/30 border border-emerald-600/50 px-3 py-2 text-emerald-200 text-sm">
        Registration submitted. Redirecting to login…
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Register as</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="role" value="owner" defaultChecked className="rounded border-slate-600 bg-slate-700 text-sky-500" />
            <span className="text-slate-200">Owner</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="role" value="manager" className="rounded border-slate-600 bg-slate-700 text-sky-500" />
            <span className="text-slate-200">Manager</span>
          </label>
        </div>
      </div>

      <div ref={outletFieldRef} className="hidden">
        <label className="block text-sm font-medium text-slate-300 mb-1">Outlet</label>
        <select
          ref={outletSelectRef}
          name="outlet_id"
          className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200 text-sm"
        >
          <option value="">— Select outlet —</option>
          {outlets.map((o) => (
            <option key={o.id} value={o.id}>{o.outlet_name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200 placeholder-slate-500 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Password (min 6 characters)</label>
        <input
          type="password"
          name="password"
          required
          minLength={6}
          placeholder="••••••••"
          className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200 placeholder-slate-500 text-sm"
        />
      </div>

      {state?.error && (
        <div className="rounded-lg bg-amber-900/30 border border-amber-600/50 px-3 py-2 text-amber-200 text-sm">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        className="w-full rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium py-2.5 text-sm"
      >
        Submit request
      </button>
      <p className="text-xs text-slate-400">
        Your request will be reviewed. You can log in after we approve it. Check your email or try logging in later.
      </p>
    </form>
  );
}
