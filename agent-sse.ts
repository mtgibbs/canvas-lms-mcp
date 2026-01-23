/**
 * MCP Server for Canvas LMS Integration - SSE Transport
 * For remote deployment (k8s, docker, etc.)
 *
 * This uses the same shared server definition as agent.ts,
 * but with SSE transport for web-based MCP clients like Claude Desktop.
 *
 * Endpoints:
 * - GET /sse - SSE stream for server-to-client messages
 * - POST /message - JSON-RPC messages from client to server
 * - GET /health - Health check
 */

import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { ensureClient } from "./src/utils/init.ts";
import { createServer } from "./src/mcp/server.ts";

// Initialize Canvas API client
await ensureClient();

const PORT = parseInt(Deno.env.get("PORT") || "3001");

// Session state
interface Session {
  server: ReturnType<typeof createServer>;
  controller: ReadableStreamDefaultController<Uint8Array>;
  encoder: TextEncoder;
  onMessage?: (message: JSONRPCMessage) => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
}

const sessions = new Map<string, Session>();

// Create a Deno-compatible SSE transport
function createDenoSSETransport(
  session: Session,
  sessionId: string,
): Transport {
  return {
    start(): Promise<void> {
      // Send the endpoint URL as the first SSE event
      const endpointEvent = `event: endpoint\ndata: /message?sessionId=${sessionId}\n\n`;
      session.controller.enqueue(session.encoder.encode(endpointEvent));
      return Promise.resolve();
    },

    close(): Promise<void> {
      sessions.delete(sessionId);
      try {
        session.controller.close();
      } catch {
        // Already closed
      }
      session.onClose?.();
      return Promise.resolve();
    },

    send(message: JSONRPCMessage): Promise<void> {
      const event = `event: message\ndata: ${JSON.stringify(message)}\n\n`;
      try {
        session.controller.enqueue(session.encoder.encode(event));
      } catch {
        // Stream closed
      }
      return Promise.resolve();
    },

    set onmessage(handler: ((message: JSONRPCMessage) => void) | undefined) {
      session.onMessage = handler;
    },
    get onmessage() {
      return session.onMessage;
    },

    set onclose(handler: (() => void) | undefined) {
      session.onClose = handler;
    },
    get onclose() {
      return session.onClose;
    },

    set onerror(handler: ((error: Error) => void) | undefined) {
      session.onError = handler;
    },
    get onerror() {
      return session.onError;
    },
  };
}

// Handle SSE connection
function handleSSE(): Response {
  const sessionId = crypto.randomUUID();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Create session
      const session: Session = {
        server: createServer(),
        controller,
        encoder,
      };
      sessions.set(sessionId, session);

      // Create transport and connect
      const transport = createDenoSSETransport(session, sessionId);
      session.server.connect(transport);
    },
    cancel() {
      const session = sessions.get(sessionId);
      if (session) {
        sessions.delete(sessionId);
        session.onClose?.();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// Handle incoming messages
async function handleMessage(req: Request, sessionId: string): Promise<Response> {
  const session = sessions.get(sessionId);

  if (!session) {
    return new Response(JSON.stringify({ error: "Session not found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const message = (await req.json()) as JSONRPCMessage;

    // Deliver the message to the transport's onmessage handler
    if (session.onMessage) {
      session.onMessage(message);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Message handling error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
}

// Main request handler
function handler(req: Request): Response | Promise<Response> {
  const url = new URL(req.url);

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // Health check
  if (url.pathname === "/health") {
    return new Response(
      JSON.stringify({ status: "ok", server: "canvas-mcp-sse", sessions: sessions.size }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // SSE endpoint
  if (url.pathname === "/sse" && req.method === "GET") {
    return handleSSE();
  }

  // Message endpoint
  if (url.pathname === "/message" && req.method === "POST") {
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing sessionId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return handleMessage(req, sessionId);
  }

  return new Response("Not Found", { status: 404 });
}

console.log(`Canvas MCP Server (SSE) listening on port ${PORT}`);
console.log(`Health check: http://localhost:${PORT}/health`);
console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
console.log(`Message endpoint: http://localhost:${PORT}/message`);

Deno.serve({ port: PORT }, handler);
