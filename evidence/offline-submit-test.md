# Offline submit test (contact form)

Captured 1 Nov 2026, ~12:10 AM IST, Incognito window.

Method: filled the form with dummy data (name "Test", email test@example.com, message
"Offline test, nothing is sent"), set DevTools > Network > throttling to Offline, clicked
Send Inquiry once. The request failed in the browser; nothing was sent to Cynbit.

Observed:
- Button stays on "Architecting Connection..." and stays disabled. No error message is shown.
- Console: POST https://www.cynbit.in/contact net::ERR_INTERNET_DISCONNECTED, then
  "Uncaught (in promise) TypeError: Failed to fetch" (stack ends in the contact page bundle).
- Request: multipart/form-data POST to /contact with a Next-Action header (Next.js Server Action).
- Payload fields: fullName, email, company, industry, message.

Conclusion: the submit handler has no failure path, which matches the code excerpt in
evidence/contact-submit-handler.excerpt.js.
