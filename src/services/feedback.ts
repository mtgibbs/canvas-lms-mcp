/**
 * Feedback Service
 * Shows teacher comments and feedback on student submissions
 *
 * Used by:
 * - CLI: `canvas feedback`
 * - MCP: `get_feedback`
 */

import { listCoursesWithGrades } from "../api/courses.ts";
import { listSubmissions, resolveUserId } from "../api/users.ts";
import type { FeedbackItem } from "./types.ts";

export interface GetFeedbackOptions {
  studentId: string;
  courseId?: number;
  days?: number;
}

/**
 * Get teacher comments and feedback on student submissions
 *
 * @param options - Configuration for fetching feedback
 * @returns List of feedback items sorted by most recent comment first
 */
export async function getFeedback(
  options: GetFeedbackOptions,
): Promise<FeedbackItem[]> {
  const { studentId, courseId, days = 14 } = options;

  // Resolve "self" to numeric ID for API calls
  const numericStudentId = await resolveUserId(studentId);

  // Calculate cutoff date for filtering comments
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  let coursesToFetch: Array<{ id: number; name: string }>;

  if (courseId) {
    // Fetch from specific course - need to get course name
    const allCourses = await listCoursesWithGrades(studentId);
    const course = allCourses.find((c) => c.id === courseId);
    if (!course) {
      throw new Error(`Course ${courseId} not found or not accessible`);
    }
    coursesToFetch = [{ id: course.id, name: course.name }];
  } else {
    // Fetch from all active courses
    const allCourses = await listCoursesWithGrades(studentId);
    coursesToFetch = allCourses.map((c) => ({ id: c.id, name: c.name }));
  }

  // Fetch submissions with comments from all courses in parallel
  const feedbackPromises = coursesToFetch.map(async (course) => {
    try {
      const submissions = await listSubmissions({
        course_id: course.id,
        student_ids: [numericStudentId],
        include: ["submission_comments", "assignment"],
      });

      // Filter to submissions with comments
      const submissionsWithComments = submissions.filter(
        (sub) => sub.submission_comments && sub.submission_comments.length > 0,
      );

      // Extract feedback items
      const feedbackItems: FeedbackItem[] = [];
      for (const sub of submissionsWithComments) {
        if (!sub.submission_comments || !sub.assignment) continue;

        // Filter comments by date
        const recentComments = sub.submission_comments.filter((comment) => {
          const commentDate = new Date(comment.created_at);
          return commentDate >= cutoffDate;
        });

        // Create a feedback item for each recent comment
        for (const comment of recentComments) {
          feedbackItems.push({
            assignment_id: sub.assignment.id,
            assignment_name: sub.assignment.name,
            course_id: course.id,
            course_name: course.name,
            comment_text: comment.comment,
            author_name: comment.author_name,
            comment_date: comment.created_at,
            student_score: sub.score ?? null,
            points_possible: sub.assignment.points_possible ?? null,
            grade: sub.grade ?? null,
            url: sub.html_url || sub.assignment.html_url || "",
          });
        }
      }

      return feedbackItems;
    } catch {
      // If a course fails, return empty array
      return [] as FeedbackItem[];
    }
  });

  const allFeedback = (await Promise.all(feedbackPromises)).flat();

  // Sort by most recent comment first
  allFeedback.sort(
    (a, b) => new Date(b.comment_date).getTime() - new Date(a.comment_date).getTime(),
  );

  return allFeedback;
}
