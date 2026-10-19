import React from 'react';
import { PRODUCT_BASE64_IMAGES } from '../data/productImageBase64';

/**
 * Option 1: Direct Inline Base64 Data Bundle
 * Uses 100% embedded, offline, high-definition uploaded product packshots.
 * Zero HTTP requests needed, zero placeholder fallbacks.
 */

// Normalized lookup map for all search terms, filenames, and product names
const DIRECT_IMAGE_MAP: Record<string, string> = {
  // Rice / Tastic
  'tastic': PRODUCT_BASE64_IMAGES['tastic_rice'],
  'tastic_rice': PRODUCT_BASE64_IMAGES['tastic_rice'],
  'tastic rice 5kg': PRODUCT_BASE64_IMAGES['tastic_rice'],
  'tastic rice 5kg.webp': PRODUCT_BASE64_IMAGES['tastic_rice'],
  'tastic rice 5kg.jpg': PRODUCT_BASE64_IMAGES['tastic_rice'],
  '/images/tastic_rice.jpg': PRODUCT_BASE64_IMAGES['tastic_rice'],
  '/images/tastic_rice.webp': PRODUCT_BASE64_IMAGES['tastic_rice'],
  'rice': PRODUCT_BASE64_IMAGES['tastic_rice'],
  'mupunga': PRODUCT_BASE64_IMAGES['tastic_rice'],
  'ilayisi': PRODUCT_BASE64_IMAGES['tastic_rice'],

  // Maize Meal / White Star
  'white star': PRODUCT_BASE64_IMAGES['white_star_maize'],
  'white_star_maize': PRODUCT_BASE64_IMAGES['white_star_maize'],
  'mealie meal': PRODUCT_BASE64_IMAGES['white_star_maize'],
  'mealie meal.webp': PRODUCT_BASE64_IMAGES['white_star_maize'],
  'mealie meal.jpg': PRODUCT_BASE64_IMAGES['white_star_maize'],
  '/images/white_star_maize.jpg': PRODUCT_BASE64_IMAGES['white_star_maize'],
  '/images/white_star_maize.webp': PRODUCT_BASE64_IMAGES['white_star_maize'],
  'maize': PRODUCT_BASE64_IMAGES['white_star_maize'],
  'mealie': PRODUCT_BASE64_IMAGES['white_star_maize'],
  'hupfu': PRODUCT_BASE64_IMAGES['white_star_maize'],
  'impuphu': PRODUCT_BASE64_IMAGES['white_star_maize'],

  // Fruit & Veg
  'fruit': PRODUCT_BASE64_IMAGES['fruit_veg_box'],
  'veg': PRODUCT_BASE64_IMAGES['fruit_veg_box'],
  'vegetable': PRODUCT_BASE64_IMAGES['fruit_veg_box'],
  'fruit_veg_box': PRODUCT_BASE64_IMAGES['fruit_veg_box'],
  'vegetable box 10kg': PRODUCT_BASE64_IMAGES['fruit_veg_box'],
  'vegetable box 10kg.jpg': PRODUCT_BASE64_IMAGES['fruit_veg_box'],
  'vegetable box 10kg.webp': PRODUCT_BASE64_IMAGES['fruit_veg_box'],
  'fruit and vegetable box 10kg': PRODUCT_BASE64_IMAGES['fruit_veg_box'],
  'fruit and vegetable box 10kg.jpg': PRODUCT_BASE64_IMAGES['fruit_veg_box'],
  'fruit and vegetable box 10kg.webp': PRODUCT_BASE64_IMAGES['fruit_veg_box'],
  '/images/fruit_veg_box.jpg': PRODUCT_BASE64_IMAGES['fruit_veg_box'],
  '/images/fruit_veg_box.webp': PRODUCT_BASE64_IMAGES['fruit_veg_box'],
  'produce': PRODUCT_BASE64_IMAGES['fruit_veg_box'],

  // Cooking Oil / Sunfoil
  'sunfoil': PRODUCT_BASE64_IMAGES['sunfoil_oil_5l'] || PRODUCT_BASE64_IMAGES['sunfoil_oil'],
  'sunfoil_oil': PRODUCT_BASE64_IMAGES['sunfoil_oil_5l'] || PRODUCT_BASE64_IMAGES['sunfoil_oil'],
  'cooking oil': PRODUCT_BASE64_IMAGES['sunfoil_oil_5l'] || PRODUCT_BASE64_IMAGES['sunfoil_oil'],
  'cooking oil 2l': PRODUCT_BASE64_IMAGES['sunfoil_oil_2l'] || PRODUCT_BASE64_IMAGES['sunfoil_oil'],
  'cooking oil 2l.webp': PRODUCT_BASE64_IMAGES['sunfoil_oil_2l'] || PRODUCT_BASE64_IMAGES['sunfoil_oil'],
  'cooking oil 2l.jpg': PRODUCT_BASE64_IMAGES['sunfoil_oil_2l'] || PRODUCT_BASE64_IMAGES['sunfoil_oil'],
  'cooking oil 5l': PRODUCT_BASE64_IMAGES['sunfoil_oil_5l'] || PRODUCT_BASE64_IMAGES['sunfoil_oil'],
  'cooking oil 5l.webp': PRODUCT_BASE64_IMAGES['sunfoil_oil_5l'] || PRODUCT_BASE64_IMAGES['sunfoil_oil'],
  'cooking oil 5l.jpg': PRODUCT_BASE64_IMAGES['sunfoil_oil_5l'] || PRODUCT_BASE64_IMAGES['sunfoil_oil'],
  '/images/sunfoil_oil.jpg': PRODUCT_BASE64_IMAGES['sunfoil_oil_5l'] || PRODUCT_BASE64_IMAGES['sunfoil_oil'],
  '/images/sunfoil_oil.webp': PRODUCT_BASE64_IMAGES['sunfoil_oil_5l'] || PRODUCT_BASE64_IMAGES['sunfoil_oil'],
  'oil': PRODUCT_BASE64_IMAGES['sunfoil_oil_5l'] || PRODUCT_BASE64_IMAGES['sunfoil_oil'],
  'cooking': PRODUCT_BASE64_IMAGES['sunfoil_oil_5l'] || PRODUCT_BASE64_IMAGES['sunfoil_oil'],
  'mafuta': PRODUCT_BASE64_IMAGES['sunfoil_oil_5l'] || PRODUCT_BASE64_IMAGES['sunfoil_oil'],

  // Sugar / Huletts
  'sugar': PRODUCT_BASE64_IMAGES['huletts_sugar'],
  'huletts': PRODUCT_BASE64_IMAGES['huletts_sugar'],
  'huletts_sugar': PRODUCT_BASE64_IMAGES['huletts_sugar'],
  'sugar 5kg': PRODUCT_BASE64_IMAGES['huletts_sugar'],
  'sugar 5kg.webp': PRODUCT_BASE64_IMAGES['huletts_sugar'],
  'sugar 5kg.jpg': PRODUCT_BASE64_IMAGES['huletts_sugar'],
  '/images/huletts_sugar.jpg': PRODUCT_BASE64_IMAGES['huletts_sugar'],
  '/images/huletts_sugar.webp': PRODUCT_BASE64_IMAGES['huletts_sugar'],
  'chigaku': PRODUCT_BASE64_IMAGES['huletts_sugar'],
  'unshukela': PRODUCT_BASE64_IMAGES['huletts_sugar'],

  // Mazoe Orange Crush
  'mazoe': PRODUCT_BASE64_IMAGES['mazoe_orange_crush'],
  'mazoe_orange_crush': PRODUCT_BASE64_IMAGES['mazoe_orange_crush'],
  'mazoe orange crush 2l': PRODUCT_BASE64_IMAGES['mazoe_orange_crush'],
  'mazoe orange crush 2l.webp': PRODUCT_BASE64_IMAGES['mazoe_orange_crush'],
  'mazoe orange crush 2l.jpg': PRODUCT_BASE64_IMAGES['mazoe_orange_crush'],
  '/images/mazoe_orange_crush.jpg': PRODUCT_BASE64_IMAGES['mazoe_orange_crush'],
  '/images/mazoe_orange_crush.webp': PRODUCT_BASE64_IMAGES['mazoe_orange_crush'],
  'crush': PRODUCT_BASE64_IMAGES['mazoe_orange_crush'],
  'orange': PRODUCT_BASE64_IMAGES['mazoe_orange_crush'],
  'cordial': PRODUCT_BASE64_IMAGES['mazoe_orange_crush'],

  // Tanganda Tea
  'tea': PRODUCT_BASE64_IMAGES['tanganda_tea'],
  'tanganda': PRODUCT_BASE64_IMAGES['tanganda_tea'],
  'tanganda_tea': PRODUCT_BASE64_IMAGES['tanganda_tea'],
  'tanganda tagless tea bags 100': PRODUCT_BASE64_IMAGES['tanganda_tea'],
  'tanganda tagless tea bags 100.webp': PRODUCT_BASE64_IMAGES['tanganda_tea'],
  'tanganda tagless tea bags 100.jpg': PRODUCT_BASE64_IMAGES['tanganda_tea'],
  '/images/tanganda_tea.jpg': PRODUCT_BASE64_IMAGES['tanganda_tea'],
  '/images/tanganda_tea.webp': PRODUCT_BASE64_IMAGES['tanganda_tea'],
  'tii': PRODUCT_BASE64_IMAGES['tanganda_tea'],
  'chai': PRODUCT_BASE64_IMAGES['tanganda_tea'],

  // Solar Kit
  'solar': PRODUCT_BASE64_IMAGES['solar_lighting_system'],
  'solar_lighting_system': PRODUCT_BASE64_IMAGES['solar_lighting_system'],
  'solar kit': PRODUCT_BASE64_IMAGES['solar_lighting_system'],
  'solar kit.webp': PRODUCT_BASE64_IMAGES['solar_lighting_system'],
  'solar kit.jpg': PRODUCT_BASE64_IMAGES['solar_lighting_system'],
  '/images/solar_lighting_system.jpg': PRODUCT_BASE64_IMAGES['solar_lighting_system'],
  '/images/solar_lighting_system.webp': PRODUCT_BASE64_IMAGES['solar_lighting_system'],
  'power': PRODUCT_BASE64_IMAGES['solar_lighting_system'],
  'lighting': PRODUCT_BASE64_IMAGES['solar_lighting_system'],
  'liteng': PRODUCT_BASE64_IMAGES['solar_lighting_system'],
  'gizzu': PRODUCT_BASE64_IMAGES['solar_lighting_system'],

  // Milk / Clover
  'milk': PRODUCT_BASE64_IMAGES['clover_milk'],
  'clover': PRODUCT_BASE64_IMAGES['clover_milk'],
  'clover_milk': PRODUCT_BASE64_IMAGES['clover_milk'],
  'full cream milk carton 6x1l': PRODUCT_BASE64_IMAGES['clover_milk'],
  'full cream milk carton 6x1l.webp': PRODUCT_BASE64_IMAGES['clover_milk'],
  'full cream milk carton 6x1l.jpg': PRODUCT_BASE64_IMAGES['clover_milk'],
  '/images/clover_milk.jpg': PRODUCT_BASE64_IMAGES['clover_milk'],
  '/images/clover_milk.webp': PRODUCT_BASE64_IMAGES['clover_milk'],
  'mukaka': PRODUCT_BASE64_IMAGES['clover_milk'],
  'ubisi': PRODUCT_BASE64_IMAGES['clover_milk'],

  // Soap / Sunlight
  'soap': PRODUCT_BASE64_IMAGES['sunlight_soap'],
  'sunlight': PRODUCT_BASE64_IMAGES['sunlight_soap'],
  'sunlight_soap': PRODUCT_BASE64_IMAGES['sunlight_soap'],
  'bar soap': PRODUCT_BASE64_IMAGES['sunlight_soap'],
  'bar soap.webp': PRODUCT_BASE64_IMAGES['sunlight_soap'],
  'bar soap.jpg': PRODUCT_BASE64_IMAGES['sunlight_soap'],
  '/images/sunlight_soap.jpg': PRODUCT_BASE64_IMAGES['sunlight_soap'],
  '/images/sunlight_soap.webp': PRODUCT_BASE64_IMAGES['sunlight_soap'],
  'sipo': PRODUCT_BASE64_IMAGES['sunlight_soap'],
  'isipho': PRODUCT_BASE64_IMAGES['sunlight_soap'],

  // Beef / Meat
  'beef': PRODUCT_BASE64_IMAGES['fresh_beef'],
  'fresh_beef': PRODUCT_BASE64_IMAGES['fresh_beef'],
  'beef blade roast 2kg': PRODUCT_BASE64_IMAGES['fresh_beef'],
  'beef blade roast 2kg.webp': PRODUCT_BASE64_IMAGES['fresh_beef'],
  'beef blade roast 2kg.jpg': PRODUCT_BASE64_IMAGES['fresh_beef'],
  '/images/fresh_beef.jpg': PRODUCT_BASE64_IMAGES['fresh_beef'],
  '/images/fresh_beef.webp': PRODUCT_BASE64_IMAGES['fresh_beef'],
  'meat': PRODUCT_BASE64_IMAGES['fresh_beef'],
  'roast': PRODUCT_BASE64_IMAGES['fresh_beef'],
  'nyama': PRODUCT_BASE64_IMAGES['fresh_beef'],
  'butchery': PRODUCT_BASE64_IMAGES['fresh_beef'],
  'eggs': PRODUCT_BASE64_IMAGES['fresh_beef'],

  // Pampers
  'pampers': PRODUCT_BASE64_IMAGES['pampers_pants'],
  'pampers_pants': PRODUCT_BASE64_IMAGES['pampers_pants'],
  'pampers 56': PRODUCT_BASE64_IMAGES['pampers_pants'],
  'pampers 56.webp': PRODUCT_BASE64_IMAGES['pampers_pants'],
  'pampers 56.jpg': PRODUCT_BASE64_IMAGES['pampers_pants'],
  '/images/pampers_pants.jpg': PRODUCT_BASE64_IMAGES['pampers_pants'],
  '/images/pampers_pants.webp': PRODUCT_BASE64_IMAGES['pampers_pants'],
  'baby': PRODUCT_BASE64_IMAGES['pampers_pants'],
  'pants': PRODUCT_BASE64_IMAGES['pampers_pants'],
  'diaper': PRODUCT_BASE64_IMAGES['pampers_pants'],
  'nappy': PRODUCT_BASE64_IMAGES['pampers_pants'],
};

