import { GoogleGenAI, Type } from '@google/genai';
import { SAMPLE_PRODUCTS, INITIAL_EXCHANGE_RATES } from '../src/data/products.js';
import { 
  Product, 
  ParsedRecipe, 
  RecipeIngredient, 
  AgentWalletState, 
  AgentWalletTxn, 
  SpecialDeal, 
  PantryDepletionItem 
} from '../src/types.js';

// Server-side Gemini initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// In-Memory Persistent Agent Wallet
let agentWallet: AgentWalletState = {
  balanceUSD: 45.00,
  balanceZWG: Number((45.00 * INITIAL_EXCHANGE_RATES.USD_ZWG).toFixed(2)),
  balanceZAR: Number((45.00 * INITIAL_EXCHANGE_RATES.USD_ZAR).toFixed(2)),
  spendLimitPerOrderUSD: 30.00,
  dailySpendCapUSD: 75.00,
  autoCheckoutEnabled: false,
  authorizedForSpecials: true,
  lastLoadedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  transactions: [
    {
      id: 'tx-init-1',
      type: 'TOPUP',
      amountUSD: 50.00,
      channel: 'ECOCASH',
      description: 'Loaded via EcoCash (+263 77 212 3456)',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      status: 'SETTLED'
    },
    {
      id: 'tx-init-2',
      type: 'BARGAIN_GRAB',
      amountUSD: 5.00,
      channel: 'FAMILY_TRANSFER',
      description: 'Auto-saved on White Star Maize Meal promo',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      status: 'SETTLED'
    }
  ]
};

export function getAgentWallet(): AgentWalletState {
  // Sync live FX equivalents
  agentWallet.balanceZWG = Number((agentWallet.balanceUSD * INITIAL_EXCHANGE_RATES.USD_ZWG).toFixed(2));
  agentWallet.balanceZAR = Number((agentWallet.balanceUSD * INITIAL_EXCHANGE_RATES.USD_ZAR).toFixed(2));
  return agentWallet;
}

export function topupAgentWallet(params: {
  amountUSD: number;
  channel: 'ECOCASH' | 'MUKURU' | 'CARD' | 'FAMILY_TRANSFER' | 'INNBUCKS';
  reference?: string;
  phone?: string;
}): AgentWalletState {
  const amount = Number(params.amountUSD);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Invalid top-up amount');
  }

  agentWallet.balanceUSD = Number((agentWallet.balanceUSD + amount).toFixed(2));
  agentWallet.lastLoadedAt = new Date().toISOString();

  const channelLabels: Record<string, string> = {
    ECOCASH: `EcoCash Deposit (${params.phone || '+263 77 212 3456'})`,
    MUKURU: `Mukuru Voucher (${params.reference || 'MKR-8921-ZW'})`,
    CARD: `Bank Card / Coinbase USDC (${params.reference || 'Card *4532'})`,
    FAMILY_TRANSFER: 'Transfer from Shared Family Balance',
    INNBUCKS: `InnBucks QR Claim (${params.reference || 'IB-5520'})`
  };

  const newTxn: AgentWalletTxn = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'TOPUP',
    amountUSD: amount,
    channel: params.channel,
    description: channelLabels[params.channel] || 'Agent Wallet Reload',
    timestamp: new Date().toISOString(),
    status: 'SETTLED'
  };

  agentWallet.transactions.unshift(newTxn);
  return getAgentWallet();
}

export function updateAgentSettings(settings: {
  spendLimitPerOrderUSD?: number;
  dailySpendCapUSD?: number;
  autoCheckoutEnabled?: boolean;
  authorizedForSpecials?: boolean;
}): AgentWalletState {
  if (typeof settings.spendLimitPerOrderUSD === 'number') {
    agentWallet.spendLimitPerOrderUSD = Math.max(5, settings.spendLimitPerOrderUSD);
  }
  if (typeof settings.dailySpendCapUSD === 'number') {
    agentWallet.dailySpendCapUSD = Math.max(10, settings.dailySpendCapUSD);
  }
  if (typeof settings.autoCheckoutEnabled === 'boolean') {
    agentWallet.autoCheckoutEnabled = settings.autoCheckoutEnabled;
  }
  if (typeof settings.authorizedForSpecials === 'boolean') {
    agentWallet.authorizedForSpecials = settings.authorizedForSpecials;
  }
  return getAgentWallet();
}

