/**
 * MCP Server for Canvas LMS Integration - HTTP Transport
 * For remote deployment (k8s, docker, etc.)
 *
 * This uses the same shared server definition as agent.ts,
 * but with Hono + Streamable HTTP transport for web-based access.
 */

import { Hono } from "hono";
import { StreamableHTTPTransport } from "@hono/mcp";
import { ensureClient } from "./src/utils/init.ts";
import { createServer } from "./src/mcp/server.ts";

// Initialize Canvas API client
await ensureClient();

// Create the MCP server (shared with agent.ts)
const server = createServer();

// Create Hono app
const app = new Hono();

// Create the transport
const transport = new StreamableHTTPTransport();

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok", server: "canvas-mcp" });
});

// MCP endpoint - handles all MCP communication
app.all("/mcp", async (c) => {
  // Connect server to transport if not already connected
  if (!server.server.transport) {
    await server.connect(transport);
  }
  return transport.handleRequest(c);
});

// Legacy SSE endpoint redirect for backwards compatibility
app.get("/sse", (c) => {
  return c.redirect("/mcp");
});

// Start the server
const PORT = parseInt(Deno.env.get("PORT") || "3001");

console.log(`Canvas MCP Server (HTTP) listening on port ${PORT}`);
console.log(`Health check: http://localhost:${PORT}/health`);
console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);

Deno.serve({ port: PORT }, app.fetch);
