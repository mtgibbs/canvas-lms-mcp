/**
 * Build script for creating an npm package from the Deno source
 * Uses dnt (Deno to Node Transform) to convert Deno code to Node.js
 *
 * Run with: deno run -A build_npm.ts
 */

import { build, emptyDir } from "@deno/dnt";

// Get version from deno.json
const denoJson = JSON.parse(await Deno.readTextFile("./deno.json"));
const version = denoJson.version || "0.1.0";

await emptyDir("./npm");

await build({
  entryPoints: ["./agent.ts"],
  outDir: "./npm",
  shims: {
    deno: true,
  },
  // Skip type checking for faster builds (we check with deno check separately)
  typeCheck: false,
  // Don't run tests during build (run separately)
  test: false,
  // Generate ESM output only (modern Node.js)
  scriptModule: false,
  package: {
    name: "@mtgibbs/canvas-lms-mcp",
    version,
    description:
      "Canvas LMS MCP (Model Context Protocol) server for AI assistants. Query student grades, assignments, and academic data through Claude or other MCP-compatible AI tools.",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/mtgibbs/canvas-lms-mcp.git",
    },
    bugs: {
      url: "https://github.com/mtgibbs/canvas-lms-mcp/issues",
    },
    homepage: "https://github.com/mtgibbs/canvas-lms-mcp#readme",
    keywords: [
      "mcp",
      "model-context-protocol",
      "canvas-lms",
      "canvas",
      "lms",
      "instructure",
      "education",
      "grades",
      "assignments",
      "claude",
      "ai",
    ],
    bin: {
      "canvas-mcp": "./esm/agent.js",
    },
    engines: {
      node: ">=18.0.0",
    },
    dependencies: {
      // dotenv is loaded dynamically in Node.js for .env file support
      dotenv: "^16.3.1",
      // MCP SDK for the server protocol
      "@modelcontextprotocol/sdk": "^1.0.1",
      // Zod for schema validation
      zod: "^3.23.8",
    },
  },
  // Post-build steps
  async postBuild() {
    // Copy README for npm
    Deno.copyFileSync("README.md", "npm/README.md");

    // Copy LICENSE if it exists
    try {
      Deno.copyFileSync("LICENSE", "npm/LICENSE");
    } catch {
      console.log("Note: No LICENSE file found. Consider adding one before publishing.");
    }

    // Copy icon.png if it exists
    let hasIcon = false;
    try {
      Deno.copyFileSync("icon.png", "npm/icon.png");
      hasIcon = true;
    } catch {
      console.log("Note: No icon.png found. Add a 512x512 PNG for Desktop Extension submission.");
    }

    // Create bin wrapper that loads dotenv before the main agent
    const binWrapper = `#!/usr/bin/env node
// Load .env file before anything else
import "dotenv/config";

// Import and run the MCP server
import "./agent.js";
`;
    await Deno.writeTextFile("npm/esm/cli.js", binWrapper);

    // Fix the config.js to remove @std/dotenv import (not available in Node.js)
    // The dotenv/config import in cli.js handles loading .env files
    const configPath = "npm/esm/src/utils/config.js";
    let configContent = await Deno.readTextFile(configPath);
    // Remove the @std/dotenv import and the load() call since dotenv/config handles it
    configContent = configContent.replace(
      'import { load } from "@std/dotenv";',
      "// dotenv is loaded via cli.js wrapper"
    );
    configContent = configContent.replace(
      /\/\/ Try to load \.env file.*?\n\s*try \{\s*\n\s*await load\(\{ export: true \}\);\s*\n\s*\}\s*\n\s*catch \{\s*\n\s*\/\/ \.env file doesn't exist.*?\n\s*\}/s,
      "// dotenv is loaded via cli.js wrapper (dotenv/config)"
    );
    await Deno.writeTextFile(configPath, configContent);

    // Update package.json to use the new bin wrapper
    const pkgPath = "npm/package.json";
    const pkg = JSON.parse(await Deno.readTextFile(pkgPath));
    pkg.bin["canvas-mcp"] = "./esm/cli.js";
    await Deno.writeTextFile(pkgPath, JSON.stringify(pkg, null, 2));

    // Create manifest.json for Desktop Extension (mcpb) builds
    const manifest = {
      manifest_version: "0.3",
      name: "canvas-lms-mcp",
      display_name: "Canvas LMS",
      version,
      description:
        "Connect Claude to your Canvas LMS account to query grades, assignments, missing work, and more.",
      long_description: `An MCP server that connects AI assistants like Claude to your Canvas LMS account. Perfect for parents monitoring their child's academic progress, students tracking their own work, or anyone who wants to interact with Canvas data through natural language.

Ask Claude things like:
- What assignments are due this week?
- Show me missing assignments across all classes
- What's my grade in Biology?
- Are there any late assignments I should know about?`,
      author: {
        name: "mtgibbs",
        url: "https://github.com/mtgibbs",
      },
      repository: {
        type: "git",
        url: "https://github.com/mtgibbs/canvas-lms-mcp",
      },
      license: "MIT",
      ...(hasIcon ? { icon: "icon.png" } : {}),
      privacy_policies: ["https://github.com/mtgibbs/canvas-lms-mcp#privacy--security"],
      server: {
        type: "node",
        entry_point: "esm/cli.js",
        mcp_config: {
          command: "node",
          args: ["${__dirname}/esm/cli.js"],
          env: {
            CANVAS_API_TOKEN: "${user_config.canvas_api_token}",
            CANVAS_BASE_URL: "${user_config.canvas_base_url}",
            CANVAS_STUDENT_ID: "${user_config.canvas_student_id}",
          },
        },
      },
      user_config: {
        canvas_api_token: {
          type: "string",
          title: "Canvas API Token",
          description:
            "Your Canvas API access token. Generate one at Canvas > Account > Settings > Approved Integrations > New Access Token",
          sensitive: true,
          required: true,
        },
        canvas_base_url: {
          type: "string",
          title: "Canvas Base URL",
          description: "Your school's Canvas URL (e.g., https://yourschool.instructure.com)",
          required: true,
        },
        canvas_student_id: {
          type: "string",
          title: "Student ID (Optional)",
          description:
            "Required for parent/observer accounts. Leave empty if you're a student viewing your own data.",
          required: false,
          default: "",
        },
      },
      tools: [
        { name: "get_courses", description: "List all courses with current grades" },
        { name: "get_missing_assignments", description: "Get assignments flagged as missing by Canvas" },
        { name: "get_unsubmitted_past_due", description: "Get past-due assignments not yet submitted" },
        { name: "get_upcoming_assignments", description: "Get assignments due soon for a specific course" },
        { name: "get_due_this_week", description: "Get all assignments due across all courses" },
        { name: "list_assignments", description: "Search and filter assignments by status" },
        { name: "get_stats", description: "Get late/missing statistics by course" },
        { name: "get_todo", description: "Get planner items and to-do list" },
      ],
    };
    await Deno.writeTextFile("npm/manifest.json", JSON.stringify(manifest, null, 2));
  },
});

console.log("\n✓ npm package built successfully in ./npm");
console.log("\nNext steps:");
console.log("  1. cd npm");
console.log("  2. npm publish --access public");
console.log("\nOr test locally with:");
console.log("  cd npm && npm link");
console.log("  canvas-mcp");
