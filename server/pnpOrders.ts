import type { OrderTrackingStatus, FulfillmentRoute } from '../src/types.js';
import { resolveWindowLabel, getEarliestWindow } from './deliveryWindows.js';

/**
 * TM-PicknPay order persistence — demo in-memory store (matches this repo's
 * DEMO_CART convention). Previously orders only existed in Moja's session
 * state, which meant TRACK was a fake hash-based display and there was no
 * real picking queue for depot staff. This gives both a real backing store.
 */

export interface PnpOrderItem {
  productId: string;
  name: string;
  qty: number;
  priceZWG: number;
}

export interface PnpOrder {
  id: string;
  phone: string;
  items: PnpOrderItem[];
  totalZWG: number;
  address: string;
  route: FulfillmentRoute;
  storeId?: string;
  hubName?: string;
  deliveryWindowId: string;
  deliveryWindowLabel: string;
  status: OrderTrackingStatus;
  createdAt: string;
  updatedAt: string;
}

const orders = new Map<string, PnpOrder>();

// Picking queues: STORE-routed orders queue by storeId; HUB-routed orders
// share one hub queue. Lets picking teams see only their own footprint.
const storeQueues = new Map<string, string[]>(); // storeId -> orderId[]
const hubQueue: string[] = [];

export function createOrder(params: {
  phone: string;
  items: PnpOrderItem[];
  totalZWG: number;
  address: string;
  route: FulfillmentRoute;
  storeId?: string;
  hubName?: string;
  deliveryWindowId?: string;
}): PnpOrder {
  // Typed/fallback checkout doesn't ask for a window (Parkinson's Law — the
  // Flow checkout path is where picking one properly belongs); an unknown or
  // omitted id falls back to the earliest real slot rather than a blank one.
  const resolvedLabel = params.deliveryWindowId ? resolveWindowLabel(params.deliveryWindowId) : null;
  const windowId = resolvedLabel ? params.deliveryWindowId! : getEarliestWindow().id;
  const windowLabel = resolvedLabel ?? getEarliestWindow().label;

  const order: PnpOrder = {
    id: `PNP-ZW-${Math.floor(100000 + Math.random() * 900000)}`,
    phone: params.phone,
    items: params.items,
    totalZWG: params.totalZWG,
    address: params.address,
    route: params.route,
    storeId: params.storeId,
    hubName: params.hubName,
    deliveryWindowId: windowId,
    deliveryWindowLabel: windowLabel,
    status: 'ORDERED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  orders.set(order.id, order);

  if (order.route === 'HUB') {
    hubQueue.push(order.id);
  } else {
    const key = order.storeId ?? 'TM_PNP';
    const queue = storeQueues.get(key) ?? [];
    queue.push(order.id);
    storeQueues.set(key, queue);
  }

  return order;
}

export function getOrder(orderId: string): PnpOrder | null {
  return orders.get(orderId) ?? null;
}

const STAGE_ORDER: OrderTrackingStatus[] = ['ORDERED', 'PACKED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export function advanceOrder(orderId: string): { success: boolean; order?: PnpOrder; reason?: string } {
  const order = orders.get(orderId);
  if (!order) return { success: false, reason: 'NOT_FOUND' };
  const idx = STAGE_ORDER.indexOf(order.status);
  if (idx === STAGE_ORDER.length - 1) return { success: false, reason: 'ALREADY_DELIVERED', order };
  order.status = STAGE_ORDER[idx + 1];
  order.updatedAt = new Date().toISOString();

  // Delivered/dispatched orders drop off the picking queue — picking teams
  // only need to see what's still awaiting action at their location.
  if (order.status !== 'ORDERED' && order.status !== 'PACKED') {
    if (order.route === 'HUB') {
      const i = hubQueue.indexOf(orderId);
      if (i >= 0) hubQueue.splice(i, 1);
    } else {
      const key = order.storeId ?? 'TM_PNP';
      const queue = storeQueues.get(key);
      if (queue) {
        const i = queue.indexOf(orderId);
        if (i >= 0) queue.splice(i, 1);
      }
    }
  }

  return { success: true, order };
}

export function getStoreQueue(storeId: string): PnpOrder[] {
  const ids = storeQueues.get(storeId) ?? [];
  return ids.map((id) => orders.get(id)).filter((o): o is PnpOrder => !!o);
}

export function getHubQueue(): PnpOrder[] {
  return hubQueue.map((id) => orders.get(id)).filter((o): o is PnpOrder => !!o);
}
