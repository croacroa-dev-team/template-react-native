# Phase 6: Template Completion — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the React Native template with 7 feature domains: permissions, animations, social login, analytics, payments, file upload, and websockets.

**Architecture:** Follows existing patterns — adapter pattern (like `services/auth/authAdapter.ts`) for analytics & payments, turnkey hooks+components for permissions/animations/social login, lightweight hooks for uploads/websockets. All new services live under `services/`, hooks under `hooks/`, components under `components/`.

**Tech Stack:** Expo SDK 52, React Native 0.76, TypeScript, Zustand, React Query, NativeWind, Reanimated 3, Zod

---

## Task 1: Install all new dependencies

**Files:**
- Modify: `package.json`
- Modify: `app.config.ts`

**Step 1: Install Expo packages**

Run:
```bash
npx expo install expo-camera expo-location expo-contacts expo-media-library expo-auth-session expo-web-browser expo-apple-authentication expo-crypto expo-image-manipulator
```

Expected: All packages installed with Expo SDK 52 compatible versions.

**Step 2: Verify installation**

Run:
```bash
npx expo-doctor
```

Expected: No critical errors.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install Phase 6 dependencies (permissions, social login, media)"
```

---

## Task 2: Permission Management — Types & Service

**Files:**
- Create: `services/permissions/types.ts`
- Create: `services/permissions/permission-manager.ts`

**Step 1: Create permission types**

```typescript
// services/permissions/types.ts
import * as Camera from 'expo-camera';
import * as Location from 'expo-location';
import * as Contacts from 'expo-contacts';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';

export type PermissionType =
  | 'camera'
  | 'location'
  | 'locationAlways'
  | 'contacts'
  | 'mediaLibrary'
  | 'microphone'
  | 'notifications';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied' | 'blocked';

export interface PermissionResult {
  status: PermissionStatus;
  canAskAgain: boolean;
}

export interface PermissionConfig {
  /** Title shown in the rationale dialog */
  title: string;
  /** Message explaining why the permission is needed */
  message: string;
  /** Icon name from @expo/vector-icons */
  icon?: string;
}

export const DEFAULT_PERMISSION_CONFIGS: Record<PermissionType, PermissionConfig> = {
  camera: {
    title: 'Camera Access',
    message: 'We need access to your camera to take photos.',
    icon: 'camera',
  },
  location: {
    title: 'Location Access',
    message: 'We need your location to show nearby results.',
    icon: 'location',
  },
  locationAlways: {
    title: 'Background Location',
    message: 'We need background location access for tracking.',
    icon: 'location',
  },
  contacts: {
    title: 'Contacts Access',
    message: 'We need access to your contacts to find friends.',
    icon: 'people',
  },
  mediaLibrary: {
    title: 'Photo Library',
    message: 'We need access to your photo library to select images.',
    icon: 'images',
  },
  microphone: {
    title: 'Microphone Access',
    message: 'We need microphone access to record audio.',
    icon: 'mic',
  },
  notifications: {
    title: 'Notifications',
    message: 'We need permission to send you notifications.',
    icon: 'notifications',
  },
};
```

**Step 2: Create permission manager service**

```typescript
// services/permissions/permission-manager.ts
import * as Camera from 'expo-camera';
import * as Location from 'expo-location';
import * as Contacts from 'expo-contacts';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionType, PermissionResult, PermissionStatus } from './types';

const PERMISSION_STORAGE_PREFIX = '@permission_asked_';

const normalizeStatus = (
  status: string,
  canAskAgain: boolean
): PermissionStatus => {
  if (status === 'granted') return 'granted';
  if (status === 'denied' && !canAskAgain) return 'blocked';
  if (status === 'denied') return 'denied';
  return 'undetermined';
};

const permissionHandlers: Record<
  PermissionType,
  {
    check: () => Promise<PermissionResult>;
    request: () => Promise<PermissionResult>;
  }
> = {
  camera: {
    check: async () => {
      const { status, canAskAgain } = await Camera.getCameraPermissionsAsync();
      return { status: normalizeStatus(status, canAskAgain), canAskAgain };
    },
    request: async () => {
      const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();
      return { status: normalizeStatus(status, canAskAgain), canAskAgain };
    },
  },
  microphone: {
    check: async () => {
      const { status, canAskAgain } = await Camera.getMicrophonePermissionsAsync();
      return { status: normalizeStatus(status, canAskAgain), canAskAgain };
    },
    request: async () => {
      const { status, canAskAgain } = await Camera.requestMicrophonePermissionsAsync();
      return { status: normalizeStatus(status, canAskAgain), canAskAgain };
    },
  },
  location: {
    check: async () => {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      return { status: normalizeStatus(status, canAskAgain), canAskAgain };
    },
    request: async () => {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      return { status: normalizeStatus(status, canAskAgain), canAskAgain };
    },
  },
  locationAlways: {
    check: async () => {
      const { status, canAskAgain } = await Location.getBackgroundPermissionsAsync();
      return { status: normalizeStatus(status, canAskAgain), canAskAgain };
    },
    request: async () => {
      const { status, canAskAgain } = await Location.requestBackgroundPermissionsAsync();
      return { status: normalizeStatus(status, canAskAgain), canAskAgain };
    },
  },
  contacts: {
    check: async () => {
      const { status, canAskAgain } = await Contacts.getPermissionsAsync();
      return { status: normalizeStatus(status, canAskAgain), canAskAgain };
    },
    request: async () => {
      const { status, canAskAgain } = await Contacts.requestPermissionsAsync();
      return { status: normalizeStatus(status, canAskAgain), canAskAgain };
    },
  },
  mediaLibrary: {
    check: async () => {
      const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();
      return { status: normalizeStatus(status, canAskAgain), canAskAgain };
    },
    request: async () => {
      const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
      return { status: normalizeStatus(status, canAskAgain), canAskAgain };
    },
  },
  notifications: {
    check: async () => {
      const settings = await Notifications.getPermissionsAsync();
      return {
        status: normalizeStatus(settings.status, settings.canAskAgain),
        canAskAgain: settings.canAskAgain,
      };
    },
    request: async () => {
      const settings = await Notifications.requestPermissionsAsync();
      return {
        status: normalizeStatus(settings.status, settings.canAskAgain),
        canAskAgain: settings.canAskAgain,
      };
    },
  },
};

export const PermissionManager = {
  check: async (type: PermissionType): Promise<PermissionResult> => {
    return permissionHandlers[type].check();
  },

  request: async (type: PermissionType): Promise<PermissionResult> => {
    await AsyncStorage.setItem(`${PERMISSION_STORAGE_PREFIX}${type}`, 'true');
    return permissionHandlers[type].request();
  },

  openSettings: async (): Promise<void> => {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    } else {
      await Linking.openSettings();
    }
  },

  hasBeenAsked: async (type: PermissionType): Promise<boolean> => {
    const value = await AsyncStorage.getItem(`${PERMISSION_STORAGE_PREFIX}${type}`);
    return value === 'true';
  },
};
```

**Step 3: Commit**

```bash
git add services/permissions/
git commit -m "feat(permissions): add permission types and centralized manager service"
```

---

## Task 3: Permission Management — Hook & Component

**Files:**
- Create: `hooks/usePermission.ts`
- Create: `components/ui/PermissionGate.tsx`

**Step 1: Create usePermission hook**

```typescript
// hooks/usePermission.ts
import { useCallback, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { PermissionManager } from '@/services/permissions/permission-manager';
import {
  PermissionType,
  PermissionStatus,
  PermissionConfig,
  DEFAULT_PERMISSION_CONFIGS,
} from '@/services/permissions/types';

interface UsePermissionReturn {
  status: PermissionStatus;
  isGranted: boolean;
  isBlocked: boolean;
  isLoading: boolean;
  config: PermissionConfig;
  request: () => Promise<PermissionStatus>;
  openSettings: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePermission(
  type: PermissionType,
  customConfig?: Partial<PermissionConfig>
): UsePermissionReturn {
  const [status, setStatus] = useState<PermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(true);

  const config = {
    ...DEFAULT_PERMISSION_CONFIGS[type],
    ...customConfig,
  };

  const checkPermission = useCallback(async () => {
    const result = await PermissionManager.check(type);
    setStatus(result.status);
    setIsLoading(false);
  }, [type]);

  const request = useCallback(async (): Promise<PermissionStatus> => {
    setIsLoading(true);
    const result = await PermissionManager.request(type);
    setStatus(result.status);
    setIsLoading(false);
    return result.status;
  }, [type]);

  const openSettings = useCallback(async () => {
    await PermissionManager.openSettings();
  }, []);

  // Check on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Re-check when app comes back from settings
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkPermission();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [checkPermission]);

  return {
    status,
    isGranted: status === 'granted',
    isBlocked: status === 'blocked',
    isLoading,
    config,
    request,
    openSettings,
    refresh: checkPermission,
  };
}
```

**Step 2: Create PermissionGate component**

```tsx
// components/ui/PermissionGate.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePermission } from '@/hooks/usePermission';
import { PermissionType, PermissionConfig } from '@/services/permissions/types';
import { useTheme } from '@/theme/ThemeContext';
import { Button } from './Button';

interface PermissionGateProps {
  type: PermissionType;
  config?: Partial<PermissionConfig>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  type,
  config: customConfig,
  children,
  fallback,
}: PermissionGateProps) {
  const { status, isLoading, isBlocked, config, request, openSettings } =
    usePermission(type, customConfig);
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  if (isLoading) {
    return null;
  }

  if (status === 'granted') {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <View className="flex-1 items-center justify-center px-8">
      {config.icon && (
        <Ionicons
          name={config.icon as any}
          size={48}
          color={isDark ? '#9ca3af' : '#6b7280'}
        />
      )}
      <Text
        className="mt-4 text-lg font-semibold text-center text-text-light dark:text-text-dark"
      >
        {config.title}
      </Text>
      <Text
        className="mt-2 text-center text-muted-light dark:text-muted-dark"
      >
        {config.message}
      </Text>
      <View className="mt-6 w-full gap-3">
        {isBlocked ? (
          <Button onPress={openSettings} variant="primary">
            Open Settings
          </Button>
        ) : (
          <Button onPress={request} variant="primary">
            Allow Access
          </Button>
        )}
      </View>
    </View>
  );
}
```

**Step 3: Commit**

```bash
git add hooks/usePermission.ts components/ui/PermissionGate.tsx
git commit -m "feat(permissions): add usePermission hook and PermissionGate component"
```

---

## Task 4: Permission Management — Tests

**Files:**
- Create: `__tests__/hooks/usePermission.test.tsx`

**Step 1: Write tests**

```typescript
// __tests__/hooks/usePermission.test.tsx
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { usePermission } from '@/hooks/usePermission';

