/**
 * Inbox Service
 * Get conversation messages from Canvas inbox
 *
 * Used by:
 * - CLI: `canvas inbox`
 * - MCP: `get_inbox`
 *
 * Note: The Conversations API is user-scoped. Observer accounts
 * see their own inbox, not the student's.
 */

import { listConversations } from "../api/conversations.ts";
import type { InboxItem } from "./types.ts";

export interface GetInboxOptions {
  studentId: string;
  scope?: "inbox" | "unread" | "archived" | "starred" | "sent";
  courseId?: number;
}

export async function getInbox(
  options: GetInboxOptions,
): Promise<InboxItem[]> {
  const { scope = "inbox", courseId } = options;

  const filter = courseId ? [`course_${courseId}`] : undefined;

  const conversations = await listConversations({
    scope,
    filter,
    auto_mark_as_read: false,
  });

  const items: InboxItem[] = conversations.map((c) => ({
    id: c.id,
    subject: c.subject,
    last_message: c.last_message,
    last_message_at: c.last_message_at,
    message_count: c.message_count,
    workflow_state: c.workflow_state,
    participants: c.participants.map((p) => p.name),
    context_name: c.context_name,
  }));

  // Sort by last_message_at desc
  items.sort((a, b) => {
    if (!a.last_message_at || !b.last_message_at) return 0;
    return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
  });

  return items;
}
