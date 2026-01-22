/**
 * Todo Service
 * Get the student's to-do list (planner items)
 *
 * Used by:
 * - CLI: `canvas todo`
 * - MCP: `get_todo`
 */

import { getPlannerItems } from "../api/users.ts";

export interface TodoItem {
  course_name: string;
  title: string;
  type: string;
  due_at: string;
  points_possible: number | null;
  submitted: boolean;
  missing: boolean;
  graded: boolean;
  url: string;
}

export interface GetTodoOptions {
  studentId: string;
  days?: number;
  startDate?: string;
  endDate?: string;
  hideSubmitted?: boolean;
}

export async function getTodoItems(options: GetTodoOptions): Promise<TodoItem[]> {
  const { studentId, days = 7, hideSubmitted = false } = options;

  // Use provided dates or calculate from days
  const startDateStr = options.startDate || new Date().toISOString().split("T")[0];
  let endDateStr = options.endDate;
  if (!endDateStr) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    endDateStr = endDate.toISOString().split("T")[0];
  }

  const items = await getPlannerItems({
    studentId,
    startDate: startDateStr,
    endDate: endDateStr,
  });

  // Filter out submitted items if requested
  let filteredItems = items;
  if (hideSubmitted) {
    filteredItems = items.filter((item) => !item.submissions?.submitted);
  }

  // Sort by due date
  filteredItems.sort((a, b) => {
    return (
      new Date(a.plannable_date).getTime() - new Date(b.plannable_date).getTime()
    );
  });

  return filteredItems.map((item) => ({
    course_name: item.context_name,
    title: item.plannable.title,
    type: item.plannable_type,
    due_at: item.plannable_date,
    points_possible: item.plannable.points_possible,
    submitted: item.submissions?.submitted || false,
    missing: item.submissions?.missing || false,
    graded: item.submissions?.graded || false,
    url: item.html_url,
  }));
}
