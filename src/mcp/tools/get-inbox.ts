/**
 * Tool: get_inbox
 * Get Canvas inbox conversations
 */

import { z } from "zod";
import { getInbox } from "../../services/index.ts";
import { getEffectiveStudentId } from "../../api/users.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {
  student_id: z
    .string()
    .optional()
    .describe("Student ID (uses configured CANVAS_STUDENT_ID if not provided)"),
  scope: z
    .enum(["inbox", "unread", "archived", "starred", "sent"])
    .optional()
    .default("inbox")
    .describe("Message scope to filter by (default: inbox)"),
  course_id: z
    .number()
    .optional()
    .describe("Filter to a specific course ID"),
};

export const getInboxTool: ToolDefinition<typeof schema> = {
  name: "get_inbox",
  description:
    "Get Canvas inbox direct messages (conversations). These are private messages between users, NOT course announcements. For observer/parent accounts, this shows the observer's own inbox. To see course announcements posted by teachers (visible in the student's Canvas app), use get_announcements instead. When checking what teachers have communicated, ALWAYS call BOTH get_inbox AND get_announcements.",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ student_id, scope, course_id }) => {
    const effectiveStudentId = await getEffectiveStudentId(student_id);

    const items = await getInbox({
      studentId: String(effectiveStudentId),
      scope,
      courseId: course_id,
    });

    return jsonResponse(items);
  },
};
