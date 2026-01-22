/**
 * Canvas REST API Server
 * Simple HTTP API that works with any client (ChatGPT Actions, curl, etc.)
 */

import { ensureClient } from "./src/utils/init.ts";
import { listCoursesWithGrades, listCourses } from "./src/api/courses.ts";
import { getMissingSubmissions, getPlannerItems } from "./src/api/users.ts";
import { listSubmissions, listUnsubmittedPastDueForStudent } from "./src/api/submissions.ts";
import { getStudentStats } from "./src/commands/stats.ts";

// Initialize Canvas client
await ensureClient();

const PORT = parseInt(Deno.env.get("PORT") || "3001");

// Simple CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Health check
    if (url.pathname === "/health") {
      return jsonResponse({ status: "ok", server: "canvas-api" });
    }

    // OpenAPI spec for ChatGPT Actions
    if (url.pathname === "/openapi.json") {
      return jsonResponse(getOpenAPISpec());
    }

    // GET /api/courses
    if (url.pathname === "/api/courses") {
      const studentId = url.searchParams.get("student_id") || "self";
      const courses = await listCoursesWithGrades(studentId);

      const simplified = courses.map(c => ({
        id: c.id,
        name: c.name,
        code: c.course_code,
        current_grade: c.enrollment?.grades?.current_grade,
        current_score: c.enrollment?.grades?.current_score,
      }));

      return jsonResponse(simplified);
    }

    // GET /api/todo
    if (url.pathname === "/api/todo") {
      const studentId = url.searchParams.get("student_id");
      if (!studentId) return errorResponse("student_id is required");

      const days = parseInt(url.searchParams.get("days") || "7");
      const hideSubmitted = url.searchParams.get("hide_submitted") === "true";

      const startDate = new Date().toISOString().split("T")[0];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const items = await getPlannerItems({
        studentId,
        startDate,
        endDate: endDate.toISOString().split("T")[0],
      });

      let filtered = items;
      if (hideSubmitted) {
        filtered = items.filter(item => !item.submissions?.submitted);
      }

      filtered.sort((a, b) =>
        new Date(a.plannable_date).getTime() - new Date(b.plannable_date).getTime()
      );

      const simplified = filtered.map(item => ({
        course: item.context_name,
        title: item.plannable.title,
        type: item.plannable_type,
        due_at: item.plannable_date,
        points: item.plannable.points_possible,
        submitted: item.submissions?.submitted || false,
        missing: item.submissions?.missing || false,
      }));

      return jsonResponse(simplified);
    }

    // GET /api/missing
    if (url.pathname === "/api/missing") {
      const studentId = url.searchParams.get("student_id") || "self";
      const courseId = url.searchParams.get("course_id");

      const missing = await getMissingSubmissions({
        studentId,
        courseIds: courseId ? [parseInt(courseId)] : undefined,
        include: ["course"],
      });

      const simplified = missing.map(m => ({
        id: m.id,
        name: m.name,
        course: m.course?.name,
        due_at: m.due_at,
        points: m.points_possible,
      }));

      return jsonResponse(simplified);
    }

    // GET /api/due-this-week
    if (url.pathname === "/api/due-this-week") {
      const studentId = url.searchParams.get("student_id");
      if (!studentId) return errorResponse("student_id is required");

      const days = parseInt(url.searchParams.get("days") || "7");

      const courses = await listCourses({
        enrollment_state: "active",
        state: ["available"],
      });

      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(now.getDate() + days);

      const results: Array<{
        course: string;
        assignment: string;
        due_at: string;
        points: number | null;
        submitted: boolean;
      }> = [];

      for (const course of courses) {
        try {
          const submissions = await listSubmissions({
            course_id: course.id,
            student_ids: [Number(studentId)],
            include: ["assignment"],
          });

          for (const sub of submissions) {
            const assignment = sub.assignment;
            if (!assignment?.due_at) continue;

            const dueDate = new Date(assignment.due_at);
            if (dueDate < now || dueDate > endDate) continue;

            results.push({
              course: course.name,
              assignment: assignment.name,
              due_at: assignment.due_at,
              points: assignment.points_possible,
              submitted: !!sub.submitted_at,
            });
          }
        } catch {
          // Skip inaccessible courses
        }
      }

      results.sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
      return jsonResponse(results);
    }

    // GET /api/stats
    if (url.pathname === "/api/stats") {
      const studentId = url.searchParams.get("student_id");
      if (!studentId) return errorResponse("student_id is required");

      const hideEmpty = url.searchParams.get("hide_empty") !== "false";

      let stats = await getStudentStats(studentId);

      if (hideEmpty) {
        stats = stats.filter((s) => s.total > 0);
      }

      return jsonResponse(stats);
    }

    // GET /api/unsubmitted
    if (url.pathname === "/api/unsubmitted") {
      const studentId = url.searchParams.get("student_id");
      if (!studentId) return errorResponse("student_id is required");

      const courses = await listCourses({
        enrollment_state: "active",
        state: ["available"],
      });

      const results: Array<{
        course_id: number;
        name: string;
        due_at: string | null;
        points: number | null;
      }> = [];

      for (const course of courses) {
        try {
          const unsubmitted = await listUnsubmittedPastDueForStudent(course.id, studentId);
          for (const sub of unsubmitted) {
            const assignment = sub.assignment;
            if (!assignment) continue;
            results.push({
              course_id: assignment.course_id,
              name: assignment.name,
              due_at: assignment.due_at,
              points: assignment.points_possible,
            });
          }
        } catch {
          // Skip inaccessible courses
        }
      }

      return jsonResponse(results);
    }

    return errorResponse("Not found", 404);
  } catch (err) {
    console.error("Error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal error", 500);
  }
}

function getOpenAPISpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Canvas LMS API",
      description: "Query student academic data from Canvas LMS",
      version: "1.0.0",
    },
    servers: [
      { url: `http://localhost:${PORT}`, description: "Local server" },
    ],
    paths: {
      "/api/courses": {
        get: {
          operationId: "getCourses",
          summary: "Get all courses with grades",
          parameters: [
            { name: "student_id", in: "query", schema: { type: "string" }, description: "Student ID" },
          ],
          responses: { "200": { description: "List of courses" } },
        },
      },
      "/api/todo": {
        get: {
          operationId: "getTodo",
          summary: "Get student's to-do list",
          parameters: [
            { name: "student_id", in: "query", required: true, schema: { type: "string" } },
            { name: "days", in: "query", schema: { type: "integer", default: 7 } },
            { name: "hide_submitted", in: "query", schema: { type: "boolean" } },
          ],
          responses: { "200": { description: "List of planner items" } },
        },
      },
      "/api/missing": {
        get: {
          operationId: "getMissing",
          summary: "Get missing assignments",
          parameters: [
            { name: "student_id", in: "query", schema: { type: "string" } },
            { name: "course_id", in: "query", schema: { type: "integer" } },
          ],
          responses: { "200": { description: "List of missing assignments" } },
        },
      },
      "/api/due-this-week": {
        get: {
          operationId: "getDueThisWeek",
          summary: "Get assignments due soon",
          parameters: [
            { name: "student_id", in: "query", required: true, schema: { type: "string" } },
            { name: "days", in: "query", schema: { type: "integer", default: 7 } },
          ],
          responses: { "200": { description: "List of upcoming assignments" } },
        },
      },
      "/api/unsubmitted": {
        get: {
          operationId: "getUnsubmitted",
          summary: "Get past-due unsubmitted assignments",
          parameters: [
            { name: "student_id", in: "query", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "List of unsubmitted assignments" } },
        },
      },
    },
  };
}

console.log(`Canvas REST API Server listening on port ${PORT}`);
console.log(`Endpoints:`);
console.log(`  GET /health`);
console.log(`  GET /openapi.json`);
console.log(`  GET /api/courses?student_id=...`);
console.log(`  GET /api/todo?student_id=...&days=7`);
console.log(`  GET /api/missing?student_id=...`);
console.log(`  GET /api/due-this-week?student_id=...`);
console.log(`  GET /api/unsubmitted?student_id=...`);

Deno.serve({ port: PORT }, handler);
