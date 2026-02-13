/**
 * MCP Tool: get_feedback
 *
 * Shows teacher comments and feedback on student submissions.
 * Critical for parents who want to see what teachers are saying about their child's work.
 *
 * CLI equivalent: `canvas feedback`
 */

import { z } from "zod";
import { getFeedback } from "../../services/index.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {
  student_id: z.string().describe(
    "Student ID (use 'self' for current user, or numeric ID from get_students tool)",
  ),
  course_id: z.number().optional().describe(
    "Filter to specific course (omit to fetch from all active courses)",
  ),
  days: z.number().optional().describe(
    "Look back N days for comments (default: 14)",
  ),
};

export const getFeedbackTool: ToolDefinition<typeof schema> = {
  name: "get_feedback",
  description:
    "Get teacher comments and feedback on student submissions. Shows what teachers and TAs are saying about the student's work. Returns a list of feedback items sorted by most recent comment first, each with: assignment_name, course_name, comment_text (the teacher's comment), author_name (who commented), comment_date, student_score, points_possible, grade, and assignment URL. Use this to see detailed feedback on assignments, especially when parents want to understand teacher comments or concerns about specific work.",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ student_id, course_id, days }) => {
    const result = await getFeedback({
      studentId: student_id,
      courseId: course_id,
      days: days,
    });

    return jsonResponse(result);
  },
};
