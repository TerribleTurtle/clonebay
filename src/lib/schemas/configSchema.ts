import { z } from 'zod';

export const configSchema = z.object({
  walletYellowThreshold: z.number().min(0, "Must be >= 0"),
  walletRedThreshold: z.number().min(0, "Must be >= 0"),
}).superRefine((data, ctx) => {
  if (data.walletYellowThreshold <= data.walletRedThreshold) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Yellow threshold must be strictly greater than Red threshold",
      path: ["walletYellowThreshold"],
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Red threshold must be strictly less than Yellow threshold",
      path: ["walletRedThreshold"],
    });
  }
});
