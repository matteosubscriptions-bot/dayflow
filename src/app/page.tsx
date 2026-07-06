import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";

export default async function Root() {
  const userId = await getCurrentUserId();
  redirect(userId ? "/home" : "/login");
}
