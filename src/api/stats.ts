/**
 * Student statistics API
 * Calculates late/missing assignment statistics by course
 */

import { listCourses } from "./courses.ts";
import { listSubmissions } from "./submissions.ts";
import { getMissingSubmissions } from "./users.ts";

export interface CourseStats {
  course_id: number;
  course_name: string;
  total: number;
  late: number;
  missing: number;
  late_pct: number;
  missing_pct: number;
}

export async function getStudentStats(studentId: string | number): Promise<CourseStats[]> {
  const courses = await listCourses({
    enrollment_state: "active",
    state: ["available"],
  });

  // Get missing assignments from Canvas
  const missing = await getMissingSubmissions({
    studentId,
    include: ["course"],
  });

  // Count missing by course
  const missingByCourse = new Map<number, number>();
  for (const m of missing) {
    missingByCourse.set(m.course_id, (missingByCourse.get(m.course_id) || 0) + 1);
  }

  const stats: CourseStats[] = [];

  for (const course of courses) {
    try {
      const subs = await listSubmissions({
        course_id: course.id,
        student_ids: [Number(studentId)],
        include: ["assignment"],
      });

      let total = 0;
      let late = 0;

      for (const sub of subs) {
        if (sub.assignment === null || sub.assignment === undefined) continue;
        total++;
        if (sub.late) late++;
      }

      const missingCount = missingByCourse.get(course.id) || 0;

      stats.push({
        course_id: course.id,
        course_name: course.name,
        total,
        late,
        missing: missingCount,
        late_pct: total > 0 ? Math.round((late / total) * 1000) / 10 : 0,
        missing_pct: total > 0 ? Math.round((missingCount / total) * 1000) / 10 : 0,
      });
    } catch {
      // Skip courses we can't access
    }
  }

  // Sort by missing percentage descending (worst first)
  stats.sort((a, b) => b.missing_pct - a.missing_pct || b.late_pct - a.late_pct);

  return stats;
}
