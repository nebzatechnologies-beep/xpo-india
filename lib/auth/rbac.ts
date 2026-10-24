import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth.config";

export async function getSession() { return await auth(); }

export function hasRole(session: any, role: string): boolean {
  if (!session?.user) return false;
  const { role: userRole, roles } = session.user;
  return userRole === role || (Array.isArray(roles) && roles.includes(role));
}

export function isAdmin(session: any): boolean {
  return hasRole(session, "superadmin") || hasRole(session, "staff");
}

export function isSuperAdmin(session: any): boolean {
  return hasRole(session, "superadmin");
}

export function requireAuth(session: any): void {
  if (!session?.user) throw new Error("Unauthorized");
}

export function requireRole(session: any, role: string): void {
  requireAuth(session);
  if (!hasRole(session, role)) throw new Error("Forbidden");
}

export function requireAdmin(session: any): void {
  requireAuth(session);
  if (!isAdmin(session)) throw new Error("Forbidden");
}
