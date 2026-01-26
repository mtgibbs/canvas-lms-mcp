/**
 * `canvas inbox` command
 * Show Canvas inbox conversations
 */

import { Command } from "@cliffy/command";
import { formatDate, output } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import { getInbox } from "../services/index.ts";
import { getEffectiveStudentId } from "../api/users.ts";
import type { OutputFormat } from "../types/canvas.ts";

export const inboxCommand = new Command()
  .name("inbox")
  .description("Show Canvas inbox conversations")
  .option("-f, --format <format:string>", "Output format (json or table)", {
    default: "json",
  })
  .option("-s, --student <id:string>", "Student ID (for observer accounts)")
  .option(
    "--scope <scope:string>",
    "Message scope: inbox, unread, archived, starred, sent (default: inbox)",
    { default: "inbox" },
  )
  .option("--course-id <id:number>", "Filter to a specific course")
  .action(async (options) => {
    await ensureClient();
    const format = options.format as OutputFormat;
    const studentId = await getEffectiveStudentId(options.student);

    const items = await getInbox({
      studentId: String(studentId),
      scope: options.scope as "inbox" | "unread" | "archived" | "starred" | "sent",
      courseId: options.courseId,
    });

    output(items, format, {
      headers: ["Subject", "Participants", "Last Message", "Count", "Status"],
      rowMapper: (item) => [
        item.subject || "(no subject)",
        item.participants.join(", "),
        formatDate(item.last_message_at),
        item.message_count,
        item.workflow_state,
      ],
    });
  });
