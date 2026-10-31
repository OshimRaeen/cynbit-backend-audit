import { z } from 'zod';

// Optional text fields arrive from a form as "" when left blank, so treat "" as "not given".
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const inquirySchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your name').max(100, 'Name is too long'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, 'Email is too long')
    .email('Please enter a valid email address'),
  company: optionalText(120),
  industry: optionalText(80),
  message: z
    .string()
    .trim()
    .min(10, 'Please tell us a bit more (at least 10 characters)')
    .max(3000, 'Message is too long (3000 characters max)'),
});

export type Inquiry = z.infer<typeof inquirySchema>;
