/**
 * Calendar Events Service
 * Get non-assignment calendar events (office hours, review sessions, school events, field trips)
 *
 * Used by:
 * - CLI: `canvas calendar`
 * - MCP: `get_calendar_events`
 */

import { listCalendarEvents } from "../api/calendar.ts";
import { listCoursesWithGrades } from "../api/courses.ts";
import type { CalendarEventItem } from "./types.ts";

export interface GetCalendarEventsOptions {
  studentId?: string;
  courseId?: number;
  days?: number;
}

export async function getCalendarEvents(
  options: GetCalendarEventsOptions = {},
): Promise<CalendarEventItem[]> {
  const { days = 14, courseId } = options;

  // Build context_codes from courses or single course
  let contextCodes: string[];
  let courseNameMap: Map<string, string>;

  if (courseId) {
    contextCodes = [`course_${courseId}`];
    courseNameMap = new Map([[`course_${courseId}`, `Course ${courseId}`]]);
  } else if (options.studentId) {
    const courses = await listCoursesWithGrades(options.studentId);
    contextCodes = courses.map((c) => `course_${c.id}`);
    courseNameMap = new Map(
      courses.map((c) => [`course_${c.id}`, c.name]),
    );
  } else {
    // No student ID or course ID - get all calendar events for current user
    contextCodes = [];
    courseNameMap = new Map();
  }

  // Calculate date range (from today to N days in the future)
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + days);

  const events = await listCalendarEvents({
    type: "event", // Only get calendar events, not assignments
    context_codes: contextCodes.length > 0 ? contextCodes : undefined,
    start_date: now.toISOString(),
    end_date: endDate.toISOString(),
  });

  // Map to service type and sort by start_at asc
  const items: CalendarEventItem[] = events
    .filter((e) => e.workflow_state === "active") // Only active events
    .map((e) => {
      const courseIdNum = parseInt(e.context_code.replace("course_", ""), 10);
      return {
        id: e.id,
        title: e.title,
        description: e.description ? e.description.substring(0, 200) : null, // Truncate to ~200 chars
        start_at: e.start_at,
        end_at: e.end_at,
        location_name: e.location_name,
        location_address: e.location_address,
        course_id: courseIdNum,
        course_name: courseNameMap.get(e.context_code) || e.context_code,
        url: e.html_url,
      };
    });

  items.sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
  );

  return items;
}
