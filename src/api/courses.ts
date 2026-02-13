/**
 * Canvas Courses API
 */

import { getClient } from "./client.ts";
import type {
  Course,
  Enrollment,
  GradingPeriod,
  GradingPeriodsResponse,
  ListCoursesOptions,
} from "../types/canvas.ts";

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
 * List grading periods for a course
 */
export async function listGradingPeriods(courseId: number): Promise<GradingPeriod[]> {
  const client = getClient();
  try {
    const response = await client.get<GradingPeriodsResponse>(
      `/courses/${courseId}/grading_periods`,
    );
    return response.grading_periods || [];
  } catch {
    // Some courses may not have grading periods configured
    return [];
  }
}

/**
 * Find the current grading period for a course
 * Returns the grading period where today falls between start_date and end_date
 */
export async function getCurrentGradingPeriod(
  courseId: number,
): Promise<GradingPeriod | null> {
  const periods = await listGradingPeriods(courseId);
  if (periods.length === 0) return null;

  const now = new Date();

  // Find the period where current date falls within the range
  const currentPeriod = periods.find((period) => {
    const start = new Date(period.start_date);
    const end = new Date(period.end_date);
    return now >= start && now <= end;
  });

  if (currentPeriod) return currentPeriod;

  // If no current period found, find the most recent non-closed period
  // (handles edge cases between grading periods)
  const openPeriods = periods.filter((p) => !p.is_closed);
  if (openPeriods.length > 0) {
    // Sort by start_date descending and return the most recent
    openPeriods.sort(
      (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
    );
    return openPeriods[0];
  }

  return null;
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
    /** Grading period ID to filter grades by */
    gradingPeriodId?: number;
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
  if (options?.gradingPeriodId) {
    params.grading_period_id = options.gradingPeriodId;
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
 *
 * IMPORTANT: This function fetches grades for the CURRENT grading period
 * to match what parents see in the Canvas portal. Without specifying a
 * grading period, Canvas may return cumulative grades across all periods.
 */
export async function listCoursesWithGrades(
  userId: string | number = "self",
): Promise<(Course & { enrollment?: Enrollment; gradingPeriodId?: number })[]> {
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
    // Fetch current grading period and student enrollments in parallel for each course
    const enrollmentPromises = courses.map(async (course) => {
      try {
        // First, get the current grading period for this course
        const currentPeriod = await getCurrentGradingPeriod(course.id);

        // Fetch enrollment with grades, filtered by grading period if available
        const enrollments = await listCourseEnrollments(course.id, {
          userId: Number(userId),
          type: ["StudentEnrollment"],
          gradingPeriodId: currentPeriod?.id,
        });

        return {
          courseId: course.id,
          enrollment: enrollments[0] || null,
          gradingPeriodId: currentPeriod?.id,
        };
      } catch {
        return { courseId: course.id, enrollment: null, gradingPeriodId: undefined };
      }
    });

    const enrollmentResults = await Promise.all(enrollmentPromises);
    const enrollmentMap = new Map(
      enrollmentResults.map((
        r,
      ) => [r.courseId, { enrollment: r.enrollment, gradingPeriodId: r.gradingPeriodId }]),
    );

    return courses.map((course) => {
      const result = enrollmentMap.get(course.id);
      return {
        ...course,
        enrollment: result?.enrollment || undefined,
        gradingPeriodId: result?.gradingPeriodId,
      };
    });
  }

  // For "self" queries, also fetch current grading period and re-fetch enrollments
  const coursesWithGrades = await Promise.all(
    courses.map(async (course) => {
      try {
        const currentPeriod = await getCurrentGradingPeriod(course.id);

        if (currentPeriod) {
          // Re-fetch enrollment with grading period filter
          const enrollments = await listCourseEnrollments(course.id, {
            type: ["StudentEnrollment"],
            gradingPeriodId: currentPeriod.id,
          });

          return {
            ...course,
            enrollment: enrollments[0] || undefined,
            gradingPeriodId: currentPeriod.id,
          };
        }

        // No grading period, use enrollment from courses response
        const enrollment = course.enrollments?.find((e) => {
          return e.type === "StudentEnrollment" || e.type === "ObserverEnrollment";
        });

        return {
          ...course,
          enrollment,
        };
      } catch {
        // Fallback to original enrollment
        const enrollment = course.enrollments?.find((e) => {
          return e.type === "StudentEnrollment" || e.type === "ObserverEnrollment";
        });

        return {
          ...course,
          enrollment,
        };
      }
    }),
  );

  return coursesWithGrades;
}
