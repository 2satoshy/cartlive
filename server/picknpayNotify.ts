import type { PnpOrder } from './pnpOrders.js';

/**
 * Pushes a TM-PicknPay order's new tracking stage to Moja (signal-desk-v4)
 * the moment a depot operator advances it, so the customer gets a WhatsApp
 * message instead of only finding out by typing TRACK. Previously TRACK was
 * pull-only — this is the push half, added 5 Oct 2026.
 *
 * Best-effort: a failed push never fails the advance itself (the order's
 * status transition already succeeded by the time this runs) — it only logs,
 * so a transient network blip to signal-desk-v4 can't block a depot operator
 * from working the picking queue.
 */
export async function notifyPicknPayStatus(order: PnpOrder): Promise<boolean> {
  const base = process.env.MOJA_WEBHOOK_BASE_URL || 'https://signaldesk.co.za';
  const secret = process.env.MOJA_PNP_SHARED_SECRET;
  if (!secret) {
    console.warn('[pnp] MOJA_PNP_SHARED_SECRET not set — cannot push order status to Moja');
    return false;
  }
  try {
    const res = await fetch(`${base}/api/webhook/picknpay-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-moja-shared-secret': secret },
      body: JSON.stringify({
        orderId: order.id,
        phone: order.phone,
        status: order.status,
        itemCount: order.items.reduce((n, i) => n + i.qty, 0),
        totalZWG: order.totalZWG,
      }),
    });
    if (!res.ok) {
      console.warn('[pnp] order status push failed', order.id, res.status);
    }
    return res.ok;
  } catch (err) {
    console.warn('[pnp] order status push threw', order.id, String(err));
    return false;
  }
}
