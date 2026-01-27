import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Health check endpoint for container orchestration
 * 
 * Returns:
 * - 200 OK if all services are healthy
 * - 503 Service Unavailable if any service is unhealthy
 * 
 * Checks:
 * - Database connectivity
 * - Memory usage
 * - Application version
 */
export async function GET(request: NextRequest) {
    const startTime = Date.now();
    const checks: Record<string, { status: "healthy" | "unhealthy"; latency?: number; error?: string }> = {};
    let overallStatus: "healthy" | "unhealthy" = "healthy";

    // 1. Database health check
    try {
        const dbStart = Date.now();
        // Simple query to verify database connectivity
        await prisma.$queryRaw`SELECT 1`;
        checks.database = {
            status: "healthy",
            latency: Date.now() - dbStart,
        };
    } catch (error) {
        checks.database = {
            status: "unhealthy",
            error: error instanceof Error ? error.message : "Database connection failed",
        };
        overallStatus = "unhealthy";
    }

    // 2. Memory check (warn if over 90% of heap used)
    try {
        const memoryUsage = process.memoryUsage();
        const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
        
        checks.memory = {
            status: heapUsedPercent < 90 ? "healthy" : "unhealthy",
        };
        
        if (heapUsedPercent >= 90) {
            overallStatus = "unhealthy";
        }
    } catch (error) {
        checks.memory = {
            status: "healthy", // Don't fail health check if memory stats unavailable
        };
    }

    // 3. Application info (limited exposure for security)
    const appInfo = {
        name: "SchoolMatica",
        version: process.env.npm_package_version || "1.0.0",
        // Note: NODE_ENV and uptime intentionally excluded from public health endpoint
    };

    const response = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        checks,
        app: appInfo,
    };

    return NextResponse.json(response, {
        status: overallStatus === "healthy" ? 200 : 503,
        headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
        },
    });
}

/**
 * Liveness probe - simple check that the app is running
 * Used by Kubernetes/Docker for restart decisions
 */
export async function HEAD() {
    return new NextResponse(null, { status: 200 });
}
