/**
 * Prompt: grade-recovery
 * Identify opportunities to improve grades across all courses
 */

import type { PromptDefinition } from "../types.ts";

export const gradeRecoveryPrompt: PromptDefinition = {
  name: "grade-recovery",
  description: "Identify opportunities to improve grades across all courses",
  arguments: [{ name: "student_id", description: "Student ID", required: true }],
  handler: ({ student_id }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Help identify grade recovery opportunities for student ${student_id}:

1. Get current grades using get_courses
2. Get statistics on late/missing work using get_stats
3. Find all missing assignments using get_missing_assignments

For each course, especially those below a B:
- Calculate the impact of missing assignments on the grade
- Identify which missing work could potentially still be submitted
- Prioritize by: points possible, likelihood of acceptance, and effort required
- Estimate potential grade improvement if completed

Create an action plan:
- Quick wins (high points, low effort)
- Important recovery items (high impact on grade)
- Long shots (may not be accepted but worth asking)`,
        },
      },
    ],
  }),
};
