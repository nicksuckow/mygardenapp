import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Rate limit check
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(clientId, "register", RATE_LIMITS.auth);
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.resetIn);
  }

  try {
    const body = await req.json();
    const { email, password, name } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name || null,
      },
    });

    // Create default garden for the user
    await prisma.garden.create({
      data: {
        userId: user.id,
        widthInches: 120,
        heightInches: 120,
        cellInches: 12,
      },
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
