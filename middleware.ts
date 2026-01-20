
import NextAuth from "next-auth";
import { auth } from "@/lib/auth-config";
import { NextResponse } from "next/server";

// Marketing/landing pages that should be publicly accessible without authentication
const publicMarketingPaths = ["/"];

export default auth((req) => {
    const isAuth = !!req.auth;
    const pathname = req.nextUrl.pathname;
    const isAuthPage = pathname.startsWith("/login");
    const isPublicPage = pathname.startsWith("/api/auth");
    const isMarketingPage = publicMarketingPaths.includes(pathname);

    // Allow marketing pages to be publicly accessible
    if (isMarketingPage) {
        return null;
    }

    if (isAuthPage) {
        if (isAuth) {
            return Response.redirect(new URL("/dashboard", req.nextUrl));
        }
        return null;
    }

    if (!isAuth && !isPublicPage) {
        let callbackUrl = pathname;
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
