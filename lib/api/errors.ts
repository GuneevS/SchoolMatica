import { API_ERROR_CODES, type ApiErrorCode, type ApiErrorPayload } from "./envelope";

/**
 * Thrown by `apiFetch` (and `useApiMutation`) when the server returns a
 * structured error envelope, or when the network/transport fails. Consumers
 * can catch this to surface human-readable messages and apply per-field
 * errors via `details`.
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: unknown;
  readonly requestId?: string;

  constructor(args: {
    code: ApiErrorCode;
    message: string;
    status: number;
    details?: unknown;
    requestId?: string;
  }) {
    super(args.message);
    this.name = "ApiError";
    this.code = args.code;
    this.status = args.status;
    this.details = args.details;
    this.requestId = args.requestId;
  }

  /** Build an ApiError from a parsed error envelope. */
  static fromEnvelope(payload: ApiErrorPayload, status: number): ApiError {
    return new ApiError({
      code: payload.code,
      message: payload.message,
      status,
      details: payload.details,
      requestId: payload.requestId,
    });
  }

  /** Build an ApiError representing a network/transport failure. */
  static network(error: unknown): ApiError {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Network request failed";
    return new ApiError({
      code: API_ERROR_CODES.INTERNAL,
      message,
      status: 0,
    });
  }

  /** True if the error is a validation failure with field-level details. */
  get isValidation(): boolean {
    return this.code === API_ERROR_CODES.VALIDATION_FAILED;
  }

  /** True if the error is an auth or permission failure. */
  get isAuth(): boolean {
    return (
      this.code === API_ERROR_CODES.UNAUTHORIZED ||
      this.code === API_ERROR_CODES.FORBIDDEN
    );
  }
}
