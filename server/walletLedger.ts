import type { WalletBalances, WalletCurrency, VoucherBalances, VoucherCurrency, RemittanceSource } from '../src/types.js';
import { INITIAL_EXCHANGE_RATES } from '../src/data/products.js';

/**
 * Demo-mode ledger. In-memory, per-process — matches this repo's existing
 * DEMO_CART convention (api/index.ts). NOT safe for real money: a real build
 * needs row-level locking / DB transactions per debit-credit pair, not the
 * sequential promise queue below. The queue only protects against
 * same-process races, not concurrent serverless instances.
 */

const ZERO_WALLET = (): WalletBalances => ({ ZWG: 0, USD: 0, ZAR: 0, EUR: 0, GBP: 0, AUD: 0 });
const ZERO_VOUCHER = (): VoucherBalances => ({ ZWG: 0, USD: 0 });

const wallets = new Map<string, WalletBalances>();
const vouchers = new Map<string, VoucherBalances>();
const remittanceLog: Array<{ id: string; source: RemittanceSource; recipientPhone: string; amount: number; currency: VoucherCurrency; reference: string; status: string; receivedAt: string }> = [];

// Simple per-phone mutex so concurrent debits on the same demo process can't
// both read-then-write a stale balance. Queues promises; does not span processes.
const locks = new Map<string, Promise<unknown>>();
async function withLock<T>(phone: string, fn: () => Promise<T> | T): Promise<T> {
  const prior = locks.get(phone) ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((resolve) => { release = resolve; });
  locks.set(phone, prior.then(() => next));
  await prior;
  try {
    return await fn();
  } finally {
    release();
  }
}

function seedIfMissing(phone: string) {
  if (!wallets.has(phone)) {
    const seeded = ZERO_WALLET();
    // Demo starting balances so the showcase isn't a wall of zeros.
    seeded.USD = 42.00;
    seeded.ZWG = 310.50;
    wallets.set(phone, seeded);
  }
  if (!vouchers.has(phone)) {
    vouchers.set(phone, ZERO_VOUCHER());
  }
}

export function getWalletBalances(phone: string): WalletBalances {
  seedIfMissing(phone);
  return { ...wallets.get(phone)! };
}

export function getVoucherBalances(phone: string): VoucherBalances {
  seedIfMissing(phone);
  return { ...vouchers.get(phone)! };
}

export async function creditWallet(phone: string, currency: WalletCurrency, amount: number): Promise<WalletBalances> {
  if (amount <= 0) throw new Error('Credit amount must be positive');
  return withLock(phone, () => {
    seedIfMissing(phone);
    const bal = wallets.get(phone)!;
    bal[currency] += amount;
    return { ...bal };
  });
}

export async function debitWallet(phone: string, currency: WalletCurrency, amount: number): Promise<{ success: boolean; balances: WalletBalances; reason?: string }> {
  if (amount <= 0) throw new Error('Debit amount must be positive');
  return withLock(phone, () => {
    seedIfMissing(phone);
    const bal = wallets.get(phone)!;
    if (bal[currency] < amount) {
      return { success: false, balances: { ...bal }, reason: 'INSUFFICIENT_FUNDS' };
    }
    bal[currency] -= amount;
    return { success: true, balances: { ...bal } };
  });
}

function fxToZWG(amountUSD: number): number {
  return amountUSD * INITIAL_EXCHANGE_RATES.USD_ZWG;
}

function fxUSDEquivalent(currency: WalletCurrency, amount: number): number {
  switch (currency) {
    case 'USD': return amount;
    case 'ZWG': return amount / INITIAL_EXCHANGE_RATES.USD_ZWG;
    case 'ZAR': return amount / INITIAL_EXCHANGE_RATES.USD_ZAR;
    case 'EUR': return amount / INITIAL_EXCHANGE_RATES.USD_EUR;
    case 'GBP': return amount / INITIAL_EXCHANGE_RATES.USD_GBP;
    case 'AUD': return amount / INITIAL_EXCHANGE_RATES.USD_AUD;
  }
}

