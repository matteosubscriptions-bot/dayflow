import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";

/**
 * Resolves the authenticated user id for an API route.
 * Throws a Response (401) when unauthenticated — callers should let it
 * propagate, or use {@link requireUserId} inside a try/catch.
 *
 * Security: the userId always comes from the session, never request input
 * (per spec §16 — RLS-style scoping by session userId).
 */
export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return userId;
}

export function isResponse(value: unknown): value is Response {
  return value instanceof Response;
}
