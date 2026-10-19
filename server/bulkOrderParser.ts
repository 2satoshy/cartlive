import { SAMPLE_PRODUCTS } from '../src/data/products.js';

export interface BulkLineItem {
  rawText: string;
  quantity: number;
  unit?: string;
  itemText: string;
  matchedProductId?: string;
  matchedProductName?: string;
}

const UNIT_WORDS = ['loaves', 'loaf', 'cases', 'case', 'boxes', 'box', 'bags', 'bag', 'crates', 'crate', 'kg', 'litres', 'liters', 'units', 'packs', 'pack', 'pallets', 'pallet'];
const UNIT_PATTERN = UNIT_WORDS.join('|');

// Matches "800 loaves of bread", "10 cases of milk", "5kg sugar", "3 boxes sunfoil oil"
const LINE_RE = new RegExp(`^\\s*(\\d+)\\s*(${UNIT_PATTERN})?\\s*(?:of\\s+)?(.+?)\\s*$`, 'i');

function fuzzyMatchProduct(itemText: string): { id: string; name: string } | null {
  const needle = itemText.toLowerCase();
  let best: { id: string; name: string; score: number } | null = null;
  for (const p of SAMPLE_PRODUCTS) {
    const haystacks = [p.name, p.nativeName ?? '', p.brand, p.category].join(' ').toLowerCase();
    const words = needle.split(/\s+/).filter((w) => w.length > 2);
    const score = words.filter((w) => haystacks.includes(w)).length;
    if (score > 0 && (!best || score > best.score)) {
      best = { id: p.id, name: p.name, score };
    }
  }
  return best ? { id: best.id, name: best.name } : null;
}

/**
 * Regex-first bulk text parser. This is the default path — no LLM call, no
 * external spend. Handles the institutional bulk-order shape explicitly
 * requested ("800 loaves of bread, 10 cases of milk"), split on commas,
 * semicolons, or newlines.
 */
export function parseBulkOrderText(text: string): BulkLineItem[] {
  const segments = text.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
  const items: BulkLineItem[] = [];

  for (const segment of segments) {
    const match = segment.match(LINE_RE);
    if (!match) continue;
    const [, qtyStr, unit, itemText] = match;
    const quantity = parseInt(qtyStr, 10);
    if (!quantity || quantity <= 0) continue;

    const matched = fuzzyMatchProduct(itemText);
    items.push({
      rawText: segment,
      quantity,
      unit: unit?.toLowerCase(),
      itemText: itemText.trim(),
      matchedProductId: matched?.id,
      matchedProductName: matched?.name,
    });
  }

  return items;
}

/**
 * Optional LLM-assisted pass for free-form phrasing the regex can't parse
 * (e.g. "I need ingredients for a cake for 20 kids"). Only runs if
 * GEMINI_API_KEY is set AND the caller explicitly opts in — never a silent
 * fallback, so a missing key degrades to "ask the user to rephrase" instead
 * of an unexpected API charge.
 */
export async function parseBulkOrderTextWithAI(text: string): Promise<BulkLineItem[] | null> {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const catalogueNames = SAMPLE_PRODUCTS.map((p) => `${p.id}: ${p.name}`).join('\n');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Parse this bulk grocery order request into line items. Match each item to a SKU from this catalogue where possible.\n\nCatalogue:\n${catalogueNames}\n\nRequest: "${text}"\n\nReturn JSON array: [{quantity, unit, itemText, matchedProductId}]`,
      config: { responseMimeType: 'application/json' },
    });
    const parsed = JSON.parse(response.text ?? '[]');
    if (!Array.isArray(parsed)) return null;
    return parsed.map((row: Record<string, unknown>) => ({
      rawText: text,
      quantity: Number(row.quantity) || 1,
      unit: typeof row.unit === 'string' ? row.unit : undefined,
      itemText: String(row.itemText ?? ''),
      matchedProductId: typeof row.matchedProductId === 'string' ? row.matchedProductId : undefined,
      matchedProductName: SAMPLE_PRODUCTS.find((p) => p.id === row.matchedProductId)?.name,
    }));
  } catch (err) {
    console.warn('[bulkOrderParser] Gemini-assisted parse failed, falling back to regex-only:', err);
    return null;
  }
}
