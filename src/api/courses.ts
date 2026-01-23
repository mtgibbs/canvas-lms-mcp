/**
 * Canvas Courses API
 */

import { getClient } from "./client.ts";
import type { Course, Enrollment, ListCoursesOptions } from "../types/canvas.ts";

/**
 * List all courses for the authenticated user
 */
export function listCourses(options?: ListCoursesOptions): Promise<Course[]> {
  const client = getClient();

  const params: Record<string, string | string[] | undefined> = {};

  if (options?.enrollment_type) {
    params.enrollment_type = options.enrollment_type;
  }
  if (options?.enrollment_state) {
    params.enrollment_state = options.enrollment_state;
  }
  if (options?.include) {
    params.include = options.include;
  }
  if (options?.state) {
    params.state = options.state;
  }

  return client.getAll<Course>("/courses", params);
}

/**
 * Get a single course by ID
 */
export function getCourse(courseId: number): Promise<Course> {
  const client = getClient();
  return client.get<Course>(`/courses/${courseId}`);
}

/**
 * List enrollments for a course (includes grade info)
 */
export function listCourseEnrollments(
  courseId: number,
  options?: {
    type?: string[];
    state?: string[];
    userId?: number | string;
    include?: string[];
  },
): Promise<Enrollment[]> {
  const client = getClient();

  const params: Record<string, string | string[] | number | undefined> = {
    // Always include grades when fetching enrollments
    include: options?.include || ["grades"],
  };

  if (options?.type) {
    params.type = options.type;
  }
  if (options?.state) {
    params.state = options.state;
  }
  if (options?.userId) {
    params.user_id = options.userId;
  }

  return client.getAll<Enrollment>(`/courses/${courseId}/enrollments`, params);
}

/**
 * Get enrollment with grades for a specific user in a course
 */
export async function getUserEnrollment(
  courseId: number,
  userId: number | string,
): Promise<Enrollment | null> {
  const enrollments = await listCourseEnrollments(courseId, {
    userId,
    type: ["StudentEnrollment"],
  });

  return enrollments[0] || null;
}

/**
 * List courses with grades for a user (observer or self)
 * Enriches course data with enrollment/grade information
 *
 * For observer accounts querying a specific student, this fetches
 * the student's enrollment separately to get their actual grades.
 */
export async function listCoursesWithGrades(
  userId: string | number = "self",
): Promise<(Course & { enrollment?: Enrollment })[]> {
  // Get all active courses with enrollments included
  const courses = await listCourses({
    enrollment_state: "active",
    include: ["enrollments", "term"],
    state: ["available"],
  });

  // If querying for a specific student (not "self"), we need to fetch
  // the student's enrollment separately since the courses endpoint
  // only returns the observer's enrollment for parent accounts
  const isObserverQuery = userId !== "self" && !isNaN(Number(userId));

  if (isObserverQuery) {
    // Fetch student enrollments with grades in parallel
    const enrollmentPromises = courses.map(async (course) => {
      try {
        const enrollments = await listCourseEnrollments(course.id, {
          userId: Number(userId),
          type: ["StudentEnrollment"],
        });
        return { courseId: course.id, enrollment: enrollments[0] || null };
      } catch {
        return { courseId: course.id, enrollment: null };
      }
    });

    const enrollmentResults = await Promise.all(enrollmentPromises);
    const enrollmentMap = new Map(
      enrollmentResults.map((r) => [r.courseId, r.enrollment]),
    );

    return courses.map((course) => ({
      ...course,
      enrollment: enrollmentMap.get(course.id) || undefined,
    }));
  }

  // For "self" queries, use the enrollment from the courses response
  const coursesWithGrades = courses.map((course) => {
    const enrollment = course.enrollments?.find((e) => {
      return e.type === "StudentEnrollment" || e.type === "ObserverEnrollment";
    });

    return {
      ...course,
      enrollment,
    };
  });

  return coursesWithGrades;
}
