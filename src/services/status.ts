/**
 * Comprehensive Status Service
 * Get a complete academic status overview in a single call
 *
 * Used by:
 * - CLI: `canvas status`
 * - MCP: `get_comprehensive_status`
 */

import { listCoursesWithGrades } from "../api/courses.ts";
import { getMissingSubmissions } from "../api/users.ts";
import { listGradedSubmissions, listSubmissions } from "../api/submissions.ts";
import type {
  ComprehensiveStatus,
  DueAssignment,
  GradedAssignment,
  MissingAssignment,
} from "./types.ts";

export interface GetStatusOptions {
  studentId: string;
  daysUpcoming?: number;
  daysGrades?: number;
  lowGradeThreshold?: number;
}

export async function getComprehensiveStatus(
  options: GetStatusOptions,
): Promise<ComprehensiveStatus> {
  const {
    studentId,
    daysUpcoming = 7,
    daysGrades = 14,
    lowGradeThreshold = 70,
  } = options;

  // Step 1: Get courses with current grades
  const coursesWithGrades = await listCoursesWithGrades(studentId);

  const courseMap = new Map<number, string>();
  for (const course of coursesWithGrades) {
    courseMap.set(course.id, course.name);
  }

  // Step 2: Get missing submissions
  const missingSubmissions = await getMissingSubmissions({
    studentId,
    include: ["course"],
  });

  // Step 3: Get upcoming assignments and recent grades in parallel
  const now = new Date();
  const upcomingEndDate = new Date(now);
  upcomingEndDate.setDate(now.getDate() + daysUpcoming);
  const gradesCutoffDate = new Date(now);
  gradesCutoffDate.setDate(now.getDate() - daysGrades);

  // Parallel fetch for each course
  const courseDataPromises = coursesWithGrades.map(async (course) => {
    try {
      const [allSubmissions, gradedSubmissions] = await Promise.all([
        listSubmissions({
          course_id: course.id,
          student_ids: [Number(studentId)],
          include: ["assignment"],
        }),
        listGradedSubmissions(course.id, studentId),
      ]);

      // Filter for upcoming assignments
      const upcoming: DueAssignment[] = allSubmissions
        .filter((sub) => {
          const assignment = sub.assignment;
          if (!assignment?.due_at) return false;
          const dueDate = new Date(assignment.due_at);
          return dueDate >= now && dueDate <= upcomingEndDate;
        })
        .map((sub) => ({
          course_id: course.id,
          course_name: course.name,
          assignment_id: sub.assignment!.id,
          assignment_name: sub.assignment!.name,
          due_at: sub.assignment!.due_at!,
          points_possible: sub.assignment!.points_possible,
          submitted: !!sub.submitted_at,
          score: sub.score,
          grade: sub.grade,
        }));

      // Filter for recent low grades
      const recentLowGrades: GradedAssignment[] = gradedSubmissions
        .filter((sub) => {
          const gradedDate = sub.graded_at ? new Date(sub.graded_at) : null;
          if (!gradedDate || gradedDate < gradesCutoffDate) return false;

          const pointsPossible = sub.assignment?.points_possible || 0;
          if (pointsPossible === 0 || sub.score === null) return false;

          const percentage = (sub.score / pointsPossible) * 100;
          return percentage < lowGradeThreshold;
        })
        .map((sub) => {
          const pointsPossible = sub.assignment?.points_possible || 0;
          const percentage =
            sub.score !== null && pointsPossible > 0
              ? Math.round((sub.score / pointsPossible) * 100)
              : null;

          return {
            course_id: course.id,
            course_name: course.name,
            assignment_id: sub.assignment_id,
            assignment_name: sub.assignment?.name || "Unknown",
            graded_at: sub.graded_at,
            score: sub.score,
            points_possible: pointsPossible,
            percentage,
            grade: sub.grade,
            late: sub.late,
          };
        });

      return { upcoming, recentLowGrades };
    } catch {
      return { upcoming: [] as DueAssignment[], recentLowGrades: [] as GradedAssignment[] };
    }
  });

  const courseDataResults = await Promise.all(courseDataPromises);

  // Aggregate results
  const allUpcoming = courseDataResults.flatMap((r) => r.upcoming);
  const allRecentLowGrades = courseDataResults.flatMap((r) => r.recentLowGrades);

  // Sort upcoming by due date
  allUpcoming.sort(
    (a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime(),
  );

  // Sort low grades by date (most recent first)
  allRecentLowGrades.sort((a, b) => {
    if (!a.graded_at || !b.graded_at) return 0;
    return new Date(b.graded_at).getTime() - new Date(a.graded_at).getTime();
  });

  // Build missing assignments with proper type
  const missing: MissingAssignment[] = missingSubmissions.map((sub) => ({
    id: sub.id,
    name: sub.name,
    course_id: sub.course_id,
    course_name:
      sub.course?.name || courseMap.get(sub.course_id) || `Course ${sub.course_id}`,
    due_at: sub.due_at,
    points_possible: sub.points_possible,
    url: sub.html_url,
  }));

  return {
    summary: {
      total_courses: coursesWithGrades.length,
      missing_assignments: missingSubmissions.length,
      upcoming_assignments: allUpcoming.length,
      recent_low_grades: allRecentLowGrades.length,
    },
    courses: coursesWithGrades.map((course) => {
      const grades = course.enrollment?.grades;
      return {
        id: course.id,
        name: course.name,
        current_score: grades?.current_score ?? null,
        current_grade: grades?.current_grade ?? null,
        final_score: grades?.final_score ?? null,
        final_grade: grades?.final_grade ?? null,
      };
    }),
    missing_assignments: missing,
    upcoming_assignments: allUpcoming,
    recent_low_grades: allRecentLowGrades,
  };
}
