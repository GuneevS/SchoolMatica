import { authMiddleware } from "@/lib/auth-edge";
import { NextResponse } from "next/server";

// Marketing/landing pages that should be publicly accessible without authentication
const publicMarketingPaths = ["/"];

// Auth-related pages that should be accessible without authentication
const publicAuthPaths = ["/login", "/register", "/forgot-password", "/reset-password"];

// Super admin pages - require authentication but skip school context
const superAdminPaths = ["/super-admin"];

// Parent portal pages - require parent role authentication
const parentPortalPaths = ["/parent"];

// Student portal pages - require student role authentication
const studentPortalPaths = ["/student"];

export default authMiddleware((req) => {
    const isAuth = !!req.auth;
    const pathname = req.nextUrl.pathname;
    const isAuthPage = publicAuthPaths.some(p => pathname.startsWith(p));
    const isPublicPage = pathname.startsWith("/api/auth") || pathname.startsWith("/api/health") || pathname.startsWith("/api/schools/search");
    const isMarketingPage = publicMarketingPaths.includes(pathname);
    const isSuperAdminPage = superAdminPaths.some(p => pathname.startsWith(p));
    const isParentPortal = parentPortalPaths.some(p => pathname.startsWith(p));
    const isStudentPortal = studentPortalPaths.some(p => pathname.startsWith(p));

    // Allow marketing pages to be publicly accessible
    if (isMarketingPage) {
        return null;
    }

    if (isAuthPage) {
        if (isAuth) {
            // Redirect based on user type
            // In production, check user's role and redirect appropriately
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

    // Super admin pages - just check auth (page itself handles permission check)
    if (isSuperAdminPage && isAuth) {
        return null;
    }

    // Parent portal pages - auth required, page handles role verification
    if (isParentPortal && isAuth) {
        return null;
    }

    // Student portal pages - auth required, page handles role verification
    if (isStudentPortal && isAuth) {
        return null;
    }

    return null;
});

export const config = {
    matcher: ["/((?!api/auth|api/health|_next/static|_next/image|favicon.ico).*)"],
};
