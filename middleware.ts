
import NextAuth from "next-auth";
import { auth } from "@/lib/auth-config";
import { NextResponse } from "next/server";

export default auth((req) => {
    const isAuth = !!req.auth;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login");
    const isPublicPage = req.nextUrl.pathname.startsWith("/api/auth");

    if (isAuthPage) {
        if (isAuth) {
            return Response.redirect(new URL("/dashboard", req.nextUrl));
        }
        return null;
    }

    if (!isAuth && !isPublicPage) {
        let callbackUrl = req.nextUrl.pathname;
        if (req.nextUrl.search) {
            callbackUrl += req.nextUrl.search;
        }

        const encodedCallbackUrl = encodeURIComponent(callbackUrl);

        return Response.redirect(
            new URL(`/login?callbackUrl=${encodedCallbackUrl}`, req.nextUrl)
        );
    }

    return null;
});

export const config = {
    matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
