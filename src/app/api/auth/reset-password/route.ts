import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = body;

    // Validate inputs
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Reset token is required" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Get all reset tokens (we'll check each one since tokens are hashed)
    const resetTokens = await prisma.passwordResetToken.findMany({
      where: {
        expires: { gte: new Date() }, // Only get non-expired tokens
      },
      include: {
        user: true,
      },
    });

    // Find the matching token by comparing hashes
    let matchedToken = null;
    for (const resetToken of resetTokens) {
      const isMatch = await bcrypt.compare(token, resetToken.token);
      if (isMatch) {
        matchedToken = resetToken;
        break;
      }
    }

    if (!matchedToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user's password
    await prisma.user.update({
      where: { id: matchedToken.userId },
      data: { password: hashedPassword },
    });

    // Delete the used token
    await prisma.passwordResetToken.delete({
      where: { id: matchedToken.id },
    });

    // Also delete any other reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: matchedToken.userId },
    });

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
