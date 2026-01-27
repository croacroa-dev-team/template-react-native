# Contributing to React Native Template

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

Please be respectful and constructive in all interactions. We're building something together.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator
- Git

### Setup

1. **Fork the repository**

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/template-react-native.git
   cd template-react-native
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names:

- `feature/add-user-profile` - New features
- `fix/login-validation` - Bug fixes
- `docs/update-readme` - Documentation
- `refactor/auth-service` - Code refactoring
- `chore/update-deps` - Maintenance tasks

### Creating a Feature

1. Create a new branch from `main`:

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Run linting and tests:

   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```

4. Commit your changes (see [Commit Messages](#commit-messages))

5. Push to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a Pull Request

## Code Style

### TypeScript

- Use TypeScript for all new code
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Export types from dedicated files in `/types`

```typescript
// Good
interface UserProps {
  id: string;
  name: string;
  email: string;
}

// Avoid
const user: any = { ... };
```

### React Components

- Use functional components with hooks
- Use NativeWind for styling
- Keep components small and focused
- Extract reusable logic into hooks

```tsx
// Good
export function UserCard({ user }: UserCardProps) {
  return (
    <View className="p-4 bg-white rounded-xl">
      <Text className="text-lg font-semibold">{user.name}</Text>
    </View>
  );
}

// Avoid inline styles
<View style={{ padding: 16, backgroundColor: 'white' }}>
```

### File Organization

```
components/
├── ui/           # Reusable UI components
│   ├── Button.tsx
│   └── index.ts  # Barrel exports
├── forms/        # Form-specific components
└── [feature]/    # Feature-specific components

hooks/
├── useAuth.tsx   # Context hooks
├── useApi.ts     # Data fetching hooks
└── index.ts      # Barrel exports

services/
├── api.ts        # API client
└── index.ts      # Barrel exports
```

### Naming Conventions

- **Files**: `PascalCase.tsx` for components, `camelCase.ts` for utilities
- **Components**: `PascalCase`
- **Hooks**: `useCamelCase`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Functions/Variables**: `camelCase`

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(auth): add biometric authentication

- Add useBiometrics hook
- Integrate with expo-local-authentication
- Add settings toggle for biometric login

Closes #123
```

```
fix(api): handle rate limiting gracefully

Add Bottleneck for client-side rate limiting
to prevent 429 errors.
```

## Pull Requests

### Before Submitting

1. **Update your branch** with the latest `main`:

   ```bash
   git checkout main
   git pull origin main
   git checkout your-branch
   git rebase main
   ```

2. **Run all checks**:

   ```bash
   npm run lint:fix
   npm run typecheck
   npm test
   ```

3. **Test on both platforms** (iOS and Android)

### PR Template

```markdown
## Description

[Describe what this PR does]

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Tested on iOS
- [ ] Tested on Android

## Screenshots (if applicable)

[Add screenshots for UI changes]

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-reviewed the code
- [ ] Added/updated documentation
- [ ] No new warnings
```

### Review Process

1. PRs require at least one approval
2. All CI checks must pass
3. Address reviewer feedback
4. Squash commits when merging

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Writing Tests

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress}>Click me</Button>
    );
    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### E2E Tests (Maestro)

```bash
# Run all E2E tests
maestro test maestro/flows/

# Run specific test
maestro test maestro/flows/login.yaml
```

## Documentation

### Code Comments

- Add JSDoc comments for public APIs
- Explain "why", not "what"
- Keep comments up to date

````typescript
/**
 * Authenticate using biometrics
 *
 * @param options - Authentication options
 * @returns true if authentication succeeded
 *
 * @example
 * ```ts
 * const success = await authenticate({
 *   promptMessage: 'Verify your identity',
 * });
 * ```
 */
async function authenticate(options?: AuthOptions): Promise<boolean> {
  // ...
}
````

### README Updates

Update the README when:

- Adding new features
- Changing installation steps
- Modifying environment variables
- Adding new scripts

### Architecture Decision Records (ADRs)

For significant architectural decisions, create an ADR in `/docs/adr/`:

```markdown
# ADR-001: Use Zustand for State Management

## Status

Accepted

## Context

[Why was this decision needed?]

## Decision

[What was decided?]

## Consequences

[What are the implications?]
```

## Questions?

Feel free to open an issue for questions or discussions.