export function debitAgentWalletForOrder(params: {
  amountUSD: number;
  orderDescription: string;
  orderId?: string;
}): { success: boolean; newBalanceUSD: number; txn?: AgentWalletTxn; error?: string } {
  if (params.amountUSD > agentWallet.balanceUSD) {
    return {
      success: false,
      newBalanceUSD: agentWallet.balanceUSD,
      error: `Insufficient Agent Wallet balance ($${agentWallet.balanceUSD.toFixed(2)} available, $${params.amountUSD.toFixed(2)} required). Please top up via EcoCash or Mukuru.`
    };
  }

  agentWallet.balanceUSD = Number((agentWallet.balanceUSD - params.amountUSD).toFixed(2));

  const txn: AgentWalletTxn = {
    id: `tx-pay-${Date.now()}`,
    type: 'ORDER_PAYMENT',
    amountUSD: params.amountUSD,
    channel: 'CARD',
    description: params.orderDescription,
    orderId: params.orderId,
    timestamp: new Date().toISOString(),
    status: 'SETTLED'
  };

  agentWallet.transactions.unshift(txn);
  return {
    success: true,
    newBalanceUSD: agentWallet.balanceUSD,
    txn
  };
}

// ── Smart Product Matcher ───────────────────────────────────────────────────
export function matchProductForIngredient(ingredientName: string): Product | undefined {
  const norm = ingredientName.toLowerCase().trim();

  // Rice
  if (norm.includes('rice') || norm.includes('mupunga') || norm.includes('ilayisi') || norm.includes('tastic') || norm.includes('basmati')) {
    return SAMPLE_PRODUCTS.find(p => p.id === 'prod-1');
  }
  // Maize meal / Hupfu / Pap
  if (norm.includes('maize') || norm.includes('meal') || norm.includes('hupfu') || norm.includes('upfu') || norm.includes('impuphu') || norm.includes('pap') || norm.includes('sadza') || norm.includes('white star') || norm.includes('cornmeal')) {
    return SAMPLE_PRODUCTS.find(p => p.id === 'prod-2');
  }
  // Vegetables / Fresh Produce (onions, tomatoes, greens, cabbage, carrots, spinach)
  if (norm.includes('vegetable') || norm.includes('veg') || norm.includes('onion') || norm.includes('tomato') || norm.includes('cabbage') || norm.includes('carrot') || norm.includes('spinach') || norm.includes('muriwo') || norm.includes('potatoes') || norm.includes('salad') || norm.includes('greens') || norm.includes('chakalaka')) {
    return SAMPLE_PRODUCTS.find(p => p.id === 'prod-3');
  }
  // Cooking Oil
  if (norm.includes('oil') || norm.includes('mafuta') || norm.includes('amafutha') || norm.includes('sunfoil') || norm.includes('sunflower') || norm.includes('cooking oil')) {
    return SAMPLE_PRODUCTS.find(p => p.id === 'prod-4');
  }
  // Sugar
  if (norm.includes('sugar') || norm.includes('chigaku') || norm.includes('unshukela') || norm.includes('shugera') || norm.includes('huletts')) {
    return SAMPLE_PRODUCTS.find(p => p.id === 'prod-5');
  }
  // Drink / Juice
  if (norm.includes('mazoe') || norm.includes('juice') || norm.includes('drink') || norm.includes('orange') || norm.includes('cordial')) {
    return SAMPLE_PRODUCTS.find(p => p.id === 'prod-6');
  }
  // Tea
  if (norm.includes('tea') || norm.includes('tii') || norm.includes('chai') || norm.includes('tanganda')) {
    return SAMPLE_PRODUCTS.find(p => p.id === 'prod-7');
  }
  // Milk
  if (norm.includes('milk') || norm.includes('mukaka') || norm.includes('ubisi') || norm.includes('clover') || norm.includes('cream') || norm.includes('dairy')) {
    return SAMPLE_PRODUCTS.find(p => p.id === 'prod-9');
  }
  // Soap
  if (norm.includes('soap') || norm.includes('sipo') || norm.includes('sunlight') || norm.includes('isipho') || norm.includes('detergent')) {
    return SAMPLE_PRODUCTS.find(p => p.id === 'prod-10');
  }
  // Beef / Meat / Steak / Stewing Beef
  if (norm.includes('beef') || norm.includes('meat') || norm.includes('nyama') || norm.includes('inyama') || norm.includes('steak') || norm.includes('blade') || norm.includes('roast') || norm.includes('curry') || norm.includes('chicken') || norm.includes('pork') || norm.includes('mince')) {
    return SAMPLE_PRODUCTS.find(p => p.id === 'prod-11');
  }
  // Baby / Pampers
  if (norm.includes('diaper') || norm.includes('nappy') || norm.includes('pampers') || norm.includes('baby')) {
    return SAMPLE_PRODUCTS.find(p => p.id === 'prod-12');
  }

  return undefined;
}

