# Reference version of the contact-form handler

This is a small, tested version of how I'd write the inquiry handler behind cynbit.in/contact.
It's written against the problems in `AUDIT.md` (F4 and F5). It runs and is tested **locally only**.
Nothing here talks to Cynbit.

## Run it

```bash
npm install
npm test          # 17 tests
npm run typecheck
```

## What it does

`src/submitInquiry.ts` takes the same `FormData` the form already posts and returns a
result object instead of just `{ success }`:

1. **Rate limit** per IP (5 per minute here). Returns `RATE_LIMITED` with `retryAfterSec`.
2. **Honeypot**: a hidden `website` field. If it's filled in, the bot gets a fake success and nothing is delivered.
3. **Server-side validation** with a schema (`src/inquirySchema.ts`): required fields, length caps
   (name 100, email 254, message 10-3000), trimmed and lowercased email, unknown fields dropped.
   Returns `VALIDATION` with errors per field so the form can show them next to the right input.
4. **Delivery** is injected (`deliver`). If it throws, the handler returns `DELIVERY_FAILED`
   and does not throw, so the form can always show a message.

The matching client-side fix is in `../fixes/contact-submit-handler.fixed.js`.

## How it would plug into a Next.js Server Action

```ts
'use server';
import { headers } from 'next/headers';
import { handleInquiry } from '@/lib/submitInquiry';
import { limiter, sendToTeam } from '@/lib/services';

export async function submitInquiry(formData: FormData) {
  // on Next 14 headers() is not async
  const h = await headers();
  // on Vercel this header is set by the platform, so the first entry can be trusted
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  return handleInquiry(formData, { ip, limiter, deliver: sendToTeam });
}
```

The form then adds one hidden field, positioned off-screen with `tabIndex={-1}` and
`autoComplete="off"`, named `website`.

## What this deliberately does not do

- **The rate limiter is in memory.** On serverless every instance has its own counter, so a
  production version needs a shared store (Upstash Redis / Vercel KV) or Vercel's firewall rate limits.
- **No CAPTCHA check.** A honeypot only stops simple bots. Cloudflare Turnstile would be the next layer,
  verified server-side before step 4.
- **No idempotency key.** If a request times out after the server already saved it, a retry creates a duplicate.
  A client-generated key stored for a few minutes would fix that.
- **No real email/CRM delivery.** `deliver` is a stub in the tests.
- I haven't seen Cynbit's server code, so I don't know which of these they already have.