// Mock all expo permission modules
jest.mock('expo-camera', () => ({
  getCameraPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'undetermined',
    canAskAgain: true,
  }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    canAskAgain: true,
  }),
  getMicrophonePermissionsAsync: jest.fn().mockResolvedValue({
    status: 'undetermined',
    canAskAgain: true,
  }),
  requestMicrophonePermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    canAskAgain: true,
  }),
}));

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'undetermined',
    canAskAgain: true,
  }),
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    canAskAgain: true,
  }),
  getBackgroundPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'undetermined',
    canAskAgain: true,
  }),
  requestBackgroundPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    canAskAgain: true,
  }),
}));

jest.mock('expo-contacts', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'undetermined',
    canAskAgain: true,
  }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    canAskAgain: true,
  }),
}));

jest.mock('expo-media-library', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'undetermined',
    canAskAgain: true,
  }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    canAskAgain: true,
  }),
}));

describe('usePermission', () => {
  it('should start with undetermined status', async () => {
    const { result } = renderHook(() => usePermission('camera'));
    await waitFor(() => {
      expect(result.current.status).toBe('undetermined');
      expect(result.current.isGranted).toBe(false);
    });
  });

  it('should request permission and update status', async () => {
    const { result } = renderHook(() => usePermission('camera'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const status = await result.current.request();
      expect(status).toBe('granted');
    });

    expect(result.current.isGranted).toBe(true);
  });

  it('should detect blocked permissions', async () => {
    const Camera = require('expo-camera');
    Camera.getCameraPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
      canAskAgain: false,
    });

    const { result } = renderHook(() => usePermission('camera'));
    await waitFor(() => {
      expect(result.current.status).toBe('blocked');
      expect(result.current.isBlocked).toBe(true);
    });
  });

  it('should allow custom config override', async () => {
    const { result } = renderHook(() =>
      usePermission('camera', { title: 'Custom Title' })
    );
    expect(result.current.config.title).toBe('Custom Title');
  });
});
```

**Step 2: Run tests**

Run: `npx jest __tests__/hooks/usePermission.test.tsx --no-cache`
Expected: All 4 tests pass.

**Step 3: Commit**

```bash
git add __tests__/hooks/usePermission.test.tsx
git commit -m "test(permissions): add usePermission hook tests"
```

---

## Task 5: Animations — Presets & Transitions

**Files:**
- Create: `utils/animations/presets.ts`
- Create: `utils/animations/transitions.ts`

**Step 1: Create animation presets**

```typescript
// utils/animations/presets.ts
import {
  withTiming,
  withSpring,
  withDelay,
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  WithTimingConfig,
  WithSpringConfig,
} from 'react-native-reanimated';

// Timing presets
export const TIMING = {
  fast: { duration: 200, easing: Easing.out(Easing.cubic) } as WithTimingConfig,
  normal: { duration: 300, easing: Easing.out(Easing.cubic) } as WithTimingConfig,
  slow: { duration: 500, easing: Easing.out(Easing.cubic) } as WithTimingConfig,
  bounce: { duration: 400, easing: Easing.out(Easing.back(1.5)) } as WithTimingConfig,
};

// Spring presets
export const SPRING = {
  gentle: { damping: 15, stiffness: 150 } as WithSpringConfig,
  bouncy: { damping: 8, stiffness: 200 } as WithSpringConfig,
  stiff: { damping: 20, stiffness: 300 } as WithSpringConfig,
  snappy: { damping: 12, stiffness: 250 } as WithSpringConfig,
};

// Entry animation types
export type EntryAnimation = 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'none';

export const ENTRY_CONFIGS: Record<
  EntryAnimation,
  { opacity: number; translateX: number; translateY: number; scale: number }
> = {
  fadeIn: { opacity: 0, translateX: 0, translateY: 0, scale: 1 },
  slideUp: { opacity: 0, translateX: 0, translateY: 30, scale: 1 },
  slideDown: { opacity: 0, translateX: 0, translateY: -30, scale: 1 },
  slideLeft: { opacity: 0, translateX: 30, translateY: 0, scale: 1 },
  slideRight: { opacity: 0, translateX: -30, translateY: 0, scale: 1 },
  scale: { opacity: 0, translateX: 0, translateY: 0, scale: 0.9 },
  none: { opacity: 1, translateX: 0, translateY: 0, scale: 1 },
};

// Stagger delay calculator
export const staggerDelay = (index: number, baseDelay: number = 50): number =>
  index * baseDelay;
```

**Step 2: Create screen transition configs**

```typescript
// utils/animations/transitions.ts
import { TransitionPresets } from '@react-navigation/stack';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

/**
 * Screen transition presets for Expo Router Stack navigation.
 * Use these in your _layout.tsx screenOptions or per-screen options.
 *
 * Example:
 *   <Stack.Screen name="detail" options={screenTransitions.modal} />
 */
export const screenTransitions = {
  /** Standard iOS-style slide from right */
  slide: {
    animation: 'slide_from_right',
  } satisfies NativeStackNavigationOptions,

  /** Fade transition */
  fade: {
    animation: 'fade',
  } satisfies NativeStackNavigationOptions,

  /** Modal presentation (slide from bottom) */
  modal: {
    presentation: 'modal',
    animation: 'slide_from_bottom',
  } satisfies NativeStackNavigationOptions,

  /** Full-screen modal */
  fullScreenModal: {
    presentation: 'fullScreenModal',
    animation: 'slide_from_bottom',
  } satisfies NativeStackNavigationOptions,

  /** Transparent modal (for overlays) */
  transparentModal: {
    presentation: 'transparentModal',
    animation: 'fade',
  } satisfies NativeStackNavigationOptions,

  /** No animation */
  none: {
    animation: 'none',
  } satisfies NativeStackNavigationOptions,
};
```

**Step 3: Commit**

```bash
git add utils/animations/
git commit -m "feat(animations): add animation presets, timing configs, and screen transitions"
```

---

## Task 6: Animations — Hooks

**Files:**
- Create: `hooks/useAnimatedEntry.ts`
- Create: `hooks/useParallax.ts`

**Step 1: Create useAnimatedEntry hook**

```typescript
// hooks/useAnimatedEntry.ts
import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  WithTimingConfig,
} from 'react-native-reanimated';
import {
  EntryAnimation,
  ENTRY_CONFIGS,
  TIMING,
} from '@/utils/animations/presets';

interface UseAnimatedEntryOptions {
  animation?: EntryAnimation;
  delay?: number;
  timing?: WithTimingConfig;
  autoPlay?: boolean;
}

