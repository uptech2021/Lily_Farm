# Email System Audit

Audit date: September 28, 2026

## Current state

- The public newsletter form stores subscribers in Firestore under `newsletterSubscribers`.
- Stored subscriber fields include email, active status, consent source, subscription time, and update time.
- The Promotions page can create a record in `emailCampaigns`, but no service consumes that collection or delivers email.
- Newsletter drafts are stored separately in `newsletters`. Preview and draft editing are available in the admin; sending is intentionally disabled.
- No production email provider is installed or configured. There is no Resend, SendGrid, Postmark, Mailgun, Amazon SES, SMTP, or Nodemailer integration.
- No server-side mail endpoint, Firebase Function, queue worker, or scheduled job exists.
- No email-provider environment variables are documented in `.env.example`.
- No unsubscribe endpoint, signed unsubscribe token, suppression list, or one-click unsubscribe flow exists.
- SPF, DKIM, and DMARC records for the sending domain cannot be verified from this codebase and must be configured after a provider is selected.

## Security note

Admin HTML routes are protected locally and on Vercel by the application's signed admin session cookie. Firestore calls are still made directly from browser JavaScript, so Firestore Security Rules must independently prevent unauthorized writes. The server session does not automatically authenticate a browser to Firebase. Review the deployed Firestore rules before treating the admin as production-secure.

## What works now

- Website visitors can submit an email address and create or reactivate a Firestore subscriber record.
- Admins can view and search subscribers.
- Admins can create, edit, preview, duplicate, and delete newsletter drafts.
- Newsletter blocks can use current product and active-promotion data.
- Promotions can be scheduled in the data model and automatically become active or ended based on their date range.

## Required before real sending

1. Select a transactional/bulk email provider that supports authenticated domains and unsubscribe handling.
2. Verify a sending domain and publish the provider's SPF and DKIM records; add a DMARC policy.
3. Add provider credentials only as server-side environment variables in Vercel. Never expose a provider API key in client JavaScript.
4. Implement an authenticated server-side send/test endpoint. It must re-check the admin session, validate content, limit recipient counts, and never accept arbitrary credentials from the client.
5. Implement batching, rate-limit handling, idempotency, retries, and durable delivery/error status logging.
6. Implement signed unsubscribe links, a public unsubscribe endpoint, and suppression checks before every send. Add `List-Unsubscribe` and one-click unsubscribe headers where supported.
7. Add audience snapshotting so a campaign has an auditable recipient set and subscriber consent record.
8. Add a scheduler only after the sender is safe and idempotent. Vercel Cron or a provider-supported scheduled-send API are suitable options.
9. Review Firestore Security Rules so public users can subscribe without gaining read access, while newsletter, campaign, promotion, and subscriber management remains restricted.
10. Test deliverability, bounce handling, complaints, and unsubscribe processing with a verified test domain before enabling the admin Send controls.

## Recommended next implementation

Use a server-only Vercel API for draft test sends and campaign dispatch. Keep Firestore as the source of subscribers and campaign status, but let the server own provider credentials, audience queries, unsubscribe token generation, and delivery logging. Enable the current disabled Send Test, Schedule, and Send controls only after those endpoints return verifiable delivery results.
