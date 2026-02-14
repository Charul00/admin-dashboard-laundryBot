import { createHash } from "crypto";
import { cookies } from "next/headers";

export type Session = {
  role: "owner" | "manager";
  outletId: string | null;
  outletName: string | null;
  email: string;
  /** Owner only: which outlet is selected for viewing (null = all). */
  selectedOutletId?: string | null;
};

const SESSION_COOKIE = "laundryops_session";
const MAX_AGE = 60 * 60 * 24; // 24 hours

export function hashPassword(password: string): string {
  return createHash("sha256").update(password, "utf8").digest("hex");
}

export function encodeSession(session: Session): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export function decodeSession(value: string): Session | null {
  try {
    const json = Buffer.from(value, "base64url").toString("utf8");
    const s = JSON.parse(json) as Session;
    if (s.role !== "owner" && s.role !== "manager") return null;
    return s;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const c = await cookies();
  const value = c.get(SESSION_COOKIE)?.value;
  if (!value) return null;
  return decodeSession(value);
}

export async function setSession(session: Session): Promise<void> {
  const c = await cookies();
  c.set(SESSION_COOKIE, encodeSession(session), {
    httpOnly: true,
    path: "/",
    maxAge: MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession(): Promise<void> {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
}

/** Effective outlet for data scope: manager = their outlet; owner = selected outlet or null (all). */
export function getEffectiveOutletId(session: Session): string | null {
  if (session.role === "manager") return session.outletId;
  return session.selectedOutletId ?? null;
}
