/**
 * `canvas feedback` command
 * Show teacher comments and feedback on student submissions
 */

import { Command } from "@cliffy/command";
import { formatDate, output } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import { getFeedback } from "../services/index.ts";
import { getEffectiveStudentId } from "../api/users.ts";
import type { OutputFormat } from "../types/canvas.ts";

export const feedbackCommand = new Command()
  .name("feedback")
  .description("Show teacher comments and feedback on student submissions")
  .option("-f, --format <format:string>", "Output format (json or table)", {
    default: "json",
  })
  .option("-s, --student <id:string>", "Student ID (for observer accounts)")
  .option("-c, --course-id <id:number>", "Filter to specific course")
  .option(
    "-d, --days <days:number>",
    "Look back N days for comments (default: 14)",
    { default: 14 },
  )
  .action(async (options) => {
    await ensureClient();
    const format = options.format as OutputFormat;
    const studentId = await getEffectiveStudentId(options.student);

    const feedback = await getFeedback({
      studentId: String(studentId),
      courseId: options.courseId,
      days: options.days,
    });

    if (format === "table") {
      output(feedback, "table", {
        headers: [
          "Course",
          "Assignment",
          "Author",
          "Comment",
          "Date",
          "Score",
          "Grade",
        ],
        rowMapper: (f) => [
          f.course_name,
          f.assignment_name,
          f.author_name,
          f.comment_text.length > 60 ? `${f.comment_text.slice(0, 60)}...` : f.comment_text,
          formatDate(f.comment_date),
          f.student_score !== null && f.points_possible !== null
            ? `${f.student_score}/${f.points_possible}`
            : "-",
          f.grade || "-",
        ],
      });
    } else {
      output(feedback, "json", {
        headers: [],
        rowMapper: () => [],
      });
    }
  });
