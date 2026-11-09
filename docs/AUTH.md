# ABrainoConscious Authentication & Role Guide

This document defines the authentication architecture, security boundaries, multi-app configuration, Google OAuth & Supabase settings, branded email templates, production launch checklist, manual testing verification, and troubleshooting guides across the ABrainoConscious platform.

---

## 1. Authentication Architecture Across Apps

The ABrainoConscious platform operates across three subdomains / applications with distinct security contexts:
- **Landing Site (`apps/landing`):** Public marketing and course discovery. Dynamic URLs generated via `getLandingUrl()` (`localhost:5175` in dev, `https://${ROOT_DOMAIN}` in prod). Directs prospective students to signup or login preserving intent (e.g. `?program=21-day-mindset`).
- **Student Web App (`apps/web`):** The student sanctuary. Dynamic URLs generated via `getAppUrl()` (`localhost:5173` in dev, `https://app.${ROOT_DOMAIN}` in prod). Uses storage key `sb-web-auth`. Protects routes with `RequireAuth`, routes incomplete profiles to `/onboarding`, handles email verification, password reset, and student profile preferences.
- **Admin Control Panel (`apps/admin`):** The creator & staff console ("Naman Studio"). Dynamic URLs generated via `getAdminUrl()` (`localhost:5174` in dev, `https://admin.${ROOT_DOMAIN}` in prod). Uses separate storage key `sb-admin-auth`. Protects all routes with `RequireRole(['admin', 'staff'])`. Enforces a 30-minute idle session timeout, client-side login throttling after 5 attempts, and optional TOTP MFA (AAL2). Any non-admin account attempting to sign in is immediately presented with an unmistakable "Access Denied" screen and signed out.

### Auth Mechanisms & Security Primitives
1. **PKCE Flow:** Configured with `flowType: 'pkce'`, `persistSession: true`, and `detectSessionInUrl: true` across all clients.
2. **Subdomain-Isolated Storage Keys:**
   - Web App: `sb-web-auth`
   - Admin App: `sb-admin-auth`
   This guarantees that an active student session on `app.<domain>` cannot hydrate or interfere with `admin.<domain>`.
3. **Open Redirect Defense:** All `next` and `program` parameters pass through `sanitizeRedirectPath` and `sanitizeProgramSlug`. Hostile patterns (protocol-relative `//evil.com`, backslash evasion `/\evil.com`, UNC paths, `javascript:`, `data:` URIs) are strictly sanitized to safe relative fallbacks.
4. **Kind, Empathetic Error Messages:** `mapAuthError` converts raw technical Supabase errors into conversational brand voice messages (e.g., "We couldn't sign you in with those details. Please double-check your email and password, or use a sign-in link").

---

## 2. Roles & Permissions Matrix

User privileges are enforced at the database level by PostgreSQL Row Level Security (RLS) policies:

| Role | Scope | Permissions & Access Boundaries |
| :--- | :--- | :--- |
| **`student`** | Default | Enrolled programs, personal lesson progress, community posts/comments, quiz submissions, earned certificates. Blocked from administrative routes. |
| **`staff`** | Operational | Read/write program content, schedules, announcements, and reviews. Reduced admin navigation (payments, coupons, team, settings, and audit logs are hidden as UX hint). Cannot alter roles or delete programs. |
| **`admin`** | Superuser | Full system access: program management, financial orders/refunds, role changes, coupons, system audit logs, video streaming infrastructure, and platform settings. |

Privilege escalation is guarded by the trigger `trg_protect_profile_fields` on the `profiles` table. When pre-seeded administrators sign in via Google OAuth for the first time, `trg_on_auth_user_created` and `trg_on_auth_user_updated` preserve their pre-existing admin role without downgrading or duplicating records.

---

## 3. Google Cloud & Supabase Settings Configuration

### Supabase Authentication Dashboard Configuration
Navigate to **Authentication -> URL Configuration**:

- **Site URL:**
  - Development: `http://localhost:5173`
  - Production: `https://app.<ROOT_DOMAIN>` (e.g. `https://app.abrainoconcious.com`)
- **Redirect URLs (Allow list):**
  - `http://localhost:5173/**`
  - `http://localhost:5174/**`
  - `http://localhost:5175/**`
  - `http://127.0.0.1:5173/**`
  - `http://127.0.0.1:5174/**`
  - `http://127.0.0.1:5175/**`
  - `https://app.<ROOT_DOMAIN>/**`
  - `https://admin.<ROOT_DOMAIN>/**`
  - `https://<ROOT_DOMAIN>/**`

### Google Cloud Console OAuth 2.0 Client IDs
Navigate to **Google Cloud Console -> APIs & Services -> Credentials -> OAuth 2.0 Client IDs**:

- **Authorized JavaScript Origins:**
  - `http://localhost:5173`
  - `http://localhost:5174`
  - `http://localhost:5175`
  - `http://127.0.0.1:5173`
  - `http://127.0.0.1:5174`
  - `http://127.0.0.1:5175`
  - `https://<ROOT_DOMAIN>`
  - `https://app.<ROOT_DOMAIN>`
  - `https://admin.<ROOT_DOMAIN>`
  - `https://<PROJECT-REF>.supabase.co`

- **Authorized Redirect URIs:**
  - `https://<PROJECT-REF>.supabase.co/auth/v1/callback`

---

## 4. Branded Email Templates

Branded HTML email templates are stored in `docs/email-templates/`:
- `confirm-signup.html` — Confirm your email to join ABrainoConscious
- `magic-link.html` — Your secure sign-in link
- `reset-password.html` — Reset your password
- `change-email.html` — Confirm your updated email address
- `invite-user.html` — Welcome to the team

### Subject Lines
See `docs/email-templates/SUBJECTS.md`:
- Confirm email: `Welcome to ABrainoConscious — Please confirm your email`
- Magic link: `Your secure sign-in link for ABrainoConscious`
- Reset password: `Reset your ABrainoConscious password`
- Change email: `Confirm your updated email address`
- Invite user: `You've been invited to ABrainoConscious Studio`

To install: Open the Supabase Dashboard -> **Authentication -> Email Templates**, select the corresponding template tab, and paste the HTML content.

---

## 5. What Changes at Launch

| Component | Development / Staging | Production Launch |
| :--- | :--- | :--- |
| **Site URL** | `http://localhost:5173` | `https://app.abrainoconcious.com` |
| **Google OAuth Status** | "Testing" (requires adding test user emails in GCP) | "In Production" (verified OAuth consent screen, public access) |
| **Email SMTP** | Supabase default mail service (rate-limited to 30 emails/hr) or local Mailpit | Custom transactional SMTP provider (e.g. Resend, SendGrid, Amazon SES) configured in Supabase Auth Settings |
| **Domain Environment** | `VITE_ROOT_DOMAIN=abrainoconcious.com` | Configured with production domain on hosting provider (e.g. Vercel / Cloudflare) |

---

## 6. Manual Testing Verification Checklist

Run through this manual verification checklist before going live:

### A. Google OAuth Sign-In
- [ ] Open `http://localhost:5173/login`. Click **Continue with Google**.
- [ ] Sign in with personal Google account.
- [ ] Confirm automatic redirection to `/onboarding` for first-time sign-ins.
- [ ] Complete onboarding (name, phone, pillars, referral). Confirm redirect to student dashboard `/`.
- [ ] Sign in with pre-seeded admin Google account (`admin@abrainoconcious.com`). Confirm `role` remains `admin` in database and profile.

### B. Email Confirmation Flow
- [ ] Visit `http://localhost:5173/signup`.
- [ ] Submit signup form with a fresh email address.
- [ ] Verify browser navigates to `/verify-email`.
- [ ] Open local Mailpit (`http://127.0.0.1:54324`) or remote inbox. Click confirmation link.
- [ ] Confirm redirection through `/auth/callback` to `/onboarding`.

### C. Passwordless Magic Link
- [ ] Visit `http://localhost:5173/login`. Click **Email me a sign-in link**.
- [ ] Enter registered email and click **Send Sign-In Link**.
- [ ] Inspect inbox for branded magic link email.
- [ ] Click link, verify calm loading state at `/auth/callback`, and confirm successful session hydration.

### D. Password Reset Flow
- [ ] Visit `http://localhost:5173/forgot-password`. Enter registered email.
- [ ] Inspect inbox for password reset email.
- [ ] Click reset link -> lands on `/reset-password`.
- [ ] Enter new valid password (strength meter green). Submit.
- [ ] Log in with new credentials.

### E. Two-Factor Authentication (TOTP MFA)
- [ ] Log in to Admin App (`http://localhost:5174`) as an administrator.
- [ ] Navigate to `/settings`.
- [ ] Click **Enroll Authenticator App**.
- [ ] Scan QR code using Google Authenticator or 1Password.
- [ ] Enter 6-digit code. Confirm success and copy recovery guidance.
- [ ] Sign out. Log in again with admin credentials.
- [ ] Confirm TOTP 2FA challenge modal appears (AAL2). Enter code and verify successful entry.

### F. Sign Out Everywhere (Global Scope)
- [ ] Log in to web app on two different browser windows/profiles.
- [ ] On window 1, visit `/profile` and click **Sign Out on All Devices**.
- [ ] Confirm window 1 signs out. Refresh window 2; confirm session is revoked and redirects to `/login`.

---

## 7. Troubleshooting Common Errors

### 1. `redirect_uri_mismatch`
- **Cause:** The Google OAuth redirect URI in GCP does not match the Supabase callback URL.
- **Fix:** In GCP Console -> APIs & Services -> Credentials -> OAuth 2.0 Client IDs, ensure Authorized Redirect URIs includes `https://<PROJECT-REF>.supabase.co/auth/v1/callback` exactly (no trailing slash, HTTPS).

### 2. "Access blocked: app not verified"
- **Cause:** The Google Cloud OAuth consent screen is in "Testing" mode and the signing-in user is not in the test users list.
- **Fix:** In GCP Console -> OAuth consent screen -> Test users, add the tester's email, or publish the app to Production.

### 3. "Invalid Redirect URL" from Supabase
- **Cause:** The `redirectTo` parameter passed from `getAppUrl('/auth/callback')` or `getAdminUrl('/auth/callback')` is not in the Supabase Redirect URLs allow-list.
- **Fix:** Add wildcard patterns (`http://localhost:5173/**`, `http://localhost:5174/**`, `https://*.abrainoconcious.com/**`) to Supabase Dashboard -> Authentication -> URL Configuration -> Redirect URLs.
