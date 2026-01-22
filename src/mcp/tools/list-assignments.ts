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
  description: "List assignments for a course with optional filtering",
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
