/**
 * `canvas calendar` command
 * Show non-assignment calendar events (office hours, review sessions, school events, field trips)
 */

import { Command } from "@cliffy/command";
import { formatDate, output } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import { getCalendarEvents } from "../services/index.ts";
import { getEffectiveStudentId } from "../api/users.ts";
import type { OutputFormat } from "../types/canvas.ts";

export const calendarCommand = new Command()
  .name("calendar")
  .description("Show upcoming calendar events (non-assignment events)")
  .option("-f, --format <format:string>", "Output format (json or table)", {
    default: "json",
  })
  .option("-s, --student <id:string>", "Student ID (for observer accounts)")
  .option("-d, --days <days:number>", "Number of days to look ahead (default: 14)", {
    default: 14,
  })
  .option("--course-id <id:number>", "Filter to a specific course")
  .action(async (options) => {
    await ensureClient();
    const format = options.format as OutputFormat;
    const studentId = await getEffectiveStudentId(options.student);

    const items = await getCalendarEvents({
      studentId: String(studentId),
      days: options.days,
      courseId: options.courseId,
    });

    output(items, format, {
      headers: ["Course", "Title", "Start", "Location"],
      rowMapper: (item) => [
        item.course_name,
        item.title,
        formatDate(item.start_at),
        item.location_name || "-",
      ],
    });
  });
