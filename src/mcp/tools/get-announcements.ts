/**
 * Tool: get_announcements
 * Get recent course announcements
 */

import { z } from "zod";
import { getAnnouncements } from "../../services/index.ts";
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
    .default(14)
    .describe("Number of days to look back for announcements (default: 14)"),
  course_id: z
    .number()
    .optional()
    .describe("Filter to a specific course ID"),
};

export const getAnnouncementsTool: ToolDefinition<typeof schema> = {
  name: "get_announcements",
  description:
    "Get recent course announcements from Canvas. Shows announcement title, message content, author, and posting date. Useful for checking teacher communications about schedule changes, exam reminders, or class updates.",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ student_id, days, course_id }) => {
    const effectiveStudentId = await getEffectiveStudentId(student_id);

    const items = await getAnnouncements({
      studentId: String(effectiveStudentId),
      days,
      courseId: course_id,
    });

    return jsonResponse(items);
  },
};
