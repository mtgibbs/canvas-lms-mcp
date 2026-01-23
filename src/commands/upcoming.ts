/**
 * `canvas upcoming` command
 * Show upcoming assignments and events
 */

import { Command } from "@cliffy/command";
import { formatDate, output } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import { getUpcomingEvents } from "../services/index.ts";
import { getEffectiveStudentId } from "../api/users.ts";
import type { OutputFormat } from "../types/canvas.ts";

export const upcomingCommand = new Command()
  .name("upcoming")
  .description("Show upcoming assignments and calendar events")
  .option("-f, --format <format:string>", "Output format (json or table)", {
    default: "json",
  })
  .option("-s, --student <id:string>", "Student ID (for observer accounts)")
  .option("--days <days:number>", "Only show events within N days", {
    default: 14,
  })
  .option("--type <type:string>", "Filter by type: assignment or event")
  .action(async (options) => {
    await ensureClient();
    const format = options.format as OutputFormat;
    const studentId = await getEffectiveStudentId(options.student);

    const events = await getUpcomingEvents({
      studentId: String(studentId),
      days: options.days,
      typeFilter: options.type as "assignment" | "event" | undefined,
    });

    output(events, format, {
      headers: ["Type", "Title", "Start", "Course ID", "URL"],
      rowMapper: (item) => [
        item.type,
        item.title,
        formatDate(item.start_at),
        item.course_id,
        item.url,
      ],
    });
  });
