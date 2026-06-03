import { z } from 'zod';

export const EveSsoTokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number().int().positive(),
  token_type: z.string(),
  refresh_token: z.string(),
}).strict();

export type EveSsoTokenResponse = z.infer<typeof EveSsoTokenResponseSchema>;

export const EveSsoJwtPayloadSchema = z.object({
  aud: z.union([z.string(), z.array(z.string())]).optional(),
  azp: z.string().optional(),
  exp: z.number().int().positive().optional(),
  iat: z.number().int().positive().optional(),
  iss: z.string().optional(),
  jti: z.string().optional(),
  kid: z.string().optional(),
  name: z.string(),
  owner: z.string().optional(),
  region: z.string().optional(),
  sub: z.string(),
  tenant: z.string().optional(),
  tier: z.string().optional(),
  scp: z.union([z.string(), z.array(z.string())]).optional(),
}).strict();

export type EveSsoJwtPayload = z.infer<typeof EveSsoJwtPayloadSchema>;
