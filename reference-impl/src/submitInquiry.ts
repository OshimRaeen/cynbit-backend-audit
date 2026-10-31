import { inquirySchema, type Inquiry } from './inquirySchema';
import type { FixedWindowLimiter } from './rateLimit';

export type InquiryResult =
  | { success: true }
  | { success: false; code: 'VALIDATION'; message: string; fieldErrors: Record<string, string[]> }
  | { success: false; code: 'RATE_LIMITED'; message: string; retryAfterSec: number }
  | { success: false; code: 'DELIVERY_FAILED'; message: string };

type Deps = {
  ip: string;
  limiter: FixedWindowLimiter;
  // Whatever actually stores or forwards the inquiry (email, CRM, database).
  deliver: (inquiry: Inquiry) => Promise<void>;
};

// Name of the hidden field bots tend to fill in. Humans never see it.
export const HONEYPOT_FIELD = 'website';

export async function handleInquiry(formData: FormData, { ip, limiter, deliver }: Deps): Promise<InquiryResult> {
  // 1. Cheapest check first: too many requests from one address.
  const limit = limiter.check(ip);
  if (!limit.allowed) {
    return {
      success: false,
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please wait a bit and try again.',
      retryAfterSec: limit.retryAfterSec,
    };
  }

  // 2. Honeypot. Report success so the bot doesn't learn what tripped it, but send nothing.
  const trap = formData.get(HONEYPOT_FIELD);
  if (typeof trap === 'string' && trap.length > 0) {
    return { success: true };
  }

  // 3. Validate on the server. Unknown keys (like Next's own $ACTION_* fields) are dropped.
  const parsed = inquirySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      code: 'VALIDATION',
      message: 'Please check the highlighted fields.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // 4. Hand off. A failure here must come back as a result, not as a thrown error,
  //    so the form can show a message instead of freezing.
  try {
    await deliver(parsed.data);
  } catch {
    return {
      success: false,
      code: 'DELIVERY_FAILED',
      message: 'We could not send your message right now. Please try again or email us directly.',
    };
  }

  return { success: true };
}
