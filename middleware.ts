import { authMiddleware } from "@/lib/auth-edge";
import { NextResponse } from "next/server";

/**
 * Header injected by middleware so server components (root layout) can read
 * the request pathname and decide whether to skip DB-heavy initialization
 * (e.g., marketing/auth pages don't need the school+auth context fetch).
 */
const PATHNAME_HEADER = "x-pathname";

// Marketing/landing pages that should be publicly accessible without authentication
const publicMarketingPaths = ["/"];

// Auth-related pages that should be accessible without authentication
const publicAuthPaths = ["/login", "/register", "/forgot-password", "/reset-password"];

// Super admin pages - require authentication AND super admin role
const superAdminPaths = ["/super-admin"];

// Parent portal pages - require parent role authentication
const parentPortalPaths = ["/parent"];

// Student portal pages - require student role authentication
const studentPortalPaths = ["/student"];

export default authMiddleware(async (req) => {
    const isAuth = !!req.auth;
    const pathname = req.nextUrl.pathname;
    const isAuthPage = publicAuthPaths.some(p => pathname.startsWith(p));
    const isPublicPage = pathname.startsWith("/api/auth") || pathname.startsWith("/api/health");
    const isMarketingPage = publicMarketingPaths.includes(pathname);
    const isSuperAdminPage = superAdminPaths.some(p => pathname.startsWith(p));
    const isParentPortal = parentPortalPaths.some(p => pathname.startsWith(p));
    const isStudentPortal = studentPortalPaths.some(p => pathname.startsWith(p));

    // Helper: pass through with the pathname header attached so server
    // components (e.g., root layout) can adapt — marketing pages skip the
    // auth/branding DB fetch, dynamic pages do it.
    const passThrough = () => {
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set(PATHNAME_HEADER, pathname);
        return NextResponse.next({ request: { headers: requestHeaders } });
    };

    // Allow marketing pages to be publicly accessible
    if (isMarketingPage) {
        return passThrough();
    }

    if (isAuthPage) {
        if (isAuth) {
            // Redirect based on user type
            // In production, check user's role and redirect appropriately
            return Response.redirect(new URL("/dashboard", req.nextUrl));
        }
        return passThrough();
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

    // Super admin pages - require authentication
    // Permission check is done in the page components and API routes
    // Middleware just ensures authentication
    if (isSuperAdminPage) {
        if (!isAuth) {
            return Response.redirect(new URL("/login?callbackUrl=" + encodeURIComponent(pathname), req.nextUrl));
        }
        // Note: Detailed permission check happens in the page components
        // Middleware doesn't have access to database to check permissions
        return passThrough();
    }

    // Parent portal pages - auth required, page handles role verification
    if (isParentPortal && isAuth) {
        return passThrough();
    }

    // Student portal pages - auth required, page handles role verification
    if (isStudentPortal && isAuth) {
        return passThrough();
    }

    return passThrough();
});

/** Exported so server code can read the same header name. */
export const PATHNAME_HEADER_NAME = PATHNAME_HEADER;

export const config = {
    matcher: ["/((?!api/auth|api/health|_next/static|_next/image|favicon.ico).*)"],
};
