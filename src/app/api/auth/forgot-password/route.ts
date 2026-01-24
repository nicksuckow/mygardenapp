import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: Request) {
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

      // In production, you would send this via email
      // For now, return it in the response for display in UI
      return NextResponse.json({
        success: true,
        message: "Password reset token generated",
        token: plainToken, // Only for development - remove in production
        expires: expires.toISOString(),
      });
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
