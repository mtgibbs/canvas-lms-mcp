/**
 * `canvas discussions` command
 * Show discussion topics across courses with participation status
 */

import { Command } from "@cliffy/command";
import { formatDate, output } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import { getDiscussions } from "../services/index.ts";
import { getEffectiveStudentId } from "../api/users.ts";
import type { OutputFormat } from "../types/canvas.ts";

export const discussionsCommand = new Command()
  .name("discussions")
  .description("Show discussion topics with participation status")
  .option("-f, --format <format:string>", "Output format (json or table)", {
    default: "json",
  })
  .option("-s, --student <id:string>", "Student ID (for observer accounts)")
  .option("-d, --days <days:number>", "Number of days to look back (default: 30)", {
    default: 30,
  })
  .option("--course-id <id:number>", "Filter to a specific course")
  .action(async (options) => {
    await ensureClient();
    const format = options.format as OutputFormat;
    const studentId = await getEffectiveStudentId(options.student);

    const items = await getDiscussions({
      studentId: String(studentId),
      days: options.days,
      courseId: options.courseId,
    });

    output(items, format, {
      headers: ["Course", "Title", "Type", "Replies", "Unread", "Graded", "Posted"],
      rowMapper: (item) => [
        item.course_name,
        item.title,
        item.discussion_type,
        item.reply_count.toString(),
        item.unread_count.toString(),
        item.is_graded ? "Yes" : "No",
        formatDate(item.posted_at),
      ],
    });
  });