export function useAnimatedEntry(options: UseAnimatedEntryOptions = {}) {
  const {
    animation = 'fadeIn',
    delay = 0,
    timing = TIMING.normal,
    autoPlay = true,
  } = options;

  const config = ENTRY_CONFIGS[animation];
  const progress = useSharedValue(0);

  useEffect(() => {
    if (autoPlay) {
      progress.value = withDelay(delay, withTiming(1, timing));
    }
  }, [autoPlay]);

  const animatedStyle = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: config.opacity + (1 - config.opacity) * t,
      transform: [
        { translateX: config.translateX * (1 - t) },
        { translateY: config.translateY * (1 - t) },
        { scale: config.scale + (1 - config.scale) * t },
      ],
    };
  });

  const play = () => {
    progress.value = 0;
    progress.value = withDelay(delay, withTiming(1, timing));
  };

  const reset = () => {
    progress.value = 0;
  };

  return { animatedStyle, play, reset, progress };
}

/**
 * Returns animated styles for a list item with stagger delay.
 * Usage: const { animatedStyle } = useStaggeredEntry(index);
 */
export function useStaggeredEntry(
  index: number,
  options: Omit<UseAnimatedEntryOptions, 'delay'> & {
    staggerDelay?: number;
  } = {}
) {
  const { staggerDelay = 50, ...rest } = options;
  return useAnimatedEntry({
    animation: 'slideUp',
    delay: index * staggerDelay,
    ...rest,
  });
}
```

**Step 2: Create useParallax hook**

```typescript
// hooks/useParallax.ts
import {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

interface UseParallaxOptions {
  /** How much the parallax element moves relative to scroll (0.5 = half speed) */
  speed?: number;
  /** Height of the parallax header */
  headerHeight?: number;
}

export function useParallax(options: UseParallaxOptions = {}) {
  const { speed = 0.5, headerHeight = 250 } = options;
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const parallaxStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-headerHeight, 0, headerHeight],
          [headerHeight * speed, 0, -headerHeight * speed],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, headerHeight * 0.8],
      [1, 0],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        scale: interpolate(
          scrollY.value,
          [-headerHeight, 0],
          [1.5, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  return {
    scrollY,
    scrollHandler,
    parallaxStyle,
    headerStyle,
  };
}
```

**Step 3: Commit**

```bash
git add hooks/useAnimatedEntry.ts hooks/useParallax.ts
git commit -m "feat(animations): add useAnimatedEntry, useStaggeredEntry, and useParallax hooks"
```

---

## Task 7: Animations — Components

**Files:**
- Create: `components/ui/AnimatedScreen.tsx`
- Create: `components/ui/AnimatedList.tsx`

**Step 1: Create AnimatedScreen wrapper**

```tsx
// components/ui/AnimatedScreen.tsx
import React from 'react';
import { ViewProps } from 'react-native';
import Animated from 'react-native-reanimated';
import { useAnimatedEntry } from '@/hooks/useAnimatedEntry';
import { EntryAnimation, TIMING } from '@/utils/animations/presets';
import type { WithTimingConfig } from 'react-native-reanimated';

interface AnimatedScreenProps extends ViewProps {
  animation?: EntryAnimation;
  delay?: number;
  timing?: WithTimingConfig;
  children: React.ReactNode;
}

export function AnimatedScreen({
  animation = 'fadeIn',
  delay = 0,
  timing = TIMING.normal,
  children,
  style,
  ...props
}: AnimatedScreenProps) {
  const { animatedStyle } = useAnimatedEntry({ animation, delay, timing });

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}
```

**Step 2: Create AnimatedList component**

```tsx
// components/ui/AnimatedList.tsx
import React, { useCallback } from 'react';
import { ViewProps } from 'react-native';
import Animated from 'react-native-reanimated';
import { useStaggeredEntry } from '@/hooks/useAnimatedEntry';
import type { EntryAnimation } from '@/utils/animations/presets';

interface AnimatedListItemProps extends ViewProps {
  index: number;
  animation?: EntryAnimation;
  staggerDelay?: number;
  children: React.ReactNode;
}

export function AnimatedListItem({
  index,
  animation = 'slideUp',
  staggerDelay = 50,
  children,
  style,
  ...props
}: AnimatedListItemProps) {
  const { animatedStyle } = useStaggeredEntry(index, {
    animation,
    staggerDelay,
  });

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}
```

**Step 3: Commit**

```bash
git add components/ui/AnimatedScreen.tsx components/ui/AnimatedList.tsx
git commit -m "feat(animations): add AnimatedScreen and AnimatedListItem components"
```

---

## Task 8: Social Login — Types & Adapters

**Files:**
- Create: `services/auth/social/types.ts`
- Create: `services/auth/social/google.ts`
- Create: `services/auth/social/apple.ts`
- Create: `services/auth/social/social-auth.ts`

**Step 1: Create social auth types**

```typescript
// services/auth/social/types.ts
export type SocialProvider = 'google' | 'apple';

export interface SocialAuthResult {
  provider: SocialProvider;
  idToken: string;
  accessToken?: string;
  user: {
    id: string;
    email: string | null;
    name: string | null;
    avatar: string | null;
  };
}

export interface SocialAuthConfig {
  google?: {
    clientId: string;
    iosClientId?: string;
    androidClientId?: string;
  };
  apple?: {
    /** Apple Sign-In is configured via entitlements, no clientId needed */
  };
}
```

**Step 2: Create Google Sign-In adapter**

```typescript
// services/auth/social/google.ts
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { SocialAuthResult } from './types';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

interface GoogleSignInOptions {
  clientId: string;
  iosClientId?: string;
  androidClientId?: string;
}

export async function signInWithGoogle(
  options: GoogleSignInOptions
): Promise<SocialAuthResult | null> {
  const redirectUri = AuthSession.makeRedirectUri();

  const codeVerifier = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    Math.random().toString(36).substring(2) + Date.now().toString(36)
  );

  const request = new AuthSession.AuthRequest({
    clientId: options.clientId,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    codeChallenge: codeVerifier,
  });

  const result = await request.promptAsync(GOOGLE_DISCOVERY);

  if (result.type !== 'success' || !result.params.code) {
    return null;
  }

  // Exchange code for tokens
  const tokenResult = await AuthSession.exchangeCodeAsync(
    {
      clientId: options.clientId,
      code: result.params.code,
      redirectUri,
      extraParams: {
        code_verifier: request.codeVerifier || '',
      },
    },
    GOOGLE_DISCOVERY
  );

  // Decode the ID token to get user info (JWT payload is base64-encoded)
  const idToken = tokenResult.idToken;
  if (!idToken) {
    return null;
  }

  const payload = JSON.parse(atob(idToken.split('.')[1]));

  return {
    provider: 'google',
    idToken,
    accessToken: tokenResult.accessToken,
    user: {
      id: payload.sub,
      email: payload.email ?? null,
      name: payload.name ?? null,
      avatar: payload.picture ?? null,
    },
  };
}
```

**Step 3: Create Apple Sign-In adapter**

```typescript
// services/auth/social/apple.ts
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { SocialAuthResult } from './types';

export function isAppleSignInAvailable(): boolean {
  return Platform.OS === 'ios';
}

export async function signInWithApple(): Promise<SocialAuthResult | null> {
  if (!isAppleSignInAvailable()) {
    return null;
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return null;
    }

    const fullName = credential.fullName;
    const name = fullName
      ? [fullName.givenName, fullName.familyName].filter(Boolean).join(' ') || null
      : null;

    return {
      provider: 'apple',
      idToken: credential.identityToken,
      user: {
        id: credential.user,
        email: credential.email ?? null,
        name,
        avatar: null,
      },
    };
  } catch (error: any) {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      return null;
    }
    throw error;
  }
}
```

**Step 4: Create social auth orchestrator**

```typescript
// services/auth/social/social-auth.ts
import { signInWithGoogle } from './google';
import { signInWithApple, isAppleSignInAvailable } from './apple';
import { SocialAuthConfig, SocialAuthResult, SocialProvider } from './types';

export { isAppleSignInAvailable } from './apple';
export type { SocialAuthResult, SocialProvider } from './types';

let config: SocialAuthConfig = {};

export const SocialAuth = {
  configure(newConfig: SocialAuthConfig) {
    config = newConfig;
  },

  async signIn(provider: SocialProvider): Promise<SocialAuthResult | null> {
    switch (provider) {
      case 'google': {
        if (!config.google?.clientId) {
          throw new Error(
            'Google Sign-In requires a clientId. Call SocialAuth.configure() first.'
          );
        }
        return signInWithGoogle(config.google);
      }
      case 'apple': {
        return signInWithApple();
      }
      default:
        throw new Error(`Unknown social provider: ${provider}`);
    }
  },
};
```

**Step 5: Commit**

```bash
git add services/auth/social/
git commit -m "feat(social-login): add Google and Apple Sign-In adapters with orchestrator"
```

---

## Task 9: Social Login — UI Component

**Files:**
- Create: `components/auth/SocialLoginButtons.tsx`

**Step 1: Create SocialLoginButtons component**

```tsx
// components/auth/SocialLoginButtons.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SocialAuth, isAppleSignInAvailable, SocialProvider } from '@/services/auth/social/social-auth';
import { useTheme } from '@/theme/ThemeContext';

