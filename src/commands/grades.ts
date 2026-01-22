/**
 * `canvas grades` command
 * List submissions with grades
 */

import { Command } from "@cliffy/command";
import { isGradeBelow, output } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import { getRecentGrades } from "../services/index.ts";
import type { OutputFormat } from "../types/canvas.ts";

export const gradesCommand = new Command()
  .name("grades")
  .description("List submissions with grades")
  .option("-f, --format <format:string>", "Output format (json or table)", {
    default: "json",
  })
  .option("-s, --student <id:string>", "Student ID (for observer accounts)", {
    default: "self",
  })
  .option("-c, --course-id <id:number>", "Filter by course ID")
  .option("--all-courses", "Fetch grades from all courses")
  .option(
    "--below <threshold:string>",
    "Only show grades below threshold (e.g., 'B' or '80')",
  )
  .option("--days <days:number>", "Only show grades from the last N days")
  .action(async (options) => {
    await ensureClient();
    const format = options.format as OutputFormat;

    if (!options.courseId && !options.allCourses) {
      console.error("Error: Either --course-id or --all-courses is required");
      Deno.exit(1);
    }

    let grades = await getRecentGrades({
      studentId: options.student,
      days: options.days,
      courseId: options.courseId,
    });

    // Filter by letter grade threshold if specified (e.g., "B")
    if (options.below) {
      const threshold = options.below;
      grades = grades.filter((g) => {
        return isGradeBelow(g.grade, g.percentage, threshold);
      });
    }

    output(grades, format, {
      headers: ["Course", "Assignment", "Grade", "Score", "Points", "%", "Late"],
      rowMapper: (item) => [
        item.course_name,
        item.assignment_name,
        item.grade || "-",
        item.score ?? "-",
        item.points_possible,
        item.percentage !== null ? `${item.percentage}%` : "-",
        item.late ? "Yes" : "No",
      ],
    });
  });
