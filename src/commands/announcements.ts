/**
 * `canvas announcements` command
 * Show recent course announcements
 */

import { Command } from "@cliffy/command";
import { formatDate, output } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import { getAnnouncements } from "../services/index.ts";
import { getEffectiveStudentId } from "../api/users.ts";
import type { OutputFormat } from "../types/canvas.ts";

export const announcementsCommand = new Command()
  .name("announcements")
  .description("Show recent course announcements")
  .option("-f, --format <format:string>", "Output format (json or table)", {
    default: "json",
  })
  .option("-s, --student <id:string>", "Student ID (for observer accounts)")
  .option("-d, --days <days:number>", "Number of days to look back (default: 14)", {
    default: 14,
  })
  .option("--course-id <id:number>", "Filter to a specific course")
  .action(async (options) => {
    await ensureClient();
    const format = options.format as OutputFormat;
    const studentId = await getEffectiveStudentId(options.student);

    const items = await getAnnouncements({
      studentId: String(studentId),
      days: options.days,
      courseId: options.courseId,
    });

    output(items, format, {
      headers: ["Course", "Title", "Author", "Posted"],
      rowMapper: (item) => [
        item.course_name,
        item.title,
        item.author_name,
        formatDate(item.posted_at),
      ],
    });
  });