interface SocialLoginButtonsProps {
  onSuccess: (result: { provider: SocialProvider; idToken: string; user: any }) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

export function SocialLoginButtons({
  onSuccess,
  onError,
  disabled = false,
}: SocialLoginButtonsProps) {
  const [loading, setLoading] = useState<SocialProvider | null>(null);
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const handleSocialLogin = async (provider: SocialProvider) => {
    if (loading || disabled) return;
    setLoading(provider);
    try {
      const result = await SocialAuth.signIn(provider);
      if (result) {
        onSuccess(result);
      }
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setLoading(null);
    }
  };

  const showApple = isAppleSignInAvailable();

  return (
    <View className="gap-3">
      {/* Google Sign-In */}
      <Pressable
        onPress={() => handleSocialLogin('google')}
        disabled={loading !== null || disabled}
        className="flex-row items-center justify-center py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
        accessibilityRole="button"
        accessibilityLabel="Sign in with Google"
      >
        {loading === 'google' ? (
          <ActivityIndicator size="small" color={isDark ? '#fff' : '#000'} />
        ) : (
          <>
            <Ionicons name="logo-google" size={20} color="#4285F4" />
            <Text className="ml-3 text-base font-medium text-text-light dark:text-text-dark">
              Continue with Google
            </Text>
          </>
        )}
      </Pressable>

      {/* Apple Sign-In (iOS only) */}
      {showApple && (
        <Pressable
          onPress={() => handleSocialLogin('apple')}
          disabled={loading !== null || disabled}
          className="flex-row items-center justify-center py-3 px-4 rounded-xl bg-black dark:bg-white"
          accessibilityRole="button"
          accessibilityLabel="Sign in with Apple"
        >
          {loading === 'apple' ? (
            <ActivityIndicator
              size="small"
              color={isDark ? '#000' : '#fff'}
            />
          ) : (
            <>
              <Ionicons
                name="logo-apple"
                size={20}
                color={isDark ? '#000' : '#fff'}
              />
              <Text
                className={`ml-3 text-base font-medium ${
                  isDark ? 'text-black' : 'text-white'
                }`}
              >
                Continue with Apple
              </Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}
```

**Step 2: Commit**

```bash
git add components/auth/SocialLoginButtons.tsx
git commit -m "feat(social-login): add SocialLoginButtons component"
```

---

## Task 10: Analytics — Adapter & Console Implementation

**Files:**
- Create: `services/analytics/types.ts`
- Create: `services/analytics/analytics-adapter.ts`
- Create: `services/analytics/adapters/console.ts`

**Step 1: Create analytics types**

```typescript
// services/analytics/types.ts
export interface AnalyticsAdapter {
  initialize(): Promise<void>;
  track(event: string, properties?: Record<string, unknown>): void;
  screen(name: string, properties?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
  reset(): void;
  setUserProperties(properties: Record<string, unknown>): void;
}

export interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
}
```

**Step 2: Create analytics adapter manager**

```typescript
// services/analytics/analytics-adapter.ts
import { AnalyticsAdapter, AnalyticsConfig } from './types';
import { ConsoleAnalyticsAdapter } from './adapters/console';

let activeAdapter: AnalyticsAdapter = new ConsoleAnalyticsAdapter();
let config: AnalyticsConfig = { enabled: true, debug: __DEV__ };

export const Analytics = {
  configure(newConfig: Partial<AnalyticsConfig>) {
    config = { ...config, ...newConfig };
  },

  setAdapter(adapter: AnalyticsAdapter) {
    activeAdapter = adapter;
  },

  async initialize(): Promise<void> {
    if (!config.enabled) return;
    await activeAdapter.initialize();
  },

  track(event: string, properties?: Record<string, unknown>) {
    if (!config.enabled) return;
    activeAdapter.track(event, properties);
  },

  screen(name: string, properties?: Record<string, unknown>) {
    if (!config.enabled) return;
    activeAdapter.screen(name, properties);
  },

  identify(userId: string, traits?: Record<string, unknown>) {
    if (!config.enabled) return;
    activeAdapter.identify(userId, traits);
  },

  reset() {
    if (!config.enabled) return;
    activeAdapter.reset();
  },

  setUserProperties(properties: Record<string, unknown>) {
    if (!config.enabled) return;
    activeAdapter.setUserProperties(properties);
  },
};
```

**Step 3: Create console adapter**

```typescript
// services/analytics/adapters/console.ts
import { AnalyticsAdapter } from '../types';

export class ConsoleAnalyticsAdapter implements AnalyticsAdapter {
  private prefix = '[Analytics]';

  async initialize(): Promise<void> {
    if (__DEV__) {
      console.log(`${this.prefix} Initialized (console adapter)`);
    }
  }

  track(event: string, properties?: Record<string, unknown>): void {
    if (__DEV__) {
      console.log(`${this.prefix} Track:`, event, properties ?? '');
    }
  }

  screen(name: string, properties?: Record<string, unknown>): void {
    if (__DEV__) {
      console.log(`${this.prefix} Screen:`, name, properties ?? '');
    }
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    if (__DEV__) {
      console.log(`${this.prefix} Identify:`, userId, traits ?? '');
    }
  }

  reset(): void {
    if (__DEV__) {
      console.log(`${this.prefix} Reset`);
    }
  }

  setUserProperties(properties: Record<string, unknown>): void {
    if (__DEV__) {
      console.log(`${this.prefix} User Properties:`, properties);
    }
  }
}
```

**Step 4: Commit**

```bash
git add services/analytics/
git commit -m "feat(analytics): add analytics adapter pattern with console implementation"
```

---

## Task 11: Analytics — Hooks & Provider

**Files:**
- Create: `hooks/useTrackScreen.ts`
- Create: `hooks/useTrackEvent.ts`
- Create: `components/providers/AnalyticsProvider.tsx`

**Step 1: Create useTrackScreen hook**

```typescript
// hooks/useTrackScreen.ts
import { useEffect } from 'react';
import { usePathname, useSegments } from 'expo-router';
import { Analytics } from '@/services/analytics/analytics-adapter';

/**
 * Automatically tracks screen views based on Expo Router navigation.
 * Place this in your root layout to track all screen changes.
 */
export function useTrackScreen() {
  const pathname = usePathname();
  const segments = useSegments();

  useEffect(() => {
    if (pathname) {
      Analytics.screen(pathname, {
        segments: segments.join('/'),
      });
    }
  }, [pathname]);
}
```

**Step 2: Create useTrackEvent hook**

```typescript
// hooks/useTrackEvent.ts
import { useCallback } from 'react';
import { Analytics } from '@/services/analytics/analytics-adapter';

/**
 * Returns a typed track function for analytics events.
 *
 * Usage:
 *   const track = useTrackEvent();
 *   track('button_pressed', { button: 'submit' });
 */
export function useTrackEvent() {
  return useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      Analytics.track(event, properties);
    },
    []
  );
}
```

**Step 3: Create AnalyticsProvider**

```tsx
// components/providers/AnalyticsProvider.tsx
import React, { useEffect } from 'react';
import { Analytics } from '@/services/analytics/analytics-adapter';
import { useTrackScreen } from '@/hooks/useTrackScreen';
import { AppConfig } from '@/constants/config';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useEffect(() => {
    Analytics.configure({
      enabled: AppConfig.featureFlags.ENABLE_ANALYTICS,
      debug: __DEV__,
    });
    Analytics.initialize();
  }, []);

  // Track screen views
  useTrackScreen();

  return <>{children}</>;
}
```

**Step 4: Commit**

```bash
git add hooks/useTrackScreen.ts hooks/useTrackEvent.ts components/providers/AnalyticsProvider.tsx
git commit -m "feat(analytics): add tracking hooks and AnalyticsProvider"
```

---

## Task 12: Payments — Adapter & Types

**Files:**
- Create: `services/payments/types.ts`
- Create: `services/payments/payment-adapter.ts`
- Create: `services/payments/adapters/mock.ts`

**Step 1: Create payment types**

```typescript
// services/payments/types.ts
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  priceString: string;
  currency: string;
  type: 'consumable' | 'non_consumable' | 'subscription';
  /** For subscriptions */
  subscriptionPeriod?: string;
}

export interface Purchase {
  id: string;
  productId: string;
  transactionDate: string;
  transactionReceipt?: string;
}

export type SubscriptionStatus =
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'grace_period'
  | 'none';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  productId: string | null;
  expiresAt: string | null;
  willRenew: boolean;
}

export interface PaymentAdapter {
  initialize(): Promise<void>;
  getProducts(ids: string[]): Promise<Product[]>;
  purchase(productId: string): Promise<Purchase>;
  restorePurchases(): Promise<Purchase[]>;
  getSubscriptionStatus(): Promise<SubscriptionInfo>;
}
```

**Step 2: Create payment adapter manager**

```typescript
// services/payments/payment-adapter.ts
import { PaymentAdapter, Product, Purchase, SubscriptionInfo } from './types';
import { MockPaymentAdapter } from './adapters/mock';

let activeAdapter: PaymentAdapter = new MockPaymentAdapter();

export const Payments = {
  setAdapter(adapter: PaymentAdapter) {
    activeAdapter = adapter;
  },

  async initialize(): Promise<void> {
    return activeAdapter.initialize();
  },

  async getProducts(ids: string[]): Promise<Product[]> {
    return activeAdapter.getProducts(ids);
  },

  async purchase(productId: string): Promise<Purchase> {
    return activeAdapter.purchase(productId);
  },

  async restorePurchases(): Promise<Purchase[]> {
    return activeAdapter.restorePurchases();
  },

  async getSubscriptionStatus(): Promise<SubscriptionInfo> {
    return activeAdapter.getSubscriptionStatus();
  },
};
```

**Step 3: Create mock adapter**

```typescript
// services/payments/adapters/mock.ts
import { PaymentAdapter, Product, Purchase, SubscriptionInfo } from '../types';

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'premium_monthly',
    title: 'Premium Monthly',
    description: 'Full access to all features',
    price: 9.99,
    priceString: '$9.99',
    currency: 'USD',
    type: 'subscription',
    subscriptionPeriod: 'P1M',
  },
  {
    id: 'premium_yearly',
    title: 'Premium Yearly',
    description: 'Full access — save 40%',
    price: 69.99,
    priceString: '$69.99',
    currency: 'USD',
    type: 'subscription',
    subscriptionPeriod: 'P1Y',
  },
];

