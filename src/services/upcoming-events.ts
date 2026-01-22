/**
 * Upcoming Events Service
 * Get upcoming calendar events and assignments
 *
 * Used by:
 * - CLI: `canvas upcoming`
 * - MCP: `get_upcoming_events`
 */

import { getUpcomingEvents as apiGetUpcomingEvents } from "../api/users.ts";

export interface UpcomingEvent {
  type: string;
  title: string;
  start_at: string;
  course_id: number | null;
  url: string;
}

export interface GetUpcomingEventsOptions {
  studentId: string;
  days?: number;
  typeFilter?: "assignment" | "event";
}

export async function getUpcomingEvents(
  options: GetUpcomingEventsOptions,
): Promise<UpcomingEvent[]> {
  const { studentId, days = 14, typeFilter } = options;

  let events = await apiGetUpcomingEvents(studentId);

  // Filter by date range
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + days);

  events = events.filter((event) => {
    const eventDate = new Date(event.start_at);
    return eventDate >= now && eventDate <= cutoff;
  });

  // Filter by type if specified
  if (typeFilter) {
    events = events.filter((event) => event.type === typeFilter);
  }

  // Sort by start date
  events.sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
  );

  // Extract course ID and transform
  return events.map((event) => {
    const courseMatch = event.context_code?.match(/course_(\d+)/);
    return {
      type: event.type,
      title: event.title,
      start_at: event.start_at,
      course_id: courseMatch ? parseInt(courseMatch[1], 10) : null,
      url: event.html_url,
    };
  });
}
