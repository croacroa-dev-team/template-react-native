/**
 * @fileoverview Provider components for app-wide functionality
 * @module components/providers
 *
 * Error Boundary Usage:
 * - Use `ErrorBoundary` (from components/ErrorBoundary) for app root with Sentry integration
 * - Use `LocalErrorBoundary` for local async patterns (lighter, no Sentry)
 */

// Main ErrorBoundary with Sentry integration - use at app root
export { ErrorBoundary, withErrorBoundary } from "../ErrorBoundary";

// Local boundaries for async patterns - lighter weight, no Sentry
export {
  LocalErrorBoundary,
  SuspenseBoundary,
  AsyncBoundary,
  QueryBoundary,
  BoundaryProvider,
  useBoundary,
} from "./SuspenseBoundary";

// Analytics
export { AnalyticsProvider } from "./AnalyticsProvider";
