/**
 * Type definitions for MCP tools and prompts
 */

import type { z } from "zod";

/**
 * Tool annotations for MCP protocol
 * These hints describe tool behavior for safety and UI purposes
 */
export interface ToolAnnotations {
  /** If true, the tool does not modify its environment (read-only operation) */
  readOnlyHint?: boolean;
  /** If true, the tool may perform destructive updates */
  destructiveHint?: boolean;
  /** If true, repeated calls with same args have no additional effect */
  idempotentHint?: boolean;
  /** If true, tool interacts with external entities */
  openWorldHint?: boolean;
}

/**
 * Tool definition that can be registered with the MCP server
 *
 * Use the generic version for type-safe tool definitions.
 * The non-generic version is used for collections of tools with different schemas.
 */
export interface ToolDefinition<T extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  description: string;
  schema: T;
  annotations?: ToolAnnotations;
  handler: (args: z.infer<z.ZodObject<T>>) => Promise<ToolResponse>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyToolDefinition = ToolDefinition<any>;

/**
 * Standard tool response format
 */
export interface ToolResponse {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
    uri?: string;
  }>;
  isError?: boolean;
}

/**
 * Prompt argument definition
 */
export interface PromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

/**
 * Prompt definition that can be registered with the MCP server
 */
export interface PromptDefinition {
  name: string;
  description: string;
  arguments: PromptArgument[];
  handler: (args: Record<string, string | undefined>) => PromptResponse;
}

/**
 * Standard prompt response format
 */
export interface PromptResponse {
  messages: Array<{
    role: "user" | "assistant";
    content: {
      type: "text";
      text: string;
    };
  }>;
}

/**
 * Helper to create a JSON text response (most common pattern)
 */
export function jsonResponse(data: unknown): ToolResponse {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Helper to create an error response
 */
export function errorResponse(message: string): ToolResponse {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}
