/**
 * Edge-compatible auth configuration for middleware.
 *
 * This file contains ONLY the auth configuration needed for the middleware
 * to run on the Edge Runtime. It does NOT include:
 * - Prisma (not Edge-compatible)
 * - bcryptjs (not Edge-compatible)
 * - Database operations
 *
 * The full auth configuration with Prisma is in auth-config.ts
 */

import NextAuth from "next-auth";

// CRITICAL: Validate NEXTAUTH_SECRET is set at runtime (not during build)
// During Next.js build, this file is analyzed but we use a placeholder secret
const isBuildTime = process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_URL;
if (!isBuildTime && !process.env.NEXTAUTH_SECRET) {
    throw new Error(
        "NEXTAUTH_SECRET environment variable is required but not set. " +
        "Generate one with: openssl rand -base64 32"
    );
}

/**
 * Edge-compatible auth export for middleware only.
 * Uses JWT strategy and doesn't perform any database lookups.
 */
export const { auth: authMiddleware } = NextAuth({
    trustHost: true,
    providers: [], // No providers needed for JWT validation in middleware
    callbacks: {
        async session({ session, token }) {
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
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
});
