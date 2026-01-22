/**
 * `canvas courses` command
 * List courses with current cumulative grades
 */

import { Command } from "@cliffy/command";
import { formatGrade, output } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import { getCourses } from "../services/index.ts";
import type { OutputFormat } from "../types/canvas.ts";

export const coursesCommand = new Command()
  .name("courses")
  .description("List all courses with current grades")
  .option("-f, --format <format:string>", "Output format (json or table)", {
    default: "json",
  })
  .option("-s, --student <id:string>", "Student ID (for observer accounts)", {
    default: "self",
  })
  .action(async (options) => {
    await ensureClient();
    const format = options.format as OutputFormat;

    const courses = await getCourses({ studentId: options.student });

    output(courses, format, {
      headers: ["ID", "Course", "Code", "Grade", "Score"],
      rowMapper: (course) => [
        course.id,
        course.name,
        course.course_code,
        formatGrade(course.current_grade, null),
        course.current_score !== null ? `${course.current_score}%` : "-",
      ],
    });
  });
