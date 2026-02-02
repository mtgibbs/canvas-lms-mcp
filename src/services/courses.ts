/**
 * Courses Service
 * List all active courses with current grades
 *
 * Used by:
 * - CLI: `canvas courses`
 * - MCP: `get_courses`
 */

import { listCoursesWithGrades } from "../api/courses.ts";
import type { CourseGrade } from "./types.ts";

export interface GetCoursesOptions {
  studentId?: string;
}

export async function getCourses(
  options: GetCoursesOptions = {},
): Promise<CourseGrade[]> {
  const { studentId = "self" } = options;

  const courses = await listCoursesWithGrades(studentId);

  return courses.map((course) => ({
    id: course.id,
    name: course.name,
    course_code: course.course_code,
    current_score: course.enrollment?.grades?.current_score ?? null,
    current_grade: course.enrollment?.grades?.current_grade ?? null,
    final_score: course.enrollment?.grades?.final_score ?? null,
    final_grade: course.enrollment?.grades?.final_grade ?? null,
    grading_period_id: course.gradingPeriodId,
  }));
}