// ── Built-in Intelligent African & Diaspora Culinary Recipes ───────────────
interface PresetRecipeDefinition {
  keywords: string[];
  dishTitle: string;
  cuisine: string;
  servings: number;
  prepTime: string;
  summary: string;
  ingredients: Array<{ rawName: string; quantityStr: string; productId: string; qty: number }>;
}

const PRESET_RECIPES: PresetRecipeDefinition[] = [
  {
    keywords: ['sadza', 'nyama', 'beef stew', 'muriwo', 'shona', 'zim stew'],
    dishTitle: 'Traditional Sadza neNyama yeMombe (Beef Stew & Greens)',
    cuisine: 'Zimbabwean Traditional',
    servings: 5,
    prepTime: '45 mins',
    summary: 'A beloved Zimbabwean family dinner with thick steaming Sadza, tender braised beef blade in rich onion-tomato gravy, and fresh farm leafy greens.',
    ingredients: [
      { rawName: 'White Star Super Maize Meal (5kg)', quantityStr: '1 bag (serves multiple meals)', productId: 'prod-2', qty: 1 },
      { rawName: 'Fresh Butchery Beef Blade Roast (2kg)', quantityStr: '2kg fresh cut', productId: 'prod-11', qty: 1 },
      { rawName: 'Fruit and Vegetable Box (10kg)', quantityStr: '1 box (onions, tomatoes, cabbage, covo greens)', productId: 'prod-3', qty: 1 },
      { rawName: 'Sunfoil Pure Sunflower Oil (5 Litres)', quantityStr: 'For sautéing & braising', productId: 'prod-4', qty: 1 }
    ]
  },
  {
    keywords: ['rice', 'chicken', 'tastic', 'curry', 'mupunga'],
    dishTitle: 'Diaspora Sunday Rice & Rich Savory Stew',
    cuisine: 'Southern African Family Banquet',
    servings: 6,
    prepTime: '40 mins',
    summary: 'Fragrant parboiled Tastic long-grain rice paired with savory meat gravy and sweet refreshing Mazoe cordial for celebration.',
    ingredients: [
      { rawName: 'Tastic Rice Parboiled Long Grain (5kg)', quantityStr: '5kg parboiled grain', productId: 'prod-1', qty: 1 },
      { rawName: 'Fresh Butchery Beef Blade Roast (2kg)', quantityStr: '2kg stewing cuts', productId: 'prod-11', qty: 1 },
      { rawName: 'Fruit and Vegetable Box (10kg)', quantityStr: 'Fresh carrots, peas, bell peppers & onions', productId: 'prod-3', qty: 1 },
      { rawName: 'Mazoe Orange Crush Syrup (2 Litres)', quantityStr: '2L drink for guests', productId: 'prod-6', qty: 1 }
    ]
  },
  {
    keywords: ['chakalaka', 'braai', 'pap', 'shisa nyama', 'bbq'],
    dishTitle: 'Authentic Township Braai & Spicy Chakalaka',
    cuisine: 'South African / SADC Braai',
    servings: 6,
    prepTime: '35 mins',
    summary: 'Sizzling flame-roasted beef cuts with hot spicy Chakalaka (baked beans, shredded carrots, peppers) and warm stiff pap.',
    ingredients: [
      { rawName: 'Fresh Butchery Beef Blade Roast (2kg)', quantityStr: '2kg prime cut for coals', productId: 'prod-11', qty: 1 },
      { rawName: 'White Star Super Maize Meal (5kg)', quantityStr: '5kg for stiff Braai Pap', productId: 'prod-2', qty: 1 },
      { rawName: 'Fruit and Vegetable Box (10kg)', quantityStr: 'Onions, tomatoes, green peppers, carrots', productId: 'prod-3', qty: 1 },
      { rawName: 'Sunfoil Pure Sunflower Oil (5 Litres)', quantityStr: 'For chakalaka sautéing', productId: 'prod-4', qty: 1 }
    ]
  },
  {
    keywords: ['porridge', 'bota', 'breakfast', 'tea', 'milk'],
    dishTitle: 'Gogo’s Nourishing Breakfast Bota (Corn Porridge & Sweet Tea)',
    cuisine: 'Comfort Breakfast',
    servings: 4,
    prepTime: '15 mins',
    summary: 'Smooth morning bota porridge with rich milk, sweet Huletts sugar, and a comforting cup of strong Tanganda black tea.',
    ingredients: [
      { rawName: 'White Star Super Maize Meal (5kg)', quantityStr: '1 bag for fine porridge', productId: 'prod-2', qty: 1 },
      { rawName: 'Clover Full Cream Milk UHT (6x1L Carton)', quantityStr: '6x1L pack', productId: 'prod-9', qty: 1 },
      { rawName: 'Huletts SunSweet White Sugar (5kg)', quantityStr: '5kg white sugar', productId: 'prod-5', qty: 1 },
      { rawName: 'Tanganda Black Tea Bags (100s)', quantityStr: '100 tea bags', productId: 'prod-7', qty: 1 }
    ]
  }
];

