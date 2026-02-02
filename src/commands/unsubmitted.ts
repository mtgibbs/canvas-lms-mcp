/**
 * `canvas unsubmitted` command
 * Get assignments that are past due but not submitted
 */

import { Command } from "@cliffy/command";
import { output } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import { getUnsubmittedAssignments } from "../services/index.ts";
import { getEffectiveStudentId } from "../api/users.ts";
import type { OutputFormat } from "../types/canvas.ts";

export const unsubmittedCommand = new Command()
  .name("unsubmitted")
  .description(
    "List past-due unsubmitted assignments (current grading period by default)",
  )
  .option("-f, --format <format:string>", "Output format (json or table)", {
    default: "json",
  })
  .option("-s, --student <id:string>", "Student ID (for observer accounts)")
  .option("-c, --course-id <id:number>", "Filter by specific course ID")
  .option(
    "--all-grading-periods",
    "Include assignments from all grading periods (default: current period only)",
  )
  .action(async (options) => {
    await ensureClient();
    const format = options.format as OutputFormat;
    const studentId = await getEffectiveStudentId(options.student);

    const results = await getUnsubmittedAssignments({
      studentId: String(studentId),
      courseId: options.courseId,
      allGradingPeriods: options.allGradingPeriods,
    });

    output(results, format, {
      headers: ["Course", "Assignment", "Due", "Points"],
      rowMapper: (item) => [
        item.course_name,
        item.name,
        item.due_at ? new Date(item.due_at).toLocaleDateString() : "-",
        item.points_possible ?? "-",
      ],
    });
  });
