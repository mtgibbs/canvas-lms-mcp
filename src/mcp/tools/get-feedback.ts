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
import type { Tool } from "../types.ts";

export const schema = z.object({
  student_id: z.string().describe(
    "Student ID (use 'self' for current user, or numeric ID from get_students tool)",
  ),
  course_id: z.number().optional().describe(
    "Filter to specific course (omit to fetch from all active courses)",
  ),
  days: z.number().optional().describe(
    "Look back N days for comments (default: 14)",
  ),
});

export const getFeedbackTool: Tool = {
  name: "get_feedback",
  description:
    "Get teacher comments and feedback on student submissions. Shows what teachers and TAs are saying about the student's work. Returns a list of feedback items sorted by most recent comment first, each with: assignment_name, course_name, comment_text (the teacher's comment), author_name (who commented), comment_date, student_score, points_possible, grade, and assignment URL. Use this to see detailed feedback on assignments, especially when parents want to understand teacher comments or concerns about specific work.",
  inputSchema: schema,
  handler: async (args) => {
    const params = schema.parse(args);

    const result = await getFeedback({
      studentId: params.student_id,
      courseId: params.course_id,
      days: params.days,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
};
