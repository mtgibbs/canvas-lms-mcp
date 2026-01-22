/**
 * `canvas todo` command
 * Show planner items (to-do list) from Canvas
 */

import { Command } from "@cliffy/command";
import { getPlannerItems } from "../api/users.ts";
import { output, formatDate } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import type { OutputFormat, PlannerItem } from "../types/canvas.ts";

export const todoCommand = new Command()
  .name("todo")
  .description("Show planner items (to-do list)")
  .option("-f, --format <format:string>", "Output format (json or table)", {
    default: "json",
  })
  .option("-s, --student <id:string>", "Student ID (for observer accounts)", {
    default: "self",
  })
  .option("-d, --days <days:number>", "Number of days ahead to look (default: 7)", {
    default: 7,
  })
  .option("--start <date:string>", "Start date (yyyy-mm-dd)")
  .option("--end <date:string>", "End date (yyyy-mm-dd)")
  .option("--hide-submitted", "Hide items that have been submitted")
  .action(async (options) => {
    await ensureClient();
    const format = options.format as OutputFormat;
    const studentId = options.student;

    // Calculate date range
    const startDate = options.start || new Date().toISOString().split("T")[0];
    let endDate = options.end;
    if (!endDate) {
      const end = new Date();
      end.setDate(end.getDate() + options.days);
      endDate = end.toISOString().split("T")[0];
    }

    const items = await getPlannerItems({
      studentId,
      startDate,
      endDate,
    });

    // Filter out submitted items if requested
    let filteredItems = items;
    if (options.hideSubmitted) {
      filteredItems = items.filter((item) => !item.submissions?.submitted);
    }

    // Sort by due date
    filteredItems.sort((a, b) => {
      return new Date(a.plannable_date).getTime() - new Date(b.plannable_date).getTime();
    });

    // Transform for output
    const outputItems = filteredItems.map((item) => ({
      course_name: item.context_name,
      title: item.plannable.title,
      type: item.plannable_type,
      due_at: item.plannable_date,
      points: item.plannable.points_possible,
      submitted: item.submissions?.submitted || false,
      missing: item.submissions?.missing || false,
      graded: item.submissions?.graded || false,
      html_url: item.html_url,
    }));

    output(outputItems, format, {
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
          item.points ?? "-",
          status,
        ];
      },
    });
  });
