/**
 * TM-PicknPay "Trending Specials" bundles — pre-set, fixed-content product
 * groupings a shopper (or a school/business buying in bulk) can add to cart
 * in one tap instead of hunting down each item individually. Added 6 Oct
 * 2026 off the stakeholder call's "top 5/10 trending bundles" ask — this is
 * a placeholder set (1 consumer hamper + 2 bulk/institutional bundles), not
 * the full top-5/top-10 list discussed; matches this repo's other
 * in-memory/deterministic mocks (e.g. deliveryWindows.ts), no real
 * promo-engine behind it.
 *
 * See the DEFERRED block at the bottom of this file for two bundle concepts
 * the same call raised but did not spec — do not add placeholders for those.
 *
 * priceZWG is derived here, not stored as a literal, from the same
 * USD_ZWG rate src/data/products.ts uses for every real catalogue product's
 * own priceZWG (26.80 — confirmed it reproduces products.ts's existing
 * priceZWG values exactly, e.g. prod-2 $4.50 -> ZWG 120.60) — one FX source
 * of truth, not a second hardcoded rate on the Moja side of this call.
 */

import { INITIAL_EXCHANGE_RATES } from '../src/data/products.js';

export type BundleKind = 'CONSUMER' | 'BULK';

export interface BundleItem {
  name: string;
  qty: number;
}

export interface Bundle {
  id: string;
  name: string;
  /**
   * WhatsApp interactive-list row titles hard-cap at 24 chars (360dialog
   * silently rejects the whole list if exceeded, same cap enforced
   * elsewhere in signal-desk-v4). A blind `name.slice(0, 24)` on the bulk
   * bundles' full descriptive names drops the exact disambiguating detail
   * those names exist to carry (e.g. "(10 x 5kg ≈ 50kg, not 500kg)") —
   * found by audit 6 Oct 2026. This is the row title instead: always <=24
   * chars, written to keep the real quantity visible pre-tap, not a
   * truncation of `name`. Falls back to `name` itself (hamper's is already
   * short enough to fit whole).
   */
  shortLabel: string;
  description: string;
  items: BundleItem[];
  priceUSD: number;
  priceZWG: number;
  kind: BundleKind;
}

type BundleInput = Omit<Bundle, 'priceZWG'>;

// ── 1. Consumer hamper ───────────────────────────────────────────────────
// Transcribed on the stakeholder call directly off a competitor reference
// (Probrands, a Zimbabwean grocery retailer, probrands.co.zw/hampers),
// total price $31. Live decision on the call: strip the Probrands house-
// brand name and rebrand as a TM Pick n Pay hamper (other manufacturers'
// brand names inside the hamper — Revive, Life, Monty's, Bally, Dishwala,
// Zimgold, Gloria, Red Seal — are kept as-is; only the retailer's own
// "Probrands" branding is what the call asked to remove). Item names below
// are generic/commodity descriptions, not real pnpexpress catalogue SKUs —
// none of these are claimed to be live-catalogue products; this bundle's
// own price is the flat hamper price (not a sum of catalogue line prices).
// Pricing: competitor reference totals $31 for the same 17 items; call
// decision was "$29, save $2" off that reference price.
const TM_PICKNPAY_HAMPER: BundleInput = {
  id: 'tm-picknpay-hamper',
  name: 'TM Pick n Pay Hamper',
  shortLabel: 'TM Pick n Pay Hamper',
  description:
    "A full household grocery hamper — 17 staples in one box. $2 off the $31 you'd pay for the same contents elsewhere.",
  items: [
    { name: 'Premium Rice 2kg', qty: 1 },
    { name: 'Salt 1kg', qty: 1 },
    { name: 'Popcorn 500g', qty: 1 },
    { name: 'Sugar Beans 500g', qty: 1 },
    { name: 'Candles 300g', qty: 1 },
    { name: 'Revive Dairy Fruit Mix / Maheu 1L', qty: 1 },
    { name: 'Life Milk UHT 1L', qty: 1 },
    { name: "Monty's Baked Beans 410g", qty: 2 },
    { name: 'Bally House Crush 2L', qty: 1 },
    { name: 'Dishwala 750ml', qty: 1 },
    { name: 'Laundry Soap (Perfection/Brightlite)', qty: 1 },
    { name: 'Zimgold Cooking Oil 2L', qty: 1 },
    { name: 'Gloria Self Raising Flour 2kg', qty: 1 },
    { name: 'Red Seal Roller Meal 10kg', qty: 1 },
    { name: 'Sugar 2kg', qty: 1 },
    { name: 'Peanut Butter 500g', qty: 1 },
    { name: 'Tomato Sauce 375ml', qty: 1 },
  ],
  priceUSD: 29,
  kind: 'CONSUMER',
};

