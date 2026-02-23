/**
 * @fileoverview Logger type definitions
 * @module services/logger/types
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface Breadcrumb {
  timestamp: number;
  category: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface LoggerAdapter {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void;
  fatal(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void;
  addBreadcrumb(
    category: string,
    message: string,
    data?: Record<string, unknown>
  ): void;
  getBreadcrumbs(): Breadcrumb[];
  setContext(key: string, value: unknown): void;
  clearContext(): void;
}
