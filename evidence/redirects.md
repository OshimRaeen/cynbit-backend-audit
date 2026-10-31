# Redirect behaviour

Captured 31 Oct 2026, ~10:27 PM IST, in an Incognito window (normal page loads, one per test).

## Test A: http://cynbit.in
| Hop | URL | Status | Location |
|---|---|---|---|
| 1 | http://cynbit.in/ | 307 Internal Redirect | https://cynbit.in/ |
| 2 | https://cynbit.in/ | 307 Temporary Redirect | https://www.cynbit.in/ |

Hop 1 is Chrome's own HSTS upgrade (DevTools shows Non-Authoritative-Reason: HSTS). It never
reached Cynbit's server, so I'm not drawing any conclusion about how the server handles plain HTTP.

## Test B: https://cynbit.in
| Hop | URL | Status | Location |
|---|---|---|---|
| 1 | https://cynbit.in/ | 307 Temporary Redirect (Server: Vercel) | https://www.cynbit.in/ |

Final URL in both tests: https://www.cynbit.in/ (single real redirect, no chain).
