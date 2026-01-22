/**
 * `canvas assignments` command
 * List assignments with various filters
 */

import { Command } from "@cliffy/command";
import { formatDate, output } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import { type AssignmentBucket, listAssignments } from "../services/index.ts";
import type { OutputFormat } from "../types/canvas.ts";

export const assignmentsCommand = new Command()
  .name("assignments")
  .description("List assignments with filters")
  .option("-f, --format <format:string>", "Output format (json or table)", {
    default: "json",
  })
  .option("-s, --student <id:string>", "Student ID (for observer accounts)", {
    default: "self",
  })
  .option("-c, --course-id <id:number>", "Filter by course ID (required unless --all-courses)")
  .option("--all-courses", "Fetch assignments from all courses")
  .option("--due-this-week", "Only show assignments due this week")
  .option("--upcoming [days:number]", "Only show upcoming assignments (default: 7 days)")
  .option(
    "--bucket <bucket:string>",
    "Filter by bucket: past, overdue, undated, ungraded, unsubmitted, upcoming, future",
  )
  .action(async (options) => {
    await ensureClient();
    const format = options.format as OutputFormat;
    const courseId = options.courseId;
    const allCourses = options.allCourses;

    if (!courseId && !allCourses) {
      console.error("Error: Either --course-id or --all-courses is required");
      Deno.exit(1);
    }

    const assignments = await listAssignments({
      courseId,
      allCourses,
      dueThisWeek: options.dueThisWeek,
      upcoming: options.upcoming !== undefined
        ? (typeof options.upcoming === "number" ? options.upcoming : 7)
        : undefined,
      bucket: options.bucket as AssignmentBucket | undefined,
    });

    output(assignments, format, {
      headers: ["Course", "Assignment", "Due Date", "Points", "Submitted", "URL"],
      rowMapper: (item) => [
        item.course_name,
        item.name,
        formatDate(item.due_at),
        item.points_possible,
        item.submitted ? "Yes" : "No",
        item.url,
      ],
    });
  });
