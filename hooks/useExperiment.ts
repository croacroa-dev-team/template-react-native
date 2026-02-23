/**
 * @fileoverview React hook for A/B test experiment variants
 * Returns the assigned variant for a given experiment, backed by the
 * FeatureFlags facade.
 * @module hooks/useExperiment
 */

import { useState, useEffect } from "react";
import { FeatureFlags } from "@/services/feature-flags/feature-flag-adapter";

/**
 * Hook that resolves the assigned variant for an A/B test experiment.
 *
 * @param experimentId - The experiment identifier
 * @returns `{ variant, isLoading }`
 *
 * @example
 * ```tsx
 * const { variant, isLoading } = useExperiment("onboarding_flow");
 *
 * if (isLoading) return <Loader />;
 * if (variant === "variant_a") return <OnboardingA />;
 * return <OnboardingControl />;
 * ```
 */
export function useExperiment(experimentId: string) {
  const [variant, setVariant] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setVariant(FeatureFlags.getExperimentVariant(experimentId));
    setIsLoading(false);
  }, [experimentId]);

  return { variant, isLoading };
}
