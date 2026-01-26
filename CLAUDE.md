# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Project Purpose

This project provides **two interfaces** to Canvas LMS:

1. **CLI** (`main.ts`) - Human-friendly command-line tool
2. **MCP Server** (`agent.ts`) - Model Context Protocol server for AI assistants like Claude

Both interfaces share the same API layer (`src/api/`) and should have **feature parity**.

## CRITICAL: CLI/MCP Parity

**When adding or modifying functionality, ALWAYS update BOTH interfaces:**

| CLI Command     | MCP Tool                   | Description                          |
| --------------- | -------------------------- | ------------------------------------ |
| `courses`       | `get_courses`              | List courses with grades             |
| `missing`       | `get_missing_assignments`  | Canvas-flagged missing work          |
| `assignments`   | `list_assignments`         | Filter/search assignments            |
| `grades`        | `get_recent_grades`        | Graded submissions with scores       |
| `upcoming`      | `get_upcoming_assignments` | Assignments due soon (single course) |
| `todo`          | `get_todo`                 | Planner items                        |
| `stats`         | `get_stats`                | Late/missing statistics              |
| `status`        | `get_comprehensive_status` | Full overview (all data in one call) |
| `due`           | `get_due_this_week`        | Upcoming across ALL courses          |
| `unsubmitted`   | `get_unsubmitted_past_due` | Past-due but not submitted           |
| `announcements` | `get_announcements`        | Recent course announcements          |
| `inbox`         | `get_inbox`                | Canvas inbox conversations           |

**Before completing any feature work:**

1. Check if the feature exists in both CLI and MCP
2. If adding to one, add to the other
3. Update this table if adding new commands/tools

## Development Commands

```bash
# Run CLI in development mode
deno task dev <command>

# Run MCP server in development
deno run -A agent.ts

# Examples:
deno task dev courses
deno task dev status --format table
deno task dev grades --all-courses --days 14 --below 70

# Build npm package (for MCP server distribution)
deno task build:npm

# Build Desktop Extension (.mcpb)
deno task build:extension

# Type check
deno task check

# Lint and format
deno task lint
deno task fmt

# Run tests
deno task test
```

## CLI Usage

```bash
# Comprehensive status (recommended for daily check-ins)
canvas status --format table
canvas status --days-upcoming 7 --days-grades 14 --threshold 70

# List courses with grades
canvas courses
canvas courses --format table

# List missing assignments
canvas missing
canvas missing --summary  # counts by course
canvas missing --course-id 12345

# List assignments
canvas assignments --all-courses --due-this-week
canvas assignments --course-id 12345 --upcoming 7
canvas assignments --course-id 12345 --bucket overdue

# List grades/submissions (with recent date filtering)
canvas grades --all-courses
canvas grades --all-courses --below 70
canvas grades --all-courses --days 14              # last 14 days only
canvas grades --all-courses --days 14 --below 70   # recent low grades

# Upcoming events
canvas upcoming --days 14

# To-do list (planner items)
canvas todo --student 200257 --days 7
canvas todo --hide-submitted

# Statistics
canvas stats

# Assignments due soon (across ALL courses)
canvas due                     # next 7 days, hide graded
canvas due --days 14           # next 14 days
canvas due --show-graded       # include already-graded items

# Past-due unsubmitted assignments
canvas unsubmitted             # all courses
canvas unsubmitted --course-id 12345

# Course announcements
canvas announcements                   # last 14 days, all courses
canvas announcements --days 7          # last 7 days
canvas announcements --course-id 12345 # specific course
canvas announcements --format table

# Inbox conversations
canvas inbox                           # inbox messages
canvas inbox --scope unread            # unread only
canvas inbox --scope sent              # sent messages
canvas inbox --course-id 12345         # specific course
canvas inbox --format table

# Global options (work with all commands)
--format <json|table>  # Output format (default: json)
--student <id>         # Student ID for observer accounts (uses CANVAS_STUDENT_ID from config if not specified)
```

## MCP Tools

The MCP server exposes these tools to AI assistants:

