/**
 * `canvas status` command
 * Comprehensive academic status overview
 */

import { Command } from "@cliffy/command";
import { output } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import { getComprehensiveStatus } from "../services/index.ts";
import { getEffectiveStudentId } from "../api/users.ts";
import type { OutputFormat } from "../types/canvas.ts";

export const statusCommand = new Command()
  .name("status")
  .description(
    "Comprehensive academic status: grades, missing work, upcoming, and recent low grades",
  )
  .option("-f, --format <format:string>", "Output format (json or table)", {
    default: "json",
  })
  .option("-s, --student <id:string>", "Student ID (for observer accounts)")
  .option(
    "--days-upcoming <days:number>",
    "Days to look ahead for upcoming assignments",
    { default: 7 },
  )
  .option(
    "--days-grades <days:number>",
    "Days to look back for recent grades",
    { default: 14 },
  )
  .option(
    "--threshold <percent:number>",
    "Percentage threshold for flagging low grades",
    { default: 70 },
  )
  .action(async (options) => {
    await ensureClient();
    const format = options.format as OutputFormat;
    const studentId = await getEffectiveStudentId(options.student);

    const statusData = await getComprehensiveStatus({
      studentId: String(studentId),
      daysUpcoming: options.daysUpcoming,
      daysGrades: options.daysGrades,
      lowGradeThreshold: options.threshold,
    });

    if (format === "table") {
      // Print summary
      console.log("\n=== ACADEMIC STATUS ===\n");
      console.log(`Courses: ${statusData.summary.total_courses}`);
      console.log(
        `Missing assignments: ${statusData.summary.missing_assignments}`,
      );
      console.log(
        `Upcoming (next ${options.daysUpcoming} days): ${statusData.summary.upcoming_assignments}`,
      );
      console.log(
        `Low grades (last ${options.daysGrades} days, <${options.threshold}%): ${statusData.summary.recent_low_grades}`,
      );

      // Courses with grades
      console.log("\n--- CURRENT GRADES ---");
      output(statusData.courses, "table", {
        headers: ["Course", "Score", "Grade"],
        rowMapper: (c) => [
          c.name,
          c.current_score !== null ? `${c.current_score}%` : "-",
          c.current_grade || "-",
        ],
      });

      // Missing
      if (statusData.missing_assignments.length > 0) {
        console.log("\n--- MISSING ASSIGNMENTS ---");
        output(statusData.missing_assignments, "table", {
          headers: ["Course", "Assignment", "Due", "Points"],
          rowMapper: (m) => [
            m.course_name,
            m.name,
            m.due_at ? new Date(m.due_at).toLocaleDateString() : "-",
            m.points_possible ?? "-",
          ],
        });
      }

      // Upcoming
      if (statusData.upcoming_assignments.length > 0) {
        console.log("\n--- UPCOMING ASSIGNMENTS ---");
        output(statusData.upcoming_assignments, "table", {
          headers: ["Course", "Assignment", "Due", "Points", "Submitted"],
          rowMapper: (u) => [
            u.course_name,
            u.assignment_name,
            new Date(u.due_at).toLocaleDateString(),
            u.points_possible ?? "-",
            u.submitted ? "Yes" : "No",
          ],
        });
      }

      // Low grades
      if (statusData.recent_low_grades.length > 0) {
        console.log("\n--- RECENT LOW GRADES ---");
        output(statusData.recent_low_grades, "table", {
          headers: ["Course", "Assignment", "Score", "Points", "%"],
          rowMapper: (g) => [
            g.course_name,
            g.assignment_name,
            g.score ?? "-",
            g.points_possible,
            g.percentage !== null ? `${g.percentage}%` : "-",
          ],
        });
      }
    } else {
      output(statusData, "json", {
        headers: [],
        rowMapper: () => [],
      });
    }
  });
