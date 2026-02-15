"use client";

import { useFormState } from "react-dom";
import { login, type LoginResult } from "./actions";
import { useEffect, useRef } from "react";

type Outlet = { id: string; outlet_name: string };

export function LoginForm({ outlets }: { outlets: Outlet[] }) {
  const [state, formAction] = useFormState<LoginResult, FormData>(login, {});
  const outletFieldRef = useRef<HTMLDivElement>(null);
  const outletSelectRef = useRef<HTMLSelectElement>(null);

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

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Login as</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="role" value="owner" defaultChecked className="rounded border-[var(--border)] bg-[var(--card)] text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]" />
            <span className="text-slate-200">Owner</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="role" value="manager" className="rounded border-[var(--border)] bg-[var(--card)] text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]" />
            <span className="text-slate-200">Manager</span>
          </label>
        </div>
      </div>

      <div ref={outletFieldRef} className="hidden">
        <label className="block text-sm font-medium text-slate-300 mb-1">Outlet</label>
        <select ref={outletSelectRef} name="outlet_id" className="input-field w-full text-sm">
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
          placeholder="owner@laundryops.com"
          className="input-field w-full text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
        <input
          type="password"
          name="password"
          required
          placeholder="••••••••"
          className="input-field w-full text-sm"
        />
      </div>

      {state?.error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/40 px-3 py-2 text-red-300 text-sm">
          {state.error}
        </div>
      )}

      <button type="submit" className="btn-accent w-full text-white font-medium py-3 text-sm">
        Sign in
      </button>
    </form>
  );
}
