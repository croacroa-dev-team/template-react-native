import { useState, useCallback, useEffect } from "react";
import * as StoreReview from "expo-store-review";
import { storage } from "@/services/storage";
import { IN_APP_REVIEW } from "@/constants/config";
import { useAppStore } from "@/stores/appStore";

const LAST_REVIEW_PROMPT_DATE_KEY = "LAST_REVIEW_PROMPT_DATE";

interface UseInAppReviewReturn {
  requestReview: () => Promise<void>;
  isAvailable: boolean;
  hasRequested: boolean;
}

/**
 * Hook for requesting in-app reviews with throttling and session gating.
 *
 * - Won't show if fewer than MIN_SESSIONS sessions have occurred
 * - Won't show if the last prompt was less than DAYS_BETWEEN_PROMPTS days ago
 * - Tracks whether a review was requested in this session
 */
export function useInAppReview(): UseInAppReviewReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const sessionCount = useAppStore((s) => s.sessionCount);

  useEffect(() => {
    StoreReview.isAvailableAsync().then(setIsAvailable).catch(() => setIsAvailable(false));
  }, []);

  const requestReview = useCallback(async () => {
    // Already requested this session
    if (hasRequested) return;

    // Platform doesn't support in-app review
    if (!isAvailable) return;

    // Not enough sessions yet
    if (sessionCount < IN_APP_REVIEW.MIN_SESSIONS) return;

    // Check throttle window
    const lastPromptDate = await storage.get<string>(LAST_REVIEW_PROMPT_DATE_KEY);
    if (lastPromptDate) {
      const daysSinceLastPrompt =
        (Date.now() - new Date(lastPromptDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastPrompt < IN_APP_REVIEW.DAYS_BETWEEN_PROMPTS) return;
    }

    try {
      await StoreReview.requestReview();
      setHasRequested(true);
      await storage.set(LAST_REVIEW_PROMPT_DATE_KEY, new Date().toISOString());
    } catch (error) {
      console.error("Failed to request in-app review:", error);
    }
  }, [hasRequested, isAvailable, sessionCount]);

  return { requestReview, isAvailable, hasRequested };
}
