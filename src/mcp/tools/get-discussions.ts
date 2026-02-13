/**
 * Tool: get_discussions
 * Get discussion topics across courses with participation status
 */

import { z } from "zod";
import { getDiscussions } from "../../services/index.ts";
import { getEffectiveStudentId } from "../../api/users.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {
  student_id: z
    .string()
    .optional()
    .describe("Student ID (uses configured CANVAS_STUDENT_ID if not provided)"),
  days: z
    .number()
    .optional()
    .default(30)
    .describe(
      "Number of days to look back for discussion topics (default: 30). Filters by posted_at or last_reply_at.",
    ),
  course_id: z
    .number()
    .optional()
    .describe(
      "Filter to a specific course ID. Use 'get_courses' to find this ID from a course name.",
    ),
};

export const getDiscussionsTool: ToolDefinition<typeof schema> = {
  name: "get_discussions",
  description:
    "Get discussion topics across courses with participation information. Shows discussion title, course, type (threaded or side_comment), number of replies, unread count, whether the discussion is graded (associated with an assignment), whether it requires an initial post, and the posted date. Useful for understanding class discussion activity, identifying unanswered discussions, and tracking participation requirements. Ordered by most recent activity (last reply or post date).",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ student_id, days, course_id }) => {
    const effectiveStudentId = await getEffectiveStudentId(student_id);

    const items = await getDiscussions({
      studentId: String(effectiveStudentId),
      days,
      courseId: course_id,
    });

    return jsonResponse(items);
  },
};
