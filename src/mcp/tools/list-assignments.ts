/**
 * Tool: list_assignments
 * List assignments for a course with optional filtering
 */

import { z } from "zod";
import { listAssignments } from "../../api/assignments.ts";
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
      course_id,
      bucket: bucket,
      search_term,
      include: ["submission"],
    });

    const simplified = assignments.map((a) => ({
      id: a.id,
      name: a.name,
      due_at: a.due_at,
      bucket: bucket || "all",
      score: a.submission?.score,
      grade: a.submission?.grade,
      submitted: !!a.submission?.submitted_at,
      url: a.html_url,
    }));

    return jsonResponse(simplified);
  },
};
