/**
 * Tool: list_assignments
 * List assignments for a course with optional filtering
 */

import { z } from "zod";
import { type AssignmentBucket, listAssignments } from "../../services/index.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {
  course_id: z.number().describe("Course ID"),
  bucket: z
    .enum(["past", "overdue", "undated", "ungraded", "unsubmitted", "upcoming", "future"])
    .optional()
    .describe("Filter by bucket"),
  search_term: z.string().optional().describe("Search by assignment name"),
};

export const listAssignmentsTool: ToolDefinition<typeof schema> = {
  name: "list_assignments",
  description:
    "List assignments for a specific course with optional filtering by bucket (past, overdue, undated, ungraded, unsubmitted, upcoming, future). Use this for detailed assignment queries within a single course, like 'show me all overdue assignments in Math' or 'what assignments are ungraded in Science'. For simpler upcoming/due queries, prefer get_due_this_week. Note: Teachers may also communicate assignments or work requirements through course announcements rather than creating Canvas assignments. Use get_teacher_communications to check for announcements about homework, remote day work, or other instructions.",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ course_id, bucket, search_term }) => {
    const assignments = await listAssignments({
      courseId: course_id,
      bucket: bucket as AssignmentBucket | undefined,
      searchTerm: search_term,
    });

    return jsonResponse(assignments);
  },
};
