/**
 * MCP Server for Canvas Integration
 * Allows LLMs to interact with the Canvas API directly
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { ensureClient } from "./src/utils/init.ts";
import { listCoursesWithGrades, listCourses } from "./src/api/courses.ts";
import { getMissingSubmissions } from "./src/api/users.ts";
import {
  listAssignments,
  listAssignmentsDueThisWeek,
  listUpcomingAssignments,
} from "./src/api/assignments.ts";
import { listSubmissions, listUnsubmittedPastDueForStudent } from "./src/api/submissions.ts";

// Initialize configuration and client
await ensureClient();

const server = new McpServer({
  name: "canvas-mcp",
  version: "1.0.0",
});

// Tool: Get Courses
server.tool(
  "get_courses",
  "List all active courses and current grades for the student",
  {
    student_id: z.string().optional().describe("Student ID (default: 'self')"),
  },
  async ({ student_id }: { student_id?: string }) => {
    const courses = await listCoursesWithGrades(student_id || "self");
    
    // Simplify output for LLM
    const simplified = courses.map(c => ({
      id: c.id,
      name: c.name,
      code: c.course_code,
      current_grade: c.enrollment?.grades?.current_grade,
      current_score: c.enrollment?.grades?.current_score,
      final_grade: c.enrollment?.grades?.final_grade,
      final_score: c.enrollment?.grades?.final_score,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(simplified, null, 2) }],
    };
  }
);

// Tool: Get Missing Assignments
server.tool(
  "get_missing_assignments",
  "Get missing assignments for a student (Canvas-flagged as missing)",
  {
    student_id: z.string().optional().describe("Student ID (default: 'self')"),
    course_id: z.number().optional().describe("Filter by specific course ID"),
  },
  async ({ student_id, course_id }: { student_id?: string; course_id?: number }) => {
    const missing = await getMissingSubmissions({
      studentId: student_id || "self",
      courseIds: course_id ? [course_id] : undefined,
      include: ["course"],
    });

    const simplified = missing.map(m => ({
      id: m.id,
      name: m.name,
      course: m.course?.name,
      due_at: m.due_at,
      points_possible: m.points_possible,
      url: m.html_url
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(simplified, null, 2) }],
    };
  }
);

// Tool: Get Unsubmitted Past-Due Assignments
server.tool(
  "get_unsubmitted_past_due",
  "Get assignments that are past due but not submitted (catches items Canvas hasn't flagged as missing yet)",
  {
    student_id: z.string().describe("Student ID (required for this endpoint)"),
    course_id: z.number().optional().describe("Filter by specific course ID (if omitted, checks all courses)"),
  },
  async ({ student_id, course_id }: { student_id: string; course_id?: number }) => {
    const courseIds: number[] = [];

    if (course_id) {
      courseIds.push(course_id);
    } else {
      // Get all active courses
      const courses = await listCourses({
        enrollment_state: "active",
        state: ["available"],
      });
      courseIds.push(...courses.map(c => c.id));
    }

    const results: Array<{
      id: number;
      name: string;
      course_id: number;
      due_at: string | null;
      points_possible: number | null;
      url: string;
    }> = [];

    for (const cid of courseIds) {
      try {
        const unsubmitted = await listUnsubmittedPastDueForStudent(cid, student_id);
        for (const sub of unsubmitted) {
          const assignment = sub.assignment;
          if (!assignment) continue;
          results.push({
            id: assignment.id,
            name: assignment.name,
            course_id: assignment.course_id,
            due_at: assignment.due_at,
            points_possible: assignment.points_possible,
            url: assignment.html_url,
          });
        }
      } catch {
        // Skip courses we can't access
      }
    }

    // Sort by due date (most recent first)
    results.sort((a, b) => {
      if (!a.due_at || !b.due_at) return 0;
      return new Date(b.due_at).getTime() - new Date(a.due_at).getTime();
    });

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

// Tool: Get Upcoming Assignments (single course)
server.tool(
  "get_upcoming_assignments",
  "Get assignments due in the next N days for a single course",
  {
    course_id: z.number().describe("Course ID"),
    days: z.number().optional().default(7).describe("Number of days to look ahead (default: 7)"),
  },
  async ({ course_id, days }: { course_id: number; days: number }) => {
    const assignments = await listUpcomingAssignments(course_id, days);

    const simplified = assignments.map(a => ({
      id: a.id,
      name: a.name,
      due_at: a.due_at,
      points: a.points_possible,
      submitted: a.submission?.submitted_at ? true : false,
      url: a.html_url
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(simplified, null, 2) }],
    };
  }
);

// Tool: Get Due This Week (all courses)
server.tool(
  "get_due_this_week",
  "Get all assignments due in the next N days across ALL courses for a student, with submission status",
  {
    student_id: z.string().describe("Student ID"),
    days: z.number().optional().default(7).describe("Number of days to look ahead (default: 7)"),
  },
  async ({ student_id, days }: { student_id: string; days: number }) => {
    // Get all active courses
    const courses = await listCourses({
      enrollment_state: "active",
      state: ["available"],
    });

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + days);

    const results: Array<{
      course_id: number;
      course_name: string;
      assignment_id: number;
      assignment_name: string;
      due_at: string;
      points_possible: number | null;
      submitted: boolean;
      score: number | null;
      grade: string | null;
      url: string;
    }> = [];

    for (const course of courses) {
      try {
        // Get student's submissions with assignment data
        const submissions = await listSubmissions({
          course_id: course.id,
          student_ids: [Number(student_id)],
          include: ["assignment"],
        });

        for (const sub of submissions) {
          const assignment = sub.assignment;
          if (!assignment?.due_at) continue;

          const dueDate = new Date(assignment.due_at);
          if (dueDate < now || dueDate > endDate) continue;

          results.push({
            course_id: course.id,
            course_name: course.name,
            assignment_id: assignment.id,
            assignment_name: assignment.name,
            due_at: assignment.due_at,
            points_possible: assignment.points_possible,
            submitted: !!sub.submitted_at,
            score: sub.score,
            grade: sub.grade,
            url: assignment.html_url,
          });
        }
      } catch {
        // Skip courses we can't access
      }
    }

    // Sort by due date
    results.sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

// Tool: List Assignments (General Search)
server.tool(
  "list_assignments",
  "List assignments for a course with optional filtering",
  {
    course_id: z.number().describe("Course ID"),
    bucket: z.enum(["past", "overdue", "undated", "ungraded", "unsubmitted", "upcoming", "future"]).optional().describe("Filter by bucket"),
    search_term: z.string().optional().describe("Search by assignment name"),
  },
  async ({ course_id, bucket, search_term }: { course_id: number; bucket?: "past" | "overdue" | "undated" | "ungraded" | "unsubmitted" | "upcoming" | "future"; search_term?: string }) => {
    const assignments = await listAssignments({
      course_id,
      bucket: bucket,
      search_term,
      include: ["submission"]
    });

    const simplified = assignments.map(a => ({
      id: a.id,
      name: a.name,
      due_at: a.due_at,
      bucket: bucket || "all",
      score: a.submission?.score,
      grade: a.submission?.grade,
      submitted: !!a.submission?.submitted_at,
      url: a.html_url
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(simplified, null, 2) }],
    };
  }
);

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);
