import { z, ZodIssue } from 'zod';
import { logger } from '../utils/logger';

const EnvSchema = z.object({
  NEXT_PUBLIC_EVE_CLIENT_ID: z.string().min(1, "EVE Client ID is required"),
  NEXT_PUBLIC_EVE_CALLBACK_URL: z.string().optional(),
});

const parsed = EnvSchema.safeParse({
  // @ts-expect-error Next.js requires dot-notation for static env replacement
  NEXT_PUBLIC_EVE_CLIENT_ID: process.env.NEXT_PUBLIC_EVE_CLIENT_ID,
  // @ts-expect-error Next.js requires dot-notation for static env replacement
  NEXT_PUBLIC_EVE_CALLBACK_URL: process.env.NEXT_PUBLIC_EVE_CALLBACK_URL,
});

if (!parsed.success) {
  const errs = parsed.error.issues;
  logger.error("Environment validation failed:", errs);
  throw new Error(`Environment validation failed: ${errs.map((err: ZodIssue) => err.message).join(', ')}`);
}

export const ENV = parsed.data;
