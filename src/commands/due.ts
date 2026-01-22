/**
 * `canvas due` command
 * Get all assignments due in the next N days across ALL courses
 */

import { Command } from "@cliffy/command";
import { output } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import { getDueAssignments } from "../services/index.ts";
import type { OutputFormat } from "../types/canvas.ts";

export const dueCommand = new Command()
  .name("due")
  .description("List assignments due in the next N days across ALL courses")
  .option("-f, --format <format:string>", "Output format (json or table)", {
    default: "json",
  })
  .option("-s, --student <id:string>", "Student ID (for observer accounts)", {
    default: "self",
  })
  .option("--days <days:number>", "Number of days to look ahead", {
    default: 7,
  })
  .option("--hide-graded", "Hide assignments that have already been graded", {
    default: true,
  })
  .option("--show-graded", "Show assignments even if already graded")
  .action(async (options) => {
    await ensureClient();
    const format = options.format as OutputFormat;
    const hideGraded = options.showGraded ? false : options.hideGraded;

    const results = await getDueAssignments({
      studentId: options.student,
      days: options.days,
      hideGraded,
    });

    output(results, format, {
      headers: ["Course", "Assignment", "Due", "Points", "Submitted", "Grade"],
      rowMapper: (item) => [
        item.course_name,
        item.assignment_name,
        new Date(item.due_at).toLocaleDateString(),
        item.points_possible ?? "-",
        item.submitted ? "Yes" : "No",
        item.grade || "-",
      ],
    });
  });
