/**
 * Tool: list_assignments
 * List assignments for a course with optional filtering
 */

import { z } from "zod";
import { type AssignmentBucket, listAssignments } from "../../services/index.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {
  course_id: z.number().describe(
    "The internal Canvas Course ID. Use 'get_courses' to find this ID from a course name.",
  ),
  bucket: z
    .enum(["past", "overdue", "undated", "ungraded", "unsubmitted", "upcoming", "future"])
    .optional()
    .describe("Filter by bucket"),
  search_term: z.string().optional().describe("Search by assignment name"),
};

export const listAssignmentsTool: ToolDefinition<typeof schema> = {
  name: "list_assignments",
  description:
    "List assignments for a specific course with optional filtering by bucket (past, overdue, undated, ungraded, unsubmitted, upcoming, future). Use this for detailed, COURSE-SPECIFIC queries like 'assignments in Math' or 'search for the essay in History'. DO NOT use this for 'what is due this week' across all classes; use 'get_due_this_week' for that. Note: Teachers may also communicate assignments or work requirements through course announcements rather than creating Canvas assignments. Use get_teacher_communications to check for announcements about homework, remote day work, or other instructions.",
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
