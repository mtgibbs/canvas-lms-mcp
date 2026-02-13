/**
 * Canvas Observees API
 * For observer/parent accounts to list students they're observing
 */

import { getClient } from "./client.ts";
import type { User } from "../types/canvas.ts";

/**
 * List students being observed by the current user (parent/observer account)
 * Uses GET /api/v1/users/self/observees
 *
 * @returns Array of User objects for each observed student
 */
export function listObservees(): Promise<User[]> {
  const client = getClient();
  return client.getAll<User>("/users/self/observees");
}
