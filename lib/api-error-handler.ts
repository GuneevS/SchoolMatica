import { NextResponse } from "next/server";

/**
 * Standard API error response handler.
 * Logs errors to the console and returns a clean JSON error response.
 */
export function handleApiError(routeName: string, error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`[API ${routeName}] Error:`, message, error);

  // Prisma-specific error handling
  if (typeof error === "object" && error !== null && "code" in error) {
    const prismaError = error as { code: string; meta?: Record<string, unknown> };
    switch (prismaError.code) {
      case "P2002":
        return NextResponse.json(
          { error: "A record with this data already exists", field: prismaError.meta?.target },
          { status: 409 }
        );
      case "P2025":
        return NextResponse.json(
          { error: "Record not found" },
          { status: 404 }
        );
      case "P2003":
        return NextResponse.json(
          { error: "Cannot delete: this record is referenced by other records" },
          { status: 409 }
        );
    }
  }

  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
