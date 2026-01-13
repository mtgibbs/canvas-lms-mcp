/**
 * `canvas assignments` command
 * List assignments with various filters
 */

import { Command } from "@cliffy/command";
import { listCourses } from "../api/courses.ts";
import {
  listAssignments,
  listAssignmentsDueThisWeek,
  listUpcomingAssignments,
} from "../api/assignments.ts";
import { output, formatDate } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import type { OutputFormat, Assignment } from "../types/canvas.ts";

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
    "Filter by bucket: past, overdue, undated, ungraded, unsubmitted, upcoming, future"
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

    let assignments: Assignment[] = [];

    if (allCourses) {
      // Fetch from all courses
      const courses = await listCourses({
        enrollment_state: "active",
        state: ["available"],
      });

      for (const course of courses) {
        let courseAssignments: Assignment[];

        if (options.dueThisWeek) {
          courseAssignments = await listAssignmentsDueThisWeek(course.id);
        } else if (options.upcoming !== undefined) {
          const days = typeof options.upcoming === "number" ? options.upcoming : 7;
          courseAssignments = await listUpcomingAssignments(course.id, days);
        } else {
          courseAssignments = await listAssignments({
            course_id: course.id,
            bucket: options.bucket as
              | "past"
              | "overdue"
              | "undated"
              | "ungraded"
              | "unsubmitted"
              | "upcoming"
              | "future"
              | undefined,
            include: ["submission"],
            order_by: "due_at",
          });
        }

        // Add course name to each assignment for context
        assignments.push(
          ...courseAssignments.map((a) => ({
            ...a,
            _course_name: course.name,
          }))
        );
      }
    } else {
      // Fetch from specific course
      if (options.dueThisWeek) {
        assignments = await listAssignmentsDueThisWeek(courseId!);
      } else if (options.upcoming !== undefined) {
        const days = typeof options.upcoming === "number" ? options.upcoming : 7;
        assignments = await listUpcomingAssignments(courseId!, days);
      } else {
        assignments = await listAssignments({
          course_id: courseId!,
          bucket: options.bucket as
            | "past"
            | "overdue"
            | "undated"
            | "ungraded"
            | "unsubmitted"
            | "upcoming"
            | "future"
            | undefined,
          include: ["submission"],
          order_by: "due_at",
        });
      }
    }

    // Sort by due date
    assignments.sort((a, b) => {
      if (!a.due_at) return 1;
      if (!b.due_at) return -1;
      return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
    });

    output(assignments, format, {
      headers: ["Course", "Assignment", "Due Date", "Points", "Submitted", "URL"],
      rowMapper: (item: Assignment & { _course_name?: string }) => [
        item._course_name || `Course ${item.course_id}`,
        item.name,
        formatDate(item.due_at),
        item.points_possible,
        item.submission?.submitted_at ? "Yes" : "No",
        item.html_url,
      ],
    });
  });
