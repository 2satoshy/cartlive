import type { DeliveryZone, FulfillmentRoute, B2BAccountType } from '../src/types.js';

export const DELIVERY_ZONES: DeliveryZone[] = [
  { zoneId: 'harare-northern-suburbs', label: 'Northern Suburbs (Borrowdale, Arundel, Avondale)', city: 'Harare', capabilities: ['SCOOTER', 'TRUCK'] },
  { zoneId: 'harare-cbd', label: 'Harare CBD', city: 'Harare', capabilities: ['SCOOTER', 'TRUCK'] },
  { zoneId: 'harare-high-density', label: 'High-Density Suburbs (Mbare, Glen View, Highfield)', city: 'Harare', capabilities: ['TRUCK'] },
  { zoneId: 'bulawayo-metro', label: 'Bulawayo Metro', city: 'Bulawayo', capabilities: ['SCOOTER', 'TRUCK'] },
  { zoneId: 'mutare-metro', label: 'Mutare Metro', city: 'Mutare', capabilities: ['TRUCK'] },
  { zoneId: 'gweru-metro', label: 'Gweru Metro', city: 'Gweru', capabilities: ['TRUCK'] },
  { zoneId: 'mutoko-rural', label: 'Mutoko Rural', city: 'Mutoko', capabilities: ['TRUCK_BULK_DROP'] },
  { zoneId: 'vicfalls-tourism', label: 'Victoria Falls Tourism Corridor', city: 'Victoria Falls', capabilities: ['TRUCK', 'THIRD_PARTY_VENDOR'] },
  { zoneId: 'cross-border-sa-diaspora', label: 'Cross-Border Dispatch (SA Wholesale Export)', city: 'Johannesburg', capabilities: ['THIRD_PARTY_VENDOR'] },
];

export function getZone(zoneId: string): DeliveryZone | undefined {
  return DELIVERY_ZONES.find((z) => z.zoneId === zoneId);
}

export function listZones(): DeliveryZone[] {
  return DELIVERY_ZONES;
}

/**
 * Hub-and-spoke routing decision. Standard individual orders go to the
 * nearest store's local pick. Schools, corporates, and Bulawayo/Harare
 * corporate accounts bypass local store stock entirely and route to the
 * Msasa warehouse hub matrix — this is a deliberate business rule, not a
 * fallback for when a store is out of stock (see verifyAvailableAtCheckout
 * in erpStock.ts for that case).
 */
export function routeFulfillment(params: {
  accountType?: B2BAccountType;
  zoneId: string;
  orderValueZWG?: number;
}): { route: FulfillmentRoute; hubName?: string; reason: string } {
  const { accountType, zoneId } = params;
  const zone = getZone(zoneId);

  if (accountType === 'SCHOOL' || accountType === 'CORPORATE') {
    return { route: 'HUB', hubName: 'Msasa Warehouse Matrix', reason: `${accountType} accounts route directly to the warehouse hub, bypassing local store stock.` };
  }

  if (accountType === 'LODGE' && (zone?.city === 'Harare' || zone?.city === 'Bulawayo')) {
    return { route: 'HUB', hubName: 'Msasa Warehouse Matrix', reason: 'Lodge bulk accounts in Harare/Bulawayo route to the warehouse hub.' };
  }

  return { route: 'STORE', reason: 'Standard individual order — routed to nearest physical branch for local picking.' };
}

export function zoneSupports(zoneId: string, need: 'SCOOTER' | 'TRUCK' | 'TRUCK_BULK_DROP' | 'THIRD_PARTY_VENDOR'): boolean {
  const zone = getZone(zoneId);
  return !!zone?.capabilities.includes(need);
}
