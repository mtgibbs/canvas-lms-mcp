/**
 * Prompt: daily-checkin
 * Get a quick daily overview of grades, missing work, and upcoming assignments
 */

import type { PromptDefinition } from "../types.ts";

export const dailyCheckinPrompt: PromptDefinition = {
  name: "daily-checkin",
  description:
    "Get a quick daily overview of grades, missing work, upcoming assignments, and teacher announcements",
  arguments: [{ name: "student_id", description: "Student ID", required: true }],
  handler: ({ student_id }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please give me a daily check-in for student ${student_id}:

1. First, get their current grades across all courses using get_courses
2. Then check for any missing assignments using get_missing_assignments
3. Check for unsubmitted past-due work using get_unsubmitted_past_due
4. Show what's due in the next 7 days using get_due_this_week
5. Check for recent teacher announcements using get_announcements (days=3)

Summarize with:
- Overall grade status (any concerns?)
- Missing/late work that needs immediate attention
- What's coming up this week
- Recent teacher announcements or communications
- A prioritized action list if there are issues to address`,
        },
      },
    ],
  }),
};
