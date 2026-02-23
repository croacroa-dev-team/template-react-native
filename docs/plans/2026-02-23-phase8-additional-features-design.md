# Phase 8: Additional Features Design

**Date:** 2026-02-23
**Version:** 3.1.0 → 3.2.0
**Scope:** 8 features, ~17 files

## Overview

Complete the template with 8 remaining features identified during the post-Phase 6 audit: rate limiting UI, app force update, in-app review, crash recovery, feature flags with A/B testing, accessibility testing, and HTTP ETag caching.

---

## 1. Rate Limiting UI

**Goal:** Give users feedback when API returns 429 Too Many Requests.

**Changes:**
- Modify `services/api.ts` — intercept 429 responses, extract `Retry-After` header, show toast, emit rate limit event
- Create `hooks/useRateLimit.ts` — exposes `{ isRateLimited, retryAfter, resetTime }` for UI (disable buttons, show countdown)

**i18n:** `errors.rateLimited` key in all 5 locales.

---

## 2. App Force Update

**Goal:** Block the app when a mandatory native update is required.

**Files:**
- `services/force-update.ts` — checks a configurable endpoint, compares `currentVersion` (expo-constants) vs `minimumVersion` from server. Mock returns `isUpdateRequired: false` by default.
- `hooks/useForceUpdate.ts` — checks on launch, returns `{ isUpdateRequired, storeUrl, currentVersion, minimumVersion }`
- `components/ui/ForceUpdateScreen.tsx` — non-dismissible full-screen modal with "Update Now" button that opens the store URL

**Config:** `FORCE_UPDATE_CHECK_URL` in constants/config.ts.

**i18n:** `forceUpdate.title`, `forceUpdate.message`, `forceUpdate.button`.

---

## 3. In-App Review

**Goal:** Request App Store / Play Store review after positive milestones.

**Dependencies:** `expo-store-review`

**Files:**
- `hooks/useInAppReview.ts` — `{ requestReview, isAvailable, hasRequested }`
- Throttle logic: tracks last prompt date in AsyncStorage, respects minimum days between prompts
- Session counter in `appStore` (Zustand), incremented at root layout mount

**Config:** `IN_APP_REVIEW.MIN_SESSIONS: 5`, `IN_APP_REVIEW.DAYS_BETWEEN_PROMPTS: 30`

---

## 4. Crash Recovery / Restart

**Goal:** Add proper hard reset capability to the existing ErrorBoundary.

**Changes to `components/ui/ErrorBoundary.tsx`:**
- Two recovery levels: soft reset (existing re-render) and hard reset (clear nav + stores + `Updates.reloadAsync()`)
- Consecutive crash counter: after 3 failed soft resets → auto-propose hard reset
- Sentry context: send crash count for crash loop diagnostics

**i18n:** `errors.crashTitle`, `errors.crashMessage`, `errors.tryAgain`, `errors.restartApp`

---

## 5. Feature Flags + A/B Testing (Adapter Pattern)

**Goal:** Dynamic feature flags with experiment variant support.

**Interface:**
```typescript
interface FeatureFlagAdapter {
  initialize(): Promise<void>;
  isEnabled(flag: string): boolean;
  getValue<T>(flag: string, defaultValue: T): T;
  getExperimentVariant(experimentId: string): string | null;
  identify(userId: string, attributes?: Record<string, unknown>): void;
  refresh(): Promise<void>;
}
```

**Files:**
- `services/feature-flags/types.ts` — types and interface
- `services/feature-flags/feature-flag-adapter.ts` — FeatureFlags facade with `setAdapter()`
- `services/feature-flags/adapters/mock.ts` — MockFeatureFlagAdapter (in-memory flags, configurable for dev/testing)
- `hooks/useFeatureFlag.ts` — `{ isEnabled, isLoading }`
- `hooks/useExperiment.ts` — `{ variant, isLoading }`
- `components/ui/FeatureGate.tsx` — declarative show/hide based on flag (same pattern as PermissionGate)
- `docs/guides/feature-flags-launchdarkly.md` — integration guide for LaunchDarkly

**Config:** `FEATURE_FLAGS.REFRESH_INTERVAL_MS: 300000` (5 min)

---

## 6. Accessibility Testing

**Goal:** Automated a11y tests for core UI components.

**Files:**
- `__tests__/helpers/a11y.ts` — reusable assertion helpers: `expectAccessibleButton()`, `expectAccessibleInput()`, `expectAccessibleImage()`. Checks: accessibilityRole, accessibilityLabel non-empty, accessibilityState correct.
- `__tests__/accessibility/components.test.tsx` — tests Button, Input, Switch, Modal, Card for a11y compliance

**Dependencies:** None new (uses existing @testing-library/react-native)

---

## 7. Network Caching / ETags

**Goal:** Reduce bandwidth with HTTP conditional requests.

**Changes to `services/api.ts`:**
- In-memory ETag cache (Map<url, { etag, data }>)
- On response: store ETag header + response body
- On request: add `If-None-Match` header with cached ETag
- On 304 response: return cached data without parsing body

**Config:** `API_CONFIG.ENABLE_ETAG_CACHE: true` in constants/config.ts.

---

## 8. Supporting Changes

**i18n keys (all 5 locales):**
- `errors.rateLimited`
- `forceUpdate.title`, `forceUpdate.message`, `forceUpdate.button`
- `errors.crashTitle`, `errors.crashMessage`, `errors.tryAgain`, `errors.restartApp`

**Config additions (constants/config.ts):**
- `FORCE_UPDATE_CHECK_URL`
- `IN_APP_REVIEW.MIN_SESSIONS`, `IN_APP_REVIEW.DAYS_BETWEEN_PROMPTS`
- `FEATURE_FLAGS.REFRESH_INTERVAL_MS`
- `API_CONFIG.ENABLE_ETAG_CACHE`

**Barrel exports:** Update `hooks/index.ts`, `services/index.ts`, `components/ui/index.ts`