export class MockPaymentAdapter implements PaymentAdapter {
  private purchases: Purchase[] = [];

  async initialize(): Promise<void> {
    if (__DEV__) {
      console.log('[Payments] Mock adapter initialized');
    }
  }

  async getProducts(ids: string[]): Promise<Product[]> {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 500));
    return MOCK_PRODUCTS.filter((p) => ids.includes(p.id));
  }

  async purchase(productId: string): Promise<Purchase> {
    await new Promise((r) => setTimeout(r, 1000));
    const purchase: Purchase = {
      id: `mock_${Date.now()}`,
      productId,
      transactionDate: new Date().toISOString(),
      transactionReceipt: 'mock_receipt',
    };
    this.purchases.push(purchase);
    return purchase;
  }

  async restorePurchases(): Promise<Purchase[]> {
    await new Promise((r) => setTimeout(r, 500));
    return this.purchases;
  }

  async getSubscriptionStatus(): Promise<SubscriptionInfo> {
    const activePurchase = this.purchases.find(
      (p) => p.productId.includes('premium')
    );
    if (activePurchase) {
      return {
        status: 'active',
        productId: activePurchase.productId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        willRenew: true,
      };
    }
    return {
      status: 'none',
      productId: null,
      expiresAt: null,
      willRenew: false,
    };
  }
}
```

**Step 4: Commit**

```bash
git add services/payments/
git commit -m "feat(payments): add payment adapter pattern with mock implementation"
```

---

## Task 13: Payments — Hooks & Components

**Files:**
- Create: `hooks/useProducts.ts`
- Create: `hooks/usePurchase.ts`
- Create: `hooks/useSubscription.ts`
- Create: `components/ui/Paywall.tsx`
- Create: `components/ui/PurchaseButton.tsx`

**Step 1: Create payment hooks**

```typescript
// hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { Payments } from '@/services/payments/payment-adapter';

