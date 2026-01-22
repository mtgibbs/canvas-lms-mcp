/**
 * MCP Server for Canvas LMS Integration
 *
 * This is the entry point for the MCP server. It initializes the Canvas API
 * client and starts the MCP server with stdio transport.
 *
 * Tools and prompts are defined in src/mcp/tools and src/mcp/prompts.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ensureClient } from "./src/utils/init.ts";
import { createServer } from "./src/mcp/server.ts";

// Initialize Canvas API client
await ensureClient();

// Create and start the MCP server
const server = createServer();
const transport = new StdioServerTransport();
await server.connect(transport);
