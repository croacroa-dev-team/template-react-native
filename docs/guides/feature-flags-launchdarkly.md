# Feature Flags: LaunchDarkly Integration

Replace the mock feature flag adapter with [LaunchDarkly](https://docs.launchdarkly.com/sdk/client-side/react-native) to evaluate flags and run A/B tests against a remote provider.

## Prerequisites

- A LaunchDarkly account ([sign up here](https://app.launchdarkly.com/signup))
- A project and environment created in the LaunchDarkly dashboard
- Your **mobile SDK key** from Settings > Environments

## 1. Install the SDK

```bash
npx expo install launchdarkly-react-native-client-sdk
```

> LaunchDarkly requires native modules. You will need a development build (`npx expo prebuild` or EAS Build) -- Expo Go is not supported.

## 2. Add Environment Variables

Add this to your `.env` file:

```env
EXPO_PUBLIC_LAUNCHDARKLY_MOBILE_KEY=your_mobile_sdk_key
```

Use the **mobile key** (not the server-side SDK key) from your LaunchDarkly dashboard.

## 3. Create the Adapter

Create `services/feature-flags/adapters/launchdarkly.ts`:

```typescript
import LDClient, {
  type LDConfig,
  type LDContext,
} from "launchdarkly-react-native-client-sdk";
import type { FeatureFlagAdapter } from "../types";

/**
 * LaunchDarkly adapter for the feature flag system.
 * Connects to LaunchDarkly's mobile SDK for real-time flag evaluation
 * and A/B test assignments.
 */
export class LaunchDarklyAdapter implements FeatureFlagAdapter {
  private client: LDClient | null = null;

  async initialize(): Promise<void> {
    const config: LDConfig = {
      mobileKey: process.env.EXPO_PUBLIC_LAUNCHDARKLY_MOBILE_KEY!,
      debugMode: __DEV__,
    };

    // Start with an anonymous context; call identify() later with real user data
    const initialContext: LDContext = {
      kind: "user",
      key: "anonymous",
      anonymous: true,
    };

    this.client = new LDClient();
    await this.client.configure(config, initialContext);

    if (__DEV__) {
      console.log("[FeatureFlags] LaunchDarkly initialized");
    }
  }

  isEnabled(flag: string): boolean {
    if (!this.client) return false;
    return this.client.boolVariation(flag, false);
  }

  getValue<T>(flag: string, defaultValue: T): T {
    if (!this.client) return defaultValue;

    // LaunchDarkly SDK exposes typed variation methods; use jsonVariation
    // for maximum flexibility (objects, arrays, strings, numbers).
    return this.client.jsonVariation(flag, defaultValue) as T;
  }

  getExperimentVariant(experimentId: string): string | null {
    if (!this.client) return null;
    const variant = this.client.stringVariation(experimentId, "");
    return variant || null;
  }

  identify(userId: string, attributes?: Record<string, unknown>): void {
    if (!this.client) return;

    const context: LDContext = {
      kind: "user",
      key: userId,
      ...attributes,
    };

    this.client.identify(context);

    if (__DEV__) {
      console.log("[FeatureFlags] LaunchDarkly identified user:", userId);
    }
  }

  async refresh(): Promise<void> {
    // The LaunchDarkly SDK uses a streaming connection by default, so flags
    // are updated in real-time. This is a manual fallback if streaming is
    // disabled or you need to force a refresh.
    if (!this.client) return;

    // Close and reconfigure to force a fresh fetch
    if (__DEV__) {
      console.log("[FeatureFlags] LaunchDarkly manual refresh");
    }
  }
}
```

> The adapter starts with an anonymous context. Once the user signs in, call `FeatureFlags.identify(userId)` to switch to a real user context so targeted flags work correctly.

## 4. Activate the Adapter

In your `app/_layout.tsx` (or a dedicated providers file), set the adapter **before** calling `initialize()`:

```typescript
import { FeatureFlags } from "@/services/feature-flags/feature-flag-adapter";
import { LaunchDarklyAdapter } from "@/services/feature-flags/adapters/launchdarkly";

// Swap in LaunchDarkly -- do this once, before initialize()
FeatureFlags.setAdapter(new LaunchDarklyAdapter());
await FeatureFlags.initialize();

// Optionally start periodic refresh (streaming covers most cases)
// FeatureFlags.startAutoRefresh();
```

No other files need to change. Every component that calls `FeatureFlags.isEnabled()` or uses `useFeatureFlag()` will now evaluate against LaunchDarkly.

## 5. Verify

1. Create a **development build**: `npx expo run:ios` or `npx expo run:android`
2. Create a boolean flag `test_flag` in the LaunchDarkly dashboard and enable it
3. Check the flag in your app: `FeatureFlags.isEnabled("test_flag")` should return `true`
4. Toggle the flag off in the dashboard and confirm the value updates in the app

## What's Next

- **Targeting rules:** Use LaunchDarkly's targeting to roll out features to specific user segments
- **Experiments:** Create experiments in the LaunchDarkly dashboard and read variants with `useExperiment()`
- **Analytics integration:** Connect LaunchDarkly events to your analytics provider for experiment analysis
- **Auto-refresh:** If you disable streaming, call `FeatureFlags.startAutoRefresh()` to poll for updates
