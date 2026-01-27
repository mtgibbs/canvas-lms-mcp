/**
 * Tool: get_teacher_communications
 * Get all recent teacher communications (announcements + inbox) in a single call
 */

import { z } from "zod";
import { getTeacherCommunications } from "../../services/index.ts";
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
    .default(7)
    .describe("Number of days to look back for announcements (default: 7)"),
  course_id: z
    .number()
    .optional()
    .describe("Filter to a specific course ID"),
};

export const getTeacherCommunicationsTool: ToolDefinition<typeof schema> = {
  name: "get_teacher_communications",
  description:
    "Get ALL recent teacher communications — both course announcements and inbox messages — in a single call. Teachers use announcements to post class-wide updates such as remote/virtual day instructions, homework details, exam reminders, schedule changes, and assignment clarifications. They use inbox messages for direct/private communications. IMPORTANT: When a user asks about what work to do, what teachers said, remote day instructions, or daily assignments, ALWAYS call this tool in addition to any assignment-related tools, because teachers often communicate work requirements through announcements rather than creating Canvas assignments.",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ student_id, days, course_id }) => {
    const effectiveStudentId = await getEffectiveStudentId(student_id);

    const result = await getTeacherCommunications({
      studentId: String(effectiveStudentId),
      days,
      courseId: course_id,
    });

    return jsonResponse(result);
  },
};
