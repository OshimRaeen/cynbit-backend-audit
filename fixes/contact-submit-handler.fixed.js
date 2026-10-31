// Fixed submit handler for the contact form.
// Differences from the current one: failures are caught, the loading state always resets,
// and the server can return a specific message.
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  try {
    const res = await submitInquiry(new FormData(e.currentTarget));
    if (res.success) setSent(true);
    else setError(res.message ?? 'Something went wrong. Please try again or email us directly.');
  } catch {
    setError('We could not send your message. Check your connection and try again, or email us directly.');
  } finally {
    setLoading(false);
  }
};
