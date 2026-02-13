/**
 * Discussion Topics Service
 * Get discussion topics across courses with participation status
 *
 * Used by:
 * - CLI: `canvas discussions`
 * - MCP: `get_discussions`
 */

import { listDiscussionTopics } from "../api/discussions.ts";
import { listCoursesWithGrades } from "../api/courses.ts";
import type { DiscussionItem } from "./types.ts";

export interface GetDiscussionsOptions {
  studentId?: string;
  courseId?: number;
  days?: number;
}

export async function getDiscussions(
  options: GetDiscussionsOptions = {},
): Promise<DiscussionItem[]> {
  const { days = 30, courseId } = options;

  // Get list of courses to query
  let courseIds: number[];
  let courseNameMap: Map<number, string>;

  if (courseId) {
    courseIds = [courseId];
    courseNameMap = new Map([[courseId, `Course ${courseId}`]]);
  } else if (options.studentId) {
    const courses = await listCoursesWithGrades(options.studentId);
    courseIds = courses.map((c) => c.id);
    courseNameMap = new Map(courses.map((c) => [c.id, c.name]));
  } else {
    // No student ID or course ID - no courses to query
    return [];
  }

  // Calculate date threshold (N days ago from today)
  const now = new Date();
  const thresholdDate = new Date(now);
  thresholdDate.setDate(now.getDate() - days);

  // Fetch discussion topics from all courses in parallel
  const allTopicsArrays = await Promise.all(
    courseIds.map((id) =>
      listDiscussionTopics({
        course_id: id,
        order_by: "recent_activity",
        per_page: 100,
      })
    ),
  );

  // Flatten and map to service type
  const items: DiscussionItem[] = [];
  for (let i = 0; i < allTopicsArrays.length; i++) {
    const topics = allTopicsArrays[i];
    const courseId = courseIds[i];
    const courseName = courseNameMap.get(courseId) || `Course ${courseId}`;

    for (const topic of topics) {
      // Filter by date: include if posted_at or last_reply_at is within the last N days
      const postedAt = new Date(topic.posted_at);
      const lastReplyAt = topic.last_reply_at ? new Date(topic.last_reply_at) : null;
      const recentDate = lastReplyAt && lastReplyAt > postedAt ? lastReplyAt : postedAt;

      if (recentDate >= thresholdDate) {
        items.push({
          id: topic.id,
          title: topic.title,
          course_id: courseId,
          course_name: courseName,
          posted_at: topic.posted_at,
          last_reply_at: topic.last_reply_at,
          discussion_type: topic.discussion_type,
          reply_count: topic.discussion_subentry_count,
          unread_count: topic.unread_count,
          is_graded: topic.assignment_id !== null,
          requires_initial_post: topic.require_initial_post,
          url: topic.html_url,
        });
      }
    }
  }

  // Sort by most recent activity (last_reply_at or posted_at) descending
  items.sort((a, b) => {
    const aDate = new Date(a.last_reply_at || a.posted_at);
    const bDate = new Date(b.last_reply_at || b.posted_at);
    return bDate.getTime() - aDate.getTime();
  });

  return items;
}
