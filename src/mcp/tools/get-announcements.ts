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
    "Get course announcements that teachers post to their class pages in Canvas. These are the posts students see in their Canvas app under each course — things like remote learning instructions, exam reminders, schedule changes, and class updates. This is DIFFERENT from inbox messages (get_inbox). When checking what teachers have communicated, ALWAYS call BOTH get_announcements AND get_inbox to get the full picture.",
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
