// Real signed session tokens, replacing the previous `jwt_token_${id}` string
// template that wasn't a token at all — anyone could construct one for any
// user id and no code anywhere ever verified it. HMAC-SHA256 over a base64url
// payload, same construction style as this repo's webhook signature checks
// (coinbaseCheckout.ts) rather than pulling in a JWT library for one field.
import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.JWT_SECRET ?? '';
const TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface AuthTokenPayload {
  userId: string;
  iat: number;
}

export function signAuthToken(userId: string): string {
  if (!SECRET) throw new Error('JWT_SECRET not set — cannot sign auth tokens');
  const payload: AuthTokenPayload = { userId, iat: Math.floor(Date.now() / 1000) };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifyAuthToken(token: string | null | undefined): AuthTokenPayload | null {
  if (!token || !SECRET) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  const expectedSig = createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: AuthTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!payload?.userId || !payload?.iat) return null;
  if (Date.now() / 1000 - payload.iat > TOKEN_MAX_AGE_SECONDS) return null;
  return payload;
}

/** Pulls a bearer token out of an Authorization header, Express or Vercel shape. */
export function extractBearerToken(authHeader: string | string[] | undefined | null): string | null {
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token || null;
}
