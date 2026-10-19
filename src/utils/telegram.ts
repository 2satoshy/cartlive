// Client-side Telegram Mini App bootstrap. No-op outside a real Telegram
// client — `window.Telegram` is simply undefined there, so every function
// here degrades silently rather than breaking the normal web storefront.
const AUTH_TOKEN_KEY = 'tm_pnp_auth_token';

type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  initData?: string;
};

function getWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp ?? null;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Runs once on app load. If we're inside a real Telegram client (initData
 * present), logs in against /api/auth/telegram and stores the resulting
 * signed token. Does nothing — and throws nothing — outside Telegram, so this
 * is safe to call unconditionally from main.tsx.
 */
export async function initTelegramAuth(): Promise<void> {
  const tg = getWebApp();
  if (!tg?.initData) return; // not running inside Telegram

  try {
    tg.ready();
    tg.expand();
  } catch {
    // unsupported client version — safe to ignore, auth still proceeds
  }

  try {
    const res = await fetch('/api/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: tg.initData }),
    });
    if (!res.ok) {
      console.warn('[telegram] login failed', res.status);
      return;
    }
    const data = await res.json();
    if (data?.token) setAuthToken(data.token);
  } catch (err) {
    console.warn('[telegram] login request failed', err);
  }
}
