/**
 * Prompt: missing-work-audit
 * Comprehensive audit of all missing and late work
 */

import type { PromptDefinition } from "../types.ts";

export const missingWorkAuditPrompt: PromptDefinition = {
  name: "missing-work-audit",
  description: "Comprehensive audit of all missing and late work",
  arguments: [{ name: "student_id", description: "Student ID", required: true }],
  handler: ({ student_id }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Perform a comprehensive audit of missing work for student ${student_id}:

1. Get all Canvas-flagged missing assignments using get_missing_assignments
2. Get unsubmitted past-due work using get_unsubmitted_past_due (catches items Canvas missed)
3. Get late/missing statistics by course using get_stats

Create a report showing:
- Total missing assignments across all courses
- Breakdown by course (which classes have the most issues?)
- Oldest missing assignments (how far back does this go?)
- Total points at risk
- Courses with the highest missing percentage

Flag any concerning patterns:
- Specific courses with many missing items
- Recent spike in missing work
- High-point assignments that are missing`,
        },
      },
    ],
  }),
};
