import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Rate limit check - strict for password reset
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(clientId, "forgot-password", RATE_LIMITS.passwordReset);
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.resetIn);
  }

  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to prevent email enumeration attacks
    // But only create token if user exists
    if (user) {
      // Delete any existing reset tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Generate a secure random token (32 bytes = 64 hex characters)
      const plainToken = crypto.randomBytes(32).toString("hex");

      // Hash the token before storing (similar to password hashing)
      const hashedToken = await bcrypt.hash(plainToken, 10);

      // Token expires in 1 hour
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      // Store hashed token
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: hashedToken,
          expires,
        },
      });

      const resetPath = `/reset-password?token=${plainToken}`;
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const fullResetLink = `${baseUrl}${resetPath}`;

      // In development, return the link directly for testing
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({
          success: true,
          message: "Password reset link generated",
          resetLink: resetPath,
          expires: expires.toISOString(),
        });
      }

      // In production, send the reset link via email
      const emailResult = await sendPasswordResetEmail(user.email, fullResetLink);
      if (!emailResult.success) {
        console.error("Failed to send password reset email:", emailResult.error);
        // Don't expose email errors to user - just log them
      }
    }

    // Return success even if user doesn't exist (security best practice)
    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, a reset token has been generated",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
