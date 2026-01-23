/**
 * `canvas todo` command
 * Show planner items (to-do list) from Canvas
 */

import { Command } from "@cliffy/command";
import { formatDate, output } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import { getTodoItems } from "../services/index.ts";
import { getEffectiveStudentId } from "../api/users.ts";
import type { OutputFormat } from "../types/canvas.ts";

export const todoCommand = new Command()
  .name("todo")
  .description("Show planner items (to-do list)")
  .option("-f, --format <format:string>", "Output format (json or table)", {
    default: "json",
  })
  .option("-s, --student <id:string>", "Student ID (for observer accounts)")
  .option("-d, --days <days:number>", "Number of days ahead to look (default: 7)", {
    default: 7,
  })
  .option("--start <date:string>", "Start date (yyyy-mm-dd)")
  .option("--end <date:string>", "End date (yyyy-mm-dd)")
  .option("--hide-submitted", "Hide items that have been submitted")
  .action(async (options) => {
    await ensureClient();
    const format = options.format as OutputFormat;
    const studentId = await getEffectiveStudentId(options.student);

    const items = await getTodoItems({
      studentId: String(studentId),
      days: options.days,
      startDate: options.start,
      endDate: options.end,
      hideSubmitted: options.hideSubmitted,
    });

    output(items, format, {
      headers: ["Course", "Title", "Type", "Due", "Points", "Status"],
      rowMapper: (item) => {
        let status = "pending";
        if (item.submitted) status = item.graded ? "graded" : "submitted";
        else if (item.missing) status = "MISSING";

        return [
          item.course_name,
          item.title,
          item.type,
          formatDate(item.due_at),
          item.points_possible ?? "-",
          status,
        ];
      },
    });
  });
