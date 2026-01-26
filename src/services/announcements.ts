/**
 * Announcements Service
 * Get course announcements
 *
 * Used by:
 * - CLI: `canvas announcements`
 * - MCP: `get_announcements`
 */

import { listAnnouncements } from "../api/announcements.ts";
import { listCoursesWithGrades } from "../api/courses.ts";
import type { AnnouncementItem } from "./types.ts";

export interface GetAnnouncementsOptions {
  studentId: string;
  days?: number;
  courseId?: number;
}

export async function getAnnouncements(
  options: GetAnnouncementsOptions,
): Promise<AnnouncementItem[]> {
  const { days = 14, courseId } = options;

  // Build context_codes from courses or single course
  let contextCodes: string[];
  let courseNameMap: Map<string, string>;

  if (courseId) {
    contextCodes = [`course_${courseId}`];
    courseNameMap = new Map([[`course_${courseId}`, `Course ${courseId}`]]);
  } else {
    const courses = await listCoursesWithGrades(options.studentId);
    contextCodes = courses.map((c) => `course_${c.id}`);
    courseNameMap = new Map(
      courses.map((c) => [`course_${c.id}`, c.name]),
    );
  }

  if (contextCodes.length === 0) {
    return [];
  }

  // Calculate date range
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - days);

  const announcements = await listAnnouncements({
    context_codes: contextCodes,
    start_date: startDate.toISOString(),
    end_date: now.toISOString(),
  });

  // Map to service type and sort by posted_at desc
  const items: AnnouncementItem[] = announcements.map((a) => {
    const courseIdNum = parseInt(a.context_code.replace("course_", ""), 10);
    return {
      id: a.id,
      title: a.title,
      message: a.message,
      posted_at: a.posted_at,
      course_id: courseIdNum,
      course_name: courseNameMap.get(a.context_code) || a.context_code,
      author_name: a.author.display_name,
      url: a.html_url,
    };
  });

  items.sort(
    (a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime(),
  );

  return items;
}
