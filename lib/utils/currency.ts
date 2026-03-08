/**
 * Shared currency formatting for South African Rand (ZAR).
 * Single source of truth - replaces all inline formatCurrency implementations.
 */

const ZAR_FORMATTER = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format a number as South African Rand (e.g., "R 1 500.00").
 */
export function formatCurrency(amount: number): string {
  return ZAR_FORMATTER.format(amount);
}