export function useProducts(productIds: string[]) {
  return useQuery({
    queryKey: ['products', productIds],
    queryFn: () => Payments.getProducts(productIds),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

```typescript
// hooks/usePurchase.ts
import { useState, useCallback } from 'react';
import { Payments } from '@/services/payments/payment-adapter';
import { Purchase } from '@/services/payments/types';

interface UsePurchaseReturn {
  purchase: (productId: string) => Promise<Purchase | null>;
  restore: () => Promise<Purchase[]>;
  isLoading: boolean;
  error: Error | null;
}

export function usePurchase(): UsePurchaseReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const purchase = useCallback(async (productId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await Payments.purchase(productId);
      return result;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restore = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await Payments.restorePurchases();
      return results;
    } catch (err) {
      setError(err as Error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { purchase, restore, isLoading, error };
}
```

```typescript
// hooks/useSubscription.ts
import { useQuery } from '@tanstack/react-query';
import { Payments } from '@/services/payments/payment-adapter';

export function useSubscription() {
  const query = useQuery({
    queryKey: ['subscription-status'],
    queryFn: () => Payments.getSubscriptionStatus(),
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    ...query,
    isActive: query.data?.status === 'active' || query.data?.status === 'grace_period',
    isPro: query.data?.status === 'active',
  };
}
```

**Step 2: Create Paywall component**

```tsx
// components/ui/Paywall.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '@/hooks/useProducts';
import { PurchaseButton } from './PurchaseButton';
import { Product } from '@/services/payments/types';
import { Skeleton } from './Skeleton';

interface PaywallProps {
  productIds: string[];
  features?: string[];
  title?: string;
  subtitle?: string;
  onPurchaseSuccess?: (productId: string) => void;
  onRestore?: () => void;
}

export function Paywall({
  productIds,
  features = [],
  title = 'Upgrade to Premium',
  subtitle = 'Unlock all features',
  onPurchaseSuccess,
  onRestore,
}: PaywallProps) {
  const { data: products, isLoading } = useProducts(productIds);

  if (isLoading) {
    return (
      <View className="flex-1 px-6 pt-8">
        <Skeleton width="60%" height={32} />
        <Skeleton width="80%" height={20} className="mt-2" />
        <Skeleton height={120} className="mt-6" />
        <Skeleton height={120} className="mt-3" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false}>
      <Text className="text-2xl font-bold text-text-light dark:text-text-dark">
        {title}
      </Text>
      <Text className="mt-1 text-base text-muted-light dark:text-muted-dark">
        {subtitle}
      </Text>

      {/* Features list */}
      {features.length > 0 && (
        <View className="mt-6 gap-3">
          {features.map((feature, i) => (
            <View key={i} className="flex-row items-center gap-3">
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text className="text-base text-text-light dark:text-text-dark">
                {feature}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Products */}
      <View className="mt-6 gap-3">
        {products?.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPurchaseSuccess={onPurchaseSuccess}
          />
        ))}
      </View>

      {/* Restore */}
      {onRestore && (
        <Text
          onPress={onRestore}
          className="mt-4 text-center text-sm text-primary-500 underline"
        >
          Restore purchases
        </Text>
      )}
    </ScrollView>
  );
}

function ProductCard({
  product,
  onPurchaseSuccess,
}: {
  product: Product;
  onPurchaseSuccess?: (productId: string) => void;
}) {
  return (
    <View className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark">
      <Text className="text-lg font-semibold text-text-light dark:text-text-dark">
        {product.title}
      </Text>
      <Text className="text-sm text-muted-light dark:text-muted-dark mt-1">
        {product.description}
      </Text>
      <View className="flex-row items-center justify-between mt-3">
        <Text className="text-xl font-bold text-primary-600 dark:text-primary-400">
          {product.priceString}
          {product.subscriptionPeriod && (
            <Text className="text-sm font-normal text-muted-light dark:text-muted-dark">
              /{product.subscriptionPeriod === 'P1M' ? 'mo' : 'yr'}
            </Text>
          )}
        </Text>
        <PurchaseButton
          productId={product.id}
          onSuccess={() => onPurchaseSuccess?.(product.id)}
        />
      </View>
    </View>
  );
}
```

**Step 3: Create PurchaseButton component**

```tsx
// components/ui/PurchaseButton.tsx
import React from 'react';
import { usePurchase } from '@/hooks/usePurchase';
import { Button } from './Button';

interface PurchaseButtonProps {
  productId: string;
  label?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function PurchaseButton({
  productId,
  label = 'Subscribe',
  onSuccess,
  onError,
}: PurchaseButtonProps) {
  const { purchase, isLoading } = usePurchase();

  const handlePress = async () => {
    const result = await purchase(productId);
    if (result) {
      onSuccess?.();
    }
  };

  return (
    <Button
      onPress={handlePress}
      loading={isLoading}
      variant="primary"
      size="sm"
    >
      {label}
    </Button>
  );
}
```

**Step 4: Commit**

```bash
git add hooks/useProducts.ts hooks/usePurchase.ts hooks/useSubscription.ts components/ui/Paywall.tsx components/ui/PurchaseButton.tsx
git commit -m "feat(payments): add payment hooks, Paywall and PurchaseButton components"
```

---

## Task 14: File Upload / Media — Services

**Files:**
- Create: `services/media/media-picker.ts`
- Create: `services/media/compression.ts`
- Create: `services/media/media-upload.ts`

**Step 1: Create media picker service**

```typescript
// services/media/media-picker.ts
import * as ImagePicker from 'expo-image-picker';

export interface PickedMedia {
  uri: string;
  type: 'image' | 'video';
  width: number;
  height: number;
  fileSize?: number;
  fileName?: string;
  duration?: number;
}

interface PickOptions {
  mediaTypes?: 'images' | 'videos' | 'all';
  allowsEditing?: boolean;
  quality?: number;
  aspect?: [number, number];
  allowsMultipleSelection?: boolean;
  selectionLimit?: number;
}

const mediaTypeMap = {
  images: ImagePicker.MediaTypeOptions.Images,
  videos: ImagePicker.MediaTypeOptions.Videos,
  all: ImagePicker.MediaTypeOptions.All,
};

function mapAsset(asset: ImagePicker.ImagePickerAsset): PickedMedia {
  return {
    uri: asset.uri,
    type: asset.type === 'video' ? 'video' : 'image',
    width: asset.width,
    height: asset.height,
    fileSize: asset.fileSize ?? undefined,
    fileName: asset.fileName ?? undefined,
    duration: asset.duration ?? undefined,
  };
}

export async function pickFromLibrary(
  options: PickOptions = {}
): Promise<PickedMedia[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: mediaTypeMap[options.mediaTypes ?? 'images'],
    allowsEditing: options.allowsEditing ?? false,
    quality: options.quality ?? 0.8,
    aspect: options.aspect,
    allowsMultipleSelection: options.allowsMultipleSelection ?? false,
    selectionLimit: options.selectionLimit,
  });

  if (result.canceled) return [];
  return result.assets.map(mapAsset);
}

export async function pickFromCamera(
  options: Omit<PickOptions, 'allowsMultipleSelection' | 'selectionLimit'> = {}
): Promise<PickedMedia | null> {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: mediaTypeMap[options.mediaTypes ?? 'images'],
    allowsEditing: options.allowsEditing ?? false,
    quality: options.quality ?? 0.8,
    aspect: options.aspect,
  });

  if (result.canceled || !result.assets[0]) return null;
  return mapAsset(result.assets[0]);
}
```

**Step 2: Create compression service**

```typescript
// services/media/compression.ts
import * as ImageManipulator from 'expo-image-manipulator';

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export async function compressImage(
  uri: string,
  options: CompressionOptions = {}
): Promise<{ uri: string; width: number; height: number }> {
  const { maxWidth = 1080, maxHeight = 1080, quality = 0.7, format = 'jpeg' } = options;

  const formatMap = {
    jpeg: ImageManipulator.SaveFormat.JPEG,
    png: ImageManipulator.SaveFormat.PNG,
    webp: ImageManipulator.SaveFormat.WEBP,
  };

  const actions: ImageManipulator.Action[] = [];

  // Only resize if we have max dimensions
  if (maxWidth || maxHeight) {
    actions.push({
      resize: {
        width: maxWidth,
        height: maxHeight,
      },
    });
  }

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: quality,
    format: formatMap[format],
  });

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
  };
}
```

**Step 3: Create upload service**

```typescript
// services/media/media-upload.ts
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadOptions {
  url: string;
  uri: string;
  fieldName?: string;
  mimeType?: string;
  headers?: Record<string, string>;
  extraFields?: Record<string, string>;
  onProgress?: (progress: UploadProgress) => void;
}

export interface UploadResult {
  status: number;
  body: string;
}

export function uploadFile(options: UploadOptions): {
  promise: Promise<UploadResult>;
  abort: () => void;
} {
  const {
    url,
    uri,
    fieldName = 'file',
    mimeType = 'image/jpeg',
    headers = {},
    extraFields = {},
    onProgress,
  } = options;

  const xhr = new XMLHttpRequest();
  const formData = new FormData();

  // Extract filename from URI
  const fileName = uri.split('/').pop() || 'upload';

  formData.append(fieldName, {
    uri,
    type: mimeType,
    name: fileName,
  } as any);

  // Append extra fields
  Object.entries(extraFields).forEach(([key, value]) => {
    formData.append(key, value);
  });

  const promise = new Promise<UploadResult>((resolve, reject) => {
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        });
      }
    });

    xhr.addEventListener('load', () => {
      resolve({ status: xhr.status, body: xhr.responseText });
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    xhr.open('POST', url);
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });
    xhr.send(formData);
  });

  return {
    promise,
    abort: () => xhr.abort(),
  };
}
```

**Step 4: Commit**

```bash
git add services/media/
git commit -m "feat(media): add media picker, image compression, and upload services"
```

---

## Task 15: File Upload / Media — Hooks & Components

**Files:**
- Create: `hooks/useImagePicker.ts`
- Create: `hooks/useUpload.ts`
- Create: `components/ui/ImagePickerButton.tsx`
- Create: `components/ui/UploadProgress.tsx`

**Step 1: Create useImagePicker hook**

```typescript
// hooks/useImagePicker.ts
import { useState, useCallback } from 'react';
import {
  PickedMedia,
  pickFromLibrary,
  pickFromCamera,
} from '@/services/media/media-picker';
import { compressImage } from '@/services/media/compression';
import { usePermission } from '@/hooks/usePermission';

interface UseImagePickerOptions {
  compress?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

interface UseImagePickerReturn {
  pickFromLibrary: () => Promise<PickedMedia | null>;
  pickFromCamera: () => Promise<PickedMedia | null>;
  selectedMedia: PickedMedia | null;
  isLoading: boolean;
  clear: () => void;
  cameraPermission: ReturnType<typeof usePermission>;
  mediaLibraryPermission: ReturnType<typeof usePermission>;
}

export function useImagePicker(
  options: UseImagePickerOptions = {}
): UseImagePickerReturn {
  const { compress = true, maxWidth = 1080, maxHeight = 1080, quality = 0.7 } = options;
  const [selectedMedia, setSelectedMedia] = useState<PickedMedia | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const cameraPermission = usePermission('camera');
  const mediaLibraryPermission = usePermission('mediaLibrary');

  const processMedia = useCallback(
    async (media: PickedMedia): Promise<PickedMedia> => {
      if (!compress || media.type !== 'image') return media;
      const compressed = await compressImage(media.uri, {
        maxWidth,
        maxHeight,
        quality,
      });
      return { ...media, ...compressed };
    },
    [compress, maxWidth, maxHeight, quality]
  );

  const handlePickFromLibrary = useCallback(async () => {
    if (!mediaLibraryPermission.isGranted) {
      const status = await mediaLibraryPermission.request();
      if (status !== 'granted') return null;
    }

    setIsLoading(true);
    try {
      const results = await pickFromLibrary();
      if (results.length === 0) return null;
      const processed = await processMedia(results[0]);
      setSelectedMedia(processed);
      return processed;
    } finally {
      setIsLoading(false);
    }
  }, [mediaLibraryPermission, processMedia]);

  const handlePickFromCamera = useCallback(async () => {
    if (!cameraPermission.isGranted) {
      const status = await cameraPermission.request();
      if (status !== 'granted') return null;
    }

    setIsLoading(true);
    try {
      const result = await pickFromCamera();
      if (!result) return null;
      const processed = await processMedia(result);
      setSelectedMedia(processed);
      return processed;
    } finally {
      setIsLoading(false);
    }
  }, [cameraPermission, processMedia]);

  const clear = useCallback(() => setSelectedMedia(null), []);

  return {
    pickFromLibrary: handlePickFromLibrary,
    pickFromCamera: handlePickFromCamera,
    selectedMedia,
    isLoading,
    clear,
    cameraPermission,
    mediaLibraryPermission,
  };
}
```

**Step 2: Create useUpload hook**

```typescript
// hooks/useUpload.ts
import { useState, useCallback, useRef } from 'react';
import {
  uploadFile,
  UploadProgress,
  UploadResult,
} from '@/services/media/media-upload';

interface UseUploadOptions {
  url: string;
  headers?: Record<string, string>;
  fieldName?: string;
}

interface UseUploadReturn {
  upload: (uri: string, extraFields?: Record<string, string>) => Promise<UploadResult | null>;
  progress: UploadProgress | null;
  isUploading: boolean;
  error: Error | null;
  cancel: () => void;
  reset: () => void;
}

export function useUpload(options: UseUploadOptions): UseUploadReturn {
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<(() => void) | null>(null);

  const upload = useCallback(
    async (uri: string, extraFields?: Record<string, string>) => {
      setIsUploading(true);
      setError(null);
      setProgress(null);

      try {
        const { promise, abort } = uploadFile({
          ...options,
          uri,
          extraFields,
          onProgress: setProgress,
        });
        abortRef.current = abort;
        const result = await promise;
        return result;
      } catch (err) {
        setError(err as Error);
        return null;
      } finally {
        setIsUploading(false);
        abortRef.current = null;
      }
    },
    [options]
  );

  const cancel = useCallback(() => {
    abortRef.current?.();
  }, []);

  const reset = useCallback(() => {
    setProgress(null);
    setError(null);
    setIsUploading(false);
  }, []);

  return { upload, progress, isUploading, error, cancel, reset };
}
```

**Step 3: Create UI components**

```tsx
// components/ui/ImagePickerButton.tsx
import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useImagePicker } from '@/hooks/useImagePicker';

interface ImagePickerButtonProps {
  onImageSelected?: (uri: string) => void;
  size?: number;
  placeholder?: string;
}

export function ImagePickerButton({
  onImageSelected,
  size = 100,
  placeholder = 'Add Photo',
}: ImagePickerButtonProps) {
  const { pickFromLibrary, selectedMedia, isLoading, clear } = useImagePicker();

  const handlePress = async () => {
    const media = await pickFromLibrary();
    if (media) {
      onImageSelected?.(media.uri);
    }
  };

  if (selectedMedia) {
    return (
      <Pressable onPress={clear} accessibilityRole="button" accessibilityLabel="Remove selected photo">
        <Image
          source={{ uri: selectedMedia.uri }}
          style={{ width: size, height: size, borderRadius: 12 }}
        />
        <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center">
          <Ionicons name="close" size={14} color="white" />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isLoading}
      className="items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl"
      style={{ width: size, height: size }}
      accessibilityRole="button"
      accessibilityLabel={placeholder}
    >
      <Ionicons name="camera-outline" size={24} color="#9ca3af" />
      <Text className="text-xs text-muted-light dark:text-muted-dark mt-1">
        {placeholder}
      </Text>
    </Pressable>
  );
}
```

```tsx
// components/ui/UploadProgress.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UploadProgress as UploadProgressType } from '@/services/media/media-upload';

interface UploadProgressProps {
  progress: UploadProgressType | null;
  isUploading: boolean;
  error: Error | null;
  onCancel?: () => void;
  onRetry?: () => void;
}

export function UploadProgress({
  progress,
  isUploading,
  error,
  onCancel,
  onRetry,
}: UploadProgressProps) {
  if (!isUploading && !error && !progress) return null;

  return (
    <View className="px-4 py-3 rounded-xl bg-surface-light dark:bg-surface-dark">
      {error ? (
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Ionicons name="alert-circle" size={20} color="#ef4444" />
            <Text className="text-sm text-red-500">Upload failed</Text>
          </View>
          {onRetry && (
            <Pressable onPress={onRetry}>
              <Text className="text-sm text-primary-500 font-medium">Retry</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm text-text-light dark:text-text-dark">
              {isUploading ? 'Uploading...' : 'Complete'}
            </Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-sm text-muted-light dark:text-muted-dark">
                {progress?.percentage ?? 0}%
              </Text>
              {isUploading && onCancel && (
                <Pressable onPress={onCancel}>
                  <Ionicons name="close-circle" size={18} color="#9ca3af" />
                </Pressable>
              )}
            </View>
          </View>
          <View className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <View
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${progress?.percentage ?? 0}%` }}
            />
          </View>
        </>
      )}
    </View>
  );
}
```

**Step 4: Commit**

```bash
git add hooks/useImagePicker.ts hooks/useUpload.ts components/ui/ImagePickerButton.tsx components/ui/UploadProgress.tsx
git commit -m "feat(media): add image picker, upload hooks and UI components"
```

---

## Task 16: WebSockets — Manager & Types

**Files:**
- Create: `services/realtime/types.ts`
- Create: `services/realtime/websocket-manager.ts`

**Step 1: Create WebSocket types**

```typescript
// services/realtime/types.ts
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface WebSocketMessage<T = unknown> {
  type: string;
  channel?: string;
  payload: T;
  timestamp: number;
}