function fxFromUSD(currency: WalletCurrency, amountUSD: number): number {
  switch (currency) {
    case 'USD': return amountUSD;
    case 'ZWG': return amountUSD * INITIAL_EXCHANGE_RATES.USD_ZWG;
    case 'ZAR': return amountUSD * INITIAL_EXCHANGE_RATES.USD_ZAR;
    case 'EUR': return amountUSD * INITIAL_EXCHANGE_RATES.USD_EUR;
    case 'GBP': return amountUSD * INITIAL_EXCHANGE_RATES.USD_GBP;
    case 'AUD': return amountUSD * INITIAL_EXCHANGE_RATES.USD_AUD;
  }
}

export interface WalletCheckoutResult {
  success: boolean;
  settledCurrency?: WalletCurrency;
  settledAmount?: number;
  fxFallbackUsed?: boolean;
  balances: WalletBalances;
  reason?: string;
}

/**
 * Checkout settlement priority: ZWG first (TM Pick n Pay's primary
 * transactional currency), then falls back to any other currency with
 * sufficient balance, converting via USD as the pivot. The fallback
 * conversion debits the ORIGIN currency at the live rate for the ZWG-
 * equivalent of totalZWG — never debits two currencies for one order.
 */
export async function walletCheckout(phone: string, totalZWG: number): Promise<WalletCheckoutResult> {
  return withLock(phone, () => {
    seedIfMissing(phone);
    const bal = wallets.get(phone)!;

    if (bal.ZWG >= totalZWG) {
      bal.ZWG -= totalZWG;
      return { success: true, settledCurrency: 'ZWG' as WalletCurrency, settledAmount: totalZWG, fxFallbackUsed: false, balances: { ...bal } };
    }

    const totalUSD = totalZWG / INITIAL_EXCHANGE_RATES.USD_ZWG;
    const fallbackOrder: WalletCurrency[] = ['USD', 'ZAR', 'GBP', 'EUR', 'AUD'];
    for (const cur of fallbackOrder) {
      const neededInCur = fxFromUSD(cur, totalUSD);
      if (bal[cur] >= neededInCur) {
        bal[cur] -= neededInCur;
        return {
          success: true,
          settledCurrency: cur,
          settledAmount: Number(neededInCur.toFixed(2)),
          fxFallbackUsed: true,
          balances: { ...bal },
        };
      }
    }

    return { success: false, reason: 'INSUFFICIENT_FUNDS_ALL_CURRENCIES', balances: { ...bal } };
  });
}

/**
 * Closed-loop voucher credit — the ONLY way voucher balances increase.
 * Inbound remittance value is converted directly into non-cashable store
 * credit. There is no debitVoucherToCash(): off-ramp only ever reads from
 * the wallet balances above, never from here.
 */
export async function creditVoucherFromRemittance(
  phone: string,
  source: RemittanceSource,
  amount: number,
  currency: VoucherCurrency,
  reference: string,
): Promise<VoucherBalances> {
  if (amount <= 0) throw new Error('Remittance amount must be positive');
  return withLock(`voucher:${phone}`, () => {
    seedIfMissing(phone);
    const v = vouchers.get(phone)!;
    v[currency] += amount;
    remittanceLog.unshift({
      id: `rmt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      source,
      recipientPhone: phone,
      amount,
      currency,
      reference,
      status: 'CREDITED',
      receivedAt: new Date().toISOString(),
    });
    return { ...v };
  });
}

export async function debitVoucherForCheckout(phone: string, currency: VoucherCurrency, amount: number): Promise<{ success: boolean; balances: VoucherBalances; reason?: string }> {
  return withLock(`voucher:${phone}`, () => {
    seedIfMissing(phone);
    const v = vouchers.get(phone)!;
    if (v[currency] < amount) {
      return { success: false, balances: { ...v }, reason: 'INSUFFICIENT_VOUCHER_BALANCE' };
    }
    v[currency] -= amount;
    return { success: true, balances: { ...v } };
  });
}

export function getRemittanceLog(phone?: string) {
  return phone ? remittanceLog.filter((r) => r.recipientPhone === phone) : remittanceLog;
}

export { fxToZWG, fxUSDEquivalent, fxFromUSD };
