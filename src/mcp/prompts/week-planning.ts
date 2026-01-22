/**
 * Prompt: week-planning
 * Plan the upcoming week with assignment priorities and daily breakdown
 */

import type { PromptDefinition } from "../types.ts";

export const weekPlanningPrompt: PromptDefinition = {
  name: "week-planning",
  description: "Plan the upcoming week with assignment priorities and daily breakdown",
  arguments: [
    { name: "student_id", description: "Student ID", required: true },
    { name: "days", description: "Days to look ahead (default: 7)", required: false },
  ],
  handler: ({ student_id, days }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Help me plan the week for student ${student_id}:

1. Get assignments due in the next ${days || 7} days using get_due_this_week
2. Check the to-do list using get_todo
3. Look for any missing work that should be prioritized using get_missing_assignments

Create a day-by-day plan that:
- Prioritizes past-due work first (these should be done ASAP)
- Spreads out upcoming assignments reasonably
- Flags any heavy days with multiple deadlines
- Suggests what to work on each day
- Notes any assignments worth a lot of points`,
        },
      },
    ],
  }),
};
