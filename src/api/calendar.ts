/**
 * Canvas Calendar Events API
 */

import { getClient } from "./client.ts";
import type { CalendarEvent } from "../types/canvas.ts";

export interface ListCalendarEventsOptions {
  type?: "event" | "assignment";
  context_codes?: string[];
  start_date?: string;
  end_date?: string;
}

/**
 * List calendar events
 * Uses GET /api/v1/calendar_events
 */
export function listCalendarEvents(
  options: ListCalendarEventsOptions = {},
): Promise<CalendarEvent[]> {
  const client = getClient();

  const params: Record<string, string | string[] | undefined> = {};

  if (options.type) {
    params.type = options.type;
  }
  if (options.context_codes) {
    params.context_codes = options.context_codes;
  }
  if (options.start_date) {
    params.start_date = options.start_date;
  }
  if (options.end_date) {
    params.end_date = options.end_date;
  }

  return client.getAll<CalendarEvent>("/calendar_events", params);
}
