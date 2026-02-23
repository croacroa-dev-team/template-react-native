# Analytics: PostHog Integration

Add [PostHog](https://posthog.com/docs/libraries/react-native) as an analytics provider alongside the existing console and Sentry adapters.

## Prerequisites

- A PostHog account ([sign up here](https://app.posthog.com/signup))
- Your project API key and host URL from **Project Settings**

## 1. Install the SDK

```bash
npx expo install posthog-react-native
```

## 2. Add Environment Variables

Add these to your `.env` file:

```env
EXPO_PUBLIC_POSTHOG_API_KEY=phc_your_project_api_key
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Use `https://eu.i.posthog.com` if your PostHog project is hosted in the EU region.

## 3. Create the Adapter

Create `services/analytics/posthog.ts`:

```typescript
import PostHog from "posthog-react-native";
import type { AnalyticsAdapter } from "@/services/analytics";

// Initialize the PostHog client once at module level.
// The SDK queues events internally, so it is safe to call
// track/identify immediately after construction.
const posthog = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_API_KEY!, {
  host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
  // Flush events every 30 s or when the queue hits 20 events
  flushInterval: 30000,
  flushAt: 20,
});

/** Timers are tracked locally; PostHog does not have a built-in timer API */
const timers = new Map<string, number>();

export const posthogAdapter: AnalyticsAdapter = {
  track(event, properties) {
    posthog.capture(event, properties);
  },

  identify(userId, traits) {
    posthog.identify(userId, traits);
  },

  screen(name, properties) {
    posthog.screen(name, properties);
  },

  reset() {
    posthog.reset();
    timers.clear();
  },

  setUserProperties(properties) {
    // $set persists properties on the user profile in PostHog
    posthog.capture("$set", { $set: properties });
  },

  trackRevenue(amount, currency, productId, properties) {
    posthog.capture("Purchase", {
      revenue: amount,
      currency,
      productId,
      ...properties,
    });
  },

  startTimer(event) {
    timers.set(event, Date.now());
  },

  endTimer(event, properties) {
    const start = timers.get(event);
    if (start) {
      const durationMs = Date.now() - start;
      timers.delete(event);
      posthog.capture(event, { ...properties, duration_ms: durationMs });
    }
  },
};
```

## 4. Register the Provider

The template's analytics system supports multiple providers at once. Register PostHog in `app/_layout.tsx` (or a dedicated providers file) so events flow to PostHog in addition to the default console and Sentry adapters:

```typescript
import { analytics } from "@/services/analytics";
import { posthogAdapter } from "@/services/analytics/posthog";

// Register PostHog alongside the existing adapters
analytics.addAdapter(posthogAdapter);
```

That is the only wiring needed. Every call to `track()`, `identify()`, or `screen()` throughout the app will now also be sent to PostHog.

## 5. Verify

1. Run the app: `npx expo start`
2. Trigger a few events (sign in, navigate between tabs, etc.)
3. Open the PostHog dashboard > **Activity** and confirm events appear within a minute
4. Check **Persons** to verify `identify()` linked events to the correct user

## What's Next

- **Feature flags:** Use `posthog.getFeatureFlag("flag-name")` to roll out features gradually
- **Session replay:** Enable session recording in PostHog to see exactly how users navigate your app
- **Group analytics:** Call `posthog.group("company", companyId)` to analyze usage at the organization level
- **Opt-out support:** Call `posthog.optOut()` to respect user privacy preferences and disable tracking
