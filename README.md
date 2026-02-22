# @croacroa/react-native-template

[![npm version](https://img.shields.io/npm/v/@croacroa/react-native-template.svg)](https://www.npmjs.com/package/@croacroa/react-native-template)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2052-000020.svg)](https://expo.dev/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/croacroa-dev-team/template-react-native/pulls)

A production-ready React Native template with Expo SDK 52, featuring authentication, i18n, biometrics, offline support, and more.

## ✨ Features

### Core

- **Expo SDK 52** with TypeScript
- **Expo Router** for file-based navigation
- **NativeWind** (Tailwind CSS) for styling
- **Zustand** for state management
- **TanStack Query** with offline persistence
- **React Hook Form + Zod** for form validation

### Authentication & Security

- **Auth Adapter Pattern** - Easy switching between Supabase, Firebase, etc.
- **Biometric Auth** - Face ID / Touch ID support
- **Secure token storage** with expo-secure-store
- **Automatic token refresh** with race condition handling

### Internationalization

- **i18n** with expo-localization + i18next
- **English & French** translations included
- **Language detection** and persistence

### UX Features

- **Dark/Light Theme** with system preference support
- **Onboarding Screens** with animated pagination
- **Push Notifications** with Expo Notifications
- **Toast Notifications** with Burnt
- **Deep Linking** support with route parsing
- **Skeleton Loaders** with shimmer animation
- **Offline Support** with connection status toasts
- **OTA Updates** with expo-updates integration

### UI Components

- Button, Input, Card, Modal, Skeleton
- **Select/Dropdown**, Checkbox, Switch
- **BottomSheet** with @gorhom/bottom-sheet
- **Avatar** with initials fallback
- **Badge, Chip, CountBadge**
- **OptimizedImage** with expo-image

### Animations & Transitions

- **Animation Presets** (timing, spring, bounce)
- **Screen Transitions** (slide, fade, modal) for Expo Router
- **useAnimatedEntry** & **useStaggeredEntry** hooks
- **useParallax** scroll effect hook
- **AnimatedScreen** & **AnimatedListItem** components

### Permissions

- **Centralized Permission Manager** for all Expo permissions
- **usePermission** hook with auto-refresh on app resume
- **PermissionGate** component for declarative permission UI

### Social Login

- **Google Sign-In** via expo-auth-session with PKCE
- **Apple Sign-In** via expo-apple-authentication (iOS)
- **SocialLoginButtons** component with platform-aware display

### Analytics

- **Analytics Adapter Pattern** — pluggable providers (PostHog, Mixpanel, etc.)
- **Auto screen tracking** via Expo Router
- **useTrackEvent** hook for custom events

### Payments & Subscriptions

- **Payment Adapter Pattern** — pluggable providers (RevenueCat, Stripe, etc.)
- **Paywall** component with product listing
- **useSubscription** hook for subscription status

### File Upload & Media

- **Image picker** (camera + library) with compression
- **Upload with progress** tracking, cancel, retry
- **ImagePickerButton** & **UploadProgress** components

### Real-time / WebSockets

- **WebSocketManager** with auto-reconnect & exponential backoff
- **useChannel** & **usePresence** hooks
- Offline queue & auth token injection

### DevOps & Quality

- **GitHub Actions** CI/CD workflows
- **Maestro** E2E tests
- **Sentry** for crash reporting
- **Analytics Adapter** for multiple providers
- **Performance Monitoring** hooks
- **Accessibility** utilities and hooks
- **Jest + Testing Library** with 58+ tests
- **Storybook** for component documentation
- **ESLint + Prettier + Husky** for code quality

## 🚀 Quick Start

### Option 1: Using npx (Recommended)

```bash
npx create-expo-app my-app --template @croacroa/react-native-template
cd my-app
npm install
```

### Option 2: Using degit

```bash
npx degit croacroa-dev-team/template-react-native my-app
cd my-app
./scripts/init.sh  # macOS/Linux
# or
.\scripts\init.ps1  # Windows PowerShell
```

### Option 3: Clone Repository

```bash
git clone https://github.com/croacroa-dev-team/template-react-native my-app
cd my-app
rm -rf .git
npm install
cp .env.example .env
```

Then update:

- `app.config.ts` - App name, bundle ID, scheme
- `package.json` - Package name
- `constants/config.ts` - API URLs

### Run the App

```bash
npm start           # Start development server
npm run ios         # Run on iOS simulator
npm run android     # Run on Android emulator
```

## 📁 Project Structure

```
├── app/                    # Expo Router pages
│   ├── (auth)/            # Protected routes (home, profile, settings)
│   ├── (public)/          # Public routes (login, register, forgot-password)
│   └── _layout.tsx        # Root layout with providers
├── components/
│   ├── ui/                # UI components (Button, Card, Modal, Skeleton)
│   ├── forms/             # Form components (FormInput)
│   └── ErrorBoundary.tsx  # Global error handling
├── hooks/                 # useAuth, useTheme, useNotifications, useApi, useOffline
├── stores/                # Zustand stores (appStore, notificationStore)
├── services/
│   ├── api.ts            # HTTP client with 401 retry
│   ├── queryClient.ts    # TanStack Query with persistence
│   ├── sentry.ts         # Crash reporting
│   └── storage.ts        # AsyncStorage & SecureStore helpers
├── utils/                 # cn, toast, validation schemas
├── constants/             # App configuration
├── types/                 # TypeScript types
├── __tests__/             # Test files (58+ tests)
└── scripts/               # Init scripts for template setup
```

## 🔐 Authentication

Complete auth flow with automatic token refresh:

```tsx
import { useAuth } from "@/hooks/useAuth";

function MyComponent() {
  const {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateUser,
    refreshSession,
  } = useAuth();
}
```

Features:

- Tokens stored securely with expo-secure-store
- Automatic refresh 5 minutes before expiry
- Race condition handling for concurrent requests
- Redirect to login on session expiry

## 📡 API Client

Robust HTTP client with automatic retry:

```tsx
import { api } from "@/services/api";

// Basic requests
const users = await api.get<User[]>("/users");
const user = await api.post<User>("/users", { name: "John" });
await api.put("/users/1", { name: "Jane" });
await api.delete("/users/1");

// Skip auth for public endpoints
await api.get("/public", { requiresAuth: false });
```

### 401 Handling

The API client automatically:

1. Catches 401 responses
2. Refreshes the access token
3. Retries the original request
4. Redirects to login if refresh fails

## 📊 Data Fetching

TanStack Query with offline persistence:

```tsx
import { useCurrentUser, useUpdateUser } from "@/hooks/useApi";

function Profile() {
  const { data: user, isLoading, error } = useCurrentUser();
  const updateUser = useUpdateUser();

  const handleUpdate = () => {
    updateUser.mutate(
      { name: "New Name" },
      { onSuccess: () => toast.success("Updated!") }
    );
  };
}
```

### CRUD Factory

Create hooks for any resource:

```tsx
import { createCrudHooks } from "@/hooks/useApi";

const postsApi = createCrudHooks<Post>({
  baseKey: ["posts"],
  endpoint: "/posts",
  entityName: "Post",
});

// Usage
const { data: posts } = postsApi.useList();
const { data: post } = postsApi.useById("123");
const createPost = postsApi.useCreate();
```

## 📴 Offline Support

Automatic offline handling:

```tsx
import { useOffline } from "@/hooks/useOffline";

function MyComponent() {
  const { isOffline, isOnline } = useOffline({ showToast: true });
  // Shows toast when connection lost/restored
}
```

Query cache persisted to AsyncStorage - data available offline.

## 🎨 Skeleton Loaders

Pre-built skeleton components:

```tsx
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonProfile,
  SkeletonList,
} from "@/components/ui/Skeleton";

// Single skeleton
<Skeleton width={200} height={20} />

// Profile placeholder
<SkeletonProfile />

// List of cards
<SkeletonList count={5} variant="card" />
```

## 🔔 Toast Notifications

Centralized toast system:

```tsx
import { toast, handleApiError } from "@/utils/toast";

// Simple toasts
toast.success("Profile updated");
toast.error("Something went wrong", "Please try again");
toast.info("New message received");

// Handle API errors automatically
try {
  await api.post("/endpoint", data);
} catch (error) {
  handleApiError(error); // Shows appropriate toast
}
```

## 🛡️ Error Boundary

Global error handling with Sentry:

```tsx
// Already wrapped in _layout.tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>;

// Or use HOC for specific components
import { withErrorBoundary } from "@/components/ErrorBoundary";

const SafeComponent = withErrorBoundary(RiskyComponent);
```

## 📋 Form Validation

React Hook Form + Zod:

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/forms";
import { loginSchema, LoginFormData } from "@/utils/validation";

function LoginForm() {
  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <FormInput
      name="email"
      control={control}
      label="Email"
      keyboardType="email-address"
    />
  );
}
```

Pre-built schemas: `loginSchema`, `registerSchema`, `forgotPasswordSchema`, `profileSchema`

## 🎭 Theming

Dark/light mode with persistence:

```tsx
import { useTheme } from "@/hooks/useTheme";

function MyComponent() {
  const { isDark, mode, toggleTheme, setMode } = useTheme();
  // mode: 'light' | 'dark' | 'system'
}
```

## 🔧 Configuration

### Environment Variables

```env
# .env
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### Sentry Setup

1. Create project at [sentry.io](https://sentry.io)
2. Copy DSN to `.env`
3. Errors automatically reported in production

## 🧪 Testing

58+ tests included:

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

Test coverage:

- `useAuth` hook - 24 tests
- `ApiClient` - 22 tests
- UI components - 12 tests

## 📜 Available Scripts

| Command                 | Description              |
| ----------------------- | ------------------------ |
| `npm start`             | Start Expo dev server    |
| `npm run ios`           | Run on iOS simulator     |
| `npm run android`       | Run on Android emulator  |
| `npm test`              | Run tests                |
| `npm run storybook`     | Start Storybook          |
| `npm run lint`          | Run ESLint               |
| `npm run typecheck`     | TypeScript check         |
| `npm run build:dev`     | Build development client |
| `npm run build:preview` | Build preview APK/IPA    |
| `npm run build:prod`    | Build production release |

## ✅ Customization Checklist

- [ ] Run init script or manually update placeholders
- [ ] Replace icons in `assets/images/`
- [ ] Configure API URL in `constants/config.ts`
- [ ] Set up Sentry DSN in `.env`
- [ ] Configure EAS: `eas build:configure`
- [ ] Implement real API calls in `services/api.ts`
- [ ] Add your analytics

## 📄 License

MIT
