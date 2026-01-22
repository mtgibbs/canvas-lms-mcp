/**
 * Grades Service
 * Get recently graded assignments with scores
 *
 * Used by:
 * - CLI: `canvas grades`
 * - MCP: `get_recent_grades`
 */

import { listCourses } from "../api/courses.ts";
import { listGradedSubmissions } from "../api/submissions.ts";
import type { GradedAssignment } from "./types.ts";

export interface GetGradesOptions {
  studentId: string;
  days?: number;
  belowPercentage?: number;
  courseId?: number;
}

export async function getRecentGrades(
  options: GetGradesOptions,
): Promise<GradedAssignment[]> {
  const { studentId, days, belowPercentage, courseId } = options;

  const courseIds: number[] = [];
  const courseMap = new Map<number, string>();

  if (courseId) {
    courseIds.push(courseId);
    courseMap.set(courseId, `Course ${courseId}`);
  } else {
    const courses = await listCourses({
      enrollment_state: "active",
      state: ["available"],
    });
    for (const course of courses) {
      courseIds.push(course.id);
      courseMap.set(course.id, course.name);
    }
  }

  // Fetch submissions from all courses in parallel
  const submissionPromises = courseIds.map(async (cid) => {
    try {
      const submissions = await listGradedSubmissions(cid, studentId);
      return submissions.map((sub) => ({
        ...sub,
        _course_id: cid,
        _course_name: courseMap.get(cid) || `Course ${cid}`,
      }));
    } catch {
      return [];
    }
  });

  const allSubmissions = (await Promise.all(submissionPromises)).flat();

  // Filter by graded date if days specified
  let filteredSubmissions = allSubmissions;
  if (days !== undefined) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    filteredSubmissions = allSubmissions.filter((sub) => {
      const gradedDate = sub.graded_at ? new Date(sub.graded_at) : null;
      return gradedDate && gradedDate >= cutoffDate;
    });
  }

  // Calculate percentages and build results
  const results: GradedAssignment[] = filteredSubmissions.map((sub) => {
    const pointsPossible = sub.assignment?.points_possible || 0;
    const percentage =
      sub.score !== null && pointsPossible > 0
        ? Math.round((sub.score / pointsPossible) * 100)
        : null;

    return {
      course_id: sub._course_id,
      course_name: sub._course_name,
      assignment_id: sub.assignment_id,
      assignment_name: sub.assignment?.name || "Unknown",
      graded_at: sub.graded_at,
      score: sub.score,
      points_possible: pointsPossible,
      percentage,
      grade: sub.grade,
      late: sub.late,
      url: sub.assignment?.html_url,
    };
  });

  // Filter by percentage threshold if specified
  let finalResults = results;
  if (belowPercentage !== undefined) {
    finalResults = results.filter(
      (r) => r.percentage !== null && r.percentage < belowPercentage,
    );
  }

  // Sort by graded date (most recent first)
  finalResults.sort((a, b) => {
    if (!a.graded_at || !b.graded_at) return 0;
    return new Date(b.graded_at).getTime() - new Date(a.graded_at).getTime();
  });

  return finalResults;
}
