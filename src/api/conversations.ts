/**
 * Canvas Conversations API
 */

import { getClient } from "./client.ts";
import type { Conversation } from "../types/canvas.ts";

export interface ListConversationsOptions {
  scope?: "inbox" | "unread" | "archived" | "starred" | "sent";
  filter?: string[];
  /** Prevent marking messages as read when fetching */
  auto_mark_as_read?: boolean;
}

/**
 * List conversations (inbox messages)
 * Uses GET /api/v1/conversations
 */
export function listConversations(
  options?: ListConversationsOptions,
): Promise<Conversation[]> {
  const client = getClient();

  const params: Record<string, string | string[] | boolean | undefined> = {
    // Default to not marking as read
    auto_mark_as_read: options?.auto_mark_as_read ?? false,
  };

  if (options?.scope) {
    params.scope = options.scope;
  }
  if (options?.filter) {
    params.filter = options.filter;
  }

  return client.getAll<Conversation>("/conversations", params);
}
