/**
 * Canvas CLI - Main Entry Point
 * A command-line tool for interacting with the Canvas LMS API
 */

import { Command } from "@cliffy/command";
import { exitWithError } from "./src/utils/output.ts";

// Import commands
import { coursesCommand } from "./src/commands/courses.ts";
import { missingCommand } from "./src/commands/missing.ts";
import { assignmentsCommand } from "./src/commands/assignments.ts";
import { gradesCommand } from "./src/commands/grades.ts";
import { upcomingCommand } from "./src/commands/upcoming.ts";
import { todoCommand } from "./src/commands/todo.ts";
import { statsCommand } from "./src/commands/stats.ts";
import { statusCommand } from "./src/commands/status.ts";
import { dueCommand } from "./src/commands/due.ts";
import { unsubmittedCommand } from "./src/commands/unsubmitted.ts";
import { announcementsCommand } from "./src/commands/announcements.ts";
import { inboxCommand } from "./src/commands/inbox.ts";
import { communicationsCommand } from "./src/commands/communications.ts";
import { studentsCommand } from "./src/commands/students.ts";

const VERSION = "0.1.0";

// Main CLI command
const cli = new Command()
  .name("canvas")
  .version(VERSION)
  .description(
    "Canvas LMS CLI - Query courses, grades, assignments, and more from Canvas.\n\n" +
      "Configure by setting CANVAS_API_TOKEN and CANVAS_BASE_URL in .env or environment.",
  )
  .globalOption("-f, --format <format:string>", "Output format: json (default) or table", {
    default: "json",
  })
  .globalOption("-s, --student <id:string>", "Student ID for observer accounts (default: self)", {
    default: "self",
  })
  // Add subcommands
  .command("courses", coursesCommand)
  .command("missing", missingCommand)
  .command("assignments", assignmentsCommand)
  .command("grades", gradesCommand)
  .command("upcoming", upcomingCommand)
  .command("todo", todoCommand)
  .command("stats", statsCommand)
  .command("status", statusCommand)
  .command("due", dueCommand)
  .command("unsubmitted", unsubmittedCommand)
  .command("announcements", announcementsCommand)
  .command("inbox", inboxCommand)
  .command("communications", communicationsCommand)
  .command("students", studentsCommand);

// Run
try {
  await cli.parse(Deno.args);
} catch (error) {
  if (error instanceof Error) {
    exitWithError(error.message);
  } else {
    exitWithError(String(error));
  }
}
