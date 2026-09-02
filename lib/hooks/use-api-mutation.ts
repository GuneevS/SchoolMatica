"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  FieldValues,
  Path,
  UseFormSetError,
} from "react-hook-form";

import { apiFetch, type ApiFetchOptions } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

interface UseApiMutationOptions<TData, TVariables, TForm extends FieldValues = FieldValues> {
  /**
   * The mutation function. Receives the variables passed to `mutate`/`mutateAsync`
   * and (optionally) an AbortSignal. Should call `apiFetch` internally.
   */
  mutationFn: (variables: TVariables, signal?: AbortSignal) => Promise<TData>;

  /** Called after a successful mutation, before the toast (which can be disabled). */
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;

  /** Called after a failed mutation (excluding aborts), before the toast. */
  onError?: (error: ApiError, variables: TVariables) => void | Promise<void>;

  /** Always called when the mutation settles (success or error, excluding aborts). */
  onSettled?: (variables: TVariables) => void | Promise<void>;

  /**
   * Success toast message (or factory). Pass `false` to suppress.
   * Default: no toast on success — set per call site.
   */
  successMessage?: string | ((data: TData) => string) | false;

  /**
   * Error toast message (or factory). Pass `false` to suppress.
   * Default: shows the server's error message.
   */
  errorMessage?: string | ((error: ApiError) => string) | false;

  /**
   * If provided and the error is `validation_failed` with a `details.fieldErrors`
   * shape from `zod.flatten()`, errors will be set on the matching form fields
   * automatically.
   */
  form?: { setError: UseFormSetError<TForm> };
}

interface UseApiMutationReturn<TData, TVariables> {
  /** Fire-and-forget — does NOT throw. Errors are surfaced via toast/onError. */
  mutate: (variables: TVariables) => void;
  /** Awaitable — resolves to data on success, throws `ApiError` on failure. */
  mutateAsync: (variables: TVariables) => Promise<TData>;
  /** Cancel any in-flight mutation. */
  cancel: () => void;
  /** Reset internal state. */
  reset: () => void;
  /** True while a mutation is in flight. */
  isPending: boolean;
  /** The last error, if any. Reset on the next call. */
  error: ApiError | null;
  /** The last successful data, if any. Reset on the next call. */
  data: TData | null;
}

/**
 * Generic mutation hook for SchoolMatica API calls.
 *
 * Wraps `apiFetch`, manages loading/error state, integrates with `sonner` for
 * toasts and `react-hook-form` for per-field validation errors. Designed to
 * replace the repetitive `try / fetch / if (!res.ok) / console.error` ladder
 * found throughout the client codebase.
 *
 * @example
 *   const createInvoice = useApiMutation({
 *     mutationFn: (input: InvoiceInput) =>
 *       apiFetch<{ id: string }>("/api/fees/invoices", { method: "POST", body: input }),
 *     onSuccess: () => router.refresh(),
 *     successMessage: "Invoice created",
 *     form,
 *   });
 *
 *   <Button onClick={() => createInvoice.mutate(values)} disabled={createInvoice.isPending}>
 *     Save
 *   </Button>
 */
export function useApiMutation<
  TData,
  TVariables = void,
  TForm extends FieldValues = FieldValues,
>(
  opts: UseApiMutationOptions<TData, TVariables, TForm>,
): UseApiMutationReturn<TData, TVariables> {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Keep the latest options in a ref so callers can update them between renders
  // without retriggering the mutate identity.
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // Track mount status.
  useStableMount(mountedRef);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    cancel();
    setError(null);
    setData(null);
    setIsPending(false);
  }, [cancel]);

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      cancel();
      const controller = new AbortController();
      abortRef.current = controller;

      if (mountedRef.current) {
        setIsPending(true);
        setError(null);
      }

      try {
        const result = await optsRef.current.mutationFn(variables, controller.signal);

        if (controller.signal.aborted) {
          // Caller cancelled — throw a benign abort to break out without
          // calling onSuccess.
          throw new DOMException("Aborted", "AbortError");
        }

        if (mountedRef.current) setData(result);
        await optsRef.current.onSuccess?.(result, variables);

        const success = optsRef.current.successMessage;
        if (success !== false && success !== undefined) {
          const msg = typeof success === "function" ? success(result) : success;
          toast.success(msg);
        }

        return result;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") throw err;

        const apiErr =
          err instanceof ApiError
            ? err
            : new ApiError({
                code: "internal",
                message:
                  (err as Error)?.message ?? "Something went wrong. Please try again.",
                status: 0,
              });

        if (mountedRef.current) setError(apiErr);

        // Set field-level errors on the form if it's a validation failure.
        if (
          optsRef.current.form &&
          apiErr.isValidation &&
          apiErr.details &&
          typeof apiErr.details === "object"
        ) {
          const fieldErrors = (apiErr.details as { fieldErrors?: Record<string, string[]> })
            .fieldErrors;
          if (fieldErrors) {
            for (const [field, messages] of Object.entries(fieldErrors)) {
              if (messages?.[0]) {
                optsRef.current.form.setError(
                  field as Path<TForm>,
                  { type: "server", message: messages[0] },
                  { shouldFocus: false },
                );
              }
            }
          }
        }

        await optsRef.current.onError?.(apiErr, variables);

        const errMsg = optsRef.current.errorMessage;
        if (errMsg !== false) {
          const msg =
            typeof errMsg === "function"
              ? errMsg(apiErr)
              : errMsg ?? apiErr.message ?? "Something went wrong. Please try again.";
          toast.error(msg);
        }

        throw apiErr;
      } finally {
        if (mountedRef.current && abortRef.current === controller) {
          setIsPending(false);
          abortRef.current = null;
        }
        await optsRef.current.onSettled?.(variables);
      }
    },
    [cancel],
  );

  const mutate = useCallback(
    (variables: TVariables) => {
      void mutateAsync(variables).catch((err) => {
        if ((err as Error)?.name === "AbortError") return;
        // Already handled inside mutateAsync — swallow so callers using
        // fire-and-forget don't get unhandled rejection warnings.
      });
    },
    [mutateAsync],
  );

  return { mutate, mutateAsync, cancel, reset, isPending, error, data };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

import { useEffect } from "react";

function useStableMount(ref: React.MutableRefObject<boolean>) {
  useEffect(() => {
    ref.current = true;
    return () => {
      ref.current = false;
    };
  }, [ref]);
}

// Re-export so callers don't need a second import for the most common case.
export { apiFetch };
export type { ApiFetchOptions };
