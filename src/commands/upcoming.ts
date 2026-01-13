/**
 * `canvas upcoming` command
 * Show upcoming assignments and events
 */

import { Command } from "@cliffy/command";
import { getUpcomingEvents } from "../api/users.ts";
import { output, formatDate } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import type { OutputFormat, UpcomingEvent } from "../types/canvas.ts";

export const upcomingCommand = new Command()
  .name("upcoming")
  .description("Show upcoming assignments and calendar events")
  .option("-f, --format <format:string>", "Output format (json or table)", {
    default: "json",
  })
  .option("-s, --student <id:string>", "Student ID (for observer accounts)", {
    default: "self",
  })
  .option("--days <days:number>", "Only show events within N days", {
    default: 14,
  })
  .option("--type <type:string>", "Filter by type: assignment or event")
  .action(async (options) => {
    await ensureClient();
    const format = options.format as OutputFormat;
    const studentId = options.student;
    const days = options.days;
    const typeFilter = options.type;

    let events = await getUpcomingEvents(studentId);

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
    events.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

    // Extract course name from context_code (format: "course_12345")
    const eventsWithCourse = events.map((event) => {
      const courseMatch = event.context_code?.match(/course_(\d+)/);
      return {
        ...event,
        _course_id: courseMatch ? parseInt(courseMatch[1], 10) : null,
      };
    });

    output(eventsWithCourse, format, {
      headers: ["Type", "Title", "Start", "Course ID", "URL"],
      rowMapper: (item: UpcomingEvent & { _course_id: number | null }) => [
        item.type,
        item.title,
        formatDate(item.start_at),
        item._course_id,
        item.html_url,
      ],
    });
  });