// ── 2 & 3. Bulk/institutional bundles ────────────────────────────────────
// Both priced as 10x the real catalogue per-unit USD price of the closest
// matching live product in src/data/products.ts (SAMPLE_PRODUCTS) — not
// invented numbers. Re-check these against the live catalogue if prices
// there change.
//
// (2) Mealie meal: the call asked for "10 by 50kgs of mealie meal" (10
//     units of a 50kg bag, for schools). No 50kg mealie meal SKU exists in
//     the live catalogue — the closest real product is prod-2, "White Star
//     Super Maize Meal (5kg)" @ $4.50/unit. This bundle approximates the
//     ask as 10x that 5kg bag = 50kg total (NOT 500kg, which a literal
//     10x50kg would be) — the name/description say this plainly so nobody
//     mistakes it for a real 50kg SKU.
//     Price = 10 x $4.50 = $45.00.
//
// (3) Cooking oil: the call asked for "10 by 5 litres of cooking oil" (for
//     schools), which the catalogue already matches exactly — prod-4,
//     "Sunfoil Pure Sunflower Oil (5 Litres)" @ $8.20/unit. No
//     approximation needed; 10 units = 50L total.
//     Price = 10 x $8.20 = $82.00.
const MEALIE_MEAL_BULK_BUNDLE: BundleInput = {
  id: 'tm-bulk-mealie-meal',
  name: 'Mealie Meal Bulk Bundle — School/Institutional (10 x 5kg ≈ 50kg)',
  shortLabel: 'Mealie Meal x10 (50kg)',
  description:
    'Approximates the discussed "10 x 50kg" school mealie meal order using 10x the real catalogue 5kg bag (White Star Super Maize Meal, closest real SKU — no 50kg bag exists in the live catalogue), totaling 50kg, not 500kg.',
  items: [{ name: 'White Star Super Maize Meal (5kg)', qty: 10 }],
  priceUSD: 45.0,
  kind: 'BULK',
};

const COOKING_OIL_BULK_BUNDLE: BundleInput = {
  id: 'tm-bulk-cooking-oil',
  name: '5L Cooking Oil x10 — School/Institutional Bundle',
  shortLabel: 'Cooking Oil x10 (50L)',
  description:
    'Bulk cooking oil for schools and businesses — 10x Sunfoil Pure Sunflower Oil (5 Litres), the real catalogue match for the "10 by 5 litres" ask, 50L total.',
  items: [{ name: 'Sunfoil Pure Sunflower Oil (5 Litres)', qty: 10 }],
  priceUSD: 82.0,
  kind: 'BULK',
};

// ── DEFERRED — do not build without Thami's own content/design input ────
// Two more bundle concepts came up on the same stakeholder call but were
// left genuinely undecided. Do not add placeholders or guess at either.
// See TM-PicknPay stakeholder call transcript, 6 Oct 2026, for context:
//
//   1. A "no-name-brand" generic TM Pick n Pay product line — the call was
//      mid-way through AI-generating product images for this when it
//      ended. No images exist yet; don't fabricate placeholder art or SKUs.
//   2. A "bucket hamper" concept (a reusable storage bucket + staples,
//      where the bucket itself has independent utility after the groceries
//      are used) — undecided on contents, price, and bucket sourcing.

const BUNDLES: BundleInput[] = [TM_PICKNPAY_HAMPER, MEALIE_MEAL_BULK_BUNDLE, COOKING_OIL_BULK_BUNDLE];

function withZwgPrice(b: BundleInput): Bundle {
  return { ...b, priceZWG: Math.round(b.priceUSD * INITIAL_EXCHANGE_RATES.USD_ZWG * 100) / 100 };
}

export function getBundles(): Bundle[] {
  return BUNDLES.map(withZwgPrice);
}

export function getBundleById(id: string): Bundle | null {
  const b = BUNDLES.find((x) => x.id === id);
  return b ? withZwgPrice(b) : null;
}
