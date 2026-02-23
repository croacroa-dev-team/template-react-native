/**
 * @fileoverview Feature-gated content component
 * Renders children only when a feature flag is enabled,
 * otherwise shows an optional fallback.
 * @module components/ui/FeatureGate
 */

import { ReactNode } from "react";

import { useFeatureFlag } from "@/hooks/useFeatureFlag";

// ============================================================================
// Props
// ============================================================================

interface FeatureGateProps {
  /** The feature flag key to evaluate */
  flag: string;
  /** Content to render when the flag is enabled */
  children: ReactNode;
  /** Optional content to render when the flag is disabled */
  fallback?: ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Declarative component that shows or hides content based on a feature flag.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <FeatureGate flag="new_dashboard">
 *   <NewDashboard />
 * </FeatureGate>
 * ```
 *
 * @example
 * ```tsx
 * // With fallback
 * <FeatureGate flag="redesigned_profile" fallback={<OldProfile />}>
 *   <NewProfile />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  flag,
  children,
  fallback = null,
}: FeatureGateProps) {
  const { isEnabled, isLoading } = useFeatureFlag(flag);

  if (isLoading) return null;
  return isEnabled ? <>{children}</> : <>{fallback}</>;
}
