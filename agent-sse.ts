/**
 * MCP Server for Canvas Integration - SSE Transport
 * For remote deployment (k8s, docker, etc.)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

import { ensureClient } from "./src/utils/init.ts";
import { listCourses, listCoursesWithGrades } from "./src/api/courses.ts";
import { getMissingSubmissions, getPlannerItems } from "./src/api/users.ts";
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

    const simplified = courses.map((c) => ({
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
  },
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

    const simplified = missing.map((m) => ({
      id: m.id,
      name: m.name,
      course: m.course?.name,
      due_at: m.due_at,
      points_possible: m.points_possible,
      url: m.html_url,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(simplified, null, 2) }],
    };
  },
);

// Tool: Get Unsubmitted Past-Due Assignments
server.tool(
  "get_unsubmitted_past_due",
  "Get assignments that are past due but not submitted (catches items Canvas hasn't flagged as missing yet)",
  {
    student_id: z.string().describe("Student ID (required for this endpoint)"),
    course_id: z.number().optional().describe(
      "Filter by specific course ID (if omitted, checks all courses)",
    ),
  },
  async ({ student_id, course_id }: { student_id: string; course_id?: number }) => {
    const courseIds: number[] = [];

    if (course_id) {
      courseIds.push(course_id);
    } else {
      const courses = await listCourses({
        enrollment_state: "active",
        state: ["available"],
      });
      courseIds.push(...courses.map((c) => c.id));
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

    results.sort((a, b) => {
      if (!a.due_at || !b.due_at) return 0;
      return new Date(b.due_at).getTime() - new Date(a.due_at).getTime();
    });

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  },
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

    const simplified = assignments.map((a) => ({
      id: a.id,
      name: a.name,
      due_at: a.due_at,
      points: a.points_possible,
      submitted: a.submission?.submitted_at ? true : false,
      url: a.html_url,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(simplified, null, 2) }],
    };
  },
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

    results.sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  },
);

// Tool: List Assignments (General Search)
server.tool(
  "list_assignments",
  "List assignments for a course with optional filtering",
  {
    course_id: z.number().describe("Course ID"),
    bucket: z.enum(["past", "overdue", "undated", "ungraded", "unsubmitted", "upcoming", "future"])
      .optional().describe("Filter by bucket"),
    search_term: z.string().optional().describe("Search by assignment name"),
  },
  async (
    { course_id, bucket, search_term }: {
      course_id: number;
      bucket?: "past" | "overdue" | "undated" | "ungraded" | "unsubmitted" | "upcoming" | "future";
      search_term?: string;
    },
  ) => {
    const assignments = await listAssignments({
      course_id,
      bucket: bucket,
      search_term,
      include: ["submission"],
    });

    const simplified = assignments.map((a) => ({
      id: a.id,
      name: a.name,
      due_at: a.due_at,
      bucket: bucket || "all",
      score: a.submission?.score,
      grade: a.submission?.grade,
      submitted: !!a.submission?.submitted_at,
      url: a.html_url,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(simplified, null, 2) }],
    };
  },
);

// Tool: Get Todo (Planner Items)
server.tool(
  "get_todo",
  "Get the student's to-do list (planner items) showing upcoming assignments, quizzes, and tasks",
  {
    student_id: z.string().describe("Student ID"),
    days: z.number().optional().default(7).describe("Number of days to look ahead (default: 7)"),
    hide_submitted: z.boolean().optional().default(false).describe(
      "Hide items that have been submitted",
    ),
  },
  async (
    { student_id, days, hide_submitted }: {
      student_id: string;
      days: number;
      hide_submitted: boolean;
    },
  ) => {
    const startDate = new Date().toISOString().split("T")[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    const endDateStr = endDate.toISOString().split("T")[0];

    const items = await getPlannerItems({
      studentId: student_id,
      startDate,
      endDate: endDateStr,
    });

    let filteredItems = items;
    if (hide_submitted) {
      filteredItems = items.filter((item) => !item.submissions?.submitted);
    }

    filteredItems.sort((a, b) => {
      return new Date(a.plannable_date).getTime() - new Date(b.plannable_date).getTime();
    });

    const simplified = filteredItems.map((item) => ({
      course_name: item.context_name,
      title: item.plannable.title,
      type: item.plannable_type,
      due_at: item.plannable_date,
      points_possible: item.plannable.points_possible,
      submitted: item.submissions?.submitted || false,
      missing: item.submissions?.missing || false,
      graded: item.submissions?.graded || false,
      url: item.html_url,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(simplified, null, 2) }],
    };
  },
);

// --- SSE HTTP Server ---
const PORT = parseInt(Deno.env.get("PORT") || "3001");

// Track active transports for cleanup
const transports = new Map<string, SSEServerTransport>();

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Health check endpoint
  if (url.pathname === "/health") {
    return new Response(JSON.stringify({ status: "ok", server: "canvas-mcp" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // SSE endpoint for MCP
  if (url.pathname === "/sse") {
    console.log("New SSE connection");

    const transport = new SSEServerTransport("/message", new Response());
    const sessionId = crypto.randomUUID();
    transports.set(sessionId, transport);

    // Connect the transport to our server
    await server.connect(transport);

    // Return the SSE response
    return transport.sseResponse!;
  }

  // Message endpoint for MCP
  if (url.pathname === "/message" && req.method === "POST") {
    // Find the transport - in a real implementation you'd use session IDs
    const transport = Array.from(transports.values())[0];
    if (transport) {
      await transport.handlePostMessage(req);
      return new Response("OK", { status: 200 });
    }
    return new Response("No active session", { status: 400 });
  }

  return new Response("Not Found", { status: 404 });
}

console.log(`Canvas MCP Server (SSE) listening on port ${PORT}`);
console.log(`Health check: http://localhost:${PORT}/health`);
console.log(`SSE endpoint: http://localhost:${PORT}/sse`);

Deno.serve({ port: PORT }, handler);
