import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import type { Prisma } from "@prisma/client";

import { apiError } from "./envelope";

/**
 * Route handler signature used with `withApi`.
 * Receives the request and the matched route params (if any).
 */
type ApiHandler<TContext = unknown> = (
  request: NextRequest,
  context: TContext,
) => Promise<NextResponse> | NextResponse;

/**
 * Wraps a Next.js route handler with the standard SchoolMatica error
 * mapping:
 *
 *   - `ZodError`           → 400 + `{ code: "validation_failed", details: flattened }`
 *   - Prisma `P2002`       → 409 + `{ code: "conflict", details: { field } }`
 *   - Prisma `P2025`       → 404 + `{ code: "not_found" }`
 *   - Prisma `P2003`       → 409 + `{ code: "conflict", message: "Cannot delete..." }`
 *   - Anything else        → 500 + `{ code: "internal" }` (original message redacted)
 *
 * The handler still gets to return its own structured `apiSuccess`/`apiError`
 * responses; the wrapper only takes over when a throw escapes.
 *
 * @example
 *   export const POST = withApi(async (req) => {
 *     const body = createInvoiceSchema.parse(await req.json());
 *     const created = await prisma.invoice.create({ data: body });
 *     return apiSuccess(created, { status: 201 });
 *   });
 */
export function withApi<TContext = unknown>(
  handler: ApiHandler<TContext>,
  options?: { routeName?: string },
) {
  const routeLabel = options?.routeName ?? "api";
  return async (request: NextRequest, context: TContext): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      // Zod validation error.
      if (error instanceof ZodError) {
        return apiError("validation_failed", "Invalid request", {
          details: error.flatten(),
        });
      }

      // Prisma known errors. We don't import `Prisma.PrismaClientKnownRequestError`
      // directly to avoid a Prisma engine import on the Edge runtime; instead
      // duck-type by code.
      if (isPrismaKnownError(error)) {
        switch (error.code) {
          case "P2002": {
            const target = (error.meta?.target as string[] | undefined)?.join(", ");
            return apiError(
              "conflict",
              target
                ? `A record with the same ${target} already exists.`
                : "A record with this data already exists.",
              { details: { field: target } },
            );
          }
          case "P2025":
            return apiError("not_found", "Record not found");
          case "P2003":
            return apiError(
              "conflict",
              "Cannot complete this action — the record is referenced by other data.",
            );
        }
      }

      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`[API ${routeLabel}] unexpected error:`, message, error);
      return apiError("internal", "Internal server error");
    }
  };
}

function isPrismaKnownError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string" &&
    (error as { code: string }).code.startsWith("P")
  );
}
