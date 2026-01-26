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
    "Get Canvas inbox conversations. Shows message subject, participants, last message date, and read status. Note: for observer accounts, this shows the observer's own inbox, not the student's. Use scope='unread' to see only unread messages.",
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
