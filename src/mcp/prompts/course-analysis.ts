/**
 * Prompt: course-analysis
 * Detailed analysis of a specific course - grades, missing work, and patterns
 */

import type { PromptDefinition } from "../types.ts";

export const courseAnalysisPrompt: PromptDefinition = {
  name: "course-analysis",
  description: "Detailed analysis of a specific course - grades, missing work, and patterns",
  arguments: [
    { name: "student_id", description: "Student ID", required: true },
    { name: "course_id", description: "Course ID to analyze", required: true },
  ],
  handler: ({ student_id, course_id }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Analyze course ${course_id} in detail for student ${student_id}:

1. Get the current grade using get_courses
2. List all assignments using list_assignments with the course_id
3. Check for missing work in this course using get_missing_assignments with course_id filter
4. Get upcoming assignments using get_upcoming_assignments

Provide:
- Current grade and standing in the class
- Assignment completion rate (submitted vs total)
- Any patterns (consistently late? missing certain types of work?)
- Impact of missing assignments on the grade
- What would improve the grade most (quick wins)
- Upcoming work to watch out for`,
        },
      },
    ],
  }),
};
