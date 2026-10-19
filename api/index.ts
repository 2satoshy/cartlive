import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SAMPLE_PRODUCTS, INITIAL_MEMBERS, INITIAL_EXCHANGE_RATES } from '../src/data/products.js';
import { connectDB, User, ActivityLog, OrderModel, CDPWallet } from '../server/models.js';
import { signAuthToken, verifyAuthToken, extractBearerToken } from '../server/authToken.js';
import { verifyInitData } from '../server/telegramAuth.js';
import { createCoinbaseCheckout, verifyWebhookSignature, refundCoinbaseCheckout } from '../server/coinbaseCheckout.js';
import { getWalletBalances, getVoucherBalances, walletCheckout, debitWallet, creditVoucherFromRemittance, getRemittanceLog } from '../server/walletLedger.js';
import { requestToPay, payout, payForOrder, settleTransaction, verifyEcoCashWebhookSignature } from '../server/ecocash.js';
import { checkStock, findSubstitute, verifyAvailableAtCheckout } from '../server/erpStock.js';
import { parseBulkOrderText, parseBulkOrderTextWithAI } from '../server/bulkOrderParser.js';
import { listZones, routeFulfillment } from '../server/deliveryZones.js';
import { allocateFromBatch } from '../server/vendorAllocation.js';
import { findB2BAccount } from '../server/b2bAccounts.js';
import { createOrder, getOrder, advanceOrder, getStoreQueue, getHubQueue } from '../server/pnpOrders.js';
import { getBundles } from '../server/bundles.js';
import { notifyPicknPayStatus } from '../server/picknpayNotify.js';
import { getAvailableWindows } from '../server/deliveryWindows.js';
import { 
  getAgentWallet, 
  topupAgentWallet, 
  updateAgentSettings, 
  debitAgentWalletForOrder, 
  parseRecipe, 
  getActiveSpecials, 
  getPantryDepletionEstimates 
} from '../server/agentShopping.js';
import type { FulfillmentRoute } from '../src/types.js';
import type { RemittanceSource, VoucherCurrency, B2BAccountType } from '../src/types.js';

// Shared In-Memory Demo Cart for Vercel Serverless Session
const DEMO_CART = [
  {
    id: 'cart-demo-1',
    productId: 'prod-1',
    product: SAMPLE_PRODUCTS[0],
    quantity: 2,
    addedByMemberId: 'mem-2',
    addedByMemberName: 'Gogo Moyo',
    addedByLocation: 'Harare, ZIM',
    channel: 'whatsapp',
    addedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    note: 'Added via WhatsApp Voice Note',
  },
  {
    id: 'cart-demo-2',
    productId: 'prod-3',
    product: SAMPLE_PRODUCTS[2],
    quantity: 1,
    addedByMemberId: 'mem-1',
    addedByMemberName: 'Tinashe Moyo',
    addedByLocation: 'Johannesburg, SA',
    channel: 'web',
    addedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 'cart-demo-3',
    productId: 'prod-8',
    product: SAMPLE_PRODUCTS[7],
    quantity: 1,
    addedByMemberId: 'mem-1',
    addedByMemberName: 'Tinashe Moyo',
    addedByLocation: 'Johannesburg, SA',
    channel: 'web',
    addedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    note: 'For Gogo power outages',
  },
];

