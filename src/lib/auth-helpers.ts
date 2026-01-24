import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Get the current user session or throw/redirect if not authenticated.
 * Use in API routes and server components.
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session;
}

/**
 * Get the current user ID for database queries.
 * Use in API routes after requireAuth().
 */
export async function getCurrentUserId(): Promise<string> {
  const session = await requireAuth();
  return session.user.id;
}
