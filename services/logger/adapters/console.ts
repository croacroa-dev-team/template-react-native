/**
 * @fileoverview Console-based logger adapter
 * @module services/logger/adapters/console
 */

import type { LoggerAdapter, LogLevel, Breadcrumb } from "../types";
import { LOGGER } from "@/constants/config";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

export class ConsoleLoggerAdapter implements LoggerAdapter {
  private breadcrumbs: Breadcrumb[] = [];
  private context: Record<string, unknown> = {};
  private minLevel: LogLevel;
  private maxBreadcrumbs: number;

  constructor(minLevel?: LogLevel, maxBreadcrumbs?: number) {
    this.minLevel = minLevel ?? (LOGGER.MIN_LEVEL as LogLevel);
    this.maxBreadcrumbs = maxBreadcrumbs ?? LOGGER.MAX_BREADCRUMBS;
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[this.minLevel];
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): string {
    const timestamp = new Date().toISOString();
    const merged = { ...this.context, ...context };
    const contextStr =
      Object.keys(merged).length > 0 ? ` ${JSON.stringify(merged)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog("debug")) return;
    console.log(this.formatMessage("debug", message, context));
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog("info")) return;
    console.log(this.formatMessage("info", message, context));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog("warn")) return;
    console.warn(this.formatMessage("warn", message, context));
  }

  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    if (!this.shouldLog("error")) return;
    const ctx = error
      ? { ...context, errorMessage: error.message, stack: error.stack }
      : context;
    console.error(this.formatMessage("error", message, ctx));
  }

  fatal(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    if (!this.shouldLog("fatal")) return;
    const ctx = error
      ? { ...context, errorMessage: error.message, stack: error.stack }
      : context;
    console.error(this.formatMessage("fatal", message, ctx));
  }

  addBreadcrumb(
    category: string,
    message: string,
    data?: Record<string, unknown>
  ): void {
    this.breadcrumbs.push({
      timestamp: Date.now(),
      category,
      message,
      data,
    });
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  setContext(key: string, value: unknown): void {
    this.context[key] = value;
  }

  clearContext(): void {
    this.context = {};
  }
}
