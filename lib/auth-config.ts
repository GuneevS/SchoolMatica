
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

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
                    .object({ email: z.string().email(), password: z.string().min(6) })
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
                    return null;
                }

                const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
                if (!passwordsMatch) return null;

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
    session: { strategy: "jwt" }, // Use JWT for Credentials provider compatibility
    pages: {
        signIn: "/login",
    },
});
