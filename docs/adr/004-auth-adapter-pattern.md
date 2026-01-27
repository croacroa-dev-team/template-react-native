# ADR-004: Auth Adapter Pattern for Authentication

## Status

Accepted

## Date

2024-01-15

## Context

The template needs to support multiple authentication providers (Supabase, Firebase, Auth0, custom backends) without requiring significant code changes. We need:

1. Easy switching between auth providers
2. Consistent API regardless of provider
3. Type safety
4. Testability with mock implementations

## Decision

Implement an **Adapter Pattern** for authentication that abstracts the auth provider behind a common interface.

## Rationale

1. **Flexibility**: Change auth providers without touching app code
2. **Testing**: Easy to mock for unit tests
3. **Consistency**: Same API for all providers
4. **Gradual Migration**: Can switch providers incrementally

## Implementation

### Interface Definition

```typescript
// services/authAdapter.ts
export interface AuthAdapter {
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(email: string, password: string, name: string): Promise<AuthResult>;
  signOut(): Promise<void>;
  refreshToken(refreshToken: string): Promise<AuthTokens>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  getSession(): Promise<AuthResult | null>;
  onAuthStateChange?(callback: (user: User | null) => void): () => void;
}

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}
```

### Mock Implementation

```typescript
export const mockAuthAdapter: AuthAdapter = {
  async signIn(email, password) {
    await delay(1000); // Simulate network
    return {
      user: { id: '1', email, name: email.split('@')[0] },
      tokens: { accessToken: 'mock', refreshToken: 'mock', expiresAt: ... },
    };
  },
  // ... other methods
};
```

### Supabase Implementation

```typescript
export const supabaseAuthAdapter: AuthAdapter = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return transformSupabaseSession(data);
  },
  // ... other methods
};
```

### Usage

```typescript
// services/authAdapter.ts
// Change this line to switch providers
export const authAdapter: AuthAdapter = mockAuthAdapter;
// export const authAdapter: AuthAdapter = supabaseAuthAdapter;
// export const authAdapter: AuthAdapter = firebaseAuthAdapter;
```

## Consequences

### Positive

- Provider-agnostic code
- Easy to test with mocks
- Clear contract for auth operations
- Can support multiple providers simultaneously

### Negative

- Some provider-specific features may not fit the interface
- Additional abstraction layer
- Need to maintain multiple implementations

### Mitigation

- Allow optional methods in interface
- Document provider-specific extensions
- Keep interface focused on common operations

## Testing

```typescript
// __tests__/auth.test.ts
import { mockAuthAdapter } from "@/services/authAdapter";

describe("Auth", () => {
  it("signs in successfully", async () => {
    const result = await mockAuthAdapter.signIn("test@example.com", "password");
    expect(result.user.email).toBe("test@example.com");
    expect(result.tokens.accessToken).toBeDefined();
  });
});
```

## Migration Guide

To switch from mock to Supabase:

1. Install Supabase: `npx expo install @supabase/supabase-js`
2. Configure environment variables
3. Implement `supabaseAuthAdapter`
4. Update export in `authAdapter.ts`

## References

- [Adapter Pattern](https://refactoring.guru/design-patterns/adapter)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Firebase Auth](https://firebase.google.com/docs/auth)
