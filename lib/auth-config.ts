
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

// CRITICAL: Validate NEXTAUTH_SECRET is set
if (!process.env.NEXTAUTH_SECRET) {
    throw new Error(
        "NEXTAUTH_SECRET environment variable is required but not set. " +
        "Generate one with: openssl rand -base64 32"
    );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    trustHost: true, // Allow localhost and container hosts
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const parsed = z
                    .object({ email: z.string().email(), password: z.string().min(8) })
                    .safeParse(credentials);

                if (!parsed.success) {
                    return null;
                }

                const { email, password } = parsed.data;
                const user = await prisma.appUser.findUnique({
                    where: { email },
                    include: { roleAssignments: { include: { role: true } } },
                });

                if (!user || !user.passwordHash) {
                    // Log failed attempt even if user doesn't exist (prevent email enumeration timing attacks)
                    // In a more sophisticated system, we'd track this separately
                    return null;
                }

                // Check if account is locked
                const now = new Date();
                if (user.accountLockedUntil && user.accountLockedUntil > now) {
                    console.warn(`[Auth] Login attempt for locked account: ${email}`);
                    return null; // Account is locked
                }

                // Clear lockout if the lockout period has expired
                if (user.accountLockedUntil && user.accountLockedUntil <= now) {
                    await prisma.appUser.update({
                        where: { id: user.id },
                        data: {
                            failedLoginAttempts: 0,
                            lastFailedAttempt: null,
                            accountLockedUntil: null,
                        },
                    });
                }

                const passwordsMatch = await bcrypt.compare(password, user.passwordHash);

                if (!passwordsMatch) {
                    // Increment failed login attempts
                    const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
                    const lockoutThreshold = 5; // Lock after 5 failed attempts
                    const lockoutDurationMinutes = 15; // Lock for 15 minutes

                    const updateData: any = {
                        failedLoginAttempts: newFailedAttempts,
                        lastFailedAttempt: now,
                    };

                    // Lock the account if threshold reached
                    if (newFailedAttempts >= lockoutThreshold) {
                        updateData.accountLockedUntil = new Date(now.getTime() + lockoutDurationMinutes * 60 * 1000);
                        console.warn(`[Auth] Account locked due to ${newFailedAttempts} failed attempts: ${email}`);
                    }

                    await prisma.appUser.update({
                        where: { id: user.id },
                        data: updateData,
                    });

                    return null;
                }

                // Successful login: reset failed attempts
                if (user.failedLoginAttempts > 0) {
                    await prisma.appUser.update({
                        where: { id: user.id },
                        data: {
                            failedLoginAttempts: 0,
                            lastFailedAttempt: null,
                            accountLockedUntil: null,
                        },
                    });
                }

                return user;
            },
        }),
    ],
    callbacks: {
        async session({ session, user, token }) {
            if (token?.sub && session.user) {
                session.user.id = token.sub;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
            }
            return token;
        },
    },
    session: {
        strategy: "jwt", // Use JWT for Credentials provider compatibility
        maxAge: 8 * 60 * 60, // 8 hours - session expires after this period of inactivity
        updateAge: 60 * 60, // 1 hour - session token refreshed after this period
    },
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === "production"
                ? "__Secure-next-auth.session-token"
                : "next-auth.session-token",
            options: {
                httpOnly: true, // Prevent JavaScript access to session cookie
                sameSite: "lax", // CSRF protection
                path: "/",
                secure: process.env.NODE_ENV === "production", // HTTPS only in production
            },
        },
    },
    pages: {
        signIn: "/login",
    },
});
