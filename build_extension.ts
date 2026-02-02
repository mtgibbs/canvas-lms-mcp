/**
 * Build script for creating the Desktop Extension (.mcpb) package
 *
 * This script:
 * 1. Builds the npm package (if not already built)
 * 2. Updates manifest.json version
 * 3. Uses official mcpb CLI to create the .mcpb bundle
 *
 * Run with: deno run -A build_extension.ts
 */

import { ensureDir } from "jsr:@std/fs@1";

// Get version from deno.json
const denoJson = JSON.parse(await Deno.readTextFile("./deno.json"));
const version = denoJson.version || "0.1.0";

console.log(`Building Canvas LMS MCP Desktop Extension v${version}...\n`);

// Step 1: Always rebuild npm package to ensure latest code is included
console.log("Building npm package...");
const buildProcess = new Deno.Command("deno", {
  args: ["task", "build:npm"],
  stdout: "inherit",
  stderr: "inherit",
});
const result = await buildProcess.output();
if (!result.success) {
  console.error("Failed to build npm package");
  Deno.exit(1);
}
console.log("✓ npm package built");

// Step 2: Update manifest.json version in npm directory
console.log("\nUpdating manifest version...");
const manifestPath = "./npm/manifest.json";
try {
  const manifest = JSON.parse(await Deno.readTextFile(manifestPath));
  manifest.version = version;
  await Deno.writeTextFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✓ manifest.json updated to v${version}`);
} catch {
  console.error("manifest.json not found in npm/. Run 'mcpb init' in npm/ first.");
  Deno.exit(1);
}

// Step 3: Ensure dist directory exists
await ensureDir("./dist");

// Step 4: Use mcpb CLI to pack the extension
console.log("\nPacking extension with mcpb...");
const packProcess = new Deno.Command("mcpb", {
  args: ["pack", "npm/", "dist/canvas-lms-mcp.mcpb"],
  stdout: "inherit",
  stderr: "inherit",
});

const packResult = await packProcess.output();
if (!packResult.success) {
  console.error("Failed to pack extension");
  Deno.exit(1);
}

// Get file size
const OUTPUT_FILE = "./dist/canvas-lms-mcp.mcpb";
const fileInfo = await Deno.stat(OUTPUT_FILE);
const sizeMB = (fileInfo.size / 1024 / 1024).toFixed(2);

console.log(`\n✓ Desktop Extension built successfully!`);
console.log(`  Output: ${OUTPUT_FILE} (${sizeMB} MB)`);
console.log(`\nTo install:`);
console.log(`  1. Double-click the .mcpb file, or`);
console.log(`  2. Drag it into Claude Desktop`);
