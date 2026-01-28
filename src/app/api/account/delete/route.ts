import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DELETE /api/account/delete
 * Permanently deletes the user's account and all associated data.
 * This is a GDPR requirement - users must be able to delete their data.
 */
export async function DELETE(req: Request) {
  // Rate limit check - strict for account deletion
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(clientId, "account-delete", RATE_LIMITS.accountDelete);
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.resetIn);
  }

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please sign in to delete your account" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Delete the user - all related data will cascade delete due to onDelete: Cascade
    // This includes: plants, beds, placements, seeds, journal entries, settings, etc.
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "Your account and all associated data have been permanently deleted.",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account. Please try again." },
      { status: 500 }
    );
  }
}
