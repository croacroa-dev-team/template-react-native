# Phase 7: Polish & Documentation Design

**Date:** 2026-02-23
**Version:** 3.0.0 → 3.1.0
**Scope:** 3 improvement domains

## Overview

Strengthen the template with full i18n coverage across all screens, comprehensive tests for Phase 6 hooks, and concrete integration guides for the 3 most popular providers (Supabase, RevenueCat, PostHog).

## Domain 1: Screen Internationalization

**Goal:** Replace all hardcoded strings in the 6 app screens with i18n `t()` calls.

**Screens:**
- `app/(public)/login.tsx` — 9 hardcoded strings
- `app/(public)/register.tsx` — 10 hardcoded strings
- `app/(public)/forgot-password.tsx` — 10 hardcoded strings (zero i18n currently)
- `app/(auth)/home.tsx` — 8 hardcoded strings
- `app/(auth)/profile.tsx` — 6 hardcoded strings
- `app/(auth)/settings.tsx` — 8 hardcoded strings

**New i18n sections:**
- `forgotPassword.*` (8 keys) — entirely new section
- `home.*` (6 keys) — entirely new section

**Extended sections:**
- `auth.*` (+3 keys: createPasswordPlaceholder, confirmPasswordPlaceholder, passwordHintFull)
- `profile.*` (+2 keys: privacySecurity, helpSupport)
- `settings.*` (+2 keys: darkMode, appVersion)

**Languages:** All 5 (en, fr, es, de, ar) updated to stay in sync.

---

## Domain 2: Phase 6 Hook Tests

**Goal:** Add ~54 tests across 6 test files covering all 13 Phase 6 hooks.

**Test files:**

| File | Hooks | Tests |
|------|-------|-------|
| `__tests__/hooks/usePermission.test.ts` | usePermission | ~8 |
| `__tests__/hooks/usePayments.test.ts` | useProducts, usePurchase, useSubscription | ~12 |
| `__tests__/hooks/useMedia.test.ts` | useImagePicker, useUpload | ~10 |
| `__tests__/hooks/useWebSocket.test.ts` | useWebSocket, useChannel, usePresence | ~12 |
| `__tests__/hooks/useAnimations.test.ts` | useAnimatedEntry, useParallax | ~6 |
| `__tests__/hooks/useAnalytics.test.ts` | useTrackScreen, useTrackEvent | ~6 |

**Patterns:** Follow existing `useAuth.test.tsx` conventions — `renderHook`, `act`, `waitFor`, `jest.mock` for services, `QueryClientProvider` wrapper where needed.

---

## Domain 3: Adapter Integration Guides

**Goal:** 3 copy-paste-ready guides for the most popular providers.

**Files:**
- `docs/guides/auth-supabase.md` — Supabase auth adapter (~100 lines)
- `docs/guides/payments-revenuecat.md` — RevenueCat payment adapter (~100 lines)
- `docs/guides/analytics-posthog.md` — PostHog analytics adapter (~100 lines)

**Structure per guide:**
1. Prerequisites & installation
2. Environment configuration
3. Full adapter implementation (complete, working code)
4. Integration (which line to change)
5. Verification steps

**Providers chosen:** Supabase (auth), RevenueCat (payments), PostHog (analytics) — most popular in the React Native ecosystem.

---

## Architecture Decisions

- **i18n:** Extend existing key structure, no breaking changes to existing keys
- **Tests:** One file per domain (not one per hook) to keep test structure manageable
- **Guides:** Standalone markdown files in `docs/guides/`, not ADRs (these are how-to, not decision records)
