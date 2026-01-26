/**
 * Canvas Announcements API
 */

import { getClient } from "./client.ts";
import type { Announcement } from "../types/canvas.ts";

export interface ListAnnouncementsOptions {
  context_codes: string[];
  start_date?: string;
  end_date?: string;
  active_only?: boolean;
}

/**
 * List announcements for the given courses
 * Uses GET /api/v1/announcements
 */
export function listAnnouncements(
  options: ListAnnouncementsOptions,
): Promise<Announcement[]> {
  const client = getClient();

  const params: Record<string, string | string[] | boolean | undefined> = {
    context_codes: options.context_codes,
  };

  if (options.start_date) {
    params.start_date = options.start_date;
  }
  if (options.end_date) {
    params.end_date = options.end_date;
  }
  if (options.active_only !== undefined) {
    params.active_only = options.active_only;
  }

  return client.getAll<Announcement>("/announcements", params);
}
