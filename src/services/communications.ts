/**
 * Communications Service
 * Get all recent teacher communications (announcements + inbox) in one call
 *
 * Used by:
 * - CLI: `canvas communications`
 * - MCP: `get_teacher_communications`
 */

import { getAnnouncements } from "./announcements.ts";
import { getInbox } from "./inbox.ts";
import type { TeacherCommunications } from "./types.ts";

export interface GetTeacherCommunicationsOptions {
  studentId: string;
  days?: number;
  courseId?: number;
}

export async function getTeacherCommunications(
  options: GetTeacherCommunicationsOptions,
): Promise<TeacherCommunications> {
  const { studentId, days = 7, courseId } = options;

  const [announcements, inbox] = await Promise.all([
    getAnnouncements({ studentId, days, courseId }),
    getInbox({ studentId, courseId }),
  ]);

  return { announcements, inbox };
}
