import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";

/**
 * API route guard: resolves the session user id or a ready 401 response.
 * Every data query must filter by this id (never trust ids from the client).
 */
export async function requireUserId(): Promise<
  { userId: string; error: null } | { userId: null; error: NextResponse }
> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      userId: null,
      error: NextResponse.json({ error: "Non autenticato" }, { status: 401 }),
    };
  }
  return { userId, error: null };
}
