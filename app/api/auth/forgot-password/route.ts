import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 requests per hour per IP
    const identifier = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.AUTH_PASSWORD_RESET);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many password reset attempts. Please try again later.",
          retryAfter: rateLimit.reset,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimit.limit.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": rateLimit.reset.toString(),
            "Retry-After": rateLimit.reset.toString(),
          },
        }
      );
    }

    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid email" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await prisma.appUser.findUnique({
      where: { email: normalizedEmail },
    });

    // SECURITY: Always return success to prevent email enumeration
    // Even if user doesn't exist, we don't reveal that information
    if (!user) {
      console.log(`[Password Reset] No user found for email: ${normalizedEmail}`);
      return NextResponse.json({
        success: true,
        message: "If an account with that email exists, you will receive a password reset link.",
      });
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Token expires in 1 hour
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // Store the hashed token in the database
    await prisma.appUser.update({
      where: { id: user.id },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpiry,
      },
    });

    // Build reset URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;

    // Send password reset email
    try {
      await sendPasswordResetEmail(normalizedEmail, {
        recipientName: user.name || normalizedEmail,
        resetUrl,
        expiryHours: 1,
      });

      // In development, also log to console for testing
      if (process.env.NODE_ENV !== "production") {
        console.log("\n========================================");
        console.log("🔐 PASSWORD RESET LINK (Development Only)");
        console.log("========================================");
        console.log(`Email: ${normalizedEmail}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log("Token expires in 1 hour");
        console.log("========================================\n");
      }

      console.log(`[Password Reset] Email sent successfully for user: ${user.id}`);
    } catch (emailError) {
      // Log error but don't fail the request
      // User already has valid token in database
      console.error("[Password Reset] Failed to send email:", emailError);
      console.log(`[Password Reset] Token generated for user: ${user.id} (email failed to send)`);

      // In development, still show the reset URL
      if (process.env.NODE_ENV !== "production") {
        console.log("\n========================================");
        console.log("🔐 PASSWORD RESET LINK (Development Only)");
        console.log("========================================");
        console.log(`Email: ${normalizedEmail}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log("Token expires in 1 hour");
        console.log("⚠️  Email service not configured - link shown here for testing");
        console.log("========================================\n");
      }
    }

    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, you will receive a password reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
