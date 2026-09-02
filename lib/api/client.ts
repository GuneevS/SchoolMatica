import { ApiError } from "./errors";
import {
  API_ERROR_CODES,
  type ApiSuccess,
  type ApiResponseBody,
} from "./envelope";

export interface ApiFetchOptions<TBody = unknown> extends Omit<RequestInit, "body"> {
  /**
   * JSON request body. Will be serialized with `JSON.stringify` and
   * `Content-Type: application/json` will be set automatically.
   */
  body?: TBody;
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
}

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

/**
 * Typed fetch wrapper for the SchoolMatica API.
 *
 * - Serializes JSON bodies automatically.
 * - Parses the standard envelope (`{ data }` on success, `{ error }` on failure).
 * - Throws `ApiError` for both server-returned errors and transport failures
 *   so call sites only need one catch block.
 * - Tolerates legacy routes that return raw bodies (no envelope) — returns
 *   the parsed JSON as `T` in that case.
 *
 * @example
 *   const data = await apiFetch<{ id: string }>("/api/students", {
 *     method: "POST",
 *     body: { firstName, lastName },
 *     signal: abortController.signal,
 *   });
 */
export async function apiFetch<T>(
  input: RequestInfo | URL,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;

  let response: Response;
  try {
    response = await fetch(input, {
      ...rest,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? JSON_HEADERS : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
    throw ApiError.network(error);
  }

  // 204 No Content — return undefined as T (caller asked for nothing).
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  // Try to parse JSON. If parsing fails on an OK response, treat as a network-shaped error.
  let parsed: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      if (response.ok) {
        // Non-JSON 2xx body. Return raw text as-is.
        return text as unknown as T;
      }
      throw new ApiError({
        code: API_ERROR_CODES.INTERNAL,
        message: response.statusText || "Malformed response",
        status: response.status,
      });
    }
  }

  if (!response.ok) {
    // Envelope error first.
    if (parsed && typeof parsed === "object" && "error" in parsed) {
      const envelope = parsed as { error: unknown };
      if (envelope.error && typeof envelope.error === "object") {
        const e = envelope.error as {
          code?: string;
          message?: string;
          details?: unknown;
          requestId?: string;
        };
        throw new ApiError({
          code: (e.code as never) ?? API_ERROR_CODES.INTERNAL,
          message: e.message ?? response.statusText ?? "Request failed",
          status: response.status,
          details: e.details,
          requestId: e.requestId,
        });
      }
      // Legacy: `{ error: "string" }` shape used by older routes.
      if (typeof envelope.error === "string") {
        throw new ApiError({
          code:
            response.status === 401
              ? API_ERROR_CODES.UNAUTHORIZED
              : response.status === 403
                ? API_ERROR_CODES.FORBIDDEN
                : response.status === 404
                  ? API_ERROR_CODES.NOT_FOUND
                  : response.status >= 500
                    ? API_ERROR_CODES.INTERNAL
                    : API_ERROR_CODES.BAD_REQUEST,
          message: envelope.error,
          status: response.status,
        });
      }
    }
    // Unknown error shape — synthesise.
    throw new ApiError({
      code:
        response.status === 401
          ? API_ERROR_CODES.UNAUTHORIZED
          : response.status === 403
            ? API_ERROR_CODES.FORBIDDEN
            : response.status === 404
              ? API_ERROR_CODES.NOT_FOUND
              : response.status >= 500
                ? API_ERROR_CODES.INTERNAL
                : API_ERROR_CODES.BAD_REQUEST,
      message: response.statusText || "Request failed",
      status: response.status,
    });
  }

  // Success. Prefer the envelope shape; fall back to the raw body for legacy routes.
  if (parsed && typeof parsed === "object" && "data" in parsed) {
    return (parsed as ApiSuccess<T>).data;
  }
  return parsed as T;
}

/**
 * Same as `apiFetch` but returns the full response envelope (including `meta`).
 * Use when you need pagination metadata alongside `data`.
 */
export async function apiFetchEnvelope<T>(
  input: RequestInfo | URL,
  options: ApiFetchOptions = {},
): Promise<ApiSuccess<T>> {
  const { body, headers, ...rest } = options;

  let response: Response;
  try {
    response = await fetch(input, {
      ...rest,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? JSON_HEADERS : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
    throw ApiError.network(error);
  }

  if (!response.ok) {
    // Let apiFetch's error-handling do the work via a delegated call.
    // We can't easily reuse it without re-reading the body, so inline-replicate
    // the minimal error path here.
    let parsedErr: unknown = null;
    const text = await response.text();
    if (text) {
      try {
        parsedErr = JSON.parse(text);
      } catch {
        /* fall through */
      }
    }
    if (
      parsedErr &&
      typeof parsedErr === "object" &&
      "error" in parsedErr &&
      typeof (parsedErr as { error: unknown }).error === "object"
    ) {
      throw ApiError.fromEnvelope(
        (parsedErr as { error: never }).error,
        response.status,
      );
    }
    throw new ApiError({
      code: API_ERROR_CODES.INTERNAL,
      message: response.statusText || "Request failed",
      status: response.status,
    });
  }

  const parsed = (await response.json()) as ApiResponseBody<T>;
  if ("error" in parsed) {
    throw ApiError.fromEnvelope(parsed.error, response.status);
  }
  return parsed;
}
