/**
 * Output formatting utilities for Canvas CLI
 * Supports JSON and table output formats
 */

import { Table } from "@cliffy/table";
import type { OutputFormat } from "../types/canvas.ts";

/**
 * Output data as JSON to stdout
 */
export function outputJson<T>(data: T): void {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Output data as a formatted table
 */
export function outputTable(
  headers: string[],
  rows: (string | number | null | undefined)[][],
  options?: {
    maxColWidth?: number;
  }
): void {
  const { maxColWidth = 50 } = options || {};

  // Convert all values to strings, handling null/undefined
  const stringRows = rows.map((row) =>
    row.map((cell) => {
      if (cell === null || cell === undefined) {
        return "-";
      }
      const str = String(cell);
      // Truncate long strings
      if (str.length > maxColWidth) {
        return str.substring(0, maxColWidth - 3) + "...";
      }
      return str;
    })
  );

  const table = new Table()
    .header(headers)
    .body(stringRows)
    .border()
    .padding(1);

  table.render();
}

/**
 * Generic output function that handles both formats
 */
export function output<T>(
  data: T | T[],
  format: OutputFormat,
  tableConfig?: {
    headers: string[];
    // deno-lint-ignore no-explicit-any
    rowMapper: (item: any) => (string | number | null | undefined)[];
  }
): void {
  if (format === "json") {
    outputJson(data);
    return;
  }

  // Table format
  if (!tableConfig) {
    // Fallback to JSON if no table config provided
    outputJson(data);
    return;
  }

  const items = Array.isArray(data) ? data : [data];
  const rows = items.map(tableConfig.rowMapper);
  outputTable(tableConfig.headers, rows);
}

/**
 * Format a date string for display
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format a grade for display
 */
export function formatGrade(
  grade: string | null | undefined,
  score: number | null | undefined
): string {
  if (grade && score !== null && score !== undefined) {
    return `${grade} (${score}%)`;
  }
  if (grade) return grade;
  if (score !== null && score !== undefined) return `${score}%`;
  return "-";
}

/**
 * Check if a grade is below a threshold
 * Supports letter grades (A, B, C, D, F) and numeric scores
 */
export function isGradeBelow(
  grade: string | null | undefined,
  score: number | null | undefined,
  threshold: string
): boolean {
  // Try to parse threshold as a number first
  const numericThreshold = parseFloat(threshold);

  if (!isNaN(numericThreshold)) {
    // Numeric comparison
    if (score !== null && score !== undefined) {
      return score < numericThreshold;
    }
    return false;
  }

  // Letter grade comparison
  const letterGradeOrder: Record<string, number> = {
    "A+": 12,
    A: 11,
    "A-": 10,
    "B+": 9,
    B: 8,
    "B-": 7,
    "C+": 6,
    C: 5,
    "C-": 4,
    "D+": 3,
    D: 2,
    "D-": 1,
    F: 0,
  };

  const thresholdValue = letterGradeOrder[threshold.toUpperCase()];
  if (thresholdValue === undefined) {
    // Unknown threshold format
    return false;
  }

  if (grade) {
    const gradeValue = letterGradeOrder[grade.toUpperCase()];
    if (gradeValue !== undefined) {
      return gradeValue < thresholdValue;
    }
  }

  return false;
}

/**
 * Print an error message to stderr and exit
 */
export function exitWithError(message: string, code = 1): never {
  console.error(`Error: ${message}`);
  Deno.exit(code);
}
