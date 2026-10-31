# Cynbit Backend Audit

A passive audit of cynbit.in from a backend point of view, done for the Backend Developer Intern assessment.

Start with **AUDIT.md**. The summary is at the top.

## What's in here
- `AUDIT.md`: findings, evidence and fixes
- `evidence/`: raw response headers, redirect notes, the offline form test and screenshots
- `fixes/`: proposed config, metadata and the corrected submit handler
- `reference-impl/`: a small tested version of the contact handler (validation, honeypot, rate limit)

## Run the tests
Needs Node 18 or newer.

    cd reference-impl
    npm install
    npm test

## Ground rules I kept to
Passive observation only, in my own browser. No scanning, no load, no tampering, and I never submitted a real inquiry. Anything I couldn't confirm from the outside is marked as unverified.