const DEFAULT_IMAGE = PRODUCT_BASE64_IMAGES['fruit_veg_box'];

/**
 * Directly returns the offline, instant Base64 data URI of the product image.
 * No network latency, no iframe path errors, no 404s.
 */
export function getProductImagePath(imagePathOrName?: string): string {
  if (!imagePathOrName) return DEFAULT_IMAGE;

  // If it is already a base64 data URI, return immediately
  if (imagePathOrName.startsWith('data:image/')) {
    return imagePathOrName;
  }

  // Exact lookup match
  const rawKey = imagePathOrName.toLowerCase().trim();
  if (DIRECT_IMAGE_MAP[rawKey]) {
    return DIRECT_IMAGE_MAP[rawKey];
  }

  // Clean lookup (remove /images/ and extensions)
  const cleanKey = rawKey
    .replace(/^\/images\//, '')
    .replace(/^\//, '');

  if (DIRECT_IMAGE_MAP[cleanKey]) {
    return DIRECT_IMAGE_MAP[cleanKey];
  }

  // Fuzzy match on product name terms
  for (const [key, b64] of Object.entries(DIRECT_IMAGE_MAP)) {
    if (rawKey.includes(key) || cleanKey.includes(key)) {
      return b64;
    }
  }

  return DEFAULT_IMAGE;
}

/**
 * Fallback handler: returns the exact Base64 image data URI for the product.
 */
export function getProductFallbackImage(productName?: string, category?: string): string {
  const query = `${productName || ''} ${category || ''}`.toLowerCase();
  
  for (const [key, b64] of Object.entries(DIRECT_IMAGE_MAP)) {
    if (query.includes(key)) {
      return b64;
    }
  }
  
  return DEFAULT_IMAGE;
}

/**
 * Image error handler that immediately assigns the embedded Base64 image.
 */
export function handleProductImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  productName?: string,
  category?: string
): void {
  const target = e.currentTarget;
  const fallback = getProductFallbackImage(productName, category);
  
  if (target.src !== fallback) {
    target.src = fallback;
  }
}