// Server-to-server guard for endpoints that move wallet/voucher balances.
// Mirrors signal-desk-v4's CivicRewards magic-link shared-secret pattern —
// this demo's API is on a public URL, so money-mutating routes shouldn't be
// callable by anyone who finds it, even in demo mode.
function requireSharedSecret(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.MOJA_PNP_SHARED_SECRET;
  if (!expected) {
    res.status(503).json({ error: 'MOJA_PNP_SHARED_SECRET not configured on server' });
    return false;
  }
  const provided = req.headers['x-moja-shared-secret'];
  if (provided !== expected) {
    res.status(401).json({ error: 'unauthorized' });
    return false;
  }
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Extract path from URL (e.g., /api/health -> /health)
    const rawUrl = req.url || '';
    const cleanUrl = rawUrl.split('?')[0];
    const pathname = cleanUrl.startsWith('/api') ? cleanUrl.replace(/^\/api/, '') : cleanUrl;

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Safely parse JSON body if string
    let body = req.body;
    if (typeof body === 'string' && body.length > 0) {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    } else if (!body) {
      body = {};
    }

  // --- 1. HEALTH ---
  if (pathname === '/health' || pathname === '') {
    return res.status(200).json({
      status: 'ok',
      service: 'PnP Express Cross-Border Engine',
      platform: 'Vercel Serverless (Unified Router)',
      timestamp: new Date().toISOString(),
    });
  }

  // --- 2. PRODUCTS ---
  if (pathname === '/products') {
    return res.status(200).json({
      products: SAMPLE_PRODUCTS,
      exchangeRates: INITIAL_EXCHANGE_RATES,
    });
  }

  // Matches server.ts's existing shape exactly (that route pre-dates this
  // change; api/index.ts — the Vercel serverless entry — was simply missing
  // it, a gap unrelated to this feature but worth closing while touching
  // this file, rather than inventing a second shape for the same path).
  if (pathname === '/products/categories') {
    const categoryCounts: Record<string, number> = {};
    SAMPLE_PRODUCTS.forEach((p) => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });
    const nativeLabels: Record<string, string> = {
      'Maize & Staples': 'Hupfu, Mupunga & Shuga',
      'Cooking & Oils': 'Mafuta eKubikisa',
      'Meats & Proteins': 'Nyama yeMombe neHuku',
      'Dairy & Fresh': 'Mukaka neMiriwo',
      'Beverages & Tea': 'Mazoe, Tii neZvinwiwa',
      'Solar & Power': 'Mwenje weZuva & Amagetsi',
      'Household & Soap': 'Sipo neZvokuchenesa',
      'Baby & Care': 'ZveVana neVacheche',
    };
    const categoryList = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      nativeLabel: nativeLabels[name] ?? name,
      count,
    }));
    return res.status(200).json(categoryList);
  }

  // --- 3. MEMBERS ---
  if (pathname === '/members') {
    return res.status(200).json({ members: INITIAL_MEMBERS });
  }

  // --- 4. EXCHANGE RATES ---
  if (pathname === '/exchange-rates') {
    return res.status(200).json(INITIAL_EXCHANGE_RATES);
  }

  // --- 5. CART ROUTES ---
  if (pathname === '/cart' && req.method === 'GET') {
    return res.status(200).json({ cart: DEMO_CART, members: INITIAL_MEMBERS });
  }

  if (pathname === '/cart/add' && req.method === 'POST') {
    const { productId, quantity = 1, memberName, memberId, memberLocation, channel, note } = req.body || {};
    const product = SAMPLE_PRODUCTS.find((p) => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const newItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      product,
      quantity: Number(quantity),
      addedByMemberId: memberId || 'mem-1',
      addedByMemberName: memberName || 'Tinashe Moyo',
      addedByLocation: memberLocation || 'Johannesburg, SA',
      channel: channel || 'web',
      addedAt: new Date().toISOString(),
      note,
    };
    return res.status(200).json({ success: true, cart: [newItem, ...DEMO_CART] });
  }

  if (pathname === '/cart/update' && req.method === 'POST') {
    const { itemId, quantity } = req.body || {};
    if (Number(quantity) <= 0) {
      const filtered = DEMO_CART.filter((item) => item.id !== itemId);
      return res.status(200).json({ success: true, cart: filtered });
    }
    const updated = DEMO_CART.map((item) =>
      item.id === itemId ? { ...item, quantity: Number(quantity) } : item
    );
    return res.status(200).json({ success: true, cart: updated });
  }

  if (pathname === '/cart/clear' && req.method === 'POST') {
    return res.status(200).json({ success: true, cart: [] });
  }

  if (pathname === '/cart/split-calculator' && req.method === 'POST') {
    const { splitMethod = 'EQUAL', customRatios = {} } = req.body || {};
    const totalUSD = DEMO_CART.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);

    const memberTotals: { [memberId: string]: { subtotalUSD: number; count: number } } = {};
    INITIAL_MEMBERS.forEach((m) => {
      memberTotals[m.id] = { subtotalUSD: 0, count: 0 };
    });

    DEMO_CART.forEach((item) => {
      if (!memberTotals[item.addedByMemberId]) {
        memberTotals[item.addedByMemberId] = { subtotalUSD: 0, count: 0 };
      }
      memberTotals[item.addedByMemberId].subtotalUSD += item.product.priceUSD * item.quantity;
      memberTotals[item.addedByMemberId].count += item.quantity;
    });

    const memberShares = INITIAL_MEMBERS.map((m) => {
      let shareUSD = 0;
      const subtotalUSD = memberTotals[m.id]?.subtotalUSD || 0;

      if (splitMethod === 'EQUAL') {
        shareUSD = totalUSD / (INITIAL_MEMBERS.length || 1);
      } else if (splitMethod === 'BY_SUBMITTER') {
        shareUSD = subtotalUSD;
      } else if (splitMethod === 'CUSTOM') {
        const ratio = customRatios[m.id] || 1 / INITIAL_MEMBERS.length;
        shareUSD = totalUSD * ratio;
      }

      const percentage = totalUSD > 0 ? Math.round((shareUSD / totalUSD) * 100) : 0;

      return {
        memberId: m.id,
        memberName: m.name,
        location: m.location,
        role: m.role,
        subtotalUSD: Number(subtotalUSD.toFixed(2)),
        shareUSD: Number(shareUSD.toFixed(2)),
        shareZAR: Number((shareUSD * INITIAL_EXCHANGE_RATES.USD_ZAR).toFixed(2)),
        shareZWG: Number((shareUSD * INITIAL_EXCHANGE_RATES.USD_ZWG).toFixed(2)),
        percentage,
      };
    });

    return res.status(200).json({
      success: true,
      totalUSD: Number(totalUSD.toFixed(2)),
      totalZAR: Number((totalUSD * INITIAL_EXCHANGE_RATES.USD_ZAR).toFixed(2)),
      totalZWG: Number((totalUSD * INITIAL_EXCHANGE_RATES.USD_ZWG).toFixed(2)),
      splitMethod,
      shares: memberShares,
    });
  }

  // --- 6. VOICE AI ---
  if (pathname === '/voice-ai' && req.method === 'POST') {
    const textPrompt = req.body?.textPrompt || 'Hupfu nemafuta';
    const promptLower = textPrompt.toLowerCase();

    let lang = 'Shona';
    let nativeReply = 'Ndaisa hupfu nemafuta mungoro yeMoyo Family.';
    let matchedProduct = SAMPLE_PRODUCTS[1];

    if (promptLower.includes('rice') || promptLower.includes('mupunga') || promptLower.includes('tastic')) {
      matchedProduct = SAMPLE_PRODUCTS[0];
      nativeReply = 'Ndaisa mupunga weTastic mungoro yeMoyo Family.';
    } else if (promptLower.includes('sugar') || promptLower.includes('chigaku')) {
      matchedProduct = SAMPLE_PRODUCTS[4];
      nativeReply = 'Ndaisa chigaku mungoro yeMoyo Family.';
    } else if (promptLower.includes('mazoe')) {
      matchedProduct = SAMPLE_PRODUCTS[5];
      nativeReply = 'Ndaisa Mazoe Orange mungoro yeMoyo Family.';
    }

    if (promptLower.includes('ndebele') || promptLower.includes('upfu')) {
      lang = 'Ndebele';
      nativeReply = 'Ngizofaka impuphu lobisi enqoleni yomdeni.';
    }

    return res.status(200).json({
      success: true,
      result: {
        action: 'ADD',
        items: [{ productName: matchedProduct.name, qty: 1 }],
        spokenResponse: nativeReply,
        detectedLanguage: lang,
        confidence: 0.95,
        originalText: textPrompt,
      },
      cart: [
        {
          id: `cart-ai-${Date.now()}`,
          productId: matchedProduct.id,
          product: matchedProduct,
          quantity: 1,
          addedByMemberId: 'mem-2',
          addedByMemberName: 'Gogo Moyo',
          addedByLocation: 'Harare, ZIM',
          channel: 'whatsapp',
          addedAt: new Date().toISOString(),
          note: `Added via ${lang} Voice AI Assistant (Demo Mode)`,
        },
        ...DEMO_CART,
      ],
    });
  }

  // --- 6B. PERSONAL AI SHOPPING ASSISTANT AGENT ---
  if (pathname === '/agent/wallet' && req.method === 'GET') {
    return res.status(200).json({ success: true, wallet: getAgentWallet() });
  }

  if (pathname === '/agent/wallet/topup' && req.method === 'POST') {
    const { amountUSD, channel, reference, phone } = req.body || {};
    if (!amountUSD || Number(amountUSD) <= 0) return res.status(400).json({ error: 'Valid amountUSD is required' });
    const updated = topupAgentWallet({ amountUSD: Number(amountUSD), channel: channel || 'ECOCASH', reference, phone });
    return res.status(200).json({ success: true, wallet: updated });
  }

  if (pathname === '/agent/wallet/settings' && req.method === 'POST') {
    const { spendLimitPerOrderUSD, dailySpendCapUSD, autoCheckoutEnabled, authorizedForSpecials } = req.body || {};
    const updated = updateAgentSettings({ spendLimitPerOrderUSD, dailySpendCapUSD, autoCheckoutEnabled, authorizedForSpecials });
    return res.status(200).json({ success: true, wallet: updated });
  }

  if (pathname === '/agent/wallet/pay-order' && req.method === 'POST') {
    const { amountUSD } = req.body || {};
    const totalToPay = Number(amountUSD) || DEMO_CART.reduce((sum, i) => sum + i.product.priceUSD * i.quantity, 0);
    const debitRes = debitAgentWalletForOrder({
      amountUSD: totalToPay,
      orderDescription: `Autonomous Agent Checkout (${DEMO_CART.length} grocery items)`
    });
    if (!debitRes.success) return res.status(400).json({ success: false, error: debitRes.error });
    return res.status(200).json({
      success: true,
      orderId: `ORD-AI-${Date.now()}`,
      wallet: getAgentWallet(),
      message: `Order authorized and settled with Agent Wallet!`
    });
  }

  if (pathname === '/agent/recipe-parse' && req.method === 'POST') {
    const parsed = await parseRecipe({
      text: req.body?.text,
      url: req.body?.url,
      imageData: req.body?.imageData,
      mimeType: req.body?.mimeType
    });
    return res.status(200).json({ success: true, recipe: parsed });
  }

  if (pathname === '/agent/add-recipe-to-cart' && req.method === 'POST') {
    const { recipe, autoCheckout = false } = req.body || {};
    if (!recipe || !Array.isArray(recipe.ingredients)) return res.status(400).json({ error: 'Valid parsed recipe required' });
    let totalAddedUSD = 0;
    for (const ing of recipe.ingredients) {
      if (ing.matchedProduct) totalAddedUSD += ing.matchedProduct.priceUSD * (ing.requiredQty || 1);
    }
    const wallet = getAgentWallet();
    let autoCheckedOut = false;
    if (autoCheckout || (wallet.autoCheckoutEnabled && totalAddedUSD <= wallet.spendLimitPerOrderUSD && totalAddedUSD <= wallet.balanceUSD)) {
      const debit = debitAgentWalletForOrder({
        amountUSD: totalAddedUSD,
        orderDescription: `Auto-checkout for: ${recipe.dishTitle}`
      });
      if (debit.success) autoCheckedOut = true;
    }
    return res.status(200).json({
      success: true,
      recipeTitle: recipe.dishTitle,
      totalAddedUSD,
      autoCheckedOut,
      wallet: getAgentWallet(),
      message: autoCheckedOut 
        ? `Autonomously paid $${totalAddedUSD.toFixed(2)} USD from Agent Wallet for ${recipe.dishTitle}!` 
        : `Added recipe ingredients for "${recipe.dishTitle}" to cart.`
    });
  }

  if (pathname === '/agent/specials' && req.method === 'GET') {
    return res.status(200).json({ success: true, specials: getActiveSpecials() });
  }

  if (pathname === '/agent/grab-bargain' && req.method === 'POST') {
    const { specialId, authorizePayment = false } = req.body || {};
    const specials = getActiveSpecials();
    const deal = specials.find(s => s.id === specialId) || specials[0];
    let paymentSettled = false;
    const wallet = getAgentWallet();
    if (authorizePayment || (wallet.autoCheckoutEnabled && deal.salePriceUSD <= wallet.spendLimitPerOrderUSD && deal.salePriceUSD <= wallet.balanceUSD)) {
      const debit = debitAgentWalletForOrder({
        amountUSD: deal.salePriceUSD,
        orderDescription: `Bargain grab: ${deal.product.name}`
      });
      if (debit.success) paymentSettled = true;
    }
    return res.status(200).json({
      success: true,
      deal,
      paymentSettled,
      wallet: getAgentWallet(),
      message: paymentSettled 
        ? `Grabbed ${deal.product.name} and auto-settled $${deal.salePriceUSD} USD via Agent Wallet!` 
        : `Grabbed ${deal.product.name} and added to cart.`
    });
  }

  if (pathname === '/agent/pantry-depletion' && req.method === 'GET') {
    return res.status(200).json({ success: true, items: getPantryDepletionEstimates() });
  }

  if (pathname === '/agent/restock-staple' && req.method === 'POST') {
    const { productId, quantity = 1 } = req.body || {};
    const product = SAMPLE_PRODUCTS.find(p => p.id === productId) || SAMPLE_PRODUCTS[1];
    return res.status(200).json({
      success: true,
      product,
      message: `Restocked ${quantity}x ${product.name} into Family Cart.`
    });
  }

  // --- 7. WHATSAPP ---
  if (pathname === '/whatsapp/webhook' && req.method === 'POST') {
    const fromPhone = req.body?.From || req.body?.fromPhone || '+263772123456';
    const senderName = req.body?.senderName || 'Gogo Moyo';
    const bodyText = req.body?.Body || req.body?.text || 'Ndinoda hupfu hweSona ne mafuta';

    const totalUSD = DEMO_CART.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
    const totalZWG = (totalUSD * INITIAL_EXCHANGE_RATES.USD_ZWG).toFixed(2);

    const replyText = `🛒 *GreenCart Family Cart Updated!*\n\n*Current Shared Items:*\n• 2x ${SAMPLE_PRODUCTS[0].name}\n\n*Total:* $${totalUSD.toFixed(2)} USD (ZWG ${totalZWG})\n*Delivery:* Harare Express & Bulawayo Depot\n\nReply *1* to Checkout via EcoCash / Mukuru.\nReply *LIST* to view options.`;

    const waMsg = {
      id: `wa-${Date.now()}`,
      fromPhone,
      senderName,
      text: bodyText,
      isVoiceNote: req.body?.isVoiceNote || false,
      timestamp: new Date().toISOString(),
      status: 'processed',
      parsedIntent: {
        action: 'ADD',
        items: [{ productName: SAMPLE_PRODUCTS[1].name, qty: 1 }],
        spokenResponse: 'Ndaisa hupfu nemafuta mungoro yeMoyo Family.',
        detectedLanguage: 'Shona',
      },
      replyText,
    };

    return res.status(200).json({
      success: true,
      waMessage: waMsg,
      cart: DEMO_CART,
      replyText,
    });
  }

  if (pathname === '/whatsapp/logs') {
    return res.status(200).json({
      logs: [
        {
          id: 'wa-msg-demo-1',
          fromPhone: '+263772123456',
          senderName: 'Gogo Moyo',
          text: 'Ndinoda mupunga weTastic ne mafuta',
          isVoiceNote: true,
          timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          status: 'processed',
          replyText: '🛒 GreenCart Zim Summary:\nAdded: 2x Tastic Rice 5kg, 1x Cooking Oil 2L.',
        },
      ],
    });
  }

  // --- 8. SMART BASKET ---
  if (pathname === '/smart-basket/recommendations' && req.method === 'POST') {
    const recommended = SAMPLE_PRODUCTS.filter((p) => p.featured).slice(0, 5);
    const totalEstimatedUSD = recommended.reduce((sum, p) => sum + p.priceUSD, 0);

    return res.status(200).json({
      success: true,
      recommendedProducts: recommended,
      totalEstimatedUSD: Number(totalEstimatedUSD.toFixed(2)),
      aiNote: 'Kudya kwemhuri kwasarudzwa zvinotsvukisa nenzira yehutsanana (Balanced family staples selected - Demo Mode).',
    });
  }

  // --- 9. DUAL-PATH COINBASE CHECKOUT & WEBHOOKS ---
  if ((pathname === '/checkout' || pathname === '/checkout/create' || pathname === '/checkout/orchestrate') && req.method === 'POST') {
    const { amount, currency = 'USD', orderId, customerEmail, country, card } = req.body || {};
    const totalAmount = amount ? parseFloat(amount) : DEMO_CART.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
    const targetOrderId = orderId || `PNP-ZW-${Math.floor(100000 + Math.random() * 900000)}`;
    const targetCountry = country || (card?.billingCountry) || 'GB';

    const checkoutResult = await createCoinbaseCheckout({
      amount: totalAmount,
      currency,
      orderId: targetOrderId,
      customerEmail: customerEmail || 'shopper@pnpexpress.co.zw',
      country: targetCountry,
      card
    });

    const voucherCode = `VOUCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const invoiceNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    return res.status(200).json({
      ...checkoutResult,
      orderId: targetOrderId,
      invoiceNumber,
      voucherCode,
      totalUSD: Number(totalAmount.toFixed(2)),
      finalRail: 'COINBASE_USDC',
      settlementAccount: 'Merchant Wallet Base (USDC)',
      attempts: [
        { rail: 'COINBASE_USDC', latencyMs: 120, status: 'SUCCESS' }
      ]
    });
  }

  if ((pathname === '/webhooks/coinbase' || pathname === '/webhooks/onramp' || pathname === '/api/webhooks/onramp') && req.method === 'POST') {
    const rawPayload = JSON.stringify(req.body || {});
    const signatureHeader = (req.headers['x-hook0-signature'] as string) || (req.headers['x-cc-webhook-signature'] as string) || (req.headers['x-cb-signature'] as string);
    const secret = process.env.COINBASE_WEBHOOK_SECRET || '';

    const isValid = verifyWebhookSignature(rawPayload, signatureHeader, secret, req.headers as any);
    const event = req.body || {};
    const eventType = event.eventType || event.type || event.event?.type;
    const status = event.status || event.data?.status;
    const metadata = event.data?.metadata || event.event?.data?.metadata || {};
    const orderId = event.partnerUserRef || metadata.orderId || event.data?.id;

    if (
      (eventType === 'onramp.transaction.success' && status === 'ONRAMP_TRANSACTION_STATUS_SUCCESS') ||
      eventType === 'checkout.payment.success' ||
      eventType === 'charge:confirmed'
    ) {
      if (orderId) {
        await OrderModel.updateOne({ orderId }, { $set: { status: 'PROCESSING', statusLabel: 'Paid via Coinbase USDC' } }).catch(() => {});
      }
    }

    return res.status(200).send('OK');
  }

  if ((pathname === '/checkout/refund' || pathname.includes('/refund')) && req.method === 'POST') {
    const checkoutId = req.body?.checkoutId || req.body?.orderId || 'chk_demo';
    const reason = req.body?.reason || 'Order cancelled';
    const result = await refundCoinbaseCheckout(checkoutId, reason);
    return res.status(200).json(result);
  }

  // --- 10. AI RECIPE SUGGEST ---
  if (pathname === '/ai/recipe-suggest' && req.method === 'POST') {
    return res.status(200).json({
      success: true,
      recipeName: 'Traditional Sadza & Beef Stew',
      description: 'Authentic Zimbabwean staple featuring cooked white maize meal, braised beef blade, and fresh leafy vegetables.',
      matchedProducts: [SAMPLE_PRODUCTS[1], SAMPLE_PRODUCTS[10], SAMPLE_PRODUCTS[2]],
      missingIngredients: ['Onions', 'Tomatoes'],
    });
  }

  // --- 11. AUTH ENDPOINTS ---
  // Connect to MongoDB Atlas
  try {
    await connectDB();
  } catch (dbErr) {
    console.error('[Vercel Serverless DB Connect Error]:', dbErr);
  }

  // --- 11. AUTH & SESSIONS ENDPOINTS (MongoDB Atlas) ---
  if (pathname === '/auth/signup' && req.method === 'POST') {
    try {
      const { email, name, password } = req.body || {};
      if (!email || !name) {
        return res.status(400).json({ error: 'Email and name are required' });
      }

      let existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const demoAddress = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const newUser = await User.create({
        email,
        name,
        password: password || 'demo_pass_123',
        role: 'Sponsor / Diaspora',
        walletAddress: demoAddress,
        cdpProjectId: process.env.VITE_CDP_PROJECT_ID
      });

      await ActivityLog.create({
        userId: newUser._id.toString(),
        userEmail: newUser.email,
        action: 'SIGNUP_SUCCESS',
        details: { cdpProjectId: process.env.VITE_CDP_PROJECT_ID, walletAddress: demoAddress }
      });

      await CDPWallet.create({
        userId: newUser._id.toString(),
        userEmail: newUser.email,
        address: demoAddress,
        projectId: process.env.VITE_CDP_PROJECT_ID
      });

      return res.status(201).json({
        success: true,
        user: newUser,
        token: signAuthToken(newUser._id.toString()),
        cdpWallet: {
          address: demoAddress,
          projectId: process.env.VITE_CDP_PROJECT_ID
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (pathname === '/auth/login' && req.method === 'POST') {
    try {
      const { email } = req.body || {};
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      let user = await User.findOne({ email });
      if (!user) {
        const demoAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18';
        user = await User.create({
          email,
          name: email.split('@')[0].replace('.', ' '),
          role: 'Sponsor / Diaspora',
          walletAddress: demoAddress,
          cdpProjectId: process.env.VITE_CDP_PROJECT_ID
        });
      } else {
        user.lastLoginAt = new Date();
        await user.save();
      }

      await ActivityLog.create({
        userId: user._id.toString(),
        userEmail: user.email,
        action: 'LOGIN_SUCCESS',
        details: { cdpProjectId: process.env.VITE_CDP_PROJECT_ID }
      });

      return res.status(200).json({
        success: true,
        user,
        token: signAuthToken(user._id.toString()),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Telegram Mini App login. initData is HMAC-signed by Telegram itself using
  // this bot's token — stronger proof of identity than the email/password
  // path above, which has no password check at all. Finds or creates a User
  // keyed by telegramId; email/password accounts are untouched.
  if (pathname === '/auth/telegram' && req.method === 'POST') {
    try {
      const { initData } = req.body || {};
      if (!initData) return res.status(400).json({ error: 'initData is required' });

      const botToken = process.env.PNP_TELEGRAM_BOT_TOKEN ?? '';
      const verified = verifyInitData(initData, botToken);
      if (!verified) return res.status(401).json({ error: 'Invalid or expired Telegram initData' });

      const telegramId = String(verified.user.id);
      let user = await User.findOne({ telegramId });
      if (!user) {
        const displayName = [verified.user.first_name, verified.user.last_name].filter(Boolean).join(' ')
          || verified.user.username || `telegram_${telegramId}`;
        const demoAddress = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        user = await User.create({
          // Synthetic, unique, never actually emailed — telegramId is the real
          // identity key here; email stays required/unique on the schema for
          // the existing email/password accounts.
          email: `telegram-${telegramId}@tm-picknpay.local`,
          name: displayName,
          role: 'Sponsor / Diaspora',
          walletAddress: demoAddress,
          cdpProjectId: process.env.VITE_CDP_PROJECT_ID,
          telegramId,
          telegramUsername: verified.user.username,
        });
      } else {
        user.lastLoginAt = new Date();
        if (verified.user.username) user.telegramUsername = verified.user.username;
        await user.save();
      }

      await ActivityLog.create({
        userId: user._id.toString(),
        userEmail: user.email,
        action: 'TELEGRAM_LOGIN_SUCCESS',
        details: { telegramId },
      });

      return res.status(200).json({
        success: true,
        user,
        token: signAuthToken(user._id.toString()),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // FIX (7 Oct 2026): this used to be `User.findOne().sort({ lastLoginAt: -1 })`
  // — it ignored whatever token the caller sent and just returned whoever had
  // logged in most recently, globally. Any caller got back the last person to
  // log in, not themselves — a real cross-user data leak. Now requires a
  // valid signed bearer token and looks up that exact user.
  if (pathname === '/auth/me') {
    try {
      const verified = verifyAuthToken(extractBearerToken(req.headers.authorization));
      if (!verified) return res.status(401).json({ authenticated: false });
      const user = await User.findById(verified.userId);
      if (!user) return res.status(401).json({ authenticated: false });
      return res.status(200).json({ authenticated: true, user });
    } catch (err) {
      return res.status(200).json({ authenticated: false });
    }
  }

  // FIX (7 Oct 2026): this used to return every user's activity log to any
  // caller, unscoped. Now requires a valid bearer token and returns only that
  // user's own sessions.
  if (pathname === '/auth/sessions') {
    try {
      const verified = verifyAuthToken(extractBearerToken(req.headers.authorization));
      if (!verified) return res.status(401).json({ error: 'Unauthorized' });
      const sessions = await ActivityLog.find({ userId: verified.userId }).sort({ timestamp: -1 }).limit(50);
      return res.status(200).json({ success: true, sessions });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (pathname === '/auth/logout' && req.method === 'POST') {
    return res.status(200).json({ success: true });
  }

  // --- 12. PAYMENTS ENDPOINTS ---
  if (pathname === '/payments/balance') {
    const address = (req.query?.address as string) || '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18';
    return res.status(200).json({
      success: true,
      address,
      balances: { eth: '1.5000', usdc: '500.00' },
      cdpActive: false,
    });
  }

  if (pathname === '/payments/faucet' && req.method === 'POST') {
    const fallbackHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    return res.status(200).json({
      success: true,
      message: 'Faucet funding requested successfully (Demo Mode)',
      txHash: fallbackHash,
      explorerUrl: `https://sepolia.basescan.org/tx/${fallbackHash}`,
      cdpActive: false,
    });
  }

  if (pathname === '/payments/usdc' && req.method === 'POST') {
    const { amountUSD = 10 } = req.body || {};
    const fallbackHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    return res.status(200).json({
      success: true,
      txHash: fallbackHash,
      explorerUrl: `https://sepolia.basescan.org/tx/${fallbackHash}`,
      amountUSD: Number(amountUSD),
      cdpActive: false,
    });
  }

  // --- 13. TM-PICKNPAY: WALLET (multi-currency, open) ---
  if (pathname === '/wallet/balances') {
    const phone = (req.query?.phone as string) || 'demo';
    return res.status(200).json({ success: true, phone, balances: getWalletBalances(phone) });
  }

  if (pathname === '/wallet/checkout' && req.method === 'POST') {
    if (!requireSharedSecret(req, res)) return;
    const { phone, totalZWG } = req.body || {};
    if (!phone || !totalZWG) return res.status(400).json({ error: 'phone and totalZWG are required' });
    const result = await walletCheckout(phone, Number(totalZWG));
    return res.status(result.success ? 200 : 402).json(result);
  }

  // --- 14. TM-PICKNPAY: VOUCHER (closed-loop, remittance-fed only) ---
  if (pathname === '/voucher/balance') {
    const phone = (req.query?.phone as string) || 'demo';
    return res.status(200).json({ success: true, phone, balances: getVoucherBalances(phone) });
  }

  if (pathname === '/remittance/webhook' && req.method === 'POST') {
    if (!requireSharedSecret(req, res)) return;
    const { source, recipientPhone, amount, currency, reference } = (req.body || {}) as {
      source?: RemittanceSource; recipientPhone?: string; amount?: number; currency?: VoucherCurrency; reference?: string;
    };
    if (!source || !recipientPhone || !amount || !currency || !reference) {
      return res.status(400).json({ error: 'source, recipientPhone, amount, currency, reference are required' });
    }
    const balances = await creditVoucherFromRemittance(recipientPhone, source, Number(amount), currency, reference);
    return res.status(200).json({ success: true, balances });
  }

  if (pathname === '/remittance/log') {
    const phone = req.query?.phone as string | undefined;
    return res.status(200).json({ success: true, log: getRemittanceLog(phone) });
  }

  // --- 15. TM-PICKNPAY: ECOCASH ON/OFF-RAMP ---
  if (pathname === '/ecocash/onramp' && req.method === 'POST') {
    if (!requireSharedSecret(req, res)) return;
    const { phone, amount, currency = 'ZWG' } = req.body || {};
    if (!phone || !amount) return res.status(400).json({ error: 'phone and amount are required' });
    const txn = await requestToPay(phone, Number(amount), currency);
    // Demo-mode auto-resolve: no real EcoCash gateway exists to send a
    // webhook, so this stands in for one — settleTransaction is what
    // actually credits the wallet (requestToPay itself never touches the
    // ledger). See settleTransaction's own comment for why calling the real
    // /ecocash/webhook later for the same transaction is still safe.
    const settled = await settleTransaction(txn.id, 'SUCCESS');
    const balances = getWalletBalances(phone);
    return res.status(200).json({ success: true, transaction: settled ?? txn, balances, message: 'EcoCash request-to-pay approved and wallet credited (demo mode — auto-resolved).' });
  }

  if (pathname === '/ecocash/offramp' && req.method === 'POST') {
    if (!requireSharedSecret(req, res)) return;
    const { phone, amount, currency = 'ZWG' } = req.body || {};
    if (!phone || !amount) return res.status(400).json({ error: 'phone and amount are required' });
    // Off-ramp always debits the open WALLET, never the closed-loop voucher
    // balance — and debits exactly the requested currency/amount, not a
    // ZWG-first FX-fallback settlement (that's walletCheckout's job, for
    // order checkout, not for a user-specified cash-out amount/currency).
    // Debited here as a HOLD, before the payout is confirmed — settleTransaction
    // refunds this if the (demo or real) gateway later reports FAILED.
    const debit = await debitWallet(phone, currency, Number(amount));
    if (!debit.success) return res.status(402).json({ success: false, reason: debit.reason, balances: debit.balances });
    const txn = await payout(phone, Number(amount), currency);
    const settled = await settleTransaction(txn.id, 'SUCCESS');
    return res.status(200).json({ success: true, transaction: settled ?? txn, balances: debit.balances });
  }

  if (pathname === '/ecocash/pay-now' && req.method === 'POST') {
    if (!requireSharedSecret(req, res)) return;
    const { phone, amount, currency = 'ZWG', orderReference } = req.body || {};
    if (!phone || !amount || !orderReference) return res.status(400).json({ error: 'phone, amount, orderReference are required' });
    const txn = await payForOrder(phone, Number(amount), currency, orderReference);
    return res.status(200).json({ success: true, transaction: txn });
  }

  if (pathname === '/ecocash/webhook' && req.method === 'POST') {
    const rawPayload = JSON.stringify(req.body || {});
    const signatureHeader = req.headers['x-ecocash-signature'] as string | undefined;
    if (!verifyEcoCashWebhookSignature(rawPayload, signatureHeader)) {
      return res.status(401).json({ error: 'invalid signature' });
    }
    const { transactionId, outcome } = req.body || {};
    const resolved = await settleTransaction(transactionId, outcome === 'FAILED' ? 'FAILED' : 'SUCCESS');
    if (!resolved) return res.status(404).json({ error: 'transaction not found, or already resolved' });
    return res.status(200).json({ success: true, transaction: resolved });
  }

  // --- 16. TM-PICKNPAY: ERP LIVE STOCK ---
  if (pathname === '/erp/stock') {
    const storeId = (req.query?.storeId as any) || 'TM_PNP';
    const sku = req.query?.sku as string;
    if (!sku) return res.status(400).json({ error: 'sku is required' });
    const level = await checkStock(storeId, sku);
    return res.status(200).json({ success: true, level });
  }

  if (pathname === '/erp/substitute') {
    const sku = req.query?.sku as string;
    if (!sku) return res.status(400).json({ error: 'sku is required' });
    const substitute = await findSubstitute(sku);
    return res.status(200).json({ success: true, substitute });
  }

  if (pathname === '/erp/verify-checkout' && req.method === 'POST') {
    const { items } = req.body || {};
    const result = await verifyAvailableAtCheckout(items || []);
    return res.status(200).json(result);
  }

  // --- 17. TM-PICKNPAY: B2B BULK ORDERING ---
  if (pathname === '/orders/bulk-parse' && req.method === 'POST') {
    const { text, useAI = false } = req.body || {};
    if (!text) return res.status(400).json({ error: 'text is required' });
    let items = parseBulkOrderText(text);
    if (items.length === 0 && useAI) {
      const aiItems = await parseBulkOrderTextWithAI(text);
      if (aiItems) items = aiItems;
    }
    return res.status(200).json({ success: true, items });
  }

  if (pathname === '/orders/vendor-allocate' && req.method === 'POST') {
    if (!requireSharedSecret(req, res)) return;
    const { productId, requestedQty } = req.body || {};
    if (!productId || !requestedQty) return res.status(400).json({ error: 'productId and requestedQty are required' });
    const result = allocateFromBatch(productId, Number(requestedQty));
    return res.status(result.success ? 200 : 409).json(result);
  }

  // --- 18. TM-PICKNPAY: DELIVERY ZONES & HUB-AND-SPOKE ROUTING ---
  if (pathname === '/delivery/zones') {
    return res.status(200).json({ success: true, zones: listZones() });
  }

  if (pathname === '/delivery/route' && req.method === 'POST') {
    const { accountType, zoneId, orderValueZWG } = (req.body || {}) as { accountType?: B2BAccountType; zoneId?: string; orderValueZWG?: number };
    if (!zoneId) return res.status(400).json({ error: 'zoneId is required' });
    const decision = routeFulfillment({ accountType, zoneId, orderValueZWG });
    return res.status(200).json({ success: true, ...decision });
  }

  if (pathname === '/delivery/windows') {
    return res.status(200).json({ success: true, windows: getAvailableWindows() });
  }

  // --- 19. TM-PICKNPAY: B2B ACCOUNT RECOGNITION ---
  if (pathname === '/b2b/account') {
    const phone = req.query?.phone as string;
    if (!phone) return res.status(400).json({ error: 'phone is required' });
    const account = findB2BAccount(phone);
    return res.status(200).json({ success: true, account });
  }

  // --- 20. TM-PICKNPAY: ORDER PERSISTENCE & PICKING QUEUES ---
  if (pathname === '/orders/pnp/create' && req.method === 'POST') {
    if (!requireSharedSecret(req, res)) return;
    const { phone, items, totalZWG, address, route, storeId, hubName, deliveryWindowId } = (req.body || {}) as {
      phone?: string; items?: Array<{ productId: string; name: string; qty: number; priceZWG: number }>;
      totalZWG?: number; address?: string; route?: FulfillmentRoute; storeId?: string; hubName?: string; deliveryWindowId?: string;
    };
    if (!phone || !items?.length || !totalZWG || !address || !route) {
      return res.status(400).json({ error: 'phone, items, totalZWG, address, route are required' });
    }
    const order = createOrder({ phone, items, totalZWG, address, route, storeId, hubName, deliveryWindowId });
    return res.status(200).json({ success: true, order });
  }

  if (pathname === '/orders/pnp/track') {
    const orderId = req.query?.orderId as string;
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });
    const order = getOrder(orderId);
    if (!order) return res.status(404).json({ error: 'order not found' });
    return res.status(200).json({ success: true, order });
  }

  if (pathname === '/orders/pnp/advance' && req.method === 'POST') {
    if (!requireSharedSecret(req, res)) return;
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });
    const result = advanceOrder(orderId);
    // Awaited, not fire-and-forget — this is a Vercel serverless function,
    // which can freeze/exit the moment the response is sent, so a detached
    // promise here is not guaranteed to ever actually complete.
    if (result.success && result.order) {
      await notifyPicknPayStatus(result.order);
    }
    return res.status(result.success ? 200 : 409).json(result);
  }

  if (pathname === '/orders/pnp/queue') {
    const storeId = req.query?.storeId as string | undefined;
    const hub = req.query?.hub === 'true';
    const queue = hub ? getHubQueue() : getStoreQueue(storeId ?? 'TM_PNP');
    return res.status(200).json({ success: true, queue });
  }

  // --- 21. TM-PICKNPAY: TRENDING SPECIALS / BUNDLES ---
  if (pathname === '/bundles') {
    return res.status(200).json({ success: true, bundles: getBundles() });
  }

  // Fallback 404 for unhandled API routes
  return res.status(404).json({ error: `API route not found: ${pathname}` });
  } catch (err: any) {
    console.error('[Vercel API Handler Exception]:', err);
    return res.status(500).json({
      error: err.message || 'Internal Server Error',
      success: false
    });
  }
}
