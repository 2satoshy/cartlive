import type { StoreId, ERPStockLevel } from '../src/types.js';
import { SAMPLE_PRODUCTS } from '../src/data/products.js';

/**
 * ERP sync layer. MockERPAdapter stands in for a real SAP / Arch Retail /
 * Syspro connection — no real ERP credentials exist for this demo. The
 * adapter interface is the actual integration contract: swap
 * MockERPAdapter for a real one without touching any caller.
 */

export interface ERPAdapter {
  getLiveStock(storeId: StoreId, sku: string): Promise<ERPStockLevel>;
}

const LOW_STOCK_THRESHOLD = 15;

// Deterministic-but-varied mock levels per store+sku so a demo run looks
// alive rather than static. Re-seeded per process start, not per request.
const mockLevels = new Map<string, number>();
function mockLevelFor(storeId: string, sku: string): number {
  const key = `${storeId}:${sku}`;
  if (!mockLevels.has(key)) {
    // Hash the key into a 0-120 range so the same SKU/store is stable within a run.
    let hash = 0;
    for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) % 10000;
    mockLevels.set(key, hash % 121);
  }
  return mockLevels.get(key)!;
}

export class MockERPAdapter implements ERPAdapter {
  async getLiveStock(storeId: StoreId, sku: string): Promise<ERPStockLevel> {
    return {
      storeId,
      sku,
      liveQty: mockLevelFor(storeId, sku),
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      erpSource: 'MOCK',
      lastSyncedAt: new Date().toISOString(),
    };
  }
}

const adapter: ERPAdapter = new MockERPAdapter();

export async function checkStock(storeId: StoreId, sku: string): Promise<ERPStockLevel> {
  return adapter.getLiveStock(storeId, sku);
}

export function stockLabel(level: ERPStockLevel): string {
  if (level.liveQty <= 0) return '❌ Out of Stock';
  if (level.liveQty <= level.lowStockThreshold) return `⚠️ Low Stock (${level.liveQty} left)`;
  return '';
}

/** Suggests the nearest in-stock alternative within the same category/brand family. */
export async function findSubstitute(sku: string): Promise<{ id: string; name: string } | null> {
  const original = SAMPLE_PRODUCTS.find((p) => p.id === sku);
  if (!original) return null;
  const candidates = SAMPLE_PRODUCTS.filter((p) => p.id !== sku && p.category === original.category);
  for (const candidate of candidates) {
    const level = await checkStock(candidate.storeId, candidate.id);
    if (level.liveQty > level.lowStockThreshold) {
      return { id: candidate.id, name: candidate.name };
    }
  }
  return null;
}

/** Atomic-at-checkout re-verification. Call this again right before settling payment. */
export async function verifyAvailableAtCheckout(items: Array<{ storeId: StoreId; sku: string; qty: number }>): Promise<{ allAvailable: boolean; unavailable: Array<{ sku: string; liveQty: number }> }> {
  const unavailable: Array<{ sku: string; liveQty: number }> = [];
  for (const item of items) {
    const level = await checkStock(item.storeId, item.sku);
    if (level.liveQty < item.qty) {
      unavailable.push({ sku: item.sku, liveQty: level.liveQty });
    }
  }
  return { allAvailable: unavailable.length === 0, unavailable };
}