| Tool                       | Description                      | Key Parameters                                                         |
| -------------------------- | -------------------------------- | ---------------------------------------------------------------------- |
| `get_courses`              | List courses with current grades | `student_id`                                                           |
| `get_missing_assignments`  | Canvas-flagged missing work      | `student_id`, `course_id?`                                             |
| `get_unsubmitted_past_due` | Past-due but not submitted       | `student_id`, `course_id?`                                             |
| `get_upcoming_assignments` | Due soon (single course)         | `student_id`, `course_id`, `days?`                                     |
| `get_due_this_week`        | Due soon (ALL courses)           | `student_id`, `days?`, `hide_graded?`                                  |
| `list_assignments`         | Filter/search assignments        | `student_id`, `course_id`, `bucket?`                                   |
| `get_stats`                | Late/missing statistics          | `student_id`                                                           |
| `get_todo`                 | Planner items                    | `student_id`, `days?`                                                  |
| `get_recent_grades`        | Graded with scores               | `student_id`, `days?`, `below_percentage?`                             |
| `get_comprehensive_status` | **Full overview**                | `student_id`, `days_upcoming?`, `days_grades?`, `low_grade_threshold?` |
| `get_announcements`        | Recent course announcements      | `student_id`, `days?`, `course_id?`                                    |
| `get_inbox`                | Canvas inbox conversations       | `student_id`, `scope?`, `course_id?`                                   |

**Recommended for daily check-ins:** Use `get_comprehensive_status` - it returns courses, grades,
missing work, upcoming assignments, recent low grades, and recent announcements in a single call.

## Architecture

```
src/
├── api/           # Canvas API client (shared by CLI and MCP)
│   ├── client.ts  # HTTP client with auth and pagination
│   ├── courses.ts, assignments.ts, submissions.ts, users.ts, enrollments.ts
│   ├── announcements.ts, conversations.ts
├── commands/      # CLI commands (Cliffy)
│   ├── courses.ts, missing.ts, assignments.ts, grades.ts
│   ├── upcoming.ts, todo.ts, stats.ts, status.ts
│   ├── due.ts, unsubmitted.ts
│   ├── announcements.ts, inbox.ts
├── mcp/           # MCP server components
│   ├── server.ts  # Server setup and tool registration
│   ├── types.ts   # Tool definition types
│   ├── tools/     # Individual tool implementations
│   │   ├── get-courses.ts, get-missing-assignments.ts, ...
│   │   ├── get-recent-grades.ts, get-comprehensive-status.ts
│   │   ├── get-announcements.ts, get-inbox.ts
│   │   └── index.ts  # Tool registry
│   └── prompts/   # MCP prompts (conversation starters)
│       ├── daily-checkin.ts, week-planning.ts, ...
│       └── index.ts
├── services/      # Shared business logic (used by CLI and MCP)
│   ├── types.ts, index.ts
│   ├── courses.ts, missing.ts, assignments.ts, grades.ts
│   ├── upcoming.ts, todo.ts, stats.ts, status.ts
│   ├── due.ts, unsubmitted.ts, upcoming-events.ts
│   ├── announcements.ts, inbox.ts
├── types/
│   └── canvas.ts  # TypeScript interfaces for Canvas API
└── utils/
    ├── config.ts  # Environment variable loading
    └── output.ts  # JSON/table output formatting
```

**Key patterns:**

- `src/api/` is shared - changes here affect both CLI and MCP
- CLI commands in `src/commands/` use Cliffy for argument parsing
- MCP tools in `src/mcp/tools/` use Zod schemas for validation
- All multi-course operations should use `Promise.all` for parallel requests
- Tools/commands that fetch from all courses should parallelize to reduce latency

## Environment Variables

Create a `.env` file (gitignored):

```
CANVAS_API_TOKEN=your_access_token_here
CANVAS_BASE_URL=https://yourschool.instructure.com
CANVAS_STUDENT_ID=self
```

## Canvas API Reference

- **Documentation**: https://canvas.instructure.com/doc/api/
- **Authentication**: Bearer token via `Authorization` header
- **Pagination**: API client auto-paginates; Canvas returns 10 items per page by default

### Key Endpoints Used

| Command/Tool  | Endpoint                                       |
| ------------- | ---------------------------------------------- |
| courses       | `GET /api/v1/courses` with enrollments         |
| missing       | `GET /api/v1/users/:id/missing_submissions`    |
| assignments   | `GET /api/v1/courses/:id/assignments`          |
| grades        | `GET /api/v1/courses/:id/students/submissions` |
| upcoming      | `GET /api/v1/users/:id/upcoming_events`        |
| todo          | `GET /api/v1/planner/items` with context_codes |
| announcements | `GET /api/v1/announcements` with context_codes |
| inbox         | `GET /api/v1/conversations`                    |

## Important Canvas API Behaviors

1. **Observer Access**: Use `observed_user_id` parameter or `--student` flag for parent accounts
2. **Rate Limiting**: Canvas enforces rate limits; the client requests 100 items per page to
   minimize calls
3. **Timestamps**: ISO 8601 format in UTC
4. **Assignment Buckets**: Filter assignments by status using `bucket` param (past, overdue,
   upcoming, etc.)
5. **Parallel Requests**: When fetching from multiple courses, always use `Promise.all` to
   parallelize and reduce total request time
