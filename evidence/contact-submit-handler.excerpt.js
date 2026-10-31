// Excerpt (submit handler only), from the contact page bundle. Captured 31 Oct 2026
// via DevTools > Sources. Source: /_next/static/chunks/app/(marketing)/contact/page-*.js
// Variable names restored by hand for readability; logic unchanged.
const submitInquiry = createServerReference("<action id omitted>", callServer, void 0, findSourceMapURL, "submitInquiry");

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  const data = new FormData(e.currentTarget);
  const res = await submitInquiry(data);        // no try/catch around this
  setLoading(false);
  res.success ? setSent(true) : setError("Something went wrong. Please try again or email us directly.");
};
