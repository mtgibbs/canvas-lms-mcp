/**
 * Canvas Users API
 * Includes missing submissions, upcoming events, etc.
 */

import { getClient } from "./client.ts";
import type {
  MissingSubmission,
  UpcomingEvent,
  Submission,
} from "../types/canvas.ts";

/**
 * Options for getMissingSubmissions
 */
export interface GetMissingOptions {
  /** Student ID - use the numeric ID for observed students, or "self" for current user */
  studentId?: string | number;
  /** Filter to specific course IDs */
  courseIds?: number[];
  /** Include related data */
  include?: Array<"planner_overrides" | "course">;
  /** Filter options */
  filter?: Array<"submittable" | "current_grading_period">;
}

/**
 * Get missing submissions for a student
 *
 * For observers (parents): pass the student's numeric ID as studentId
 * For students: pass "self" or omit studentId
 *
 * Note: The Canvas API requires the student ID in the URL path for observers.
 * The observed_user_id parameter does NOT work for this endpoint.
 */
export async function getMissingSubmissions(
  options?: GetMissingOptions
): Promise<MissingSubmission[]> {
  const client = getClient();
  const studentId = options?.studentId ?? "self";

  const params: Record<string, string | string[] | undefined> = {};

  if (options?.courseIds?.length) {
    params.course_ids = options.courseIds.map(String);
  }
  if (options?.include) {
    params.include = options.include;
  }
  if (options?.filter) {
    params.filter = options.filter;
  }

  return client.getAll<MissingSubmission>(`/users/${studentId}/missing_submissions`, params);
}

/**
 * Get upcoming events for a user (assignments and calendar events)
 */
export async function getUpcomingEvents(userId: string | number = "self"): Promise<UpcomingEvent[]> {
  const client = getClient();
  return client.getAll<UpcomingEvent>(`/users/${userId}/upcoming_events`);
}

/**
 * Get todo items for a user (assignments needing submission)
 */
export async function getTodoItems(
  userId: string | number = "self"
): Promise<Array<{ assignment: MissingSubmission; context_name: string }>> {
  const client = getClient();
  return client.getAll<{ assignment: MissingSubmission; context_name: string }>(
    `/users/${userId}/todo`
  );
}

/**
 * Get recently graded submissions for a user
 */
export async function getGradedSubmissions(
  userId: string | number = "self",
  options?: {
    onlyPublished?: boolean;
  }
): Promise<Submission[]> {
  const client = getClient();

  const params: Record<string, string | undefined> = {};
  if (options?.onlyPublished) {
    params.only_published_assignments = "true";
  }

  return client.getAll<Submission>(`/users/${userId}/graded_submissions`, params);
}

/**
 * Get missing submissions grouped by course
 */
export async function getMissingSubmissionsByCourse(
  options?: GetMissingOptions
): Promise<Map<number, MissingSubmission[]>> {
  const missing = await getMissingSubmissions({
    ...options,
    include: ["course"],
  });

  const byCourse = new Map<number, MissingSubmission[]>();

  for (const submission of missing) {
    const courseId = submission.course_id;
    if (!byCourse.has(courseId)) {
      byCourse.set(courseId, []);
    }
    byCourse.get(courseId)!.push(submission);
  }

  return byCourse;
}

/**
 * Get count of missing submissions per course
 */
export async function getMissingCountsByCourse(
  options?: GetMissingOptions
): Promise<Map<number, { courseName: string; count: number }>> {
  const missing = await getMissingSubmissions({
    ...options,
    include: ["course"],
  });

  const counts = new Map<number, { courseName: string; count: number }>();

  for (const submission of missing) {
    const courseId = submission.course_id;
    const courseName = submission.course?.name || `Course ${courseId}`;

    if (!counts.has(courseId)) {
      counts.set(courseId, { courseName, count: 0 });
    }
    counts.get(courseId)!.count++;
  }

  return counts;
}

/**
 * Get observed students (for parent/observer accounts)
 * Returns the list of users that the current user is observing
 */
export async function getObservedStudents(
  userId: string | number = "self"
): Promise<import("../types/canvas.ts").User[]> {
  const client = getClient();
  return client.getAll<import("../types/canvas.ts").User>(`/users/${userId}/observees`);
}
