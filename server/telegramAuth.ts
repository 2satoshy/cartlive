// Verifies Telegram Mini App initData per
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
// Same HMAC algorithm as signal-desk-v4's app/lib/langa/telegramAuth.ts — this
// is Telegram's spec, not a house convention, so it's intentionally identical,
// just against this app's own bot token instead of Langa Rail's.
import { createHmac, timingSafeEqual } from 'crypto';

const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60;

export type TelegramInitDataUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

export type VerifiedInitData = {
  user: TelegramInitDataUser;
  authDate: number;
};

export function verifyInitData(initData: string, botToken: string): VerifiedInitData | null {
  if (!botToken) return null;
  const params = new URLSearchParams(initData);
  const receivedHash = params.get('hash');
  if (!receivedHash) return null;
  params.delete('hash');

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const computedBuf = Buffer.from(computedHash, 'hex');
  const receivedBuf = Buffer.from(receivedHash, 'hex');
  if (computedBuf.length !== receivedBuf.length || !timingSafeEqual(computedBuf, receivedBuf)) {
    return null;
  }

  const authDateRaw = params.get('auth_date');
  const authDate = authDateRaw ? parseInt(authDateRaw, 10) : 0;
  if (!authDate || Date.now() / 1000 - authDate > MAX_AUTH_AGE_SECONDS) return null;

  const userRaw = params.get('user');
  if (!userRaw) return null;
  let user: TelegramInitDataUser;
  try {
    user = JSON.parse(userRaw);
  } catch {
    return null;
  }
  if (!user?.id) return null;

  return { user, authDate };
}
