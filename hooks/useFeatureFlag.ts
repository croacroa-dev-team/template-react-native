/**
 * @fileoverview React hooks for feature flag evaluation
 * Provides `useFeatureFlag` for boolean checks and `useFeatureFlagValue`
 * for typed flag values, both backed by the FeatureFlags facade.
 * @module hooks/useFeatureFlag
 */

import { useState, useEffect } from "react";
import { FeatureFlags } from "@/services/feature-flags/feature-flag-adapter";

/**
 * Hook that resolves a boolean feature flag.
 *
 * @param flag - The flag key to evaluate
 * @param defaultValue - Value used until the flag is resolved (default `false`)
 * @returns `{ isEnabled, isLoading }`
 *
 * @example
 * ```tsx
 * const { isEnabled, isLoading } = useFeatureFlag("new_checkout");
 * if (isLoading) return <Loader />;
 * return isEnabled ? <NewCheckout /> : <OldCheckout />;
 * ```
 */
export function useFeatureFlag(flag: string, defaultValue = false) {
  const [isEnabled, setIsEnabled] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsEnabled(FeatureFlags.isEnabled(flag, defaultValue));
    setIsLoading(false);
  }, [flag, defaultValue]);

  return { isEnabled, isLoading };
}

/**
 * Hook that resolves a feature flag with an arbitrary type.
 *
 * @param flag - The flag key to evaluate
 * @param defaultValue - Value used until the flag is resolved
 * @returns `{ value, isLoading }`
 *
 * @example
 * ```tsx
 * const { value: maxItems } = useFeatureFlagValue("max_cart_items", 10);
 * ```
 */
export function useFeatureFlagValue<T>(flag: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setValue(FeatureFlags.getValue(flag, defaultValue));
    setIsLoading(false);
  }, [flag, defaultValue]);

  return { value, isLoading };
}
