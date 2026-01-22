/**
 * Assignments Service
 * List assignments for a course with optional filtering
 *
 * Used by:
 * - CLI: `canvas assignments`
 * - MCP: `list_assignments`
 */

import { listCourses } from "../api/courses.ts";
import {
  listAssignments as apiListAssignments,
  listAssignmentsDueThisWeek,
  listUpcomingAssignments as apiListUpcomingAssignments,
} from "../api/assignments.ts";
import type { Assignment } from "../types/canvas.ts";

export type AssignmentBucket =
  | "past"
  | "overdue"
  | "undated"
  | "ungraded"
  | "unsubmitted"
  | "upcoming"
  | "future";

export interface AssignmentResult {
  id: number;
  course_id: number;
  course_name: string;
  name: string;
  due_at: string | null;
  points_possible: number | null;
  bucket: string;
  score: number | null;
  grade: string | null;
  submitted: boolean;
  url: string;
}

export interface ListAssignmentsOptions {
  courseId?: number;
  allCourses?: boolean;
  bucket?: AssignmentBucket;
  dueThisWeek?: boolean;
  upcoming?: number; // Number of days
  searchTerm?: string;
}

export async function listAssignments(
  options: ListAssignmentsOptions,
): Promise<AssignmentResult[]> {
  const { courseId, allCourses, bucket, dueThisWeek, upcoming, searchTerm } = options;

  if (!courseId && !allCourses) {
    throw new Error("Either courseId or allCourses is required");
  }

  const results: AssignmentResult[] = [];

  if (allCourses) {
    // Fetch from all courses in parallel
    const courses = await listCourses({
      enrollment_state: "active",
      state: ["available"],
    });

    const assignmentPromises = courses.map(async (course) => {
      const courseAssignments = await fetchAssignmentsForCourse(
        course.id,
        { dueThisWeek, upcoming, bucket, searchTerm },
      );
      return courseAssignments.map((a) => transformAssignment(a, course.name));
    });

    const allAssignments = await Promise.all(assignmentPromises);
    results.push(...allAssignments.flat());
  } else if (courseId) {
    // Fetch from specific course
    const assignments = await fetchAssignmentsForCourse(
      courseId,
      { dueThisWeek, upcoming, bucket, searchTerm },
    );
    results.push(...assignments.map((a) => transformAssignment(a, `Course ${courseId}`)));
  }

  // Sort by due date
  results.sort((a, b) => {
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });

  return results;
}

function fetchAssignmentsForCourse(
  courseId: number,
  options: { dueThisWeek?: boolean; upcoming?: number; bucket?: AssignmentBucket; searchTerm?: string },
): Promise<Assignment[]> {
  if (options.dueThisWeek) {
    return listAssignmentsDueThisWeek(courseId);
  } else if (options.upcoming !== undefined) {
    return apiListUpcomingAssignments(courseId, options.upcoming);
  } else {
    return apiListAssignments({
      course_id: courseId,
      bucket: options.bucket,
      search_term: options.searchTerm,
      include: ["submission"],
      order_by: "due_at",
    });
  }
}

function transformAssignment(a: Assignment, courseName: string): AssignmentResult {
  return {
    id: a.id,
    course_id: a.course_id,
    course_name: courseName,
    name: a.name,
    due_at: a.due_at,
    points_possible: a.points_possible,
    bucket: "all",
    score: a.submission?.score ?? null,
    grade: a.submission?.grade ?? null,
    submitted: !!a.submission?.submitted_at,
    url: a.html_url,
  };
}
