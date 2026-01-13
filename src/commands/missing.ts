/**
 * `canvas missing` command
 * List all missing/past-due assignments
 */

import { Command } from "@cliffy/command";
import { getMissingSubmissions, getMissingCountsByCourse } from "../api/users.ts";
import { listUnsubmittedPastDueForStudent } from "../api/submissions.ts";
import { listCourses } from "../api/courses.ts";
import { output, formatDate } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import type { OutputFormat, MissingSubmission } from "../types/canvas.ts";

export const missingCommand = new Command()
  .name("missing")
  .description("List all missing/past-due assignments")
  .option("-f, --format <format:string>", "Output format (json or table)", {
    default: "json",
  })
  .option("-s, --student <id:string>", "Student ID (for observer accounts)", {
    default: "self",
  })
  .option("-c, --course-id <id:number>", "Filter by course ID")
  .option("--summary", "Show summary count by course instead of individual assignments")
  .option(
    "--include-unsubmitted",
    "Also include unsubmitted past-due assignments not yet flagged as missing"
  )
  .action(async (options) => {
    await ensureClient();
    const format = options.format as OutputFormat;
    const studentId = options.student;
    const courseId = options.courseId;

    if (options.summary) {
      // Show summary counts by course
      const counts = await getMissingCountsByCourse({
        studentId,
        courseIds: courseId ? [courseId] : undefined,
      });

      const summaryData = Array.from(counts.entries()).map(([id, data]) => ({
        course_id: id,
        course_name: data.courseName,
        missing_count: data.count,
      }));

      output(summaryData, format, {
        headers: ["Course ID", "Course Name", "Missing Count"],
        rowMapper: (item: { course_id: number; course_name: string; missing_count: number }) => [
          item.course_id,
          item.course_name,
          item.missing_count,
        ],
      });
      return;
    }

    // Get Canvas-flagged missing submissions
    const missing = await getMissingSubmissions({
      studentId,
      courseIds: courseId ? [courseId] : undefined,
      include: ["course"],
    });

    // Convert to common format for output
    type OutputItem = {
      course_name: string;
      course_id: number;
      name: string;
      due_at: string | null;
      points_possible: number | null;
      html_url: string;
      source: "missing" | "unsubmitted";
    };

    const results: OutputItem[] = missing.map((item) => ({
      course_name: item.course?.name || `Course ${item.course_id}`,
      course_id: item.course_id,
      name: item.name,
      due_at: item.due_at,
      points_possible: item.points_possible,
      html_url: item.html_url,
      source: "missing" as const,
    }));

    // If --include-unsubmitted, also check for unsubmitted past-due assignments
    // This uses the submissions endpoint to get the student's actual submission status
    if (options.includeUnsubmitted) {
      const courseIds: number[] = [];

      if (courseId) {
        courseIds.push(courseId);
      } else {
        // Get all courses
        const courses = await listCourses({
          enrollment_state: "active",
          state: ["available"],
        });
        courseIds.push(...courses.map((c) => c.id));
      }

      // Get unsubmitted past-due for each course
      const existingIds = new Set(results.map((r) => `${r.course_id}-${r.name}`));

      for (const cid of courseIds) {
        try {
          const unsubmitted = await listUnsubmittedPastDueForStudent(cid, studentId);
          for (const sub of unsubmitted) {
            const assignment = sub.assignment;
            if (!assignment) continue;

            // Skip if already in missing list
            const key = `${assignment.course_id}-${assignment.name}`;
            if (existingIds.has(key)) continue;

            results.push({
              course_name: `Course ${assignment.course_id}`,
              course_id: assignment.course_id,
              name: assignment.name,
              due_at: assignment.due_at,
              points_possible: assignment.points_possible,
              html_url: assignment.html_url,
              source: "unsubmitted",
            });
            existingIds.add(key);
          }
        } catch {
          // Skip courses we can't access
        }
      }
    }

    // Sort by due date (most recent first)
    results.sort((a, b) => {
      if (!a.due_at || !b.due_at) return 0;
      return new Date(b.due_at).getTime() - new Date(a.due_at).getTime();
    });

    output(results, format, {
      headers: ["Course", "Assignment", "Due Date", "Points", "URL"],
      rowMapper: (item: OutputItem) => [
        item.course_name,
        item.name,
        formatDate(item.due_at),
        item.points_possible,
        item.html_url,
      ],
    });
  });
