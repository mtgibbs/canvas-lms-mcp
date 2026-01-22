# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

This project is a Deno CLI tool that wraps the Canvas LMS API, designed for both human use and LLM integration. It enables querying student academic data including grades, assignments, and course information. The primary use case is allowing a parent to discuss their child's academic progress through natural language.

## Development Commands

```bash
# Run CLI in development mode
deno task dev <command>

# Examples:
deno task dev courses
deno task dev missing --format table
deno task dev assignments --all-courses --due-this-week

# Build standalone binary
deno task build

# Build for all platforms
deno task build:all

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

# List grades/submissions
canvas grades --all-courses
canvas grades --all-courses --below B
canvas grades --course-id 12345 --below 80

# Upcoming events
canvas upcoming --days 14

# To-do list (planner items)
canvas todo --student 200257 --days 7
canvas todo --hide-submitted

# Global options (work with all commands)
--format <json|table>  # Output format (default: json)
--student <id>         # Student ID for observer accounts (default: self)
```

## Architecture

```
src/
├── api/           # Canvas API client and endpoint modules
│   ├── client.ts  # HTTP client with auth and pagination
│   ├── courses.ts, assignments.ts, submissions.ts, users.ts, enrollments.ts
├── commands/      # CLI commands (Cliffy)
│   ├── courses.ts, missing.ts, assignments.ts, grades.ts, upcoming.ts, todo.ts
├── types/
│   └── canvas.ts  # TypeScript interfaces for Canvas API
└── utils/
    ├── config.ts  # Environment variable loading
    └── output.ts  # JSON/table output formatting
```

**Key patterns:**
- `src/api/client.ts` handles auth and pagination; use `getClient()` after initialization
- Commands use Cliffy for argument parsing
- Output supports JSON (for LLM parsing) and table (for humans)
- Use `--student <id>` for observer accounts accessing student data

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

| Command | Endpoint |
|---------|----------|
| courses | `GET /api/v1/courses` with enrollments |
| missing | `GET /api/v1/users/:id/missing_submissions` |
| assignments | `GET /api/v1/courses/:id/assignments` |
| grades | `GET /api/v1/courses/:id/students/submissions` |
| upcoming | `GET /api/v1/users/:id/upcoming_events` |
| todo | `GET /api/v1/planner/items` with context_codes |

## Important Canvas API Behaviors

1. **Observer Access**: Use `observed_user_id` parameter or `--student` flag for parent accounts
2. **Rate Limiting**: Canvas enforces rate limits; the client requests 100 items per page to minimize calls
3. **Timestamps**: ISO 8601 format in UTC
4. **Assignment Buckets**: Filter assignments by status using `bucket` param (past, overdue, upcoming, etc.)
