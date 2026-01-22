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
}

export async function getMissingAssignments(
  options: GetMissingOptions = {},
): Promise<MissingAssignment[]> {
  const { studentId = "self", courseId } = options;

  const missing = await getMissingSubmissions({
    studentId,
    courseIds: courseId ? [courseId] : undefined,
    include: ["course"],
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
