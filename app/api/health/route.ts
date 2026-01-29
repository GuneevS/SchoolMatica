import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRedisConnected } from "@/lib/redis";

/**
 * Health check endpoint for load balancers and container orchestration
 * 
 * Returns:
 * - 200: All services healthy
 * - 503: One or more services unhealthy
 */
export async function GET(_request: NextRequest) {
  const startTime = Date.now();
  
  const checks = {
    status: "healthy" as "healthy" | "unhealthy",
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || "1.0.0",
    uptime: process.uptime(),
    services: {
      database: { status: "unknown" as "healthy" | "unhealthy" | "unknown", latency: 0 },
      redis: { status: "unknown" as "healthy" | "unhealthy" | "unknown", latency: 0 },
    },
    memory: {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      rss: 0,
    },
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.services.database = {
      status: "healthy",
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    console.error("[Health] Database check failed:", error);
    checks.services.database = {
      status: "unhealthy",
      latency: Date.now() - startTime,
    };
    checks.status = "unhealthy";
  }

  // Check Redis connectivity
  try {
    const redisStart = Date.now();
    const redisConnected = isRedisConnected();
    checks.services.redis = {
      status: redisConnected ? "healthy" : "unhealthy",
      latency: Date.now() - redisStart,
    };
    if (!redisConnected) {
      // Redis being down is degraded but not critical
      // Application can fall back to in-memory rate limiting
      console.warn("[Health] Redis not connected, using fallback mode");
    }
  } catch (error) {
    console.error("[Health] Redis check failed:", error);
    checks.services.redis = {
      status: "unhealthy",
      latency: Date.now() - startTime,
    };
  }

  // Memory usage
  const memUsage = process.memoryUsage();
  checks.memory = {
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
    external: Math.round(memUsage.external / 1024 / 1024), // MB
    rss: Math.round(memUsage.rss / 1024 / 1024), // MB
  };

  const responseStatus = checks.status === "healthy" ? 200 : 503;

  return NextResponse.json(checks, { 
    status: responseStatus,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
