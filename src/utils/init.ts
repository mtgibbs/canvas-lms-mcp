/**
 * Initialization utility for CLI commands
 */

import { loadConfig } from "./config.ts";
import { initClient } from "../api/client.ts";

let initialized = false;

/**
 * Initialize the Canvas API client
 * Safe to call multiple times - will only init once
 */
export async function ensureClient(): Promise<void> {
  if (initialized) return;

  const config = await loadConfig();
  initClient({
    baseUrl: config.baseUrl,
    apiToken: config.apiToken,
  });
  initialized = true;
}
