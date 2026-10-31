// Proposed security headers for Cynbit (Next.js on Vercel).
// CSP starts in Report-Only mode so nothing breaks while the policy is tuned.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  {
    key: 'Content-Security-Policy-Report-Only',
    value:
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "connect-src 'self' https://*.google-analytics.com; " +
      "img-src 'self' data: https://*.google-analytics.com; " +
      "frame-ancestors 'self'",
  },
];

module.exports = {
  poweredByHeader: false, // removes x-powered-by: Next.js
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};
