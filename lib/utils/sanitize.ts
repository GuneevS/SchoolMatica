/**
 * HTML sanitization utilities for safe template interpolation.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escape HTML special characters to prevent XSS/injection in email templates
 * and other HTML contexts where user-supplied data is interpolated.
 */
export function escapeHtml(str: string): string {
  if (!str) return "";
  return str.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] || char);
}
