/**
 * RFC 4180-compliant CSV parsing and escaping utilities.
 * Handles quoted fields, embedded commas, embedded newlines, and escaped quotes.
 */

/**
 * Escape a value for CSV export.
 * Wraps in double quotes if the value contains commas, quotes, or newlines.
 * Embedded double quotes are escaped by doubling them.
 */
export function escapeCSVField(value: string | number | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Build a CSV row from an array of values, properly escaping each field.
 */
export function buildCSVRow(fields: (string | number | null | undefined)[]): string {
  return fields.map(escapeCSVField).join(",");
}

/**
 * Parse a single CSV line respecting quoted fields.
 * Handles commas within quoted strings and escaped double quotes.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote (double quote)
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        }
        // End of quoted field
        inQuotes = false;
        i++;
        continue;
      }
      current += char;
      i++;
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (char === ",") {
        fields.push(current.trim());
        current = "";
        i++;
        continue;
      }
      current += char;
      i++;
    }
  }

  fields.push(current.trim());
  return fields;
}

/**
 * Parse CSV text into an array of string arrays (rows x columns).
 * Handles quoted fields, embedded commas, and embedded newlines.
 */
export function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  return lines.map(parseCSVLine);
}

/**
 * Parse CSV text into an array of objects using the first row as headers.
 */
export function parseCSVWithHeaders(text: string): Record<string, string>[] {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];

  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] ?? "";
    });
    return obj;
  });
}