export interface WebSocketConfig {
  url: string;
  /** Auth token to send on connection */
  getToken?: () => Promise<string | null>;
  /** Auto-reconnect on disconnect (default: true) */
  autoReconnect?: boolean;
  /** Max reconnect attempts (default: 10) */
  maxReconnectAttempts?: number;
  /** Base delay for reconnect backoff in ms (default: 1000) */
  reconnectBaseDelay?: number;
  /** Heartbeat interval in ms (default: 30000) */
  heartbeatInterval?: number;
  /** Connection timeout in ms (default: 10000) */
  connectionTimeout?: number;
}

export type MessageHandler<T = unknown> = (message: WebSocketMessage<T>) => void;
export type StatusHandler = (status: ConnectionStatus) => void;
```

**Step 2: Create WebSocket manager**

```typescript
// services/realtime/websocket-manager.ts
import {
  ConnectionStatus,
  WebSocketConfig,
  WebSocketMessage,
  MessageHandler,
  StatusHandler,
} from './types';

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private messageQueue: WebSocketMessage[] = [];

  // Listeners
  private messageHandlers = new Map<string, Set<MessageHandler>>();
  private globalHandlers = new Set<MessageHandler>();
  private statusHandlers = new Set<StatusHandler>();

  constructor(config: WebSocketConfig) {
    this.config = {
      autoReconnect: true,
      maxReconnectAttempts: 10,
      reconnectBaseDelay: 1000,
      heartbeatInterval: 30000,
      connectionTimeout: 10000,
      ...config,
    };
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.setStatus('connecting');

    let url = this.config.url;
    if (this.config.getToken) {
      const token = await this.config.getToken();
      if (token) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}token=${token}`;
      }
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.ws?.close();
        reject(new Error('Connection timeout'));
      }, this.config.connectionTimeout);

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.flushQueue();
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch {
          // Non-JSON message, ignore
        }
      };

      this.ws.onclose = () => {
        clearTimeout(timeout);
        this.stopHeartbeat();
        this.setStatus('disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('WebSocket error'));
      };
    });
  }

  disconnect(): void {
    this.config.autoReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
    this.setStatus('disconnected');
  }

  send<T>(type: string, payload: T, channel?: string): void {
    const message: WebSocketMessage<T> = {
      type,
      channel,
      payload,
      timestamp: Date.now(),
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message as WebSocketMessage);
    }
  }

  subscribe(channel: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(channel)) {
      this.messageHandlers.set(channel, new Set());
    }
    this.messageHandlers.get(channel)!.add(handler);

    // Send subscribe message to server
    this.send('subscribe', { channel });

    return () => {
      this.messageHandlers.get(channel)?.delete(handler);
      if (this.messageHandlers.get(channel)?.size === 0) {
        this.messageHandlers.delete(channel);
        this.send('unsubscribe', { channel });
      }
    };
  }

  onMessage(handler: MessageHandler): () => void {
    this.globalHandlers.add(handler);
    return () => this.globalHandlers.delete(handler);
  }

  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  // --- Private ---

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusHandlers.forEach((handler) => handler(status));
  }

  private handleMessage(message: WebSocketMessage): void {
    // Global handlers
    this.globalHandlers.forEach((handler) => handler(message));

    // Channel handlers
    if (message.channel) {
      this.messageHandlers.get(message.channel)?.forEach((handler) => handler(message));
    }
  }

  private attemptReconnect(): void {
    if (
      !this.config.autoReconnect ||
      this.reconnectAttempts >= (this.config.maxReconnectAttempts ?? 10)
    ) {
      return;
    }

    this.setStatus('reconnecting');
    const delay =
      (this.config.reconnectBaseDelay ?? 1000) * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {
        // Reconnect failed, will try again via onclose
      });
    }, Math.min(delay, 30000));
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send('ping', {});
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private flushQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }
}
```

**Step 3: Commit**

```bash
git add services/realtime/
git commit -m "feat(realtime): add WebSocket manager with auto-reconnect and channel support"
```

---

## Task 17: WebSockets — Hooks

**Files:**
- Create: `hooks/useWebSocket.ts`
- Create: `hooks/useChannel.ts`
- Create: `hooks/usePresence.ts`

**Step 1: Create useWebSocket hook**

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketManager } from '@/services/realtime/websocket-manager';
import { ConnectionStatus, WebSocketConfig } from '@/services/realtime/types';

interface UseWebSocketReturn {
  status: ConnectionStatus;
  send: <T>(type: string, payload: T, channel?: string) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  manager: WebSocketManager;
}

export function useWebSocket(config: WebSocketConfig): UseWebSocketReturn {
  const managerRef = useRef<WebSocketManager | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  if (!managerRef.current) {
    managerRef.current = new WebSocketManager(config);
  }
  const manager = managerRef.current;

  useEffect(() => {
    const unsubscribe = manager.onStatusChange(setStatus);
    manager.connect().catch(() => {});

    return () => {
      unsubscribe();
      manager.disconnect();
    };
  }, []);

  const send = useCallback(
    <T,>(type: string, payload: T, channel?: string) => {
      manager.send(type, payload, channel);
    },
    [manager]
  );

  const connect = useCallback(() => manager.connect(), [manager]);
  const disconnect = useCallback(() => manager.disconnect(), [manager]);

  return { status, send, connect, disconnect, manager };
}
```

**Step 2: Create useChannel hook**

```typescript
// hooks/useChannel.ts
import { useEffect, useState, useCallback } from 'react';
import { WebSocketManager } from '@/services/realtime/websocket-manager';
import { WebSocketMessage } from '@/services/realtime/types';

