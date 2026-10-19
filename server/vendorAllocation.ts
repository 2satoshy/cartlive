/**
 * Daily production batch allocation. Street vendors and tuck shops ordering
 * via WhatsApp draw dynamically from a fixed daily run instead of an
 * unbounded catalogue quantity, so the 800th loaf ordered today can't
 * oversell a batch that only made 600.
 *
 * Generalised beyond a single hardcoded SKU: any high-volume production
 * line can be registered here, not just the Mutoko bakery line.
 */

interface DailyBatch {
  id: string;
  productId: string;
  label: string;
  producedQty: number;
  allocatedQty: number;
  productionDate: string;
}

// Registry of production lines and their daily output. Adding a new
// high-volume item is a one-line addition here, not a code change to the
// allocation logic itself.
const PRODUCTION_LINES: Array<{ productId: string; label: string; dailyQty: number }> = [
  { productId: 'bread-loaf', label: 'Mutoko Bakery Line — White Bread Loaf', dailyQty: 600 },
  { productId: 'maize-meal-bulk', label: 'Harare Milling Line — Bulk Maize Meal (10kg)', dailyQty: 400 },
  { productId: 'cooking-oil-bulk', label: 'Bulawayo Bottling Line — Bulk Cooking Oil (5L)', dailyQty: 250 },
];

const batches = new Map<string, DailyBatch>();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function seedTodaysBatches() {
  const date = today();
  for (const line of PRODUCTION_LINES) {
    const seedKey = `${line.productId}-${date}`;
    if (!batches.has(seedKey)) {
      batches.set(seedKey, {
        id: seedKey,
        productId: line.productId,
        label: line.label,
        producedQty: line.dailyQty,
        allocatedQty: 0,
        productionDate: date,
      });
    }
  }
}

export function getTodaysBatch(productId: string): DailyBatch | null {
  seedTodaysBatches();
  for (const batch of batches.values()) {
    if (batch.productId === productId && batch.productionDate === today()) return { ...batch };
  }
  return null;
}

export function listTodaysBatches(): DailyBatch[] {
  seedTodaysBatches();
  const date = today();
  return [...batches.values()].filter((b) => b.productionDate === date);
}

export interface AllocationResult {
  success: boolean;
  allocatedQty: number;
  remainingInBatch: number;
  reason?: string;
}

/**
 * Allocates out of the current day's production run for the given
 * productId. Partial fills are reported explicitly (allocatedQty may be
 * less than requested) rather than silently rounding down — the caller
 * must relay that to the vendor. Returns NO_BATCH_TODAY for any productId
 * not registered in PRODUCTION_LINES above.
 */
export function allocateFromBatch(productId: string, requestedQty: number): AllocationResult {
  seedTodaysBatches();
  const batch = [...batches.values()].find((b) => b.productId === productId && b.productionDate === today());
  if (!batch) {
    return { success: false, allocatedQty: 0, remainingInBatch: 0, reason: 'NO_BATCH_TODAY' };
  }
  const remaining = batch.producedQty - batch.allocatedQty;
  if (remaining <= 0) {
    return { success: false, allocatedQty: 0, remainingInBatch: 0, reason: 'BATCH_EXHAUSTED' };
  }
  const granted = Math.min(requestedQty, remaining);
  batch.allocatedQty += granted;
  return {
    success: granted > 0,
    allocatedQty: granted,
    remainingInBatch: batch.producedQty - batch.allocatedQty,
    reason: granted < requestedQty ? 'PARTIAL_FILL' : undefined,
  };
}
