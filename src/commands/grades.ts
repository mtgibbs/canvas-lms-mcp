/**
 * `canvas grades` command
 * List submissions with grades
 */

import { Command } from "@cliffy/command";
import { listCourses } from "../api/courses.ts";
import { listGradedSubmissions } from "../api/submissions.ts";
import { output, isGradeBelow } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import type { OutputFormat, Submission } from "../types/canvas.ts";

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
    "Only show grades below threshold (e.g., 'B' or '80')"
  )
  .action(async (options) => {
    await ensureClient();
    const format = options.format as OutputFormat;
    const studentId = options.student;
    const courseId = options.courseId;
    const allCourses = options.allCourses;
    const belowThreshold = options.below;

    if (!courseId && !allCourses) {
      console.error("Error: Either --course-id or --all-courses is required");
      Deno.exit(1);
    }

    let submissions: (Submission & { _course_name?: string })[] = [];

    if (allCourses) {
      // Fetch from all courses
      const courses = await listCourses({
        enrollment_state: "active",
        state: ["available"],
      });

      for (const course of courses) {
        const courseSubmissions = await listGradedSubmissions(course.id, studentId);
        submissions.push(
          ...courseSubmissions.map((s) => ({
            ...s,
            _course_name: course.name,
          }))
        );
      }
    } else {
      // Fetch from specific course
      submissions = await listGradedSubmissions(courseId!, studentId);
    }

    // Filter by threshold if specified
    if (belowThreshold) {
      submissions = submissions.filter((sub) => {
        // Calculate percentage score
        let percentage: number | null = null;
        if (sub.score !== null && sub.assignment?.points_possible) {
          percentage = (sub.score / sub.assignment.points_possible) * 100;
        }

        return isGradeBelow(sub.grade, percentage, belowThreshold);
      });
    }

    // Transform for output
    const gradesData = submissions.map((sub) => ({
      course_id: sub.assignment?.course_id || 0,
      course_name: sub._course_name || `Course ${sub.assignment?.course_id}`,
      assignment_id: sub.assignment_id,
      assignment_name: sub.assignment?.name || "Unknown",
      grade: sub.grade,
      score: sub.score,
      points_possible: sub.assignment?.points_possible || 0,
      percentage:
        sub.score !== null && sub.assignment?.points_possible
          ? Math.round((sub.score / sub.assignment.points_possible) * 100)
          : null,
      late: sub.late,
      missing: sub.missing,
    }));

    output(gradesData, format, {
      headers: ["Course", "Assignment", "Grade", "Score", "Points", "%", "Late"],
      rowMapper: (item: (typeof gradesData)[0]) => [
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
