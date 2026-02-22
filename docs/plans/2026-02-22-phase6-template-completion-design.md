# Phase 6: Template Completion Design

**Date:** 2026-02-22
**Version:** 2.1.0 -> 3.0.0
**Scope:** 7 new feature domains

## Overview

Complete the React Native template with 7 missing feature domains, using a mix of "clé en main" (turnkey) solutions and adapter pattern bases depending on the domain.

## Domains

### 1. Permission Management (Turnkey)

**Goal:** Centralized permission handling with great UX.

**Files:**
- `services/permissions/permission-manager.ts` — Centralized service
- `services/permissions/types.ts` — Permission types
- `hooks/usePermission.ts` — Generic hook returning `{ status, request, openSettings }`
- `components/ui/PermissionGate.tsx` — Wrapper component for permission-gated content

**Features:**
- Support: Camera, Location, Contacts, Media Library, Microphone, Notifications
- "Don't ask again" detection with Settings redirect
- First refusal tracking to adapt messaging

**Dependencies:** `expo-camera`, `expo-location`, `expo-contacts`, `expo-media-library`

---

### 2. Animations / UX Polish (Turnkey)

**Goal:** Production-quality animations and transitions out of the box.

**Files:**
- `utils/animations/transitions.ts` — Screen transition configs for Expo Router
- `utils/animations/presets.ts` — Reusable animation presets
- `hooks/useAnimatedEntry.ts` — Fade/slide-in on mount
- `hooks/useParallax.ts` — Parallax effect for scroll
- `components/ui/AnimatedScreen.tsx` — Screen wrapper with entry/exit animations
- `components/ui/AnimatedList.tsx` — Stagger animation for list items

**Features:**
- Screen transition presets (slide, fade, modal) via Expo Router
- Configurable entry animations (fade, slide-up, scale)
- Cascade/stagger list item animations
- Parallax scroll effect

**Dependencies:** None new (uses existing `react-native-reanimated`)

---

### 3. Social Login (Turnkey)

**Goal:** Google and Apple Sign-In ready to use.

**Files:**
- `services/auth/adapters/social/google.ts` — Google Sign-In adapter
- `services/auth/adapters/social/apple.ts` — Apple Sign-In adapter
- `services/auth/social-auth.ts` — Orchestrator
- `components/auth/SocialLoginButtons.tsx` — Styled buttons (Apple/Google guidelines)
- Update `app/(public)/login.tsx` with social buttons
- Update `app.config.ts` with OAuth schemes

**Features:**
- Google Sign-In via `expo-auth-session`
- Apple Sign-In via `expo-apple-authentication`
- Integration with existing auth flow (Zustand store + token management)
- Platform-aware (Apple Sign-In only on iOS)

**Dependencies:** `expo-auth-session`, `expo-web-browser`, `expo-apple-authentication`, `expo-crypto`

---

### 4. Analytics (Adapter Pattern)

**Goal:** Pluggable analytics with zero vendor lock-in.

**Files:**
- `services/analytics/analytics-adapter.ts` — Abstract interface
- `services/analytics/adapters/console.ts` — Dev adapter (console.log)
- `services/analytics/types.ts` — Event types
- `hooks/useTrackScreen.ts` — Auto-track screen views
- `hooks/useTrackEvent.ts` — Track custom events
- `components/providers/AnalyticsProvider.tsx` — Provider initialization

**Interface:**
```typescript
interface AnalyticsAdapter {
  initialize(): Promise<void>;
  track(event: string, properties?: Record<string, unknown>): void;
  screen(name: string, properties?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
  reset(): void;
}
```

**Dependencies:** None required (console adapter by default)

---

### 5. Payment Infrastructure (Adapter Pattern)

**Goal:** Payment/subscription foundation with mock for dev.

**Files:**
- `services/payments/payment-adapter.ts` — Abstract interface
- `services/payments/adapters/mock.ts` — Mock adapter for dev/testing
- `services/payments/types.ts` — Product, Purchase, Subscription types
- `hooks/useProducts.ts` — List products/plans
- `hooks/usePurchase.ts` — Purchase flow
- `hooks/useSubscription.ts` — Subscription status
- `components/ui/Paywall.tsx` — Generic paywall component
- `components/ui/PurchaseButton.tsx` — Purchase button with loading states

**Interface:**
```typescript
interface PaymentAdapter {
  initialize(): Promise<void>;
  getProducts(ids: string[]): Promise<Product[]>;
  purchase(productId: string): Promise<Purchase>;
  restorePurchases(): Promise<Purchase[]>;
  getSubscriptionStatus(): Promise<SubscriptionStatus>;
}
```

**Dependencies:** None required (mock adapter by default)

---

### 6. File Upload / Media (Lightweight + Hooks)

**Goal:** Image/video selection, compression, and upload with progress.

**Files:**
- `services/media/media-picker.ts` — Image/video selection wrapper
- `services/media/media-upload.ts` — Upload with progress tracking
- `services/media/compression.ts` — Image compression
- `hooks/useImagePicker.ts` — Pick + compress + preview in one hook
- `hooks/useUpload.ts` — Upload with progress, retry, cancel
- `components/ui/ImagePickerButton.tsx` — Selection button
- `components/ui/UploadProgress.tsx` — Progress bar component

**Features:**
- Image compression before upload (configurable quality)
- Upload progress tracking
- Retry and cancel support
- Integration with permission system (camera/media library)

**Dependencies:** `expo-image-manipulator`

---

### 7. WebSockets / Real-time (Lightweight + Hooks)

**Goal:** WebSocket foundation with auto-reconnect and offline awareness.

**Files:**
- `services/realtime/websocket-manager.ts` — Connection manager
- `services/realtime/types.ts` — Message types
- `hooks/useWebSocket.ts` — Connection lifecycle hook
- `hooks/useChannel.ts` — Channel subscription hook
- `hooks/usePresence.ts` — User presence tracking

**Features:**
- Auto-reconnect with exponential backoff
- Heartbeat/ping-pong
- Offline queue (pause when offline, resume when online)
- Auth token injection
- Channel-based subscriptions
- Presence tracking (online/offline users)

**Dependencies:** None (uses native WebSocket API)

---

## New Dependencies Summary

| Package | Purpose | Required |
|---------|---------|----------|
| `expo-camera` | Camera permissions | Yes |
| `expo-location` | Location permissions | Yes |
| `expo-contacts` | Contacts permissions | Yes |
| `expo-media-library` | Media library permissions | Yes |
| `expo-auth-session` | OAuth flows | Yes |
| `expo-web-browser` | OAuth redirects | Yes |
| `expo-apple-authentication` | Apple Sign-In | Yes |
| `expo-crypto` | PKCE for OAuth | Yes |
| `expo-image-manipulator` | Image compression | Yes |

## Architecture Decisions

- **Adapter pattern** for analytics and payments: consistent with existing auth adapter pattern (ADR-004)
- **Turnkey** for permissions, animations, social login: universal needs, consistent implementation
- **Lightweight hooks** for uploads and websockets: project-specific requirements vary too much for full integration
