/**
 * `canvas courses` command
 * List courses with current cumulative grades
 */

import { Command } from "@cliffy/command";
import { listCoursesWithGrades } from "../api/courses.ts";
import { output, formatGrade } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import type { OutputFormat, CourseWithGrade } from "../types/canvas.ts";

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
    const studentId = options.student;

    const courses = await listCoursesWithGrades(studentId);

    // Transform to a cleaner output format
    const coursesWithGrades: CourseWithGrade[] = courses.map((course) => ({
      id: course.id,
      name: course.name,
      course_code: course.course_code,
      current_grade: course.enrollment?.grades?.current_grade || null,
      current_score: course.enrollment?.grades?.current_score || null,
      final_grade: course.enrollment?.grades?.final_grade || null,
      final_score: course.enrollment?.grades?.final_score || null,
    }));

    output(coursesWithGrades, format, {
      headers: ["ID", "Course", "Code", "Grade", "Score"],
      rowMapper: (course: CourseWithGrade) => [
        course.id,
        course.name,
        course.course_code,
        formatGrade(course.current_grade, null),
        course.current_score !== null ? `${course.current_score}%` : "-",
      ],
    });
  });