function sanitizeProduct(p?: Product): Product | undefined {
  if (!p) return undefined;
  const { image, ...rest } = p;
  return {
    ...rest,
    image: p.imageUrl || `/images/${p.slug || p.id}.jpg`
  } as Product;
}

// ── Multi-Modal Recipe Parser ───────────────────────────────────────────────
export async function parseRecipe(input: {
  text?: string;
  url?: string;
  imageData?: string; // base64 or data URL
  mimeType?: string;
}): Promise<ParsedRecipe> {
  const { text = '', url = '', imageData = '', mimeType = 'image/jpeg' } = input;
  const sourceType = imageData ? 'IMAGE' : url ? 'URL' : 'TEXT';

  // Try calling Gemini Flash if API key is configured
  if (process.env.GEMINI_API_KEY) {
    try {
      const catalogPrompt = SAMPLE_PRODUCTS.map(p => 
        `- ID: "${p.id}", Name: "${p.name}", Category: "${p.category}", PriceUSD: $${p.priceUSD}, Store: "${p.storeName}"`
      ).join('\n');

      const systemInstruction = `You are PnP's Personal AI Shopping Assistant Agent for Southern Africa (South Africa & Zimbabwe).
Your job is to read and analyze recipes uploaded by users as screenshots, images, food blog URLs, or text instructions.

Given the recipe, you must:
1. Identify the dish title, cuisine type, servings, and approximate preparation time.
2. Extract all key food ingredients and measurements needed to prepare the meal.
3. Map every single ingredient to the BEST MATCHING product from this available store catalog:
${catalogPrompt}
4. For ingredients already included in generic packs (e.g. onions, tomatoes, carrots, cabbage in the "Fruit and Vegetable Box"), map them to that product.
5. Provide realistic required quantities (usually 1 pack/bag per ingredient unless cooking for a massive event).
6. Return STRICT JSON with the schema provided.`;

      let contentsPayload: any;

      if (imageData) {
        // Clean base64 string
        const cleanBase64 = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
        contentsPayload = {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || 'image/jpeg'
              }
            },
            {
              text: `Analyze this recipe screenshot or photo. Extract dish name, cuisine, servings, and map ingredients to store products from the catalog. Additional user notes: "${text}".`
            }
          ]
        };
      } else if (url) {
        contentsPayload = `The user provided this recipe URL: "${url}". Notes: "${text}". Analyze the recipe, extract ingredients, and map to our store catalog products.`;
      } else {
        contentsPayload = `Analyze this recipe text: "${text}". Identify ingredients and map them to our store catalog products.`;
      }

      const geminiCall = ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: contentsPayload,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dishTitle: { type: Type.STRING },
              cuisine: { type: Type.STRING },
              servings: { type: Type.INTEGER },
              prepTime: { type: Type.STRING },
              instructionsSummary: { type: Type.STRING },
              ingredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    rawName: { type: Type.STRING },
                    quantityStr: { type: Type.STRING },
                    matchedProductId: { type: Type.STRING },
                    requiredQty: { type: Type.INTEGER }
                  }
                }
              }
            }
          }
        }
      });

      const timeoutCall = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout for recipe parse')), 3000)
      );

      const res = await Promise.race([geminiCall, timeoutCall]);
      const rawParsed = JSON.parse(res.text || '{}');

      if (rawParsed.dishTitle && Array.isArray(rawParsed.ingredients) && rawParsed.ingredients.length > 0) {
        // Build final hydrated ingredients
        const hydratedIngredients: RecipeIngredient[] = rawParsed.ingredients.map((ing: any) => {
          let product = SAMPLE_PRODUCTS.find(p => p.id === ing.matchedProductId);
          if (!product) {
            product = matchProductForIngredient(ing.rawName);
          }

          const requiredQty = ing.requiredQty && ing.requiredQty > 0 ? ing.requiredQty : 1;
          const price = product ? product.priceUSD * requiredQty : 0;

          return {
            rawName: ing.rawName || (product ? product.name : 'Unknown ingredient'),
            quantityStr: ing.quantityStr || `${requiredQty} unit`,
            matchedProductId: product?.id,
            matchedProduct: sanitizeProduct(product),
            requiredQty,
            estimatedPriceUSD: Number(price.toFixed(2)),
            inStock: product ? product.inStock : false,
            category: product?.category || 'Groceries'
          };
        });

        const totalUSD = hydratedIngredients.reduce((sum, i) => sum + i.estimatedPriceUSD, 0);

        return {
          dishTitle: rawParsed.dishTitle,
          cuisine: rawParsed.cuisine || 'African & Cross-Border',
          servings: rawParsed.servings || 4,
          prepTime: rawParsed.prepTime || '35 mins',
          sourceType,
          ingredients: hydratedIngredients,
          totalEstimatedUSD: Number(totalUSD.toFixed(2)),
          instructionsSummary: rawParsed.instructionsSummary || 'Prepare all fresh ingredients, simmer slowly, and serve warm with family.',
          confidence: 0.94
        };
      }
    } catch (err) {
      console.warn('[Gemini Recipe AI Fallback]:', err);
    }
  }

  // Resilient Culinary Rule Engine Fallback
  const searchStr = `${text} ${url}`.toLowerCase();
  let matchedPreset = PRESET_RECIPES[0]; // Default to Sadza neNyama

  for (const preset of PRESET_RECIPES) {
    if (preset.keywords.some(k => searchStr.includes(k))) {
      matchedPreset = preset;
      break;
    }
  }

  const hydratedIngredients: RecipeIngredient[] = matchedPreset.ingredients.map(ing => {
    const product = SAMPLE_PRODUCTS.find(p => p.id === ing.productId) || matchProductForIngredient(ing.rawName);
    const requiredQty = ing.qty || 1;
    const price = product ? product.priceUSD * requiredQty : 0;

    return {
      rawName: ing.rawName,
      quantityStr: ing.quantityStr,
      matchedProductId: product?.id,
      matchedProduct: sanitizeProduct(product),
      requiredQty,
      estimatedPriceUSD: Number(price.toFixed(2)),
      inStock: product ? product.inStock : true,
      category: product?.category
    };
  });

  const totalUSD = hydratedIngredients.reduce((sum, i) => sum + i.estimatedPriceUSD, 0);

  return {
    dishTitle: matchedPreset.dishTitle,
    cuisine: matchedPreset.cuisine,
    servings: matchedPreset.servings,
    prepTime: matchedPreset.prepTime,
    sourceType,
    ingredients: hydratedIngredients,
    totalEstimatedUSD: Number(totalUSD.toFixed(2)),
    instructionsSummary: matchedPreset.summary,
    confidence: 0.92
  };
}

