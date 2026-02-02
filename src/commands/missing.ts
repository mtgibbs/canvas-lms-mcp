/**
 * `canvas missing` command
 * List all missing/past-due assignments
 */

import { Command } from "@cliffy/command";
import { formatDate, output } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import {
  getMissingAssignments,
  getMissingCountsByCourse,
  getUnsubmittedAssignments,
} from "../services/index.ts";
import { getEffectiveStudentId } from "../api/users.ts";
import type { OutputFormat } from "../types/canvas.ts";

export const missingCommand = new Command()
  .name("missing")
  .description(
    "List missing/past-due assignments (current grading period by default)",
  )
  .option("-f, --format <format:string>", "Output format (json or table)", {
    default: "json",
  })
  .option("-s, --student <id:string>", "Student ID (for observer accounts)")
  .option("-c, --course-id <id:number>", "Filter by course ID")
  .option(
    "--summary",
    "Show summary count by course instead of individual assignments",
  )
  .option(
    "--include-unsubmitted",
    "Also include unsubmitted past-due assignments not yet flagged as missing",
  )
  .option(
    "--all-grading-periods",
    "Include assignments from all grading periods (default: current period only)",
  )
  .action(async (options) => {
    await ensureClient();
    const format = options.format as OutputFormat;
    const studentId = await getEffectiveStudentId(options.student);

    if (options.summary) {
      // Show summary counts by course
      const counts = await getMissingCountsByCourse({
        studentId: String(studentId),
        courseId: options.courseId,
        allGradingPeriods: options.allGradingPeriods,
      });

      output(counts, format, {
        headers: ["Course ID", "Course Name", "Missing Count"],
        rowMapper: (item) => [item.course_id, item.course_name, item.count],
      });
      return;
    }

    // Get Canvas-flagged missing submissions
    const missing = await getMissingAssignments({
      studentId: String(studentId),
      courseId: options.courseId,
      allGradingPeriods: options.allGradingPeriods,
    });

    // Convert to common format for output
    type OutputItem = {
      course_name: string;
      course_id: number;
      name: string;
      due_at: string | null;
      points_possible: number | null;
      url: string;
      source: "missing" | "unsubmitted";
    };

    const results: OutputItem[] = missing.map((item) => ({
      course_name: item.course_name,
      course_id: item.course_id,
      name: item.name,
      due_at: item.due_at,
      points_possible: item.points_possible,
      url: item.url,
      source: "missing" as const,
    }));

    // If --include-unsubmitted, also add unsubmitted past-due assignments
    if (options.includeUnsubmitted) {
      const unsubmitted = await getUnsubmittedAssignments({
        studentId: String(studentId),
        courseId: options.courseId,
        allGradingPeriods: options.allGradingPeriods,
      });

      // Dedupe by course_id + name
      const existingIds = new Set(results.map((r) => `${r.course_id}-${r.name}`));

      for (const item of unsubmitted) {
        const key = `${item.course_id}-${item.name}`;
        if (!existingIds.has(key)) {
          results.push({
            course_name: item.course_name,
            course_id: item.course_id,
            name: item.name,
            due_at: item.due_at,
            points_possible: item.points_possible,
            url: item.url || "",
            source: "unsubmitted",
          });
          existingIds.add(key);
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
        item.points_possible ?? "-",
        item.url,
      ],
    });
  });
