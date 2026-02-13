/**
 * `canvas students` command
 * List students being observed by the current user (parent/observer account)
 */

import { Command } from "@cliffy/command";
import { output } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import { getObservedStudents } from "../services/index.ts";
import type { OutputFormat } from "../types/canvas.ts";

export const studentsCommand = new Command()
  .name("students")
  .description("List students being observed (for parent/observer accounts)")
  .option("-f, --format <format:string>", "Output format (json or table)", {
    default: "json",
  })
  .action(async (options) => {
    await ensureClient();
    const format = options.format as OutputFormat;

    const students = await getObservedStudents();

    output(students, format, {
      headers: ["ID", "Name", "Short Name", "Sortable Name"],
      rowMapper: (student) => [
        student.id,
        student.name,
        student.short_name,
        student.sortable_name,
      ],
    });
  });
