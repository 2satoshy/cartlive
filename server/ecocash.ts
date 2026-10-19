import crypto from 'crypto';
import type { EcoCashTransaction, VoucherCurrency } from '../src/types.js';
import { creditWallet } from './walletLedger.js';

/**
 * EcoCash integration — DEMO MODE. No real EcoCash merchant/API credentials
 * exist yet; this simulates the request-to-pay (on-ramp) and payout
 * (off-ramp) lifecycle realistically enough to showcase, but every call
 * resolves locally rather than hitting EcoCash's real gateway. Swap the
 * body of requestToPay/payout for real HTTP calls once Thami has merchant
 * credentials — the function signatures and webhook contract are designed
 * not to change when that happens.
 */

const transactions = new Map<string, EcoCashTransaction>();

function reference(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export function verifyEcoCashWebhookSignature(rawPayload: string, signatureHeader: string | null | undefined): boolean {
  const secret = process.env.ECOCASH_WEBHOOK_SECRET || '';
  if (!signatureHeader || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawPayload, 'utf8').digest('hex');
  const sigBuf = Buffer.from(signatureHeader.trim(), 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

/** On-ramp: request-to-pay push to the user's EcoCash number. */
export async function requestToPay(phone: string, amount: number, currency: VoucherCurrency): Promise<EcoCashTransaction> {
  const txn: EcoCashTransaction = {
    id: `ecc_${Date.now()}`,
    direction: 'ONRAMP',
    phone,
    amount,
    currency,
    status: 'PENDING',
    reference: reference('ECO-ON'),
    createdAt: new Date().toISOString(),
  };
  transactions.set(txn.id, txn);
  return txn;
}

/**
 * Off-ramp: cash-out to EcoCash. Caller (the wallet checkout layer) must
 * have already confirmed the funds come from the real multi-currency
 * WALLET, never the closed-loop voucher balance — this function has no
 * way to tell the two apart, by design, so that check belongs upstream.
 * Prioritises ZiG per the TM Pick n Pay requirement.
 */
export async function payout(phone: string, amount: number, currency: VoucherCurrency = 'ZWG'): Promise<EcoCashTransaction> {
  const txn: EcoCashTransaction = {
    id: `ecc_${Date.now()}`,
    direction: 'OFFRAMP',
    phone,
    amount,
    currency,
    status: 'PENDING',
    reference: reference('ECO-OFF'),
    createdAt: new Date().toISOString(),
  };
  transactions.set(txn.id, txn);
  return txn;
}

/**
 * Demo-mode resolver — simulates the async webhook that a real gateway
 * would send. Only transitions a transaction OUT of PENDING once — calling
 * this again on an already-resolved transaction is a no-op (returns null),
 * which is what makes it safe to call both synchronously (demo auto-resolve
 * at request time) and from the separate /ecocash/webhook endpoint without
 * double-crediting or double-refunding the wallet.
 */
export function simulateResolve(txnId: string, outcome: 'SUCCESS' | 'FAILED' = 'SUCCESS'): EcoCashTransaction | null {
  const txn = transactions.get(txnId);
  if (!txn || txn.status !== 'PENDING') return null;
  txn.status = outcome;
  return { ...txn };
}

export function getTransaction(txnId: string): EcoCashTransaction | null {
  const t = transactions.get(txnId);
  return t ? { ...t } : null;
}

/**
 * Direct order payment — EcoCash charges the customer for one order's
 * total right now, at checkout. Deliberately separate from requestToPay/
 * payout: those two move the WALLET ledger (top-up / cash-out); this one
 * settles a specific order and must never touch the wallet at all — so it
 * resolves via simulateResolve directly rather than settleTransaction
 * (whose ONRAMP+SUCCESS branch exists specifically to credit the wallet,
 * which would be wrong here — crediting the wallet for money that's about
 * to be spent on this exact order, not saved for later, served no purpose
 * and would have looked like free money on the next balance check).
 */
export async function payForOrder(phone: string, amount: number, currency: VoucherCurrency, orderReference: string): Promise<EcoCashTransaction> {
  const txn: EcoCashTransaction = {
    id: `ecc_${Date.now()}`,
    direction: 'ONRAMP',
    phone,
    amount,
    currency,
    status: 'PENDING',
    reference: orderReference,
    createdAt: new Date().toISOString(),
  };
  transactions.set(txn.id, txn);
  const resolved = simulateResolve(txn.id, 'SUCCESS');
  return resolved ?? txn;
}

/**
 * Single source of truth for applying ledger effects when a transaction
 * resolves — called both by the demo-mode auto-resolve (synchronously, at
 * request time, standing in for a gateway callback with no real gateway to
 * wait on) and by the real /ecocash/webhook endpoint. simulateResolve's own
 * PENDING-only guard makes calling this twice for the same transaction safe:
 * the second call is a no-op, so demo auto-resolve + a later real webhook
 * call can never double-credit or double-refund.
 *
 * - ONRAMP + SUCCESS  → credit the wallet (never credited at request time)
 * - OFFRAMP + FAILED  → refund the wallet (it was debited as a hold at
 *   request time, to prevent double-spend while the payout was pending)
 * - ONRAMP + FAILED, OFFRAMP + SUCCESS → no ledger action needed
 */
export async function settleTransaction(txnId: string, outcome: 'SUCCESS' | 'FAILED'): Promise<EcoCashTransaction | null> {
  const resolved = simulateResolve(txnId, outcome);
  if (!resolved) return null;

  if (resolved.direction === 'ONRAMP' && outcome === 'SUCCESS') {
    await creditWallet(resolved.phone, resolved.currency, resolved.amount);
  } else if (resolved.direction === 'OFFRAMP' && outcome === 'FAILED') {
    await creditWallet(resolved.phone, resolved.currency, resolved.amount);
  }

  return resolved;
}
