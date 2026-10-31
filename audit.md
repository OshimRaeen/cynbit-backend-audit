# Cynbit Backend Audit

**Scope:** the public side of cynbit.in, mainly the contact form, since that's where visitors hand over personal data.
**Method:** passive only. My own browser, DevTools and view-source, one normal visit per page. I didn't scan, load-test or send anything hostile, and I didn't submit a real inquiry.
**Author:** Oshim Raeen, 1 Nov 2026

## Summary

The basics are in good shape: HTTPS is enforced with HSTS, pages are compressed and served from the Vercel edge, and caching is sensible. The weak spot is the contact form. If a submission fails, the form freezes with no message, and everything that protects the endpoint seems to depend on the browser. I couldn't see their server code, so I've marked what I confirmed and what I only suspect.

| # | Finding | Severity | How I know |
|---|---|---|---|
| F4 | Failed submission leaves the form stuck, no message | Low-Medium | Reproduced offline, plus the code |
| F5 | Intake endpoint trusts the browser; no abuse controls visible | Medium (unverified) | Read from the page code |
| F1 | Only HSTS; no CSP or other security headers | Low-Medium | Response headers on / and /contact |
| F2 | Metadata and redirect point at the wrong host, no canonical | Low | view-source and redirect test |
| F3 | Headers differ between routes | Informational | Response headers |

If I had a week, I'd fix them in the order F4, F5, F1, F2, F3. The first two affect real visitors and leads; the rest is hardening and housekeeping.

The code for each fix is in `fixes/`, and a tested version of the contact handler is in `reference-impl/`.

## What looks good
- HSTS with a 2-year max-age; Brotli compression; ETag + must-revalidate; HTML served from the
  Vercel edge (bom1) with cache hits.

## Findings

### F1: No browser security headers beyond HSTS (Low-Medium, hardening)
Observed: Neither `/` nor `/contact` returns CSP, X-Content-Type-Options, frame protection,
Referrer-Policy or Permissions-Policy (evidence/headers-home.txt, headers-contact.txt).
Why it matters: pages that collect personal data (contact, newsletter, enrolment) can be framed by
other sites, and nothing restricts which scripts run on them.
Fix: fixes/next.config.headers.js. CSP ships in Report-Only first; nonces are the cleaner
long-term replacement for 'unsafe-inline'.

### F2: Metadata points at the apex host and there is no canonical tag (Low, consistency/SEO)
Observed: on /contact, og:url is the site root (https://cynbit.in), og:image and twitter:image are
https://cynbit.in/logo.svg, and there is no rel=canonical (screenshots in evidence). The apex
answers 307 to www (evidence/redirects.md).The JSON-LD blocks also use the apex host (https://cynbit.in site-wide, https://cynbit.in/contact on the contact page).
Why it matters: crawlers and link-preview bots get a different address from the one served, the
redirect is marked temporary, and SVG share images are usually not rendered.
Fix: 308 for the apex redirect, metadataBase and per-page canonical, PNG share image
(fixes/metadata.example.ts).

### F3: Response headers differ between routes (Informational)
Observed: x-powered-by: Next.js is on /contact but not on /; access-control-allow-origin: * is on /
but not on /contact.
Why it matters: low risk by itself, but headers should come from one central config.
Fix: poweredByHeader: false and a single headers() block (same file as F1).

### F4: A failed submission leaves the contact form stuck, with no message (Low-Medium, reliability)
Observed: the submit handler awaits submitInquiry(formData) with no try/catch/finally, and the
loading state is only reset after the call returns. I reproduced the failure safely by switching
Chrome to Offline and submitting dummy data: the request failed locally, the console showed an
uncaught "Failed to fetch", and the button stayed on "Architecting Connection..." and disabled,
with no error shown (evidence/offline-submit-test.md). Nothing reached Cynbit.
Why it matters: on any network drop or server error, the visitor can't tell whether their
message was sent, and probably has to retype it or leaves. Each one is a lost lead.
Fix: wrap the call in try/catch/finally and show a clear message (fixes/contact-submit-handler.fixed.js).

### F5: The intake endpoint relies on the browser for validation; no abuse controls are visible (Medium, unverified)
Observed: the form posts to a Next.js Server Action (a POST to /contact with a Next-Action header).
The only checks I could see are in the browser: required, and type=email. There are no length
limits on any field, including the message, and no honeypot or CAPTCHA. The action returns
only a success flag, so the client can't show field-level errors.
Why it matters: a Server Action is a public POST endpoint, and browser rules don't apply to a
script that posts to it directly. Whether the server validates length, format and rate depends
on code I can't see, and testing it would break the brief's rules, so this is a risk to
confirm, not a confirmed hole.
Fix: server-side schema validation with length caps, a honeypot plus Turnstile, per-IP rate
limiting, and structured errors. Working example in reference-impl/ (17 tests, run with npm test).

## Limits of this audit
I only looked at what a normal browser session shows. Server-side validation, rate limiting and
payment handling can't be judged without sending hostile input, which the brief rules out.I did not submit a real inquiry; the offline test sent nothing to Cynbit.
