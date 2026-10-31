# Cynbit Backend Audit

Scope: public intake path of cynbit.in. Method: passive observation in my own browser (DevTools,
view-source). No scanning, no load, no tampering. Evidence is in /evidence.

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
answers 307 to www (evidence/redirects.md).
Why it matters: crawlers and link-preview bots get a different address from the one served, the
redirect is marked temporary, and SVG share images are usually not rendered.
Fix: 308 for the apex redirect, metadataBase and per-page canonical, PNG share image
(fixes/metadata.example.ts).

### F3: Response headers differ between routes (Informational)
Observed: x-powered-by: Next.js is on /contact but not on /; access-control-allow-origin: * is on /
but not on /contact.
Why it matters: low risk by itself, but headers should come from one central config.
Fix: poweredByHeader: false and a single headers() block (same file as F1).

## Limits of this audit
I only looked at what a normal browser session shows. Server-side validation, rate limiting and
payment handling can't be judged without sending hostile input, which the brief rules out.
