/**
 * `canvas stats` command
 * Show late/missing assignment statistics by course
 */

import { Command } from "@cliffy/command";
import { output } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import { getStats, type CourseStats } from "../services/index.ts";
import type { OutputFormat } from "../types/canvas.ts";

export const statsCommand = new Command()
  .name("stats")
  .description("Show late/missing assignment statistics by course")
  .option("-f, --format <format:string>", "Output format (json or table)", {
    default: "table",
  })
  .option("-s, --student <id:string>", "Student ID (for observer accounts)", {
    default: "self",
  })
  .option("--hide-empty", "Hide courses with no assignments")
  .action(async (options) => {
    await ensureClient();
    const format = options.format as OutputFormat;

    const stats = await getStats({
      studentId: options.student,
      hideEmpty: options.hideEmpty,
    });

    output(stats, format, {
      headers: ["Course", "Total", "Late", "Missing", "Late%", "Missing%"],
      rowMapper: (s: CourseStats) => [
        s.course_name.substring(0, 35),
        s.total,
        s.late,
        s.missing,
        `${s.late_pct}%`,
        `${s.missing_pct}%`,
      ],
    });
  });
