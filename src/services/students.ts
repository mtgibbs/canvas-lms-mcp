/**
 * Students service for listing observed students (parent/observer accounts)
 */

import { listObservees } from "../api/observees.ts";
import type { ObservedStudent } from "./types.ts";

/**
 * Get the list of students being observed by the current user
 * For parent/observer accounts to identify which students they can view data for
 *
 * @returns Array of observed students with id, name, short_name, and sortable_name
 */
export async function getObservedStudents(): Promise<ObservedStudent[]> {
  const observees = await listObservees();

  return observees.map((user) => ({
    id: user.id,
    name: user.name,
    short_name: user.short_name,
    sortable_name: user.sortable_name,
  }));
}
