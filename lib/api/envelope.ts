/**
 * Standard API response envelope shared between client and server.
 *
 * Every API route in the app should return either:
 *   { data: T, meta?: { pagination?: ... } }            // success (2xx)
 *   { error: { code, message, details?, requestId? } }  // error (4xx/5xx)
 *
 * The client uses `apiFetch<T>` which throws `ApiError` on the error envelope
 * so consumers never have to discriminate on the response shape themselves.
 */

import { NextResponse } from "next/server";

/** Stable, machine-readable error codes used across the API. */
export const API_ERROR_CODES = {
  UNAUTHORIZED: "unauthorized",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "not_found",
  VALIDATION_FAILED: "validation_failed",
  CONFLICT: "conflict",
  RATE_LIMITED: "rate_limited",
  INTERNAL: "internal",
  BAD_REQUEST: "bad_request",
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

/** Pagination metadata for list endpoints. */
export interface ApiPaginationMeta {
  limit: number;
  cursor?: string | null;
  nextCursor?: string | null;
  total?: number;
}

export interface ApiMeta {
  pagination?: ApiPaginationMeta;
  /** Anything else routes want to attach (e.g., counts, summary stats). */
  [key: string]: unknown;
}

export interface ApiSuccess<T> {
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorPayload {
  code: ApiErrorCode;
  message: string;
  /** Optional structured details (e.g., Zod-flattened field errors). */
  details?: unknown;
  /** Optional request id for support / tracing. */
  requestId?: string;
}

export interface ApiErrorEnvelope {
  error: ApiErrorPayload;
}

export type ApiResponseBody<T> = ApiSuccess<T> | ApiErrorEnvelope;

/**
 * Build a success NextResponse with the standard envelope.
 *
 * @example
 *   return apiSuccess(students, { meta: { pagination: { limit, total } } });
 */
export function apiSuccess<T>(
  data: T,
  init?: { status?: number; meta?: ApiMeta; headers?: HeadersInit },
): NextResponse<ApiSuccess<T>> {
  const body: ApiSuccess<T> = init?.meta ? { data, meta: init.meta } : { data };
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: init?.headers,
  });
}

/**
 * Build an error NextResponse with the standard envelope.
 *
 * @example
 *   return apiError("validation_failed", "Invalid payload", { status: 400, details });
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  init?: {
    status?: number;
    details?: unknown;
    requestId?: string;
    headers?: HeadersInit;
  },
): NextResponse<ApiErrorEnvelope> {
  const body: ApiErrorEnvelope = {
    error: {
      code,
      message,
      ...(init?.details !== undefined ? { details: init.details } : {}),
      ...(init?.requestId ? { requestId: init.requestId } : {}),
    },
  };
  return NextResponse.json(body, {
    status: init?.status ?? statusForCode(code),
    headers: init?.headers,
  });
}

/** Default HTTP status mapped per error code. */
export function statusForCode(code: ApiErrorCode): number {
  switch (code) {
    case API_ERROR_CODES.UNAUTHORIZED:
      return 401;
    case API_ERROR_CODES.FORBIDDEN:
      return 403;
    case API_ERROR_CODES.NOT_FOUND:
      return 404;
    case API_ERROR_CODES.VALIDATION_FAILED:
    case API_ERROR_CODES.BAD_REQUEST:
      return 400;
    case API_ERROR_CODES.CONFLICT:
      return 409;
    case API_ERROR_CODES.RATE_LIMITED:
      return 429;
    case API_ERROR_CODES.INTERNAL:
    default:
      return 500;
  }
}