// ── Specials Radar & Bargain Hunter ─────────────────────────────────────────
export function getActiveSpecials(): SpecialDeal[] {
  return [
    {
      id: 'deal-1',
      productId: 'prod-4', // Sunfoil Pure Sunflower Oil 5L
      product: sanitizeProduct(SAMPLE_PRODUCTS[3])!,
      originalPriceUSD: 9.80,
      salePriceUSD: 8.20,
      discountPercentage: 16,
      dealTag: '🔥 16% OFF Weekend Promo',
      reason: 'PnP Wholesale bulk shipment arrived in Joburg depot. High household turnover item.',
      expiresInHours: 36,
      autoBuyEligible: true
    },
    {
      id: 'deal-2',
      productId: 'prod-1', // Tastic Rice 5kg
      product: sanitizeProduct(SAMPLE_PRODUCTS[0])!,
      originalPriceUSD: 7.90,
      salePriceUSD: 6.80,
      discountPercentage: 14,
      dealTag: '🌾 14% OFF Staple Special',
      reason: 'Harvest season promotion across Harare & Bulawayo branches.',
      expiresInHours: 48,
      autoBuyEligible: true
    },
    {
      id: 'deal-3',
      productId: 'prod-9', // Clover Full Cream Milk 6x1L
      product: sanitizeProduct(SAMPLE_PRODUCTS[8])!,
      originalPriceUSD: 10.50,
      salePriceUSD: 8.90,
      discountPercentage: 15,
      dealTag: '🥛 15% OFF Dairy Bundle',
      reason: 'Bulawayo click-and-collect stock incentive. UHT long-life keeps fresh during outages.',
      expiresInHours: 24,
      autoBuyEligible: true
    },
    {
      id: 'deal-4',
      productId: 'prod-2', // White Star Maize Meal 5kg
      product: sanitizeProduct(SAMPLE_PRODUCTS[1])!,
      originalPriceUSD: 5.20,
      salePriceUSD: 4.50,
      discountPercentage: 13,
      dealTag: '⭐ 13% OFF White Star',
      reason: 'Top family essential. Guaranteed same-day fulfillment to Zimbabwe.',
      expiresInHours: 72,
      autoBuyEligible: true
    }
  ];
}

