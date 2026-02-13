/**
 * Canvas People API
 * Get teachers and TAs for courses
 */

import { getClient } from "./client.ts";
import type { User } from "../types/canvas.ts";

/**
 * List users (teachers/TAs) in a course
 * @param courseId - The course ID
 * @param enrollmentTypes - Array of enrollment types to filter (e.g., ["teacher", "ta"])
 * @returns Array of users with their enrollment information
 */
export function listCourseUsers(
  courseId: number,
  enrollmentTypes: string[] = ["teacher", "ta"],
): Promise<User[]> {
  const client = getClient();

  const params: Record<string, string | string[]> = {
    enrollment_type: enrollmentTypes,
    include: ["email", "enrollments"],
  };

  return client.getAll<User>(`/courses/${courseId}/users`, params);
}
