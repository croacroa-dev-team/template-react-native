# Firebase Remote Config Integration Guide

This guide shows how to replace the `MockRemoteConfigAdapter` with Firebase Remote Config for production use.

## Prerequisites

1. A Firebase project with Remote Config enabled
2. `@react-native-firebase/app` and `@react-native-firebase/remote-config` installed

```bash
npm install @react-native-firebase/app @react-native-firebase/remote-config
```

## Create the Firebase Adapter

Create `services/config/adapters/firebase.ts`:

```typescript
import remoteConfig from "@react-native-firebase/remote-config";
import type { RemoteConfigAdapter } from "../types";

export class FirebaseRemoteConfigAdapter implements RemoteConfigAdapter {
  private listeners: Array<(keys: string[]) => void> = [];

  async initialize(): Promise<void> {
    // Set minimum fetch interval (0 for dev, 3600 for prod)
    await remoteConfig().setConfigSettings({
      minimumFetchIntervalMillis: __DEV__ ? 0 : 3600000,
    });

    // Set default values
    await remoteConfig().setDefaults({
      feature_new_onboarding: false,
      maintenance_mode: false,
      min_app_version: "1.0.0",
      api_timeout_ms: 10000,
    });

    // Fetch and activate
    await remoteConfig().fetchAndActivate();
  }

  getValue<T>(key: string, defaultValue: T): T {
    const value = remoteConfig().getValue(key);

    if (typeof defaultValue === "boolean") {
      return value.asBoolean() as T;
    }
    if (typeof defaultValue === "number") {
      return value.asNumber() as T;
    }
    if (typeof defaultValue === "string") {
      return value.asString() as T;
    }

    // For objects, parse JSON
    try {
      return JSON.parse(value.asString()) as T;
    } catch {
      return defaultValue;
    }
  }

  getAll(): Record<string, unknown> {
    const all = remoteConfig().getAll();
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(all)) {
      try {
        result[key] = JSON.parse(entry.asString());
      } catch {
        result[key] = entry.asString();
      }
    }
    return result;
  }

  async refresh(): Promise<void> {
    await remoteConfig().fetchAndActivate();
    const keys = Object.keys(remoteConfig().getAll());
    this.listeners.forEach((cb) => cb(keys));
  }

  onConfigUpdate(callback: (keys: string[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }
}
```

## Wire It Up

In your app initialization (e.g., `services/index.ts` or `app/_layout.tsx`):

```typescript
import { RemoteConfig } from "@/services/config/config-adapter";
import { FirebaseRemoteConfigAdapter } from "@/services/config/adapters/firebase";

// Replace the mock adapter with Firebase
RemoteConfig.setAdapter(new FirebaseRemoteConfigAdapter());

// Initialize (typically in your root layout's useEffect)
await RemoteConfig.initialize();
```

## Usage with the Hook

No changes needed in your components — `useRemoteConfig` works with any adapter:

```tsx
import { useRemoteConfig } from "@/hooks/useRemoteConfig";

function MyComponent() {
  const maintenanceMode = useRemoteConfig("maintenance_mode", false);
  const minVersion = useRemoteConfig("min_app_version", "1.0.0");

  if (maintenanceMode) {
    return <MaintenanceScreen />;
  }

  return <App />;
}
```

## Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) > Remote Config
2. Add parameters matching your defaults:
   - `feature_new_onboarding` (Boolean)
   - `maintenance_mode` (Boolean)
   - `min_app_version` (String)
   - `api_timeout_ms` (Number)
3. Publish changes

## Conditional Targeting

Firebase Remote Config supports conditions based on:

- App version
- Platform (iOS/Android)
- User properties
- Random percentile (for gradual rollouts)

Example: Roll out a feature to 10% of users, then gradually increase.
