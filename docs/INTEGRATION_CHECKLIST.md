# Integration Checklist

When you create a new project from this template, use this checklist to track all the `TODO` placeholders you need to replace with your real configuration.

## API & Networking

- [ ] **API Base URL** — `constants/config.ts:10`
      Replace `https://api.example.com` with your actual API URL for each environment (dev, staging, production).
- [ ] **Token Refresh Endpoint** — `services/api.ts:127`
      Replace the stub refresh endpoint with your real token refresh URL.
- [ ] **Certificate Pins** — `constants/config.ts:114`
      Add your production API certificate pins for SSL pinning.

## Authentication

- [ ] **Sign In** — `hooks/useAuth.tsx:156`
      Replace the mock `signIn` implementation with your actual API call.
- [ ] **Sign Up** — `hooks/useAuth.tsx:200`
      Replace the mock `signUp` implementation with your actual API call.
- [ ] **Update User** — `hooks/useAuth.tsx:234`
      Replace the mock `updateUser` implementation with your actual API call.
- [ ] **Sign Out** — `hooks/useAuth.tsx:264`
      Optionally call a logout endpoint to invalidate the refresh token server-side.
- [ ] **Social Login** — `app/(public)/login.tsx:130`
      Send the social login `result.idToken` to your backend for verification.
- [ ] **Forgot Password** — `app/(public)/forgot-password.tsx:34`
      Implement the password reset API call.

## MFA (Multi-Factor Authentication)

- [ ] **MFA Setup** — `hooks/useMFA.ts:228`
      Replace MFA setup with your actual API call.
- [ ] **MFA Verify** — `hooks/useMFA.ts:253`
      Replace MFA verification with your actual API call.
- [ ] **MFA Disable** — `hooks/useMFA.ts:302`
      Replace MFA disable with your actual API call.
- [ ] **MFA Recovery** — `hooks/useMFA.ts:347`, `hooks/useMFA.ts:382`, `hooks/useMFA.ts:406`, `hooks/useMFA.ts:448`
      Replace recovery code generation, verification, and backup with your actual API calls.

## Analytics & Monitoring

- [ ] **Sentry DSN** — `services/sentry.ts:6`
      Replace with your actual Sentry DSN from [sentry.io](https://sentry.io).

## Notifications

- [ ] **Notification Navigation** — `hooks/useNotifications.ts:92`
      Handle notification deep-link navigation based on the notification `data` payload.

---

**Tip:** Run `grep -rn "TODO" --include="*.ts" --include="*.tsx" .` to find any TODOs added after this checklist was created.
