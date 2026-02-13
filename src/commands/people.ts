/**
 * `canvas people` command
 * Show teachers and teaching assistants for courses
 */

import { Command } from "@cliffy/command";
import { output } from "../utils/output.ts";
import { ensureClient } from "../utils/init.ts";
import { getPeople } from "../services/index.ts";
import { getEffectiveStudentId } from "../api/users.ts";
import type { OutputFormat } from "../types/canvas.ts";

export const peopleCommand = new Command()
  .name("people")
  .description("Show teachers and teaching assistants for courses")
  .option("-f, --format <format:string>", "Output format (json or table)", {
    default: "json",
  })
  .option("-s, --student <id:string>", "Student ID (for observer accounts)")
  .option("-c, --course-id <id:number>", "Filter to specific course")
  .action(async (options) => {
    await ensureClient();
    const format = options.format as OutputFormat;
    const studentId = options.student
      ? String(await getEffectiveStudentId(options.student))
      : undefined;

    const people = await getPeople({
      studentId,
      courseId: options.courseId,
    });

    if (format === "table") {
      output(people, "table", {
        headers: ["Name", "Role", "Email", "Courses"],
        rowMapper: (p) => [
          p.name,
          p.role,
          p.email || "-",
          p.courses.map((c: { id: number; name: string }) => c.name).join(", "),
        ],
      });
    } else {
      output(people, "json", {
        headers: [],
        rowMapper: () => [],
      });
    }
  });
