# Auth: Supabase Integration

Replace the mock auth adapter with [Supabase Auth](https://supabase.com/docs/guides/auth) in under 10 minutes.

## Prerequisites

- A Supabase project ([create one here](https://supabase.com/dashboard))
- Your project URL and anon key from **Settings > API**

## 1. Install the SDK

```bash
npx expo install @supabase/supabase-js
```

## 2. Add Environment Variables

Add these to your `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Create the Adapter

Create `services/auth/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import type { AuthAdapter, AuthResult } from "@/services/authAdapter";
import type { User, AuthTokens } from "@/types";

// Initialize the Supabase client once at module level
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

/** Convert a Supabase session + user into the template's AuthResult shape */
function toAuthResult(
  user: { id: string; email?: string; user_metadata: Record<string, any>; created_at: string },
  session: { access_token: string; refresh_token: string; expires_at?: number }
): AuthResult {
  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      name: user.user_metadata.name ?? user.email?.split("@")[0] ?? "",
      avatar: user.user_metadata.avatar_url,
      createdAt: user.created_at,
    },
    tokens: {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      // Supabase expires_at is in seconds; the template expects milliseconds
      expiresAt: (session.expires_at ?? 0) * 1000,
    },
  };
}

export const supabaseAuthAdapter: AuthAdapter = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw { code: error.name, message: error.message };
    return toAuthResult(data.user!, data.session!);
  },

  async signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw { code: error.name, message: error.message };
    return toAuthResult(data.user!, data.session!);
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw { code: error.name, message: error.message };
  },

  async refreshToken(_refreshToken) {
    // Supabase manages the refresh token internally; calling refreshSession
    // is enough. The _refreshToken parameter is ignored.
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw { code: error.name, message: error.message };
    return {
      accessToken: data.session!.access_token,
      refreshToken: data.session!.refresh_token,
      expiresAt: (data.session!.expires_at ?? 0) * 1000,
    };
  },

  async forgotPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw { code: error.name, message: error.message };
  },

  async resetPassword(_token, newPassword) {
    // After the user clicks the reset link, Supabase sets a session.
    // We can update the password directly on the current session.
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw { code: error.name, message: error.message };
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return null;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    return toAuthResult(userData.user, data.session);
  },

  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          callback({
            id: session.user.id,
            email: session.user.email ?? "",
            name: session.user.user_metadata.name ?? "",
            avatar: session.user.user_metadata.avatar_url,
            createdAt: session.user.created_at,
          });
        } else {
          callback(null);
        }
      }
    );
    return () => subscription.unsubscribe();
  },
};
```

## 4. Activate the Adapter

Open `services/authAdapter.ts` and change the last line:

```diff
- export const authAdapter: AuthAdapter = mockAuthAdapter;
+ import { supabaseAuthAdapter } from "./auth/supabase";
+ export const authAdapter: AuthAdapter = supabaseAuthAdapter;
```

That is the only change needed in the existing codebase. Every screen and hook that consumes `authAdapter` will now talk to Supabase.

## 5. Verify

1. Run the app: `npx expo start`
2. Register a new account -- check the Supabase dashboard **Authentication > Users**
3. Sign out, then sign back in
4. Trigger "Forgot password" and confirm the email arrives

## What's Next

- **Social login:** Add Google/Apple via `supabase.auth.signInWithOAuth()`
- **Row-level security:** Enable RLS on your Supabase tables and pass the access token with API calls
- **Deep link handling:** Configure a redirect URL so password-reset links open your app directly
