/**
 * `canvas communications` command
 * Show all recent teacher communications (announcements + inbox)
 */

import { Command } from "@cliffy/command";
import { formatDate, output, outputTable } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import { getTeacherCommunications } from "../services/index.ts";
import { getEffectiveStudentId } from "../api/users.ts";
import type { OutputFormat } from "../types/canvas.ts";

export const communicationsCommand = new Command()
  .name("communications")
  .description(
    "Show all recent teacher communications (announcements and inbox messages)",
  )
  .option("-f, --format <format:string>", "Output format (json or table)", {
    default: "json",
  })
  .option("-s, --student <id:string>", "Student ID (for observer accounts)")
  .option(
    "-d, --days <days:number>",
    "Number of days to look back for announcements (default: 7)",
    {
      default: 7,
    },
  )
  .option("--course-id <id:number>", "Filter to a specific course")
  .action(async (options) => {
    await ensureClient();
    const format = options.format as OutputFormat;
    const studentId = await getEffectiveStudentId(options.student);

    const result = await getTeacherCommunications({
      studentId: String(studentId),
      days: options.days,
      courseId: options.courseId,
    });

    if (format === "json") {
      output(result, format);
      return;
    }

    // Table format: two sections
    console.log("\n  ANNOUNCEMENTS\n");
    if (result.announcements.length === 0) {
      console.log("  No recent announcements.\n");
    } else {
      outputTable(
        ["Course", "Title", "Author", "Posted"],
        result.announcements.map((item) => [
          item.course_name,
          item.title,
          item.author_name,
          formatDate(item.posted_at),
        ]),
      );
    }

    console.log("\n  INBOX MESSAGES\n");
    if (result.inbox.length === 0) {
      console.log("  No inbox messages.\n");
    } else {
      outputTable(
        ["Subject", "Participants", "Last Message", "Status"],
        result.inbox.map((item) => [
          item.subject || "(no subject)",
          item.participants.join(", "),
          formatDate(item.last_message_at),
          item.workflow_state,
        ]),
      );
    }
  });
