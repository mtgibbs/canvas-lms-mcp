/**
 * Missing Assignments Service
 * Get assignments flagged as missing by Canvas
 *
 * Used by:
 * - CLI: `canvas missing`
 * - MCP: `get_missing_assignments`
 */

import { getMissingSubmissions } from "../api/users.ts";
import type { MissingAssignment } from "./types.ts";

export interface GetMissingOptions {
  studentId?: string;
  courseId?: number;
  /** If true, include assignments from all grading periods (default: current grading period only) */
  allGradingPeriods?: boolean;
}

export async function getMissingAssignments(
  options: GetMissingOptions = {},
): Promise<MissingAssignment[]> {
  const { studentId = "self", courseId, allGradingPeriods = false } = options;

  const missing = await getMissingSubmissions({
    studentId,
    courseIds: courseId ? [courseId] : undefined,
    include: ["course"],
    // By default, only show missing assignments from the current grading period
    // This matches what parents see in the Canvas portal
    filter: allGradingPeriods ? undefined : ["current_grading_period"],
  });

  return missing.map((m) => ({
    id: m.id,
    name: m.name,
    course_id: m.course_id,
    course_name: m.course?.name || `Course ${m.course_id}`,
    due_at: m.due_at,
    points_possible: m.points_possible,
    url: m.html_url,
  }));
}

export interface MissingCountByCourse {
  course_id: number;
  course_name: string;
  count: number;
}

export async function getMissingCountsByCourse(
  options: GetMissingOptions = {},
): Promise<MissingCountByCourse[]> {
  const missing = await getMissingAssignments(options);

  const counts = new Map<number, MissingCountByCourse>();

  for (const m of missing) {
    if (!counts.has(m.course_id)) {
      counts.set(m.course_id, {
        course_id: m.course_id,
        course_name: m.course_name,
        count: 0,
      });
    }
    counts.get(m.course_id)!.count++;
  }

  return Array.from(counts.values());
}
