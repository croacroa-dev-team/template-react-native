/**
 * @fileoverview Logger facade — singleton that delegates to the active adapter
 * @module services/logger/logger-adapter
 */

import type { LoggerAdapter, Breadcrumb } from "./types";
import { ConsoleLoggerAdapter } from "./adapters/console";
import { LOGGER } from "@/constants/config";
import { scrubString, scrub } from "@/utils/piiScrubber";

function scrubContext(
  context?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!context) return context;
  return scrub(context) as Record<string, unknown>;
}

let adapter: LoggerAdapter = new ConsoleLoggerAdapter();

/**
 * Central Logger facade.
 * Module-level singleton gated by LOGGER.ENABLED.
 */
export const Logger = {
  setAdapter(newAdapter: LoggerAdapter): void {
    adapter = newAdapter;
  },

  debug(message: string, context?: Record<string, unknown>): void {
    if (!LOGGER.ENABLED) return;
    adapter.debug(scrubString(message), scrubContext(context));
  },

  info(message: string, context?: Record<string, unknown>): void {
    if (!LOGGER.ENABLED) return;
    adapter.info(scrubString(message), scrubContext(context));
  },

  warn(message: string, context?: Record<string, unknown>): void {
    if (!LOGGER.ENABLED) return;
    adapter.warn(scrubString(message), scrubContext(context));
  },

  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    if (!LOGGER.ENABLED) return;
    adapter.error(scrubString(message), error, scrubContext(context));
  },

  fatal(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    if (!LOGGER.ENABLED) return;
    adapter.fatal(scrubString(message), error, scrubContext(context));
  },

  addBreadcrumb(
    category: string,
    message: string,
    data?: Record<string, unknown>
  ): void {
    if (!LOGGER.ENABLED) return;
    adapter.addBreadcrumb(category, scrubString(message), scrubContext(data));
  },

  getBreadcrumbs(): Breadcrumb[] {
    return adapter.getBreadcrumbs();
  },

  setContext(key: string, value: unknown): void {
    adapter.setContext(key, value);
  },

  clearContext(): void {
    adapter.clearContext();
  },

  /**
   * Returns a scoped logger that merges the given context into every call.
   */
  withContext(ctx: Record<string, unknown>) {
    return {
      debug: (msg: string, extra?: Record<string, unknown>) =>
        Logger.debug(msg, { ...ctx, ...extra }),
      info: (msg: string, extra?: Record<string, unknown>) =>
        Logger.info(msg, { ...ctx, ...extra }),
      warn: (msg: string, extra?: Record<string, unknown>) =>
        Logger.warn(msg, { ...ctx, ...extra }),
      error: (msg: string, err?: Error, extra?: Record<string, unknown>) =>
        Logger.error(msg, err, { ...ctx, ...extra }),
      fatal: (msg: string, err?: Error, extra?: Record<string, unknown>) =>
        Logger.fatal(msg, err, { ...ctx, ...extra }),
    };
  },
};
