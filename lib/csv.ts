/**
 * Tiny CSV serializer. No external deps.
 *
 * Handles quoting values that contain commas, quotes, or newlines.
 */

function escapeCell(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert an array of objects into a CSV string.
 * Columns are derived from the `headers` array, which also controls order.
 */
export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  headers: (keyof T & string)[],
): string {
  const headerLine = headers.map(escapeCell).join(",");
  const dataLines = rows.map((row) =>
    headers
      .map((h) => {
        const v = row[h];
        if (v == null) return "";
        if (Array.isArray(v)) return escapeCell(v.join("; "));
        return escapeCell(String(v));
      })
      .join(","),
  );
  return [headerLine, ...dataLines].join("\n");
}
