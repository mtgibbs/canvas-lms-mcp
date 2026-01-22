/**
 * Stats Service
 * Get late and missing assignment statistics by course
 *
 * Used by:
 * - CLI: `canvas stats`
 * - MCP: `get_stats`
 */

import { type CourseStats, getStudentStats } from "../api/stats.ts";

// Re-export the type for consumers
export type { CourseStats };

export interface GetStatsOptions {
  studentId: string;
  hideEmpty?: boolean;
}

export async function getStats(options: GetStatsOptions): Promise<CourseStats[]> {
  const { studentId, hideEmpty = true } = options;

  let stats = await getStudentStats(studentId);

  if (hideEmpty) {
    stats = stats.filter((s) => s.total > 0);
  }

  return stats;
}