interface UseChannelReturn<T> {
  messages: WebSocketMessage<T>[];
  lastMessage: WebSocketMessage<T> | null;
  send: (type: string, payload: T) => void;
}

export function useChannel<T = unknown>(
  manager: WebSocketManager,
  channel: string
): UseChannelReturn<T> {
  const [messages, setMessages] = useState<WebSocketMessage<T>[]>([]);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage<T> | null>(null);

  useEffect(() => {
    const unsubscribe = manager.subscribe(channel, (message) => {
      const typed = message as WebSocketMessage<T>;
      setMessages((prev) => [...prev, typed]);
      setLastMessage(typed);
    });

    return unsubscribe;
  }, [manager, channel]);

  const send = useCallback(
    (type: string, payload: T) => {
      manager.send(type, payload, channel);
    },
    [manager, channel]
  );

  return { messages, lastMessage, send };
}
```

**Step 3: Create usePresence hook**

```typescript
// hooks/usePresence.ts
import { useEffect, useState } from 'react';
import { WebSocketManager } from '@/services/realtime/websocket-manager';

interface PresenceUser {
  id: string;
  name?: string;
  lastSeen: number;
}

interface UsePresenceReturn {
  onlineUsers: PresenceUser[];
  isUserOnline: (userId: string) => boolean;
}

export function usePresence(
  manager: WebSocketManager,
  channel: string
): UsePresenceReturn {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    const unsubscribe = manager.subscribe(channel, (message) => {
      if (message.type === 'presence_join') {
        const user = message.payload as PresenceUser;
        setOnlineUsers((prev) => {
          const filtered = prev.filter((u) => u.id !== user.id);
          return [...filtered, user];
        });
      } else if (message.type === 'presence_leave') {
        const { id } = message.payload as { id: string };
        setOnlineUsers((prev) => prev.filter((u) => u.id !== id));
      } else if (message.type === 'presence_sync') {
        setOnlineUsers(message.payload as PresenceUser[]);
      }
    });

    // Request current presence list
    manager.send('presence_sync', {}, channel);

    return unsubscribe;
  }, [manager, channel]);

  const isUserOnline = (userId: string) =>
    onlineUsers.some((u) => u.id === userId);

  return { onlineUsers, isUserOnline };
}
```

**Step 4: Commit**

```bash
git add hooks/useWebSocket.ts hooks/useChannel.ts hooks/usePresence.ts
git commit -m "feat(realtime): add useWebSocket, useChannel, and usePresence hooks"
```

---

## Task 18: Update app.config.ts with new permissions & schemes

**Files:**
- Modify: `app.config.ts`

**Step 1: Add camera, location, contacts, media library permissions to Android/iOS config**

Add to the iOS config section:
```typescript
infoPlist: {
  NSCameraUsageDescription: 'This app uses the camera to take photos.',
  NSPhotoLibraryUsageDescription: 'This app accesses your photo library to select images.',
  NSLocationWhenInUseUsageDescription: 'This app uses your location to show nearby results.',
  NSContactsUsageDescription: 'This app accesses your contacts to find friends.',
  NSMicrophoneUsageDescription: 'This app uses the microphone to record audio.',
}
```

Add to the Android config section:
```typescript
permissions: [
  'CAMERA',
  'READ_CONTACTS',
  'ACCESS_FINE_LOCATION',
  'ACCESS_COARSE_LOCATION',
  'READ_MEDIA_IMAGES',
  'READ_MEDIA_VIDEO',
  'RECORD_AUDIO',
]
```

Add expo-camera plugin to plugins array:
```typescript
['expo-camera', { cameraPermission: 'This app uses the camera to take photos.' }],
```

**Step 2: Add OAuth redirect scheme for social login**

Add to the app scheme config:
```typescript
scheme: `com.yourcompany.yourapp${appVariant === 'development' ? '.dev' : appVariant === 'preview' ? '.preview' : ''}`,
```

**Step 3: Commit**

```bash
git add app.config.ts
git commit -m "chore: update app.config.ts with permissions, camera plugin, and OAuth scheme"
```

---

## Task 19: Update config constants with new feature flags

**Files:**
- Modify: `constants/config.ts`

**Step 1: Add feature flags and storage keys**

Add to `featureFlags`:
```typescript
ENABLE_SOCIAL_LOGIN: true,
ENABLE_PAYMENTS: false, // Enable when payment adapter is configured
```

Add to `storageKeys`:
```typescript
PERMISSION_PREFIX: '@permission_asked_',
ANALYTICS_USER_ID: '@analytics_user_id',
```

Add new config section:
```typescript
socialAuth: {
  google: {
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
  },
},
```

**Step 2: Update .env.example**

Add:
```env
# Social Login
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-google-ios-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-google-android-client-id
```

**Step 3: Commit**

```bash
git add constants/config.ts .env.example
git commit -m "chore: add Phase 6 feature flags and social auth config"
```

---

## Task 20: Update translations for new features

**Files:**
- Modify: `i18n/locales/en.json` (and equivalent for other locales)

**Step 1: Add translations for permissions, social login, payments**

Add to English translations:
```json
{
  "permissions": {
    "camera": "Camera access is needed to take photos.",
    "location": "Location access is needed to show nearby results.",
    "contacts": "Contacts access is needed to find friends.",
    "mediaLibrary": "Photo library access is needed to select images.",
    "microphone": "Microphone access is needed to record audio.",
    "notifications": "Notification permission is needed to send you alerts.",
    "openSettings": "Open Settings",
    "allowAccess": "Allow Access",
    "blocked": "Permission was denied. Please enable it in Settings."
  },
  "socialAuth": {
    "continueWithGoogle": "Continue with Google",
    "continueWithApple": "Continue with Apple",
    "orContinueWith": "Or continue with"
  },
  "payments": {
    "upgradeToPremium": "Upgrade to Premium",
    "subscribe": "Subscribe",
    "restore": "Restore purchases",
    "perMonth": "/mo",
    "perYear": "/yr"
  },
  "upload": {
    "uploading": "Uploading...",
    "complete": "Complete",
    "failed": "Upload failed",
    "retry": "Retry",
    "addPhoto": "Add Photo"
  }
}
```

**Step 2: Commit**

```bash
git add i18n/
git commit -m "feat(i18n): add translations for permissions, social login, payments, upload"
```

---

## Task 21: Integrate AnalyticsProvider into root layout

**Files:**
- Modify: `app/_layout.tsx`

**Step 1: Add AnalyticsProvider to the provider tree**

Import and wrap the root layout children with `AnalyticsProvider` (inside the QueryClientProvider, after ThemeProvider):

```tsx
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider';

// In the provider tree:
<AnalyticsProvider>
  {/* existing children */}
</AnalyticsProvider>
```

**Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat(analytics): integrate AnalyticsProvider into root layout"
```

---

## Task 22: Update login screen with social login buttons

**Files:**
- Modify: `app/(public)/login.tsx`

**Step 1: Add SocialLoginButtons to login screen**

Import and add below the existing login form:
```tsx
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';

// After the form, add:
<View className="my-4 flex-row items-center gap-3">
  <View className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
  <Text className="text-muted-light dark:text-muted-dark text-sm">or</Text>
  <View className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
</View>

<SocialLoginButtons
  onSuccess={async (result) => {
    // Handle social login success — send idToken to your backend
    // then sign in with the returned session
  }}
/>
```

**Step 2: Commit**

```bash
git add app/(public)/login.tsx
git commit -m "feat(social-login): add social login buttons to login screen"
```

---

## Task 23: Update exports and documentation

**Files:**
- Modify: `README.md` — Add Phase 6 features section
- Modify: `CHANGELOG.md` — Add 3.0.0 entry

**Step 1: Update README**

Add Phase 6 feature descriptions under the features section.

**Step 2: Update CHANGELOG**

Add `## [3.0.0] - 2026-02-XX` with all new features listed.

**Step 3: Update package.json version**

```bash
npm version minor --no-git-tag-version
```

**Step 4: Commit**

```bash
git add README.md CHANGELOG.md package.json
git commit -m "docs: update README and CHANGELOG for Phase 6 (v3.0.0)"
```

---

## Task 24: Run full test suite and verify build

**Step 1: Run existing tests**

```bash
npx jest --coverage
```

Expected: All existing tests pass, no regressions.

**Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors.

**Step 3: Run lint**

```bash
npx eslint . --ext .ts,.tsx
```

Expected: No errors (warnings acceptable).

**Step 4: Verify Expo build**

```bash
npx expo export --platform web
```

Expected: Web export succeeds.

**Step 5: Commit any fixes if needed**

```bash
git add -A
git commit -m "fix: resolve Phase 6 integration issues"
```
