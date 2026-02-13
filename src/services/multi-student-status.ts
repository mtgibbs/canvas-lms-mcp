/**
 * Multi-Student Status Service
 * Get comprehensive status for ALL observed students in a single call
 *
 * Used by:
 * - CLI: `canvas status --all-students`
 * - MCP: `get_all_students_status`
 */

import { getObservedStudents } from "./students.ts";
import { getComprehensiveStatus } from "./status.ts";
import type { MultiStudentStatus } from "./types.ts";

export interface GetAllStudentsStatusOptions {
  daysUpcoming?: number;
  daysGrades?: number;
  lowGradeThreshold?: number;
}

/**
 * Get comprehensive status for all observed students
 * Each student's data is clearly separated and labeled to prevent mix-ups
 *
 * @param options - Configuration for status queries (days, thresholds)
 * @returns Array of status objects, one per student, with student name/ID clearly labeled
 */
export async function getAllStudentsStatus(
  options: GetAllStudentsStatusOptions = {},
): Promise<MultiStudentStatus[]> {
  const {
    daysUpcoming = 7,
    daysGrades = 7,
    lowGradeThreshold = 70,
  } = options;

  // Step 1: Get all observed students
  const students = await getObservedStudents();

  // Step 2: Fetch comprehensive status for each student in parallel
  const statusPromises = students.map(async (student) => {
    const status = await getComprehensiveStatus({
      studentId: String(student.id),
      daysUpcoming,
      daysGrades,
      lowGradeThreshold,
    });

    return {
      student_name: student.name,
      student_id: student.id,
      status,
    };
  });

  const results = await Promise.all(statusPromises);

  return results;
}
