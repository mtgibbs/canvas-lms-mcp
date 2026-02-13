/**
 * People Service
 * Shows teachers and teaching assistants for courses
 *
 * Used by:
 * - CLI: `canvas people`
 * - MCP: `get_people`
 */

import { listCoursesWithGrades } from "../api/courses.ts";
import { listCourseUsers } from "../api/people.ts";
import type { PersonItem } from "./types.ts";
import type { User } from "../types/canvas.ts";

export interface GetPeopleOptions {
  studentId?: string;
  courseId?: number;
}

/**
 * Get teachers and TAs for courses
 * When fetching across all courses, deduplicates people who appear in multiple courses
 *
 * @param options - Configuration for fetching people
 * @returns List of people with their roles and courses
 */
export async function getPeople(
  options: GetPeopleOptions,
): Promise<PersonItem[]> {
  const { studentId, courseId } = options;

  let coursesToFetch: Array<{ id: number; name: string }>;

  if (courseId) {
    // Fetch from specific course - need to get course name
    const allCourses = studentId
      ? await listCoursesWithGrades(studentId)
      : await listCoursesWithGrades("self");
    const course = allCourses.find((c) => c.id === courseId);
    if (!course) {
      throw new Error(`Course ${courseId} not found or not accessible`);
    }
    coursesToFetch = [{ id: course.id, name: course.name }];
  } else {
    // Fetch from all active courses
    const allCourses = studentId
      ? await listCoursesWithGrades(studentId)
      : await listCoursesWithGrades("self");
    coursesToFetch = allCourses.map((c) => ({ id: c.id, name: c.name }));
  }

  // Fetch users from all courses in parallel
  const peoplePromises = coursesToFetch.map(async (course) => {
    try {
      const users = await listCourseUsers(course.id, ["teacher", "ta"]);
      return users.map((user) => ({
        user,
        courseId: course.id,
        courseName: course.name,
      }));
    } catch {
      return [];
    }
  });

  const allPeopleWithCourses = (await Promise.all(peoplePromises)).flat();

  // Deduplicate people across courses
  // Group by user ID
  const peopleMap = new Map<
    number,
    {
      user: User;
      courses: Array<{ id: number; name: string }>;
      role: "Teacher" | "TA";
    }
  >();

  for (const { user, courseId, courseName } of allPeopleWithCourses) {
    if (!user.id) continue;

    // Determine role from enrollments
    const enrollment = user.enrollments?.[0];
    const role = enrollment?.type === "TaEnrollment" ? "TA" : "Teacher";

    if (peopleMap.has(user.id)) {
      // Add course to existing person
      const existing = peopleMap.get(user.id)!;
      if (!existing.courses.find((c) => c.id === courseId)) {
        existing.courses.push({ id: courseId, name: courseName });
      }
    } else {
      // Add new person
      peopleMap.set(user.id, {
        user,
        courses: [{ id: courseId, name: courseName }],
        role,
      });
    }
  }

  // Convert to PersonItem array
  const people: PersonItem[] = Array.from(peopleMap.values()).map((p) => ({
    name: p.user.name,
    role: p.role,
    email: p.user.email || null,
    courses: p.courses.sort((a, b) => a.name.localeCompare(b.name)),
  }));

  // Sort by name
  people.sort((a, b) => a.name.localeCompare(b.name));

  return people;
}
