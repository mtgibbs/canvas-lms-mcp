/**
 * Upcoming Assignments Service
 * Get assignments due in the next N days for a single course
 *
 * Used by:
 * - CLI: `canvas upcoming`
 * - MCP: `get_upcoming_assignments`
 */

import { listUpcomingAssignments } from "../api/assignments.ts";

export interface UpcomingAssignment {
  id: number;
  name: string;
  due_at: string | null;
  points_possible: number | null;
  submitted: boolean;
  url: string;
}

export interface GetUpcomingOptions {
  courseId: number;
  days?: number;
}

export async function getUpcomingAssignments(
  options: GetUpcomingOptions,
): Promise<UpcomingAssignment[]> {
  const { courseId, days = 7 } = options;

  const assignments = await listUpcomingAssignments(courseId, days);

  return assignments.map((a) => ({
    id: a.id,
    name: a.name,
    due_at: a.due_at,
    points_possible: a.points_possible,
    submitted: !!a.submission?.submitted_at,
    url: a.html_url,
  }));
}
