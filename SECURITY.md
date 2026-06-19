<div align="center">

```
███████╗███████╗ ██████╗██╗   ██╗██████╗ ██╗████████╗██╗   ██╗
██╔════╝██╔════╝██╔════╝██║   ██║██╔══██╗██║╚══██╔══╝╚██╗ ██╔╝
███████╗█████╗  ██║     ██║   ██║██████╔╝██║   ██║    ╚████╔╝
╚════██║██╔══╝  ██║     ██║   ██║██╔══██╗██║   ██║     ╚██╔╝
███████║███████╗╚██████╗╚██████╔╝██║  ██║██║   ██║      ██║
╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝   ╚═╝      ╚═╝
```

# 🔐 Security

### How Inboxly protects your inbox, your tokens, and your money.

[**← Back to README**](./README.md) &nbsp;·&nbsp; [**🏗 Architecture**](./ARCHITECTURE.md) &nbsp;·&nbsp; [**🤝 Contributing**](./CONTRIBUTING.md)

</div>

---

## 📑 Table of Contents

- [Reporting a Vulnerability](#-reporting-a-vulnerability)
- [Supported Versions](#-supported-versions)
- [Security Model at a Glance](#-security-model-at-a-glance)
- [Authentication & Authorization](#-authentication--authorization)
- [Google OAuth Tokens (Corsair)](#-google-oauth-tokens-corsair)
- [Webhook Verification](#-webhook-verification)
- [Payment Integrity (Razorpay)](#-payment-integrity-razorpay)
- [Input Validation & Output Safety](#-input-validation--output-safety)
- [Secrets & Configuration](#-secrets--configuration)
- [Data Handling & Privacy](#-data-handling--privacy)
- [Responsible Disclosure Guidelines](#-responsible-disclosure-guidelines)

---

## 📣 Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

If you discover a security issue, report it privately:

- **Email:** [kumar.abhishek2k23@gmail.com](mailto:kumar.abhishek2k23@gmail.com) — subject line `SECURITY: Inboxly`.
- Or use **GitHub Security Advisories** ("Report a vulnerability") on the repository, if enabled.

Please include:

1. A clear description of the issue and its impact.
2. Reproduction steps or a proof-of-concept.
3. Affected component (web, API, a specific route/service) and any relevant config.

**What to expect:**

| Stage              | Target                                            |
| ------------------ | ------------------------------------------------- |
| Acknowledgement    | within **72 hours**                               |
| Initial assessment | within **7 days**                                 |
| Fix / mitigation   | severity-dependent; coordinated before disclosure |

We'll keep you updated and credit you (if you wish) once a fix ships.

---

## 🧷 Supported Versions

Inboxly is an actively developed product deployed from `main`. Security fixes are applied to the latest `main` and the running production deployment.

| Version            | Supported           |
| ------------------ | ------------------- |
| `main` (latest)    | ✅                  |
| Older commits/tags | ❌ (please upgrade) |

---

## 🛡 Security Model at a Glance

| Surface               | Control                                                                     |
| --------------------- | --------------------------------------------------------------------------- |
| **User auth**         | Clerk-issued Bearer JWTs, verified on every protected route.                |
| **Google tokens**     | Encrypted at rest by Corsair using `CORSAIR_KEK`; never sent to the client. |
| **Clerk webhooks**    | Signature-verified against the **raw** request body.                        |
| **Gmail webhooks**    | Shared-secret token (`GMAIL_WEBHOOK_TOKEN`) checked on every push.          |
| **Calendar webhooks** | `X-Goog-Channel-Token` checked against `CALENDAR_WEBHOOK_TOKEN`.            |
| **Payments**          | Razorpay HMAC-SHA256 signature verification before any upgrade.             |
| **Input**             | Zod validation middleware on request bodies.                                |
| **Output**            | DOMPurify on rendered HTML email in the web app.                            |
| **Limits**            | Server-authoritative usage metering (`PLAN_LIMITS`).                        |
| **Secrets**           | Environment variables only; `.env` files gitignored.                        |

---

## 🔑 Authentication & Authorization

Authentication uses **[Clerk](https://clerk.com)** (Google OAuth + email/password).

- The browser sends a **Clerk Bearer JWT** with every API call.
- `requireAuthenticated` (`apps/api/src/middleware/auth.ts`) rejects any request without a valid `userId` with `401 Unauthorized` **before** the controller runs.
- `attachUser` then resolves the local `users` row via `getOrCreateByClerkId`, so downstream services operate on a verified, app-local identity — never on a client-supplied id.
- **Tenant isolation:** every Google data operation is scoped with `corsair.withTenant(String(users.id))`, so a user can only ever touch their own mail/calendar data. There is no cross-tenant code path.

Webhook endpoints are intentionally **unauthenticated by Bearer** (Google/Clerk can't send a user JWT) and are instead protected by signature/token verification (below).

---

## 🔐 Google OAuth Tokens (Corsair)

All Google access flows through **[Corsair](https://corsair.dev)**, which owns the OAuth lifecycle:

- Tokens are **encrypted at rest** with a key-encryption key, `CORSAIR_KEK` (generate with `openssl rand -base64 32`).
- Tokens live only server-side in `corsair_accounts` — **they are never exposed to the browser**.
- The app never handles raw Google tokens; it calls `corsair.withTenant(...).gmail.* / .googlecalendar.*`. The only direct Google calls are push-notification _watch_ registrations.
- One OAuth client (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`) covers Gmail + Calendar; the redirect URI is `<API_BASE_URL>/api/integrations/google/callback`, and the OAuth `state` is **signed** so the tenant can be recovered safely on callback.

> Rotating `CORSAIR_KEK` invalidates stored tokens — users would need to reconnect Google. Treat it as a top-tier secret.

---

## 📡 Webhook Verification

Inboxly exposes three unauthenticated-by-Bearer webhooks, each with its own verification:

**Clerk** (`POST /api/webhooks/clerk`)

- Mounted with `raw({ type: "application/json" })` so the **raw body** is preserved.
- Verified with `verifyWebhook(req, { signingSecret: CLERK_WEBHOOK_SIGNING_SECRET })` — a failed verification returns an error and the event is dropped.

**Gmail Pub/Sub** (`POST /api/webhooks/gmail`)

- A shared-secret token is required: the handler rejects the request when `req.query.token !== GMAIL_WEBHOOK_TOKEN` (`[gmail-webhook] rejected: invalid or missing token`).

**Google Calendar** (`POST /api/webhooks/calendar`)

- The `X-Goog-Channel-Token` header is compared against `CALENDAR_WEBHOOK_TOKEN`; a mismatch is rejected (`[calendar-webhook] rejected: invalid or missing channel token`).

This means an attacker who learns a webhook URL still cannot forge a delivery without the corresponding secret/signature.

---

## 💳 Payment Integrity (Razorpay)

Upgrades to Pro are gated by **server-side signature verification** — the client cannot self-grant a plan:

- `payment.service.ts` computes `HMAC-SHA256(orderId|paymentId, RAZORPAY_KEY_SECRET)` and compares it to the signature Razorpay returns (`verifySignature(orderId, paymentId, signature)`).
- Only on a verified match does the server upgrade the plan; the upgrade also **resets usage meters** server-side.
- `RAZORPAY_KEY_SECRET` lives only on the API; the browser only ever sees the public `RAZORPAY_KEY_ID`.

---

## 🧪 Input Validation & Output Safety

- **Input:** request bodies are validated by **Zod** schemas (`validations/`) via the `validate` middleware before any controller logic runs — malformed payloads are rejected early.
- **Output:** rendered HTML email bodies are sanitized with **DOMPurify** in the web app, preventing stored-XSS from hostile message content.
- **Errors:** a central `errorHandler` keeps internal details from leaking into responses; `asyncHandler` ensures rejected promises surface as handled errors rather than crashing the process.
- **Limits as a safety control:** server-authoritative metering (`PLAN_LIMITS`) caps chats, chat depth, email syncs, and attachment size — also a guard against runaway/abusive usage (`402 limit:*`).

---

## 🗝 Secrets & Configuration

- **All** secrets are supplied via environment variables; `.env` files are **gitignored** — never commit real secrets.
- See [`.env.example`](./.env.example) and [`apps/api/.env.example`](./apps/api/.env.example) for the annotated list.
- Sensitive variables include: `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `CORSAIR_KEK`, `GOOGLE_CLIENT_SECRET`, `RAZORPAY_KEY_SECRET`, `OPENAI_API_KEY`, `GMAIL_WEBHOOK_TOKEN`, `CALENDAR_WEBHOOK_TOKEN`, `DATABASE_URL`.
- Rotate any secret immediately if you suspect exposure. Rotating `CORSAIR_KEK` requires users to reconnect Google.
- CORS is restricted via `CORS_ORIGIN` so only the configured web origin may call the API with credentials.

---

## 🔒 Data Handling & Privacy

- **Email/calendar data** is cached server-side in Postgres (`corsair_entities`) to power fast, consistent reads — kept fresh by push notifications.
- **Embeddings** (`email_ai_meta.embedding`, `vector(1536)`) are derived from message content for semantic search; they live in the same database, protected by the same access controls.
- **Account deletion** (`DELETE /api/account`) removes the user from the database **and** Clerk, so deleting an account tears down the local mirror and auth identity together.
- Data leaves the system only to the services it must reach: **OpenAI** (chat + embeddings), **Google** (Gmail/Calendar via Corsair), **Clerk** (auth), **Razorpay** (payments), and **Sentry** (error telemetry).

---

## 🤝 Responsible Disclosure Guidelines

We appreciate good-faith security research. When testing, please:

- ✅ Test only against **your own** account and data.
- ✅ Give us reasonable time to fix before any public disclosure.
- ❌ Do **not** access, modify, or exfiltrate other users' data.
- ❌ Do **not** run denial-of-service, spam, or social-engineering attacks.
- ❌ Do **not** degrade the production service for other users.

Acting in good faith within these guidelines, we will not pursue or support legal action against you for your research.

---

<div align="center">

[**← README**](./README.md) &nbsp;·&nbsp; [**🏗 Architecture**](./ARCHITECTURE.md) &nbsp;·&nbsp; [**🤝 Contributing**](./CONTRIBUTING.md)

**Found something? Email [kumar.abhishek2k23@gmail.com](mailto:kumar.abhishek2k23@gmail.com) — `SECURITY: Inboxly`.**

</div>
