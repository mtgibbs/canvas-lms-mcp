/**
 * Canvas Discussion Topics API
 */

import { getClient } from "./client.ts";
import type { DiscussionTopic } from "../types/canvas.ts";

export interface ListDiscussionTopicsOptions {
  course_id: number;
  order_by?: "position" | "recent_activity" | "title";
  per_page?: number;
}

/**
 * List discussion topics for a course
 * Uses GET /api/v1/courses/:course_id/discussion_topics
 */
export function listDiscussionTopics(
  options: ListDiscussionTopicsOptions,
): Promise<DiscussionTopic[]> {
  const client = getClient();

  const params: Record<string, string | number | undefined> = {};

  if (options.order_by) {
    params.order_by = options.order_by;
  }
  if (options.per_page) {
    params.per_page = options.per_page;
  }

  return client.getAll<DiscussionTopic>(
    `/courses/${options.course_id}/discussion_topics`,
    params,
  );
}
