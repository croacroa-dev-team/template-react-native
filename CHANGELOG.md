# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Auth adapter pattern for easy provider switching (Supabase, Firebase, etc.)
- Internationalization (i18n) support with expo-localization and i18next
  - English and French translations included
  - Language detection and persistence
- New UI components:
  - `Select` - Dropdown/picker component
  - `Checkbox` and `CheckboxGroup` - Animated checkbox components
  - `BottomSheet` - Modal bottom sheet with @gorhom/bottom-sheet
  - `Avatar` and `AvatarGroup` - User avatar components
  - `Badge`, `Chip`, and `CountBadge` - Label/tag components
  - `OptimizedImage` - High-performance image component with expo-image
- Deep linking support with `useDeepLinking` hook
- Biometric authentication with `useBiometrics` hook
- Analytics adapter for multiple providers (Mixpanel, Amplitude, etc.)
- Rate limiting for API calls using Bottleneck
- E2E testing setup with Maestro
  - Login, registration, navigation, and offline flow tests
- Project documentation:
  - CONTRIBUTING.md
  - CHANGELOG.md
  - Architecture Decision Records (ADRs)

### Changed

- Primary color changed from blue to emerald green (croacroa branding)
- API client now includes rate limiting protection

### Dependencies Added

- `@gorhom/bottom-sheet` ^4.6.0
- `bottleneck` ^2.19.5
- `expo-image` ~2.0.0
- `expo-local-authentication` ~15.0.0
- `expo-localization` ~15.0.0
- `i18next` ^23.0.0
- `react-i18next` ^14.0.0

## [1.0.0] - 2024-01-01

### Added

- Initial release
- Expo SDK 52 with React Native 0.76
- Expo Router for file-based navigation
- Authentication flow with secure token storage
- React Query for data fetching with offline support
- Zustand for state management
- NativeWind (Tailwind CSS) for styling
- React Hook Form with Zod validation
- Push notifications with Expo Notifications
- Error tracking with Sentry
- Storybook for component documentation
- Jest and Testing Library for unit tests
- Dark mode support
- Basic UI components (Button, Input, Card, Modal, Skeleton)
- Animated components with Reanimated
- Toast notifications with Burnt

### Infrastructure

- EAS Build configuration for dev/preview/production
- ESLint and Prettier setup
- Husky pre-commit hooks
- TypeScript strict mode

---

## Versioning Guide

### Version Format: MAJOR.MINOR.PATCH

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Changelog Categories

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Features to be removed
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements
