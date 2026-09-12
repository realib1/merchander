# Feature 33: Production Email & Auth Redirects

## Goal
Fix the password reset redirect issue and set up a reliable transactional email service for Merchander.

## Scope
- **In scope:** 
  - Resolving the Vercel redirect issue for password resets while preventing Host Header Injection vulnerabilities.
  - Integrating a transactional email provider (Resend) into the application for outbound emails.
  - Sending a test/welcome email or overriding the default Supabase SMTP.
- **Out of scope:** 
  - Complex email marketing campaigns or templating engines (we'll use simple React email templates or raw HTML for now).

## The Redirect Issue (Security Context)
Currently, `getURL()` uses Vercel environment variables to generate the password reset link. This was explicitly designed to prevent **Host Header Injection**, a vulnerability where an attacker spoofs the `Host` header to generate a password reset link pointing to their own malicious domain, stealing the user's token when they click it.

If `NEXT_PUBLIC_SITE_URL` is not set, it falls back to Vercel's internal URLs (e.g., `merchander.vercel.app`), which may be protected by Vercel Authentication, causing a redirect loop or login wall.

**Solution:** We will update `getURL()` to securely support both the custom domain and the `.vercel.app` fallback by checking a whitelist or using a safe client-provided origin strictly validated against known Vercel/Prod domains.

**Status:** verified
## Build Steps

- [x] 1. **Update `getURL` for secure dynamic origins**
  - Modify `src/utils/url.ts` or the auth action to safely resolve the origin.
  - Validate the request's origin against a strict whitelist (custom domain + known Vercel domains) to allow `merchander.vercel.app` to work without opening up Host Header Injection.
- [x] 2. **Integrate Resend for Email Service**
  - Install the `resend` package.
  - Create `src/lib/email/index.ts` to expose a simple `sendEmail` function.
  - Create a basic email template (e.g., `WelcomeEmail` or `NotificationEmail`).
- [ ] 3. **Implement outbound email triggers (Optional based on user preference)**
  - Wire up the new email service to a specific event (e.g., sending a welcome email on signup or a notification on order creation).

## Data & Contracts
- The email service will rely on a new environment variable: `RESEND_API_KEY`.
- Supabase Auth emails will still be handled by Supabase, but the user will need to configure Supabase's SMTP settings in the dashboard using the Resend SMTP credentials to ensure reliable delivery of password reset emails.

## Testing
- Verify password reset requests generate the correct domain link based on where the user initiated the request (testing both custom domain and vercel domain).
- Verify the Resend client can successfully send a test email.

## Notes for AI
- Keep the `getURL` logic robust. We must not blindly trust the `Host` or `x-forwarded-host` headers.