// ── Pantry Depletion Estimator ("Run-Out Predictor") ────────────────────────
export function getPantryDepletionEstimates(): PantryDepletionItem[] {
  // Modeled on Moyo family (4 people) usage behavior & average consumption velocities
  return [
    {
      id: 'dep-1',
      productId: 'prod-2', // White Star Maize Meal (5kg)
      productName: 'White Star Super Maize Meal (5kg)',
      unit: '5kg bag',
      currentStockPercent: 12,
      daysRemaining: 2,
      averageDaysPerUnit: 14, // 5kg mealies lasts ~14 days for family of 4
      lastPurchasedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
      status: 'CRITICAL',
      recommendedRestockQty: 1,
      priceUSD: 4.50
    },
    {
      id: 'dep-2',
      productId: 'prod-9', // Clover Milk 6x1L
      productName: 'Clover Full Cream Milk UHT (6x1L Carton)',
      unit: '6x1L carton',
      currentStockPercent: 20,
      daysRemaining: 3,
      averageDaysPerUnit: 10, // 6L milk lasts ~10 days
      lastPurchasedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      status: 'RUNNING_LOW',
      recommendedRestockQty: 1,
      priceUSD: 8.90
    },
    {
      id: 'dep-3',
      productId: 'prod-4', // Sunfoil Cooking Oil 5L
      productName: 'Sunfoil Pure Sunflower Oil (5 Litres)',
      unit: '5L bottle',
      currentStockPercent: 35,
      daysRemaining: 6,
      averageDaysPerUnit: 21, // 5L cooking oil lasts ~21 days
      lastPurchasedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
      status: 'RUNNING_LOW',
      recommendedRestockQty: 1,
      priceUSD: 8.20
    },
    {
      id: 'dep-4',
      productId: 'prod-1', // Tastic Rice 5kg
      productName: 'Tastic Rice Parboiled Long Grain (5kg)',
      unit: '5kg bag',
      currentStockPercent: 45,
      daysRemaining: 9,
      averageDaysPerUnit: 20,
      lastPurchasedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(),
      status: 'OPTIMAL',
      recommendedRestockQty: 1,
      priceUSD: 6.80
    },
    {
      id: 'dep-5',
      productId: 'prod-5', // Huletts White Sugar 5kg
      productName: 'Huletts SunSweet White Sugar (5kg)',
      unit: '5kg bag',
      currentStockPercent: 65,
      daysRemaining: 15,
      averageDaysPerUnit: 25,
      lastPurchasedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      status: 'OPTIMAL',
      recommendedRestockQty: 1,
      priceUSD: 5.90
    }
  ];
}
