import type { B2BAccount } from '../src/types.js';

/**
 * B2B institutional account registry — demo seed data. A real build would
 * pull this from TM Pick n Pay's own CRM/ERP; this is enough to showcase
 * phone-number-based recognition and routing.
 */
export const B2B_ACCOUNTS: B2BAccount[] = [
  { id: 'b2b-1', name: 'Mutoko Bakery Line (Street Vendors)', type: 'VENDOR', phone: '263771000001', city: 'Mutoko', defaultFulfillment: 'STORE', dailyBatchAllocationId: 'bread-loaf' },
  { id: 'b2b-1b', name: 'Harare Milling Line (Tuck Shops)', type: 'VENDOR', phone: '263771000006', city: 'Harare', defaultFulfillment: 'STORE', dailyBatchAllocationId: 'maize-meal-bulk' },
  { id: 'b2b-1c', name: 'Bulawayo Bottling Line (Tuck Shops)', type: 'VENDOR', phone: '263771000007', city: 'Bulawayo', defaultFulfillment: 'STORE', dailyBatchAllocationId: 'cooking-oil-bulk' },
  { id: 'b2b-2', name: 'St. Ignatius College (Harare)', type: 'SCHOOL', phone: '263771000002', city: 'Harare', defaultFulfillment: 'HUB' },
  { id: 'b2b-3', name: 'Dominican Convent School (Bulawayo)', type: 'SCHOOL', phone: '263771000003', city: 'Bulawayo', defaultFulfillment: 'HUB' },
  { id: 'b2b-4', name: 'Econet Corporate Catering (Harare)', type: 'CORPORATE', phone: '263771000004', city: 'Harare', defaultFulfillment: 'HUB' },
  { id: 'b2b-5', name: 'Victoria Falls Safari Lodge', type: 'LODGE', phone: '263771000005', city: 'Victoria Falls', defaultFulfillment: 'HUB' },
];

export function findB2BAccount(phone: string): B2BAccount | null {
  const normalised = phone.replace(/\D/g, '');
  return B2B_ACCOUNTS.find((a) => a.phone.replace(/\D/g, '') === normalised) ?? null;
}
