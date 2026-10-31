import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleInquiry, HONEYPOT_FIELD } from '../src/submitInquiry';
import { FixedWindowLimiter } from '../src/rateLimit';

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
}

const valid = {
  fullName: 'Asha Verma',
  email: 'asha@example.com',
  company: 'Verma Textiles',
  industry: 'Retail',
  message: 'We want to automate our order follow-ups.',
};

let clock = 0;
let limiter: FixedWindowLimiter;
let deliver: ReturnType<typeof vi.fn>;

beforeEach(() => {
  clock = 1_000_000;
  limiter = new FixedWindowLimiter({ limit: 5, windowMs: 60_000, now: () => clock });
  deliver = vi.fn().mockResolvedValue(undefined);
});

const run = (fields: Record<string, string>, ip = '1.1.1.1') =>
  handleInquiry(form(fields), { ip, limiter, deliver });

describe('valid input', () => {
  it('delivers once and reports success', async () => {
    const res = await run(valid);
    expect(res).toEqual({ success: true });
    expect(deliver).toHaveBeenCalledTimes(1);
  });

  it('trims fields and lowercases the email before delivering', async () => {
    await run({ ...valid, fullName: '  Asha Verma  ', email: '  ASHA@Example.COM ' });
    expect(deliver).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: 'Asha Verma', email: 'asha@example.com' }),
    );
  });

  it('treats blank optional fields as missing', async () => {
    await run({ ...valid, company: '', industry: '' });
    const sent = deliver.mock.calls[0][0];
    expect(sent.company).toBeUndefined();
    expect(sent.industry).toBeUndefined();
  });

  it('ignores unknown fields such as the framework\'s own action keys', async () => {
    await run({ ...valid, $ACTION_ID_abc: '', isAdmin: 'true' });
    const sent = deliver.mock.calls[0][0];
    expect(sent).not.toHaveProperty('isAdmin');
    expect(sent).not.toHaveProperty('$ACTION_ID_abc');
  });
});

describe('validation', () => {
  it('rejects missing required fields with per-field errors', async () => {
    const res = await run({ fullName: '', email: '', message: '' });
    expect(res).toMatchObject({ success: false, code: 'VALIDATION' });
    if (res.success === false && res.code === 'VALIDATION') {
      expect(Object.keys(res.fieldErrors).sort()).toEqual(['email', 'fullName', 'message']);
    }
    expect(deliver).not.toHaveBeenCalled();
  });

  it('rejects a malformed email', async () => {
    const res = await run({ ...valid, email: 'not-an-email' });
    expect(res).toMatchObject({ success: false, code: 'VALIDATION' });
    expect(deliver).not.toHaveBeenCalled();
  });

  it('rejects a message over 3000 characters', async () => {
    const res = await run({ ...valid, message: 'a'.repeat(3001) });
    expect(res).toMatchObject({ success: false, code: 'VALIDATION' });
    expect(deliver).not.toHaveBeenCalled();
  });

  it('accepts a message of exactly 3000 characters', async () => {
    const res = await run({ ...valid, message: 'a'.repeat(3000) });
    expect(res).toEqual({ success: true });
  });

  it('rejects a one-word throwaway message', async () => {
    const res = await run({ ...valid, message: 'hi' });
    expect(res).toMatchObject({ success: false, code: 'VALIDATION' });
  });

  it('rejects a file posted where text is expected', async () => {
    const fd = form(valid);
    fd.set('message', new File(['x'], 'x.txt'));
    const res = await handleInquiry(fd, { ip: '1.1.1.1', limiter, deliver });
    expect(res).toMatchObject({ success: false, code: 'VALIDATION' });
  });
});

describe('honeypot', () => {
  it('looks successful to the bot but delivers nothing', async () => {
    const res = await run({ ...valid, [HONEYPOT_FIELD]: 'https://spam.example' });
    expect(res).toEqual({ success: true });
    expect(deliver).not.toHaveBeenCalled();
  });

  it('an empty honeypot is a normal submission', async () => {
    const res = await run({ ...valid, [HONEYPOT_FIELD]: '' });
    expect(res).toEqual({ success: true });
    expect(deliver).toHaveBeenCalledTimes(1);
  });
});

describe('rate limiting', () => {
  it('blocks the 6th request from the same IP inside the window', async () => {
    for (let i = 0; i < 5; i++) expect(await run(valid)).toEqual({ success: true });
    const res = await run(valid);
    expect(res).toMatchObject({ success: false, code: 'RATE_LIMITED' });
    expect(deliver).toHaveBeenCalledTimes(5);
  });

  it('tells the client how long to wait', async () => {
    for (let i = 0; i < 5; i++) await run(valid);
    clock += 20_000;
    const res = await run(valid);
    expect(res).toMatchObject({ code: 'RATE_LIMITED', retryAfterSec: 40 });
  });

  it('lets the same IP back in once the window has passed', async () => {
    for (let i = 0; i < 5; i++) await run(valid);
    clock += 60_001;
    expect(await run(valid)).toEqual({ success: true });
  });

  it('counts each IP separately', async () => {
    for (let i = 0; i < 5; i++) await run(valid, '1.1.1.1');
    expect(await run(valid, '2.2.2.2')).toEqual({ success: true });
  });
});

describe('delivery failure', () => {
  it('returns a result instead of throwing, so the form can show a message', async () => {
    deliver.mockRejectedValueOnce(new Error('smtp down'));
    const res = await run(valid);
    expect(res).toMatchObject({ success: false, code: 'DELIVERY_FAILED' });
  });
});
