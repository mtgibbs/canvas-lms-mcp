/**
 * Tool: get_students
 * List students being observed by the current user (parent/observer account)
 */

import { getObservedStudents } from "../../services/index.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {};

export const getStudentsTool: ToolDefinition<typeof schema> = {
  name: "get_students",
  description:
    "List all students being observed by the current user (for parent/observer accounts). Returns the student's ID, name, short_name, and sortable_name for each observed student. CRITICAL: Call this tool FIRST when the user mentions a student by name (e.g., 'Ronin', 'Rory'). Use the returned student_id in subsequent tool calls (get_courses, get_missing_assignments, etc.). NEVER guess a student_id - always call this tool to map student names to Canvas student IDs.",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async () => {
    const students = await getObservedStudents();
    return jsonResponse(students);
  },
};
