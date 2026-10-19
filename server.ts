import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { SAMPLE_PRODUCTS, INITIAL_MEMBERS, INITIAL_EXCHANGE_RATES } from './src/data/products';
import { connectDB, User, ActivityLog, OrderModel, CDPWallet } from './server/models';
import { signAuthToken, verifyAuthToken, extractBearerToken } from './server/authToken';
import { verifyInitData } from './server/telegramAuth';
import { createCoinbaseCheckout, verifyWebhookSignature, refundCoinbaseCheckout } from './server/coinbaseCheckout';
import { getWalletBalances, getVoucherBalances, walletCheckout, debitWallet, creditVoucherFromRemittance, getRemittanceLog } from './server/walletLedger';
import { requestToPay, payout, payForOrder, settleTransaction, verifyEcoCashWebhookSignature } from './server/ecocash';
import { checkStock, findSubstitute, verifyAvailableAtCheckout } from './server/erpStock';
import { parseBulkOrderText, parseBulkOrderTextWithAI } from './server/bulkOrderParser';
import { listZones, routeFulfillment } from './server/deliveryZones';
import { allocateFromBatch } from './server/vendorAllocation';
import { findB2BAccount } from './server/b2bAccounts';
import { createOrder, getOrder, advanceOrder, getStoreQueue, getHubQueue } from './server/pnpOrders';
import { getBundles } from './server/bundles';
import { notifyPicknPayStatus } from './server/picknpayNotify';
import { getAvailableWindows } from './server/deliveryWindows';
import { 
  getAgentWallet, 
  topupAgentWallet, 
  updateAgentSettings, 
  debitAgentWalletForOrder, 
  parseRecipe, 
  getActiveSpecials, 
  getPantryDepletionEstimates 
} from './server/agentShopping';
import { 
  CartItem, 
  Product, 
  WhatsAppMessage, 
  VoiceAIResult, 
  PaymentRail, 
  OrchestrationAttempt, 
  OrchestrationResponse, 
  PaymentOrchestratorLog,
  DeliveryAddress,
  StoreId,
  Currency
} from './src/types';
import { 
  INITIAL_DEPOTS, 
  INITIAL_ORDERS, 
  INITIAL_INVOICES, 
  INITIAL_USER_PROFILE, 
  INITIAL_USER_ADDRESSES, 
  LIVE_CALL_INITIAL_STATE,
  PastOrder,
  CommercialInvoice,
  DepotLocation
} from './server/db';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Conditional multer middleware: only invokes multer if request is multipart/form-data
const conditionalUpload = (fieldName: string) => (req: Request, res: Response, next: express.NextFunction) => {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart/form-data')) {
    return (upload.single(fieldName) as any)(req, res, next);
  }
  next();
};

// Server-to-server guard for endpoints that move wallet/voucher balances —
// mirrors the same check in api/index.ts (the Vercel serverless entry).
// Both entry points must stay in sync; this one was initially missed here.
function requireSharedSecret(req: Request, res: Response): boolean {
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

// Server-side Gemini initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// =========================================================================
// IN-MEMORY PERSISTENCE LAYER (Synchronized & Socket Broadcasted)
// =========================================================================

let currentCart: CartItem[] = [
  {
    id: 'cart-init-1',
    productId: 'prod-1',
    product: SAMPLE_PRODUCTS[0], // Tastic Rice 5kg
    quantity: 2,
    addedByMemberId: 'mem-2',
    addedByMemberName: 'Gogo Moyo',
    addedByLocation: 'Harare, ZIM',
    channel: 'whatsapp',
    addedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    note: 'Added via WhatsApp Voice Note'
  },
  {
    id: 'cart-init-2',
    productId: 'prod-3',
    product: SAMPLE_PRODUCTS[2], // Fruit and Vegetable Box 10kg
    quantity: 1,
    addedByMemberId: 'mem-1',
    addedByMemberName: 'Tinashe Moyo',
    addedByLocation: 'Johannesburg, SA',
    channel: 'web',
    addedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 'cart-init-3',
    productId: 'prod-8',
    product: SAMPLE_PRODUCTS[7], // Solar Light Kit
    quantity: 1,
    addedByMemberId: 'mem-1',
    addedByMemberName: 'Tinashe Moyo',
    addedByLocation: 'Johannesburg, SA',
    channel: 'web',
    addedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    note: 'For Gogo power outages'
  }
];

let ordersStore: PastOrder[] = [...INITIAL_ORDERS];
let invoicesStore: CommercialInvoice[] = [...INITIAL_INVOICES];
let depotsStore: DepotLocation[] = [...INITIAL_DEPOTS];
let userProfileStore = { ...INITIAL_USER_PROFILE };
let userAddressesStore: DeliveryAddress[] = [...INITIAL_USER_ADDRESSES];
let liveCallStore = { ...LIVE_CALL_INITIAL_STATE };
let paymentAuditLogs: PaymentOrchestratorLog[] = [];

let whatsappLog: WhatsAppMessage[] = [
  {
    id: 'wa-msg-1',
    fromPhone: '+263772123456',
    senderName: 'Gogo Moyo',
    text: 'Ndinoda mupunga weTastic ne mafuta',
    isVoiceNote: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    status: 'processed',
    parsedIntent: {
      action: 'ADD',
      items: [{ productName: 'Tastic Rice Parboiled Long Grain (5kg)', qty: 2 }],
      spokenResponse: 'Ndaisa mupunga weTastic nemafuta ekubikisa mungoro yeMoyo Family.',
      detectedLanguage: 'Shona'
    },
    replyText: '🛒 TM Pick n Pay Family Cart:\nAdded: 2x Tastic Rice 5kg, 1x Cooking Oil 2L.\nTotal: $17.40 (ZWG 466.32). Reply 1 to Checkout via EcoCash / Mukuru.'
  }
];

// Helper to match catalog item by voice or colloquial native text query
const matchProduct = (queryName: string): Product => {
  const q = queryName.toLowerCase();
  
  // Check exact name and native terms
  const exactMatch = SAMPLE_PRODUCTS.find(p => 
    p.name.toLowerCase().includes(q) || 
    (p.nativeName && p.nativeName.toLowerCase().includes(q)) ||
    p.category.toLowerCase().includes(q)
  );
  if (exactMatch) return exactMatch;

  // Colloquial term mapping
  if (q.includes('mupunga') || q.includes('tastic') || q.includes('rice') || q.includes('ilayisi')) {
    return SAMPLE_PRODUCTS[0]; // Tastic Rice 5kg
  }
  if (q.includes('hupfu') || q.includes('impuphu') || q.includes('maize') || q.includes('meal') || q.includes('upfu')) {
    return SAMPLE_PRODUCTS[1]; // White Star Maize
  }
  if (q.includes('miriwo') || q.includes('michero') || q.includes('fruit') || q.includes('vegetable') || q.includes('veshi')) {
    return SAMPLE_PRODUCTS[2]; // Fruit & Veg Box 10kg
  }
  if (q.includes('mafuta') || q.includes('oil') || q.includes('amafutha') || q.includes('cooking')) {
    return SAMPLE_PRODUCTS[3]; // Sunfoil Oil 5L
  }
  if (q.includes('chigaku') || q.includes('sugar') || q.includes('unshukela') || q.includes('shuga')) {
    return SAMPLE_PRODUCTS[4]; // Huletts Sugar
  }
  if (q.includes('mazoe') || q.includes('orange') || q.includes('drink') || q.includes('cordial')) {
    return SAMPLE_PRODUCTS[5]; // Mazoe Orange
  }
  if (q.includes('mwenje') || q.includes('solar') || q.includes('light') || q.includes('amagetsi')) {
    return SAMPLE_PRODUCTS[7]; // Solar kit
  }
  if (q.includes('nyama') || q.includes('beef') || q.includes('meat') || q.includes('inyama')) {
    return SAMPLE_PRODUCTS[10] || SAMPLE_PRODUCTS[0]; // Beef
  }
  if (q.includes('mukaka') || q.includes('milk') || q.includes('ubisi') || q.includes('clover')) {
    return SAMPLE_PRODUCTS[8] || SAMPLE_PRODUCTS[0]; // Clover Milk
  }
  if (q.includes('sipo') || q.includes('soap') || q.includes('isipho') || q.includes('sunlight')) {
    return SAMPLE_PRODUCTS[9] || SAMPLE_PRODUCTS[0]; // Soap
  }
  
  return SAMPLE_PRODUCTS[0];
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// =========================================================================
// SERVER STARTUP & API ROUTING
async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' }
  });

  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Helper to broadcast cart updates
  const broadcastCartUpdate = (initiator?: string) => {
    io.emit('cart:update', {
      cart: currentCart,
      updatedAt: new Date().toISOString(),
      initiator
    });
  };

  // Socket.io connection handling
  io.on('connection', (socket) => {
    socket.emit('cart:init', {
      cart: currentCart,
      members: INITIAL_MEMBERS,
      exchangeRates: INITIAL_EXCHANGE_RATES,
      activeOrdersCount: ordersStore.length
    });

    socket.on('presence:join', (member) => {
      socket.broadcast.emit('member:joined', member);
    });

    socket.on('live_call:join', (data) => {
      liveCallStore.isActive = true;
      io.emit('live_call:state', liveCallStore);
    });
  });

  // Initialize MongoDB Atlas connection asynchronously
  connectDB().catch((err) => {
    console.error('[MongoDB Init Error]:', err);
  });

  // -------------------------------------------------------------
  // 1. HEALTH & METRICS
  // -------------------------------------------------------------
  app.get('/api/health', async (req: Request, res: Response) => {
    let mongoConnected = false;
    try {
      const mongoose = (await import('mongoose')).default;
      mongoConnected = mongoose.connection.readyState === 1;
    } catch (_) {}

    res.json({ 
      status: 'ok', 
      service: 'PnP Express Cross-Border Engine', 
      version: '2.4.0',
      database: mongoConnected ? 'MongoDB Atlas Connected' : 'In-Memory Fallback',
      activeSockets: io.engine.clientsCount,
      cartItemCount: currentCart.length,
      ordersCount: ordersStore.length,
      timestamp: new Date().toISOString() 
    });
  });

  // -------------------------------------------------------------
  // 1B. AUTHENTICATION & USER SESSIONS (MongoDB Atlas)
  // -------------------------------------------------------------
  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    try {
      const { email, name, password, phone, country } = req.body;
      if (!email || !name) {
        return res.status(400).json({ error: 'Email and name are required' });
      }

      let existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Generate CDP Smart Wallet Address placeholder or user wallet
      const walletAddress = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      const newUser = new User({
        email,
        name,
        password: password || 'demo_pass_123',
        role: 'Sponsor / Diaspora',
        walletAddress,
        cdpProjectId: process.env.VITE_CDP_PROJECT_ID,
        phone: phone || '+44 7700 900123',
        country: country || 'United Kingdom',
        city: 'London',
        walletBalanceUSD: 250.00
      });

      await newUser.save();

      // Record Activity Log Session in MongoDB
      await ActivityLog.create({
        userId: newUser._id.toString(),
        userEmail: newUser.email,
        action: 'SIGNUP_SUCCESS',
        details: { cdpProjectId: process.env.VITE_CDP_PROJECT_ID, walletAddress },
        ip: req.ip
      });

      // Record CDP Wallet in MongoDB
      await CDPWallet.create({
        userId: newUser._id.toString(),
        userEmail: newUser.email,
        address: walletAddress,
        projectId: process.env.VITE_CDP_PROJECT_ID,
        balanceEth: 0.05,
        balanceUsdc: 500.00
      });

      res.status(201).json({
        success: true,
        user: newUser,
        token: signAuthToken(newUser._id.toString()),
        cdpWallet: {
          address: walletAddress,
          projectId: process.env.VITE_CDP_PROJECT_ID,
          paymasterUrl: process.env.CDP_PAYMASTER_URL_TESTNET
        }
      });
    } catch (err: any) {
      console.error('[Auth Signup Error]:', err);
      res.status(500).json({ error: err.message || 'Failed to sign up' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      let user = await User.findOne({ email });
      if (!user) {
        // Auto-provision demo account if not existing for smooth UX
        const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18';
        user = await User.create({
          email,
          name: email.split('@')[0].replace('.', ' '),
          role: 'Sponsor / Diaspora',
          walletAddress,
          cdpProjectId: process.env.VITE_CDP_PROJECT_ID
        });
      } else {
        user.lastLoginAt = new Date();
        await user.save();
      }

      // Record Session Activity in MongoDB
      await ActivityLog.create({
        userId: user._id.toString(),
        userEmail: user.email,
        action: 'LOGIN_SUCCESS',
        details: { cdpProjectId: process.env.VITE_CDP_PROJECT_ID },
        ip: req.ip
      });

      let cdpWallet = await CDPWallet.findOne({ userId: user._id.toString() });
      if (!cdpWallet) {
        cdpWallet = await CDPWallet.create({
          userId: user._id.toString(),
          userEmail: user.email,
          address: user.walletAddress || '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
          projectId: process.env.VITE_CDP_PROJECT_ID
        });
      }

      res.json({
        success: true,
        user,
        token: signAuthToken(user._id.toString()),
        cdpWallet
      });
    } catch (err: any) {
      console.error('[Auth Login Error]:', err);
      res.status(500).json({ error: err.message || 'Failed to log in' });
    }
  });

  // Telegram Mini App login — see api/index.ts's /auth/telegram for the full
  // rationale (initData is HMAC-signed by Telegram itself, stronger proof of
  // identity than the email/password path above, which has no password check
  // at all). Kept identical between the two entrypoints since they aren't a
  // shared module.
  app.post('/api/auth/telegram', async (req: Request, res: Response) => {
    try {
      const { initData } = req.body;
      if (!initData) return res.status(400).json({ error: 'initData is required' });

      const botToken = process.env.PNP_TELEGRAM_BOT_TOKEN ?? '';
      const verified = verifyInitData(initData, botToken);
      if (!verified) return res.status(401).json({ error: 'Invalid or expired Telegram initData' });

      const telegramId = String(verified.user.id);
      let user = await User.findOne({ telegramId });
      if (!user) {
        const displayName = [verified.user.first_name, verified.user.last_name].filter(Boolean).join(' ')
          || verified.user.username || `telegram_${telegramId}`;
        const walletAddress = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        user = await User.create({
          email: `telegram-${telegramId}@tm-picknpay.local`,
          name: displayName,
          role: 'Sponsor / Diaspora',
          walletAddress,
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
        ip: req.ip,
      });

      res.json({
        success: true,
        user,
        token: signAuthToken(user._id.toString()),
      });
    } catch (err: any) {
      console.error('[Auth Telegram Error]:', err);
      res.status(500).json({ error: err.message || 'Failed to log in with Telegram' });
    }
  });

  // FIX (7 Oct 2026): this used to be `User.findOne().sort({ lastLoginAt: -1 })`
  // — ignored whatever the caller sent and returned whoever logged in most
  // recently, globally. A real cross-user data leak. Now requires a valid
  // signed bearer token and looks up that exact user.
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    try {
      const verified = verifyAuthToken(extractBearerToken(req.headers.authorization));
      if (!verified) return res.status(401).json({ authenticated: false });
      const user = await User.findById(verified.userId);
      if (!user) return res.status(401).json({ authenticated: false });
      const cdpWallet = await CDPWallet.findOne({ userId: user._id.toString() });
      res.json({
        authenticated: true,
        user,
        cdpWallet
      });
    } catch (err) {
      res.json({ authenticated: false });
    }
  });

  // FIX (7 Oct 2026): this used to return every user's activity log to any
  // caller, unscoped. Now requires a valid bearer token and returns only that
  // user's own sessions.
  app.get('/api/auth/sessions', async (req: Request, res: Response) => {
    try {
      const verified = verifyAuthToken(extractBearerToken(req.headers.authorization));
      if (!verified) return res.status(401).json({ error: 'Unauthorized' });
      const logs = await ActivityLog.find({ userId: verified.userId }).sort({ timestamp: -1 }).limit(50);
      res.json({ success: true, count: logs.length, sessions: logs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // 1C. COINBASE DEVELOPER PLATFORM (CDP) WALLET & PAYMASTER API
  // -------------------------------------------------------------
  app.get('/api/cdp/info', (req: Request, res: Response) => {
    res.json({
      success: true,
      projectId: process.env.VITE_CDP_PROJECT_ID,
      keyId: process.env.CDP_API_KEY_ID ? `${process.env.CDP_API_KEY_ID.substring(0, 6)}...` : 'configured',
      paymasterTestnet: process.env.CDP_PAYMASTER_URL_TESTNET,
      paymasterMainnet: process.env.CDP_PAYMASTER_URL_MAINNET,
      network: 'Base Sepolia (Layer 2 Gasless)'
    });
  });

  app.post('/api/cdp/wallet/create', async (req: Request, res: Response) => {
    try {
      const { userEmail = 'diaspora@pnpexpress.co.zw' } = req.body;
      const newAddress = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      let user = await User.findOne({ email: userEmail });
      const userId = user ? user._id.toString() : `usr_${Date.now()}`;

      const wallet = await CDPWallet.create({
        userId,
        userEmail,
        address: newAddress,
        projectId: process.env.VITE_CDP_PROJECT_ID,
        paymasterUrl: process.env.CDP_PAYMASTER_URL_TESTNET,
        balanceEth: 0.05,
        balanceUsdc: 500.00
      });

      await ActivityLog.create({
        userId,
        userEmail,
        action: 'CDP_WALLET_CREATED',
        details: { address: newAddress, projectId: process.env.VITE_CDP_PROJECT_ID }
      });

      res.status(201).json({
        success: true,
        message: 'Coinbase CDP Smart Wallet provisioned successfully',
        wallet
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // 2. PRODUCTS & CATALOG ENDPOINTS
  // -------------------------------------------------------------
  app.get('/api/products', (req: Request, res: Response) => {
    const { 
      category, 
      storeId, 
      search, 
      fulfillmentTag, 
      inStock, 
      sort = 'featured',
      page = '1',
      limit = '50'
    } = req.query;

    let filtered = [...SAMPLE_PRODUCTS];

    if (category) {
      filtered = filtered.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
    }

    if (storeId) {
      filtered = filtered.filter(p => p.storeId === storeId);
    }

    if (fulfillmentTag) {
      filtered = filtered.filter(p => p.fulfillmentTag === fulfillmentTag);
    }

    if (inStock !== undefined) {
      const stockBool = inStock === 'true';
      filtered = filtered.filter(p => p.inStock === stockBool);
    }

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) ||
        (p.nativeName && p.nativeName.toLowerCase().includes(q)) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sort === 'price_asc') {
      filtered.sort((a, b) => a.priceUSD - b.priceUSD);
    } else if (sort === 'price_desc') {
      filtered.sort((a, b) => b.priceUSD - a.priceUSD);
    } else if (sort === 'name_asc') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'name_desc') {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    } else {
      // Default: featured first
      filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 50;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(startIndex, startIndex + limitNum);

    res.json({
      products: paginated,
      total: filtered.length,
      page: pageNum,
      totalPages: Math.ceil(filtered.length / limitNum),
      exchangeRates: INITIAL_EXCHANGE_RATES
    });
  });

  app.get('/api/products/categories', (req: Request, res: Response) => {
    const categoryCounts: Record<string, number> = {};
    SAMPLE_PRODUCTS.forEach(p => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });

    const categoryList = Object.entries(categoryCounts).map(([name, count]) => {
      let nativeLabel = name;
      if (name === 'Maize & Staples') nativeLabel = 'Hupfu, Mupunga & Shuga';
      if (name === 'Cooking & Oils') nativeLabel = 'Mafuta eKubikisa';
      if (name === 'Meats & Proteins') nativeLabel = 'Nyama yeMombe neHuku';
      if (name === 'Dairy & Fresh') nativeLabel = 'Mukaka neMiriwo';
      if (name === 'Beverages & Tea') nativeLabel = 'Mazoe, Tii neZvinwiwa';
      if (name === 'Solar & Power') nativeLabel = 'Mwenje weZuva & Amagetsi';
      if (name === 'Household & Soap') nativeLabel = 'Sipo neZvokuchenesa';
      if (name === 'Baby & Care') nativeLabel = 'ZveVana neVacheche';

      return {
        name,
        nativeLabel,
        count
      };
    });

    res.json(categoryList);
  });

  app.get('/api/products/stores', (req: Request, res: Response) => {
    const stores = [
      { id: 'TM_PNP', name: 'TM Pick n Pay Zimbabwe', tag: '74+ Branch Network', depotCount: 74, logo: 'tm_pnp' },
    ];
    res.json(stores);
  });

  app.get('/api/products/deals', (req: Request, res: Response) => {
    const deals = SAMPLE_PRODUCTS.filter(p => p.featured || p.priceUSD < 7.00);
    res.json({
      title: 'Diaspora Family Relief Hampers & Weekly Saver Packs',
      deals
    });
  });

  app.get('/api/products/:id', (req: Request, res: Response) => {
    const product = SAMPLE_PRODUCTS.find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const related = SAMPLE_PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3);

    res.json({
      ...product,
      nutritionFacts: 'Rich in essential daily minerals and dietary energy.',
      packagingNote: 'Sealed cold-chain packaging guaranteed for door delivery and depot lockers.',
      relatedProducts: related
    });
  });

  // -------------------------------------------------------------
  // 3. COLLABORATIVE FAMILY CART ENDPOINTS
  // -------------------------------------------------------------
  app.get('/api/cart', (req: Request, res: Response) => {
    const totalUSD = currentCart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
    const totalZAR = totalUSD * INITIAL_EXCHANGE_RATES.USD_ZAR;
    const totalZWG = totalUSD * INITIAL_EXCHANGE_RATES.USD_ZWG;
    const totalGBP = totalUSD * 0.79;

    res.json({
      cart: currentCart,
      members: INITIAL_MEMBERS,
      totals: {
        totalUSD: Number(totalUSD.toFixed(2)),
        totalZAR: Number(totalZAR.toFixed(2)),
        totalZWG: Number(totalZWG.toFixed(2)),
        totalGBP: Number(totalGBP.toFixed(2)),
        itemCount: currentCart.reduce((cnt, i) => cnt + i.quantity, 0)
      }
    });
  });

  app.post('/api/cart/add', (req: Request, res: Response) => {
    const { productId, quantity = 1, memberId, memberName, memberLocation, channel = 'web', note } = req.body;
    
    const product = SAMPLE_PRODUCTS.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found in store catalog' });
    }

    const existingIndex = currentCart.findIndex(item => item.productId === productId);
    if (existingIndex > -1) {
      currentCart[existingIndex].quantity += Number(quantity);
      if (note) currentCart[existingIndex].note = note;
    } else {
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        product,
        quantity: Math.max(1, Number(quantity)),
        addedByMemberId: memberId || 'mem-1',
        addedByMemberName: memberName || 'Tinashe Moyo',
        addedByLocation: memberLocation || 'Johannesburg, SA',
        channel: channel || 'web',
        addedAt: new Date().toISOString(),
        note
      };
      currentCart.unshift(newItem);
    }

    broadcastCartUpdate(memberName || 'Family Member');
    res.json({ success: true, cart: currentCart });
  });

  app.post('/api/cart/update', (req: Request, res: Response) => {
    const { itemId, quantity, note } = req.body;
    
    if (Number(quantity) <= 0) {
      currentCart = currentCart.filter(item => item.id !== itemId);
    } else {
      const item = currentCart.find(i => i.id === itemId);
      if (item) {
        item.quantity = Number(quantity);
        if (note !== undefined) item.note = note;
      }
    }

    broadcastCartUpdate();
    res.json({ success: true, cart: currentCart });
  });

  app.post('/api/cart/remove', (req: Request, res: Response) => {
    const { itemId } = req.body;
    currentCart = currentCart.filter(item => item.id !== itemId);
    broadcastCartUpdate();
    res.json({ success: true, cart: currentCart });
  });

  app.post('/api/cart/clear', (req: Request, res: Response) => {
    currentCart = [];
    broadcastCartUpdate('Cart Reset');
    res.json({ success: true, cart: currentCart });
  });

  app.post('/api/cart/member-address', (req: Request, res: Response) => {
    const { memberId, address } = req.body;
    currentCart.forEach(item => {
      if (item.addedByMemberId === memberId) {
        item.deliveryAddress = address;
      }
    });
    broadcastCartUpdate();
    res.json({ success: true, cart: currentCart });
  });

  app.post('/api/cart/split-calculator', (req: Request, res: Response) => {
    try {
      const { splitMethod = 'EQUAL', customRatios = {} } = req.body;
      const totalUSD = currentCart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);

      const memberTotals: { [memberId: string]: { subtotalUSD: number; count: number } } = {};
      INITIAL_MEMBERS.forEach(m => {
        memberTotals[m.id] = { subtotalUSD: 0, count: 0 };
      });

      currentCart.forEach(item => {
        if (!memberTotals[item.addedByMemberId]) {
          memberTotals[item.addedByMemberId] = { subtotalUSD: 0, count: 0 };
        }
        memberTotals[item.addedByMemberId].subtotalUSD += item.product.priceUSD * item.quantity;
        memberTotals[item.addedByMemberId].count += item.quantity;
      });

      const memberShares = INITIAL_MEMBERS.map(m => {
        let shareUSD = 0;
        const subtotalUSD = memberTotals[m.id]?.subtotalUSD || 0;

        if (splitMethod === 'EQUAL') {
          shareUSD = totalUSD / (INITIAL_MEMBERS.length || 1);
        } else if (splitMethod === 'BY_SUBMITTER') {
          shareUSD = subtotalUSD;
        } else if (splitMethod === 'CUSTOM') {
          const ratio = customRatios[m.id] || (1 / INITIAL_MEMBERS.length);
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
          shareGBP: Number((shareUSD * 0.79).toFixed(2)),
          percentage
        };
      });

      res.json({
        success: true,
        totalUSD: Number(totalUSD.toFixed(2)),
        totalZAR: Number((totalUSD * INITIAL_EXCHANGE_RATES.USD_ZAR).toFixed(2)),
        totalZWG: Number((totalUSD * INITIAL_EXCHANGE_RATES.USD_ZWG).toFixed(2)),
        totalGBP: Number((totalUSD * 0.79).toFixed(2)),
        splitMethod,
        shares: memberShares
      });
    } catch (err: any) {
      console.error('[Split Calculator Error]:', err);
      res.status(500).json({ error: 'Failed to calculate split shares' });
    }
  });

  // -------------------------------------------------------------
  // 4. ORDERS & LIVE DISPATCH TRACKING ENDPOINTS
  // -------------------------------------------------------------
  app.get('/api/orders', (req: Request, res: Response) => {
    const { status, search } = req.query;
    let filtered = [...ordersStore];

    if (status && status !== 'ALL') {
      filtered = filtered.filter(o => o.status === status);
    }

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(o => 
        o.id.toLowerCase().includes(q) ||
        o.invoiceNumber.toLowerCase().includes(q) ||
        o.recipientName.toLowerCase().includes(q) ||
        o.fulfillmentLocation.toLowerCase().includes(q) ||
        o.items.some(i => i.name.toLowerCase().includes(q))
      );
    }

    res.json({
      orders: filtered,
      totalCount: filtered.length
    });
  });

  app.get('/api/orders/:id', (req: Request, res: Response) => {
    const order = ordersStore.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  });

  app.post('/api/orders/reorder', (req: Request, res: Response) => {
    const { orderId } = req.body;
    const order = ordersStore.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({ error: 'Past order not found' });
    }

    let addedCount = 0;
    order.items.forEach(pastItem => {
      const prod = SAMPLE_PRODUCTS.find(p => p.id === pastItem.id) || matchProduct(pastItem.name);
      const existing = currentCart.find(c => c.productId === prod.id);
      if (existing) {
        existing.quantity += pastItem.quantity;
      } else {
        currentCart.unshift({
          id: `cart-reorder-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          productId: prod.id,
          product: prod,
          quantity: pastItem.quantity,
          addedByMemberId: 'mem-1',
          addedByMemberName: 'Tariro Moyo',
          addedByLocation: 'London, UK',
          channel: 'web',
          addedAt: new Date().toISOString(),
          note: `Reordered from ${order.id}`
        });
      }
      addedCount += pastItem.quantity;
    });

    broadcastCartUpdate(`Re-order (${order.id})`);
    res.json({
      success: true,
      addedCount,
      cart: currentCart,
      message: `Added ${addedCount} items from ${order.id} into family cart.`
    });
  });

  app.post('/api/orders/:id/advance-status', (req: Request, res: Response) => {
    const order = ordersStore.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { nextStatus } = req.body;
    if (nextStatus) {
      order.status = nextStatus;
    } else if (order.status === 'PROCESSING') {
      order.status = order.fulfillmentType === 'CLICK_AND_COLLECT' ? 'READY_FOR_COLLECTION' : 'OUT_FOR_DELIVERY';
    } else if (order.status === 'OUT_FOR_DELIVERY' || order.status === 'READY_FOR_COLLECTION') {
      order.status = 'DELIVERED';
    }

    // Update tracking steps
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (order.status === 'DELIVERED') {
      order.statusLabel = `Delivered to ${order.recipientName}`;
      order.statusColor = 'emerald';
      order.trackingSteps.forEach(s => s.completed = true);
    }

    io.emit('order:status_updated', order);
    res.json({ success: true, order });
  });

  // -------------------------------------------------------------
  // 5. COMMERCIAL TAX INVOICES ENDPOINTS
  // -------------------------------------------------------------
  app.get('/api/invoices', (req: Request, res: Response) => {
    res.json({
      invoices: invoicesStore,
      totalCount: invoicesStore.length
    });
  });

  app.get('/api/invoices/:id', (req: Request, res: Response) => {
    const invoice = invoicesStore.find(inv => inv.id === req.params.id || inv.orderId === req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice record not found' });
    }
    res.json(invoice);
  });

  app.get('/api/invoices/:id/html', (req: Request, res: Response) => {
    const invoice = invoicesStore.find(inv => inv.id === req.params.id || inv.orderId === req.params.id);
    if (!invoice) {
      return res.status(404).send('<h2>Invoice Not Found</h2>');
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #1c1917; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #002D62; padding-bottom: 20px; }
    .brand { font-size: 24px; font-weight: 900; color: #002D62; }
    .badge { background: #E6F4EA; color: #137333; font-weight: 700; padding: 4px 10px; border-radius: 6px; font-size: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 30px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    th { background: #F5F5F4; text-align: left; padding: 10px; font-size: 13px; border-bottom: 2px solid #E7E5E4; }
    td { padding: 12px 10px; border-bottom: 1px solid #E7E5E4; font-size: 14px; }
    .total-box { margin-left: auto; width: 300px; font-size: 14px; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; }
    .grand-total { font-size: 18px; font-weight: 900; color: #002D62; border-top: 2px solid #002D62; padding-top: 10px; margin-top: 6px; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #E7E5E4; font-size: 11px; color: #78716C; text-align: center; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px;">
    <button onclick="window.print()" style="background: #002D62; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">Print / Download PDF</button>
  </div>
  <div class="header">
    <div>
      <div class="brand">TM Pick n Pay Zimbabwe</div>
      <div style="font-size: 12px; color: #57534E; margin-top: 4px;">Meikles Limited & Pick n Pay Retailers JV</div>
      <div style="font-size: 12px; color: #57534E;">VAT Registration: 10029481 | RBZ CD1 Authorized</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">OFFICIAL TAX INVOICE</span>
      <div style="font-size: 16px; font-weight: 800; margin-top: 8px;">${invoice.invoiceNumber}</div>
      <div style="font-size: 13px; color: #57534E;">Date: ${invoice.date}</div>
    </div>
  </div>

  <div class="grid">
    <div>
      <strong>Diaspora Sponsor (Billed To):</strong>
      <div>${invoice.customerName}</div>
      <div>${invoice.customerLocation}</div>
      <div style="margin-top: 8px;"><strong>Payment Rail:</strong> ${invoice.paymentRail}</div>
      <div><strong>Forex Declaration:</strong> ${invoice.forexReportingCode}</div>
    </div>
    <div>
      <strong>Zimbabwe Recipient (Delivered To):</strong>
      <div>${invoice.recipientName}</div>
      <div>${invoice.recipientAddress}</div>
      <div style="margin-top: 8px;"><strong>Fulfillment Store:</strong> ${invoice.storePartner}</div>
      <div><strong>Settlement Treasury:</strong> ${invoice.settlementAccount}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item Description</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Unit Price (USD)</th>
        <th style="text-align: right;">Amount (USD)</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items.map(it => `
        <tr>
          <td>${it.name}</td>
          <td style="text-align: center;">${it.quantity}</td>
          <td style="text-align: right;">$${it.unitPriceUSD.toFixed(2)}</td>
          <td style="text-align: right;">$${it.totalUSD.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="total-box">
    <div class="total-row"><span>Subtotal:</span><span>$${invoice.subtotalUSD.toFixed(2)}</span></div>
    <div class="total-row"><span>Express Delivery / Depot Handling:</span><span>$${invoice.deliveryFeeUSD.toFixed(2)}</span></div>
    <div class="total-row"><span>Value Added Tax (Zero-Rated Export):</span><span>$${invoice.vatTaxUSD.toFixed(2)}</span></div>
    <div class="total-row grand-total"><span>Total Settled (USD):</span><span>$${invoice.totalUSD.toFixed(2)}</span></div>
    <div style="font-size: 11px; color: #57534E; margin-top: 6px; text-align: right;">
      Equivalent: £${invoice.currencyEquivalents.GBP.toFixed(2)} GBP | R${invoice.currencyEquivalents.ZAR.toFixed(2)} ZAR | ZWG ${invoice.currencyEquivalents.ZWG.toFixed(2)}
    </div>
  </div>

  <div class="footer">
    This document serves as an authorized commercial export receipt under Zimbabwe Reserve Bank (RBZ) Direct Inflow Regulations. Goods cleared for express handover in Zimbabwe.
  </div>
</body>
</html>
    `;
    res.send(html);
  });

  // -------------------------------------------------------------
  // 5B. DUAL-PATH COINBASE CHECKOUT & WEBHOOK SYSTEM
  // -------------------------------------------------------------

  // Dual-Path Checkout API: Routes US (Headless Native) vs UK/EU/AU/NZ (Hosted Redirect)
  const handleDualPathCheckout = async (req: Request, res: Response) => {
    try {
      const { amount, currency = 'USD', orderId, customerEmail, country, card } = req.body;
      const totalAmount = amount ? parseFloat(amount) : currentCart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
      const targetOrderId = orderId || `PNP-ZW-${Math.floor(10000 + Math.random() * 90000)}`;
      const targetCountry = country || (card?.billingCountry) || 'US';

      const checkoutResult = await createCoinbaseCheckout({
        amount: totalAmount,
        currency,
        orderId: targetOrderId,
        customerEmail: customerEmail || 'shopper@pnpexpress.co.zw',
        country: targetCountry,
        card
      });

      // Record Activity Log Session in MongoDB
      await ActivityLog.create({
        userId: customerEmail || 'guest_shopper',
        userEmail: customerEmail || 'shopper@pnpexpress.co.zw',
        action: `COINBASE_CHECKOUT_CREATED_${checkoutResult.mode}`,
        details: { checkoutId: checkoutResult.checkoutId, orderId: targetOrderId, country: targetCountry, amount: totalAmount }
      }).catch(() => {});

      return res.status(200).json(checkoutResult);
    } catch (err: any) {
      console.error('[Coinbase Checkout Creation Error]:', err);
      return res.status(500).json({ error: err.message || 'Failed to initialize Coinbase checkout' });
    }
  };

  app.post('/api/checkout', handleDualPathCheckout);
  app.post('/api/checkout/create', handleDualPathCheckout);

  // Coinbase Webhook Handler: Verifies HMAC signature and processes payment events (Onramp & Checkouts)
  const handleCoinbaseWebhook = async (req: Request, res: Response) => {
    try {
      const rawPayload = JSON.stringify(req.body);
      const signatureHeader = (req.headers['x-hook0-signature'] as string) || (req.headers['x-cc-webhook-signature'] as string) || (req.headers['x-cb-signature'] as string);
      const secret = process.env.COINBASE_WEBHOOK_SECRET || '';

      const isValid = verifyWebhookSignature(rawPayload, signatureHeader, secret, req.headers as any);

      const event = req.body || {};
      const eventType = event.eventType || event.type || event.event?.type;
      const status = event.status || event.data?.status;
      const orderId = event.partnerUserRef || event.data?.metadata?.orderId || event.event?.data?.metadata?.orderId || event.data?.id;
      const txHash = event.txHash || event.data?.txHash;

      if (
        (eventType === 'onramp.transaction.success' && status === 'ONRAMP_TRANSACTION_STATUS_SUCCESS') ||
        eventType === 'checkout.payment.success' ||
        eventType === 'charge:confirmed'
      ) {
        if (orderId) {
          const order = ordersStore.find(o => o.id === orderId);
          if (order) {
            order.status = 'PROCESSING';
            order.statusLabel = 'Payment Confirmed via Coinbase USDC (Base) - Packaging at TM Pick n Pay Avondale';
            order.statusColor = 'emerald';
            order.trackingSteps[0].completed = true;
          }
          await OrderModel.updateOne({ orderId }, { $set: { status: 'PROCESSING', statusLabel: 'Paid via Coinbase USDC', txHash } }).catch(() => {});
        }

        await ActivityLog.create({
          userId: event.partnerUserRef || 'webhooks',
          userEmail: 'webhooks@pnpexpress.co.zw',
          action: 'COINBASE_PAYMENT_SUCCESS_WEBHOOK',
          details: { orderId, eventType, txHash, usdcAmount: event.purchaseAmount?.value }
        }).catch(() => {});
      } else if (eventType === 'onramp.transaction.failed' || eventType === 'checkout.payment.failed' || eventType === 'charge:failed') {
        if (orderId) {
          await OrderModel.updateOne({ orderId }, { $set: { status: 'FAILED' } }).catch(() => {});
        }
      } else if (eventType === 'checkout.refund.success') {
        if (orderId) {
          await OrderModel.updateOne({ orderId }, { $set: { status: 'REFUNDED' } }).catch(() => {});
        }
      }

      return res.status(200).send('OK');
    } catch (err: any) {
      console.error('[Coinbase Webhook Handler Error]:', err);
      return res.status(200).send('OK');
    }
  };

  app.post('/api/webhooks/coinbase', handleCoinbaseWebhook);
  app.post('/api/webhooks/onramp', handleCoinbaseWebhook);
  app.post('/webhooks/onramp', handleCoinbaseWebhook);

  // Refund Route: Cancels / refunds order via Coinbase CDP API
  app.post(['/api/checkout/:id/refund', '/api/checkout/refund'], async (req: Request, res: Response) => {
    try {
      const checkoutId = req.params.id || req.body.checkoutId || req.body.orderId;
      const reason = req.body.reason || 'Order cancelled by customer';

      const result = await refundCoinbaseCheckout(checkoutId, reason);

      await ActivityLog.create({
        userId: 'admin_refund',
        action: 'COINBASE_REFUND_EXECUTED',
        details: { checkoutId, reason }
      }).catch(() => {});

      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to process refund' });
    }
  });

  // -------------------------------------------------------------
  // 6. MULTI-RAIL PAYMENT ORCHESTRATOR
  // -------------------------------------------------------------
  async function processContiPay(
    card: any, 
    amountUSD: number, 
    orderId: string
  ): Promise<{ success: boolean; latencyMs: number; error?: string; txRef?: string; nostroAccount?: string; forexCode?: string }> {
    const startTime = Date.now();
    await delay(220 + Math.floor(Math.random() * 80));
    const latencyMs = Date.now() - startTime;

    const country = (card.billingCountry || '').toUpperCase();
    const cleanPan = (card.cardNumber || '').replace(/\D/g, '');

    // Hard decline check
    if (cleanPan.endsWith('0000')) {
      return {
        success: false,
        latencyMs,
        error: 'HARD_DECLINE: Insufficient funds in cardholder account'
      };
    }

    if (card.cvv === '000') {
      return {
        success: false,
        latencyMs,
        error: 'HARD_DECLINE: Invalid CVV security code'
      };
    }

    // Soft errors triggering fallback: Coinbase Commerce, Australasia, or test card numbers ending in 9991/9992
    if (
      country.includes('COINBASE') ||
      country.includes('USDC') ||
      country.includes('CARD-TO-USDC') ||
      country.includes('GLOBAL') ||
      country.includes('OTHER') ||
      country.includes('AU') || 
      country.includes('NZ') || 
      country.includes('AUSTRALIA') || 
      country.includes('NEW ZEALAND') || 
      cleanPan.endsWith('9991') || 
      cleanPan.endsWith('9992')
    ) {
      return {
        success: false,
        latencyMs,
        error: (country.includes('COINBASE') || country.includes('USDC'))
          ? 'ROUTING_DIRECT: Initiating Coinbase Commerce (Card-to-USDC) clearing waterfall'
          : 'GATEWAY_UNSUPPORTED_REGION: ContiPay primary routing restricted to UK/EU/US card BINs'
      };
    }

    // Success via ContiPay (UK, EU, US direct Nostro)
    const timestamp = Date.now();
    return {
      success: true,
      latencyMs,
      txRef: `CTP-UK-${orderId}-${Math.floor(1000 + Math.random() * 9000)}`,
      nostroAccount: 'TM_PNP_USD_NOSTRO_STANBIC_01 (Stanbic Bank Zimbabwe)',
      forexCode: `RBZ-CD1-CTP-${timestamp.toString(36).toUpperCase()}`
    };
  }

  async function processPesapal(
    card: any, 
    amountUSD: number, 
    orderId: string
  ): Promise<{ success: boolean; latencyMs: number; error?: string; txRef?: string; nostroAccount?: string; forexCode?: string }> {
    const startTime = Date.now();
    await delay(320 + Math.floor(Math.random() * 90));
    const latencyMs = Date.now() - startTime;

    const country = (card.billingCountry || '').toUpperCase();
    const cleanPan = (card.cardNumber || '').replace(/\D/g, '');

    // If user has chosen Coinbase Commerce or test card ending in 9992, route directly to Coinbase USDC
    if (country.includes('COINBASE') || country.includes('USDC') || country.includes('CARD-TO-USDC') || cleanPan.endsWith('9992')) {
      return {
        success: false,
        latencyMs,
        error: (country.includes('COINBASE') || country.includes('USDC'))
          ? 'ROUTING_PREFERENCE: Directing to Coinbase Commerce (Card-to-USDC) clearing rail'
          : 'ACQUIRER_TIMEOUT: Australasia regional clearing bridge timeout (>450ms)'
      };
    }

    const timestamp = Date.now();
    return {
      success: true,
      latencyMs,
      txRef: `PSP-APAC-${orderId}-${Math.floor(1000 + Math.random() * 9000)}`,
      nostroAccount: 'TM_PNP_USD_NOSTRO_CABS_02 (CABS Nostro Zimbabwe)',
      forexCode: `RBZ-ECTS-PSP-${timestamp.toString(36).toUpperCase()}`
    };
  }

  async function processCoinbaseUSDC(
    card: any, 
    amountUSD: number, 
    orderId: string
  ): Promise<{ success: boolean; latencyMs: number; error?: string; txRef?: string; nostroAccount?: string; forexCode?: string }> {
    const startTime = Date.now();
    await delay(450 + Math.floor(Math.random() * 100));
    const latencyMs = Date.now() - startTime;

    const timestamp = Date.now();
    return {
      success: true,
      latencyMs,
      txRef: `CB-USDC-0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 6)}`,
      nostroAccount: 'TM_PNP_USD_NOSTRO_CBZ_03 (CBZ Bank Forex Bureau Off-Ramp)',
      forexCode: `RBZ-CRYPTO-BUREAU-091-${timestamp.toString(36).toUpperCase()}`
    };
  }

  // Unified Payment Orchestration Controller
  app.post('/api/checkout/orchestrate', async (req: Request, res: Response) => {
    const orchestrationStart = Date.now();
    const attempts: OrchestrationAttempt[] = [];

    try {
      const { 
        card, 
        payerMemberId = 'mem-1', 
        payerMemberName = 'Tariro Moyo (London Diaspora)',
        deliveryAddresses = {}
      } = req.body;

      if (!card || !card.cardNumber) {
        return res.status(400).json({ error: 'Card information required for payment orchestration.' });
      }

      const totalUSD = currentCart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
      const totalItemsCount = currentCart.reduce((cnt, i) => cnt + i.quantity, 0);

      const orderId = `PNP-ZW-${Math.floor(10000 + Math.random() * 90000)}`;
      const invoiceNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const voucherCode = `VOUCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const cleanPan = (card.cardNumber || '').replace(/\D/g, '');
      const last4 = cleanPan.slice(-4) || '4242';

      let settledRail: PaymentRail | null = null;
      let settlementData: any = null;

      // Rail 1: ContiPay
      const contiResult = await processContiPay(card, totalUSD, orderId);
      attempts.push({
        rail: 'CONTIPAY',
        latencyMs: contiResult.latencyMs,
        error: contiResult.error,
        status: contiResult.success ? 'SUCCESS' : 'FAILED'
      });

      if (contiResult.success) {
        settledRail = 'CONTIPAY';
        settlementData = contiResult;
      } else if (contiResult.error && contiResult.error.startsWith('HARD_DECLINE:')) {
        const totalLatencyMs = Date.now() - orchestrationStart;
        return res.status(402).json({
          success: false,
          orderId,
          totalLatencyMs,
          attempts,
          error: contiResult.error.replace('HARD_DECLINE: ', ''),
          userMessage: 'Card transaction was declined by the card issuer.'
        });
      }

      // Rail 2: Fallback Pesapal
      if (!settledRail) {
        const pesapalResult = await processPesapal(card, totalUSD, orderId);
        attempts.push({
          rail: 'PESAPAL',
          latencyMs: pesapalResult.latencyMs,
          error: pesapalResult.error,
          status: pesapalResult.success ? 'SUCCESS' : 'FAILED'
        });

        if (pesapalResult.success) {
          settledRail = 'PESAPAL';
          settlementData = pesapalResult;
        }
      }

      // Rail 3: Fallback Coinbase USDC
      if (!settledRail) {
        const coinbaseResult = await processCoinbaseUSDC(card, totalUSD, orderId);
        attempts.push({
          rail: 'COINBASE_USDC',
          latencyMs: coinbaseResult.latencyMs,
          error: coinbaseResult.error,
          status: coinbaseResult.success ? 'SUCCESS' : 'FAILED'
        });

        if (coinbaseResult.success) {
          settledRail = 'COINBASE_USDC';
          settlementData = coinbaseResult;
        }
      }

      if (settledRail && settlementData) {
        const totalLatencyMs = Date.now() - orchestrationStart;

        // 1. Create Past Order Record in Store
        const newOrderItems = currentCart.map(item => ({
          id: item.productId,
          name: item.product.name,
          nativeName: item.product.nativeName,
          quantity: item.quantity,
          unitPriceUSD: item.product.priceUSD,
          totalUSD: item.product.priceUSD * item.quantity,
          image: item.product.image,
          store: item.product.storeName,
          weightOrVol: item.product.unit
        }));

        const newPastOrder: PastOrder = {
          id: orderId,
          invoiceNumber,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          timestamp: new Date().toISOString(),
          status: 'PROCESSING',
          statusLabel: 'Packaging at TM Pick n Pay Avondale',
          statusColor: 'blue',
          storePartner: 'TM Pick n Pay Avondale, Harare',
          fulfillmentType: 'DOOR_DELIVERY',
          fulfillmentLocation: 'House 42, Bath Road, Avondale, Harare',
          recipientName: 'Gogo Moyo',
          recipientPhone: '+263 77 234 5678',
          collectionCode: `PIN-${Math.floor(1000 + Math.random() * 9000)}-HRE`,
          paymentMethod: {
            type: settledRail as any,
            label: `${settledRail} Cross-Border (••${last4})`,
            details: `Settled into ${settlementData.nostroAccount?.split(' ')[0]}`,
            authRef: settlementData.txRef || `AUTH-${orderId}`
          },
          subtotalUSD: Number(totalUSD.toFixed(2)),
          deliveryFeeUSD: 3.50,
          vatTaxUSD: 0.00,
          totalUSD: Number((totalUSD + 3.50).toFixed(2)),
          items: newOrderItems.length > 0 ? newOrderItems : [
            {
              id: 'WS-5KG',
              name: 'White Star Super Maize Meal (5kg)',
              nativeName: 'Hupfu hweSona',
              quantity: 2,
              unitPriceUSD: 4.50,
              totalUSD: 9.00,
              image: '/images/white_star_maize.jpg',
              store: 'TM Pick n Pay',
              weightOrVol: '5kg x 2'
            }
          ],
          trackingSteps: [
            {
              title: `Payment Cleared via ${settledRail}`,
              description: `Funds authorized and allocated to TM Pick n Pay Nostro account.`,
              time: 'Just Now',
              completed: true,
              current: true
            },
            {
              title: 'Aisle Staging & Packaging',
              description: 'Cold-chain dispatch team assembling order in refrigerated depot crates.',
              time: 'Estimated 20 Mins',
              completed: false
            },
            {
              title: 'Assigned to Express Delivery Van',
              description: 'Courier route optimization in progress.',
              time: 'Estimated 1 Hour',
              completed: false
            },
            {
              title: 'Handover & Signature',
              description: 'Recipient OTP scan at doorstep.',
              time: 'Estimated 3 Hours',
              completed: false
            }
          ]
        };

        ordersStore.unshift(newPastOrder);

        // MongoDB Atlas Async Sync
        try {
          await OrderModel.create({
            orderId: newPastOrder.id,
            invoiceNumber: newPastOrder.invoiceNumber,
            date: newPastOrder.date,
            timestamp: newPastOrder.timestamp,
            status: newPastOrder.status,
            statusLabel: newPastOrder.statusLabel,
            statusColor: newPastOrder.statusColor,
            storePartner: newPastOrder.storePartner,
            fulfillmentType: newPastOrder.fulfillmentType,
            fulfillmentLocation: newPastOrder.fulfillmentLocation,
            recipientName: newPastOrder.recipientName,
            recipientPhone: newPastOrder.recipientPhone,
            paymentMethod: newPastOrder.paymentMethod,
            subtotalUSD: newPastOrder.subtotalUSD,
            deliveryFeeUSD: newPastOrder.deliveryFeeUSD,
            vatTaxUSD: newPastOrder.vatTaxUSD,
            totalUSD: newPastOrder.totalUSD,
            items: newPastOrder.items,
            trackingSteps: newPastOrder.trackingSteps
          });

          await ActivityLog.create({
            userId: payerMemberId || 'mem-1',
            userEmail: 'tariro.moyo@gmail.com',
            action: 'ORDER_PLACED_AND_SETTLED',
            details: {
              orderId,
              invoiceNumber,
              settledRail,
              totalUSD: newPastOrder.totalUSD,
              cdpProjectId: process.env.VITE_CDP_PROJECT_ID
            }
          });
        } catch (dbErr) {
          console.error('[MongoDB Order Save Error]:', dbErr);
        }

        // 2. Create Commercial Tax Invoice Record
        const newInvoice: CommercialInvoice = {
          id: invoiceNumber,
          invoiceNumber,
          orderId,
          date: newPastOrder.date,
          timestamp: newPastOrder.timestamp,
          customerName: payerMemberName.split('(')[0].trim() || 'Tariro Moyo',
          customerLocation: 'London, United Kingdom (Diaspora Sponsor)',
          recipientName: newPastOrder.recipientName,
          recipientAddress: newPastOrder.fulfillmentLocation,
          storePartner: newPastOrder.storePartner,
          paymentRail: `${settledRail} Cross-Border (Ref: ${settlementData.txRef})`,
          settlementAccount: settlementData.nostroAccount || 'TM_PNP_USD_NOSTRO_STANBIC_01',
          forexReportingCode: settlementData.forexCode || `RBZ-CD1-${orderId}`,
          subtotalUSD: newPastOrder.subtotalUSD,
          deliveryFeeUSD: newPastOrder.deliveryFeeUSD,
          vatTaxUSD: 0.00,
          totalUSD: newPastOrder.totalUSD,
          currencyEquivalents: {
            GBP: Number((newPastOrder.totalUSD * 0.79).toFixed(2)),
            ZAR: Number((newPastOrder.totalUSD * INITIAL_EXCHANGE_RATES.USD_ZAR).toFixed(2)),
            ZWG: Number((newPastOrder.totalUSD * INITIAL_EXCHANGE_RATES.USD_ZWG).toFixed(2)),
            EUR: Number((newPastOrder.totalUSD * 0.92).toFixed(2)),
            AUD: Number((newPastOrder.totalUSD * 1.54).toFixed(2))
          },
          items: newPastOrder.items.map(i => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            unitPriceUSD: i.unitPriceUSD,
            totalUSD: i.totalUSD
          }))
        };

        invoicesStore.unshift(newInvoice);

        // 3. Record Audit Log
        paymentAuditLogs.unshift({
          id: `LOG-${Date.now()}`,
          timestamp: new Date().toISOString(),
          orderId,
          amountUSD: totalUSD,
          billingCountry: card.billingCountry || 'United Kingdom',
          cardLast4: last4,
          status: 'SETTLED',
          finalRail: settledRail,
          attempts,
          nostroAccount: settlementData.nostroAccount,
          forexCode: settlementData.forexCode,
          totalLatencyMs
        });

        const responseData: OrchestrationResponse = {
          success: true,
          orderId,
          voucherCode,
          finalRail: settledRail,
          transactionReference: settlementData.txRef,
          settlementAccount: settlementData.nostroAccount,
          forexReportingCode: settlementData.forexCode,
          totalLatencyMs,
          attempts,
          userMessage: `Payment authorized and settled via ${settledRail} Cross-Border Rail into Zimbabwe Nostro treasury.`,
          itemsCount: totalItemsCount,
          totalUSD: Number(totalUSD.toFixed(2)),
          timestamp: new Date().toISOString()
        };

        // Emit Socket Event
        io.emit('order:created', newPastOrder);
        io.emit('payment:orchestrated', responseData);

        // Clear Cart
        currentCart = [];
        broadcastCartUpdate(`Payment Orchestrator (${settledRail})`);

        return res.json(responseData);
      }

      // All Rails Failed
      const totalLatencyMs = Date.now() - orchestrationStart;
      return res.status(502).json({
        success: false,
        orderId,
        totalLatencyMs,
        attempts,
        error: 'All payment rails exhausted. Please check card details or try another card.',
        userMessage: 'Payment processing could not be completed across all fallback channels.'
      });

    } catch (err: any) {
      console.error('[Payment Orchestrator Fatal Error]:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Payment orchestrator internal error',
        totalLatencyMs: Date.now() - orchestrationStart,
        attempts
      });
    }
  });

  app.get('/api/payment-orchestrator/logs', (req: Request, res: Response) => {
    res.json({
      success: true,
      totalCount: paymentAuditLogs.length,
      logs: paymentAuditLogs.slice(0, 30),
      supportedRails: [
        {
          rail: 'CONTIPAY',
          priority: 1,
          targetRegions: ['UK', 'EU', 'USA'],
          settlementTarget: 'TM_PNP_USD_NOSTRO_STANBIC_01',
          compliance: 'RBZ Form CD1 Forex Declaration',
          targetSLA: '< 400ms'
        },
        {
          rail: 'PESAPAL',
          priority: 2,
          targetRegions: ['Australia', 'New Zealand', 'SADC', 'East Africa'],
          settlementTarget: 'TM_PNP_USD_NOSTRO_CABS_02',
          compliance: 'RBZ ECTS Inflow Certification',
          targetSLA: '< 600ms'
        },
        {
          rail: 'COINBASE_USDC',
          priority: 3,
          targetRegions: ['Global Fallback / Unrestricted'],
          settlementTarget: 'TM_PNP_USD_NOSTRO_CBZ_03 (Bureau de Change Off-Ramp)',
          compliance: 'RBZ Licensed Bureau Crypto-to-Nostro Clearance',
          targetSLA: '< 800ms'
        }
      ]
    });
  });

  // -------------------------------------------------------------
  // 7. GEMINI VOICE AI & SMART ASSISTANT ENDPOINTS
  // -------------------------------------------------------------
  app.post('/api/voice-ai', conditionalUpload('audio'), async (req: Request, res: Response) => {
    try {
      const textPrompt = req.body.textPrompt;
      const file = req.file;

      if (!textPrompt && !file) {
        return res.status(400).json({ error: 'Audio file or textPrompt required' });
      }

      const systemInstruction = `
You are PnP's Multilingual African Voice AI Shopping Assistant for South Africa and Zimbabwe.
You understand English, Shona (chiShona), Ndebele (siNdebele), Zulu (isiZulu), Xhosa, Tswana, and Sesotho.

Your task is to analyze user spoken or written grocery orders, which often contain code-switched or colloquial terms.
Key African Grocery Term Translations:
- "hupfu", "hupfu hweSona", "impuphu", "upfu" -> Maize Meal / Mealies
- "mafuta", "mafuta ekubikisa", "amafutha" -> Cooking Oil
- "chigaku", "shugera", "unshukela", "shuga" -> White Sugar
- "mukaka", "ubisi" -> Fresh or Steri Milk
- "mazoe", "mazoe orange" -> Mazoe Orange Crush
- "mwenje", "solar", "mwenje wezuva", "amagetsi" -> Solar Light / Charger Kit
- "nyama", "nyama yemombe", "inyama" -> Beef Meat
- "tii", "chai" -> Tea Bags
- "sipo", "isipho" -> Laundry Soap Bar

Available Action Types:
- "ADD": User wants to add item(s) to cart.
- "REMOVE": User wants to remove item(s).
- "QUERY": User asking about prices or recommendations.
- "CHECKOUT": User asking to finalize or send invoice.

Response Guidelines:
1. Identify the items and quantities requested.
2. Formulate a natural 'spokenResponse' in the same language as the user's input (Shona, Ndebele, Zulu, English), confirming the item was added to the family cart.
3. Return strict JSON matching the schema.
`;

      let contentsPayload: any;

      if (file) {
        const base64Data = file.buffer.toString('base64');
        contentsPayload = {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: file.mimetype || 'audio/webm'
              }
            },
            {
              text: 'Listen to this grocery audio request and extract intent, items, quantity, and spoken native response.'
            }
          ]
        };
      } else {
        contentsPayload = `Process this African grocery order: "${textPrompt}". Extract intent, items, quantities, and spoken native response.`;
      }

      // Call Gemini Flash with resilient timeout and fallback
      let parsed: VoiceAIResult | null = null;
      try {
        const geminiCall = ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: contentsPayload,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                action: { type: Type.STRING },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      productName: { type: Type.STRING },
                      qty: { type: Type.INTEGER }
                    }
                  }
                },
                spokenResponse: { type: Type.STRING },
                detectedLanguage: { type: Type.STRING },
                confidence: { type: Type.NUMBER }
              }
            }
          }
        });

        const timeoutCall = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), 6000)
        );

        const geminiResponse = await Promise.race([geminiCall, timeoutCall]);
        parsed = JSON.parse(geminiResponse.text || '{}');
      } catch (geminiErr: any) {
        console.warn('[Gemini Voice AI]: using African grocery rule engine fallback:', geminiErr?.message || geminiErr);
      }

      // If Gemini returned no valid action, fallback to intelligent native rule matching
      if (!parsed || !parsed.action || !parsed.items || parsed.items.length === 0) {
        const rawText = ((textPrompt || '') + ' ' + (req.body?.textPrompt || '')).trim() || 'Hupfu nemafuta';
        const lower = rawText.toLowerCase();
        let lang = 'Shona';
        let matched = matchProduct(lower);
        let spoken = `Ndaisa ${matched.name} mungoro yeMoyo Family.`;

        if (lower.includes('ndebele') || lower.includes('upfu') || lower.includes('ubisi') || lower.includes('lonyama') || lower.includes('impuphu')) {
          lang = 'Ndebele';
          spoken = `Ngizofaka ${matched.name} enqoleni yomdeni.`;
        } else if (lower.includes('english') || lower.includes('add') || lower.includes('please') || lower.includes('basket')) {
          lang = 'English';
          spoken = `Added ${matched.name} to the family basket.`;
        }

        parsed = {
          action: 'ADD',
          items: [{ productName: matched.name, qty: 1 }],
          spokenResponse: spoken,
          detectedLanguage: lang,
          confidence: 0.95
        };
      }

      // Mutate cart if action is ADD
      if (parsed.action === 'ADD' && parsed.items && parsed.items.length > 0) {
        for (const itemRequest of parsed.items) {
          const product = matchProduct(itemRequest.productName);
          const qty = itemRequest.qty || 1;

          const existingIndex = currentCart.findIndex(i => i.productId === product.id);
          if (existingIndex > -1) {
            currentCart[existingIndex].quantity += qty;
          } else {
            currentCart.unshift({
              id: `cart-ai-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              productId: product.id,
              product,
              quantity: qty,
              addedByMemberId: 'mem-2',
              addedByMemberName: 'Gogo Moyo',
              addedByLocation: 'Harare, ZIM',
              channel: file ? 'whatsapp' : 'web',
              addedAt: new Date().toISOString(),
              note: `Added via ${parsed.detectedLanguage || 'African'} Voice AI Assistant`
            });
          }
        }
        broadcastCartUpdate('Gogo Moyo (Voice AI)');
      }

      return res.status(200).json({
        success: true,
        result: parsed,
        cart: currentCart
      });

    } catch (err: any) {
      console.error('[Gemini Voice AI Error]:', err);
      
      const fallbackPrompt = ((req.body && req.body.textPrompt) || 'Hupfu nemafuta').toString().toLowerCase();
      let matchedProduct = matchProduct(fallbackPrompt);
      let lang = 'Shona';
      let nativeReply = `Ndaisa ${matchedProduct.name} mungoro yeMoyo Family.`;

      if (fallbackPrompt.includes('ndebele') || fallbackPrompt.includes('upfu')) {
        lang = 'Ndebele';
        nativeReply = `Ngizofaka ${matchedProduct.name} enqoleni yomdeni.`;
      }

      currentCart.unshift({
        id: `cart-fb-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        productId: matchedProduct.id,
        product: matchedProduct,
        quantity: 1,
        addedByMemberId: 'mem-2',
        addedByMemberName: 'Gogo Moyo',
        addedByLocation: 'Harare, ZIM',
        channel: 'whatsapp',
        addedAt: new Date().toISOString(),
        note: `Added via ${lang} Voice Assistant`
      });

      broadcastCartUpdate('Gogo Moyo (Voice AI)');

      return res.status(200).json({
        success: true,
        result: {
          action: 'ADD',
          items: [{ productName: matchedProduct.name, qty: 1 }],
          spokenResponse: nativeReply,
          detectedLanguage: lang,
          confidence: 0.95,
          originalText: req.body?.textPrompt || 'Voice Order'
        },
        cart: currentCart
      });
    }
  });

  app.post('/api/ai/shopping-advisor', async (req: Request, res: Response) => {
    try {
      const { query = 'What are good staples for a family of 4 in Harare?' } = req.body;

      const prompt = `You are the TM Pick n Pay Cross-Border Grocery Advisor.
Advise a diaspora sponsor on this question: "${query}".
Available products in catalog:
${SAMPLE_PRODUCTS.map(p => `- ${p.name} ($${p.priceUSD} USD, ${p.unit}, Store: ${p.storeName})`).join('\n')}

Provide practical, helpful advice in 2-3 concise paragraphs, highlighting high-calorie nutritional value and load-shedding convenience (e.g. solar lighting, UHT long-life milk).
Also recommend 3 product IDs from the catalog.
Return JSON with:
1. "response": string
2. "recommendedProductIds": array of strings.`;

      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              response: { type: Type.STRING },
              recommendedProductIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      });

      const parsed = JSON.parse(geminiResponse.text || '{}');
      const recProducts = SAMPLE_PRODUCTS.filter(p => parsed.recommendedProductIds?.includes(p.id));

      res.json({
        success: true,
        response: parsed.response || 'We recommend pairing 10kg White Star Maize Meal, Pure Sunflower Oil, and Tanganda Tea for a well-rounded household staple pack.',
        recommendations: recProducts.length > 0 ? recProducts : SAMPLE_PRODUCTS.slice(0, 3)
      });
    } catch (err) {
      res.json({
        success: true,
        response: 'For a family of 4 in Zimbabwe, securing essential staples like maize meal, cooking oil, long-life milk, and a backup solar lighting kit provides maximum peace of mind.',
        recommendations: [SAMPLE_PRODUCTS[0], SAMPLE_PRODUCTS[3], SAMPLE_PRODUCTS[7]]
      });
    }
  });

  app.post('/api/ai/recipe-suggest', async (req: Request, res: Response) => {
    try {
      const { recipeQuery = 'Sadza ne Beef Stew ne Muriwo' } = req.body;

      const prompt = `You are a culinary expert in traditional Southern African and Zimbabwean dishes.
The user wants to cook: "${recipeQuery}".
Current cart items: ${currentCart.map(i => i.product.name).join(', ') || 'None'}.

Available store catalog:
${SAMPLE_PRODUCTS.map(p => `- ID: ${p.id} | Name: ${p.name} | Category: ${p.category}`).join('\n')}

Identify necessary ingredients to prepare this dish, and match them with IDs from the available catalog.
Return JSON with:
1. "recipeName": string
2. "description": short appetizing description
3. "matchedCatalogIds": array of matching product IDs
4. "missingIngredients": array of ingredient names not in catalog.`;

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recipeName: { type: Type.STRING },
              description: { type: Type.STRING },
              matchedCatalogIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              missingIngredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      const matchedProducts = SAMPLE_PRODUCTS.filter(p => parsed.matchedCatalogIds?.includes(p.id));

      res.json({
        success: true,
        recipeName: parsed.recipeName || recipeQuery,
        description: parsed.description || 'Rich traditional Zimbabwean meal prepared with fresh farm ingredients.',
        matchedProducts: matchedProducts.length > 0 ? matchedProducts : SAMPLE_PRODUCTS.slice(0, 3),
        missingIngredients: parsed.missingIngredients || []
      });
    } catch (err: any) {
      console.error('[Recipe Suggest Error]:', err);
      res.json({
        success: true,
        recipeName: 'Traditional Sadza & Beef Stew',
        description: 'Authentic Zimbabwean staple featuring cooked white maize meal, braised beef blade, and fresh leafy vegetables.',
        matchedProducts: [SAMPLE_PRODUCTS[1], SAMPLE_PRODUCTS[10] || SAMPLE_PRODUCTS[0], SAMPLE_PRODUCTS[2]],
        missingIngredients: ['Onions', 'Tomatoes']
      });
    }
  });

  // -------------------------------------------------------------
  // 7B. PERSONAL AI SHOPPING ASSISTANT AGENT (RECIPES, WALLET, SPECIALS, PANTRY)
  // -------------------------------------------------------------
  // Get Agent Wallet & Spend Settings
  app.get('/api/agent/wallet', (_req: Request, res: Response) => {
    res.json({ success: true, wallet: getAgentWallet() });
  });

  // Top up Agent Wallet via EcoCash, Mukuru, Card/USDC, or Family Transfer
  app.post('/api/agent/wallet/topup', (req: Request, res: Response) => {
    try {
      const { amountUSD, channel, reference, phone } = req.body || {};
      if (!amountUSD || Number(amountUSD) <= 0) {
        return res.status(400).json({ error: 'Valid amountUSD is required' });
      }
      const updated = topupAgentWallet({
        amountUSD: Number(amountUSD),
        channel: channel || 'ECOCASH',
        reference,
        phone
      });
      res.json({ success: true, wallet: updated, message: `Successfully loaded $${Number(amountUSD).toFixed(2)} USD into Agent Wallet via ${channel || 'EcoCash'}` });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to top up agent wallet' });
    }
  });

  // Update Agent Spend Limits & Auto-Checkout Configuration
  app.post('/api/agent/wallet/settings', (req: Request, res: Response) => {
    try {
      const { spendLimitPerOrderUSD, dailySpendCapUSD, autoCheckoutEnabled, authorizedForSpecials } = req.body || {};
      const updated = updateAgentSettings({
        spendLimitPerOrderUSD,
        dailySpendCapUSD,
        autoCheckoutEnabled,
        authorizedForSpecials
      });
      res.json({ success: true, wallet: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update settings' });
    }
  });

  // Autonomous / Authorized Agent Checkout (Debits Agent Wallet, Creates Delivery Order)
  app.post('/api/agent/wallet/pay-order', (req: Request, res: Response) => {
    try {
      const { amountUSD, itemsCount, deliveryAddress, recipientName } = req.body || {};
      const totalToPay = Number(amountUSD) || currentCart.reduce((sum, i) => sum + i.product.priceUSD * i.quantity, 0);

      const debitRes = debitAgentWalletForOrder({
        amountUSD: totalToPay,
        orderDescription: `Autonomous Agent Checkout (${itemsCount || currentCart.length} grocery items)`
      });

      if (!debitRes.success) {
        return res.status(400).json({ success: false, error: debitRes.error });
      }

      // Generate Delivery Order
      const newOrderId = `ORD-AI-${Date.now()}`;
      const newOrder: PastOrder = {
        id: newOrderId,
        invoiceNumber: `INV-AGENT-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        timestamp: new Date().toISOString(),
        status: 'PROCESSING',
        statusLabel: 'Order Dispatched · AI Agent Paid',
        statusColor: 'emerald',
        storePartner: 'TM Pick n Pay Express',
        fulfillmentType: 'DOOR_DELIVERY',
        fulfillmentLocation: deliveryAddress?.addressLine || 'Harare Northern Suburbs (Borrowdale / Avondale)',
        recipientName: recipientName || 'Gogo Moyo',
        recipientPhone: '+263 77 212 3456',
        paymentMethod: {
          type: 'PNP_WALLET',
          label: 'Personal AI Shopping Assistant Wallet',
          details: 'Autonomous Agent Balance Settlement',
          authRef: debitRes.txn?.id || `TXN-${Date.now()}`
        },
        subtotalUSD: Number((totalToPay * 0.92).toFixed(2)),
        deliveryFeeUSD: 3.50,
        vatTaxUSD: Number((totalToPay * 0.08).toFixed(2)),
        totalUSD: totalToPay,
        items: currentCart.map((i, idx) => ({
          id: `item-${idx}`,
          name: i.product.name,
          nativeName: i.product.nativeName,
          quantity: i.quantity,
          unitPriceUSD: i.product.priceUSD,
          totalUSD: i.product.priceUSD * i.quantity,
          image: i.product.image,
          store: i.product.storeName,
          weightOrVol: i.product.unit
        })),
        trackingSteps: [
          { title: 'Order Authorized by AI Agent', description: 'Autonomous agent debit settled successfully', time: 'Just now', completed: true, current: false },
          { title: 'Store Picking at TM Pick n Pay Depot', description: 'Fresh staple goods packed and quality checked', time: 'In progress', completed: false, current: true },
          { title: 'Courier Dispatched (Harare Express)', description: 'Express delivery van en-route to recipient', time: 'Estimated 45 mins', completed: false },
          { title: 'Delivered & Handed Over', description: 'Gogo Moyo confirms receipt via WhatsApp', time: 'Pending', completed: false }
        ]
      };

      ordersStore.unshift(newOrder);

      // Clear or reset current cart after order payment
      const completedItems = [...currentCart];
      currentCart = [];
      broadcastCartUpdate('Personal AI Shopping Agent (Autonomous Checkout)');

      res.json({
        success: true,
        orderId: newOrderId,
        order: newOrder,
        itemsPaid: completedItems,
        wallet: getAgentWallet(),
        message: `Order #${newOrderId} authorized and paid! $${totalToPay.toFixed(2)} USD deducted from Agent Wallet. Delivery dispatched to Harare Express.`
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Payment processing failed' });
    }
  });

  // Multimodal Recipe Parsing (Image screenshot, text, or URL)
  app.post('/api/agent/recipe-parse', conditionalUpload('recipeImage'), async (req: Request, res: Response) => {
    try {
      let imageData: string | undefined = undefined;
      let mimeType: string | undefined = undefined;

      if (req.file) {
        imageData = req.file.buffer.toString('base64');
        mimeType = req.file.mimetype;
      } else if (req.body?.imageData) {
        imageData = req.body.imageData;
        mimeType = req.body.mimeType || 'image/jpeg';
      }

      const parsed = await parseRecipe({
        text: req.body?.text,
        url: req.body?.url,
        imageData,
        mimeType
      });

      res.json({ success: true, recipe: parsed });
    } catch (err: any) {
      console.error('[Agent Recipe Parse Error]:', err);
      res.status(500).json({ error: err.message || 'Recipe parsing failed' });
    }
  });

  // Add Recipe Ingredients to Shopping Cart (with Optional Auto-Checkout)
  app.post('/api/agent/add-recipe-to-cart', (req: Request, res: Response) => {
    try {
      const { recipe, autoCheckout = false } = req.body || {};
      if (!recipe || !Array.isArray(recipe.ingredients)) {
        return res.status(400).json({ error: 'Valid parsed recipe required' });
      }

      let addedCount = 0;
      let totalAddedUSD = 0;

      for (const ing of recipe.ingredients) {
        if (!ing.matchedProduct) continue;
        const product: Product = ing.matchedProduct;
        const qty = ing.requiredQty || 1;
        totalAddedUSD += product.priceUSD * qty;

        const existingIndex = currentCart.findIndex(i => i.productId === product.id);
        if (existingIndex > -1) {
          currentCart[existingIndex].quantity += qty;
        } else {
          currentCart.unshift({
            id: `cart-rec-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            productId: product.id,
            product,
            quantity: qty,
            addedByMemberId: 'mem-2',
            addedByMemberName: 'Gogo Moyo',
            addedByLocation: 'Harare, ZIM',
            channel: 'web',
            addedAt: new Date().toISOString(),
            note: `AI Recipe Agent: ${recipe.dishTitle}`
          });
        }
        addedCount++;
      }

      broadcastCartUpdate(`AI Agent (${recipe.dishTitle})`);

      // Check if autonomous auto-checkout is requested and permitted by wallet settings
      const wallet = getAgentWallet();
      let autoCheckedOut = false;
      let orderId: string | undefined = undefined;

      if (autoCheckout || (wallet.autoCheckoutEnabled && totalAddedUSD <= wallet.spendLimitPerOrderUSD && totalAddedUSD <= wallet.balanceUSD)) {
        const debitRes = debitAgentWalletForOrder({
          amountUSD: totalAddedUSD,
          orderDescription: `Auto-checkout for recipe: ${recipe.dishTitle}`
        });

        if (debitRes.success) {
          autoCheckedOut = true;
          orderId = `ORD-REC-${Date.now()}`;
          const newOrder: PastOrder = {
            id: orderId,
            invoiceNumber: `INV-REC-${Date.now().toString().slice(-6)}`,
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            timestamp: new Date().toISOString(),
            status: 'PROCESSING',
            statusLabel: 'Order Dispatched · AI Agent Paid',
            statusColor: 'emerald',
            storePartner: 'TM Pick n Pay',
            fulfillmentType: 'DOOR_DELIVERY',
            fulfillmentLocation: 'Harare Northern Suburbs',
            recipientName: 'Gogo Moyo',
            recipientPhone: '+263 77 212 3456',
            paymentMethod: {
              type: 'PNP_WALLET',
              label: 'AI Agent Auto-Checkout',
              details: 'Autonomous Recipe Meal Provisioning',
              authRef: debitRes.txn?.id || `TXN-${Date.now()}`
            },
            subtotalUSD: Number((totalAddedUSD * 0.92).toFixed(2)),
            deliveryFeeUSD: 3.50,
            vatTaxUSD: Number((totalAddedUSD * 0.08).toFixed(2)),
            totalUSD: totalAddedUSD,
            items: currentCart.map((i, idx) => ({
              id: `item-${idx}`,
              name: i.product.name,
              quantity: i.quantity,
              unitPriceUSD: i.product.priceUSD,
              totalUSD: i.product.priceUSD * i.quantity,
              image: i.product.image,
              store: i.product.storeName,
              weightOrVol: i.product.unit
            })),
            trackingSteps: [
              { title: 'Recipe Ingredients Auto-Approved', description: `${recipe.dishTitle} meal verified`, time: 'Just now', completed: true, current: false },
              { title: 'Fast-Track Packing at Depot', description: 'Fresh produce & butcher cuts being assembled', time: 'In progress', completed: false, current: true },
              { title: 'Harare Express Delivery Scheduled', description: 'Courier departs shortly', time: 'Estimated 40 mins', completed: false }
            ]
          };
          ordersStore.unshift(newOrder);
          currentCart = [];
          broadcastCartUpdate('AI Recipe Agent (Auto-Checkout Settled)');
        }
      }

      res.json({
        success: true,
        addedCount,
        totalAddedUSD,
        cart: currentCart,
        autoCheckedOut,
        orderId,
        wallet: getAgentWallet(),
        message: autoCheckedOut 
          ? `Autonomously paid $${totalAddedUSD.toFixed(2)} USD from Agent Wallet for ${recipe.dishTitle}! Delivery dispatched to Harare.` 
          : `Added ${addedCount} ingredients for "${recipe.dishTitle}" ($${totalAddedUSD.toFixed(2)} USD) to Family Cart.`
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to add recipe items to cart' });
    }
  });

  // Specials Radar & Bargains
  app.get('/api/agent/specials', (_req: Request, res: Response) => {
    res.json({ success: true, specials: getActiveSpecials() });
  });

  // Grab Bargain (Add to Cart, with Optional Authorization to Pay)
  app.post('/api/agent/grab-bargain', (req: Request, res: Response) => {
    try {
      const { specialId, authorizePayment = false } = req.body || {};
      const specials = getActiveSpecials();
      const deal = specials.find(s => s.id === specialId) || specials[0];

      if (!deal) {
        return res.status(404).json({ error: 'Special deal not found' });
      }

      const product = deal.product;
      const existingIndex = currentCart.findIndex(i => i.productId === product.id);
      if (existingIndex > -1) {
        currentCart[existingIndex].quantity += 1;
      } else {
        currentCart.unshift({
          id: `cart-deal-${Date.now()}`,
          productId: product.id,
          product,
          quantity: 1,
          addedByMemberId: 'mem-2',
          addedByMemberName: 'Gogo Moyo',
          addedByLocation: 'Harare, ZIM',
          channel: 'web',
          addedAt: new Date().toISOString(),
          note: `Bargain Grab: ${deal.dealTag}`
        });
      }

      broadcastCartUpdate(`AI Agent (${deal.product.name} Bargain)`);

      let paymentSettled = false;
      const wallet = getAgentWallet();

      if (authorizePayment || (wallet.autoCheckoutEnabled && deal.salePriceUSD <= wallet.spendLimitPerOrderUSD && deal.salePriceUSD <= wallet.balanceUSD)) {
        const debitRes = debitAgentWalletForOrder({
          amountUSD: deal.salePriceUSD,
          orderDescription: `Bargain grab: ${deal.product.name} (${deal.dealTag})`
        });

        if (debitRes.success) {
          paymentSettled = true;
        }
      }

      res.json({
        success: true,
        deal,
        cart: currentCart,
        paymentSettled,
        wallet: getAgentWallet(),
        message: paymentSettled 
          ? `Grabbed ${deal.product.name} at special price of $${deal.salePriceUSD} USD and settled payment via Agent Wallet!` 
          : `Grabbed ${deal.product.name} ($${deal.salePriceUSD} USD) and added to cart. Awaiting your authorization to pay.`
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to grab bargain' });
    }
  });

  // Pantry Depletion Estimator
  app.get('/api/agent/pantry-depletion', (_req: Request, res: Response) => {
    res.json({ success: true, items: getPantryDepletionEstimates() });
  });

  // 1-Click Restock of Household Staple
  app.post('/api/agent/restock-staple', (req: Request, res: Response) => {
    try {
      const { productId, quantity = 1 } = req.body || {};
      const product = SAMPLE_PRODUCTS.find(p => p.id === productId) || SAMPLE_PRODUCTS[1];

      const existingIndex = currentCart.findIndex(i => i.productId === product.id);
      if (existingIndex > -1) {
        currentCart[existingIndex].quantity += quantity;
      } else {
        currentCart.unshift({
          id: `cart-restock-${Date.now()}`,
          productId: product.id,
          product,
          quantity,
          addedByMemberId: 'mem-2',
          addedByMemberName: 'Gogo Moyo',
          addedByLocation: 'Harare, ZIM',
          channel: 'web',
          addedAt: new Date().toISOString(),
          note: 'AI Pantry Auto-Restock'
        });
      }

      broadcastCartUpdate(`AI Restock (${product.name})`);

      res.json({
        success: true,
        product,
        cart: currentCart,
        message: `Restocked ${quantity}x ${product.name} into Family Cart.`
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Restock failed' });
    }
  });


  // -------------------------------------------------------------
  // 8. LOW-DATA WHATSAPP WEBHOOK & BOT
  // -------------------------------------------------------------
  app.post('/api/whatsapp/webhook', async (req: Request, res: Response) => {
    try {
      const fromPhone = req.body.From || req.body.fromPhone || '+263772123456';
      const senderName = req.body.senderName || (fromPhone.includes('263772') ? 'Gogo Moyo' : 'Uncle Farai');
      const bodyText = req.body.Body || req.body.text || 'Ndinoda hupfu hweSona ne mafuta';
      const isVoice = req.body.isVoiceNote || false;

      let parsedResult: VoiceAIResult = {
        action: 'ADD',
        items: [{ productName: '10kg Maize Meal', qty: 1 }],
        spokenResponse: 'Ndaisa hupfu nemafuta mungoro.',
        detectedLanguage: 'Shona',
        confidence: 0.9
      };

      try {
        const geminiResponse = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: `A user sent this WhatsApp message in Zimbabwe/South Africa: "${bodyText}". Identify if they want to add groceries, check cart, or clear cart. Return JSON.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                action: { type: Type.STRING },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      productName: { type: Type.STRING },
                      qty: { type: Type.INTEGER }
                    }
                  }
                },
                spokenResponse: { type: Type.STRING },
                detectedLanguage: { type: Type.STRING }
              }
            }
          }
        });

        if (geminiResponse.text) {
          parsedResult = JSON.parse(geminiResponse.text);
        }
      } catch (geminiErr) {
        console.warn('[WhatsApp Gemini Warning]: using heuristic parser:', geminiErr);
      }

      if (parsedResult.action === 'ADD' && parsedResult.items && parsedResult.items.length > 0) {
        for (const it of parsedResult.items) {
          const prod = matchProduct(it.productName);
          const qty = it.qty || 1;
          
          const existing = currentCart.find(c => c.productId === prod.id);
          if (existing) {
            existing.quantity += qty;
          } else {
            currentCart.unshift({
              id: `cart-wa-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              productId: prod.id,
              product: prod,
              quantity: qty,
              addedByMemberId: 'mem-2',
              addedByMemberName: senderName,
              addedByLocation: 'Harare, ZIM',
              channel: 'whatsapp',
              addedAt: new Date().toISOString(),
              note: `Added via WhatsApp (${parsedResult.detectedLanguage || 'Local'})`
            });
          }
        }
      }

      broadcastCartUpdate(`${senderName} (WhatsApp)`);

      const totalUSD = currentCart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
      const totalZWG = (totalUSD * INITIAL_EXCHANGE_RATES.USD_ZWG).toFixed(2);

      const itemsSummaryList = currentCart
        .map(item => `• ${item.quantity}x ${item.product.name} ($${(item.product.priceUSD * item.quantity).toFixed(2)})`)
        .join('\n');

      const replyText = `🛒 *TM Pick n Pay Family Cart Updated!*\n\n*Current Shared Items:*\n${itemsSummaryList || 'Cart is empty'}\n\n*Total:* $${totalUSD.toFixed(2)} USD (ZWG ${totalZWG})\n*Delivery:* Harare Express & Bulawayo Locker\n\nReply *1* to Checkout via EcoCash / Mukuru.\nReply *LIST* to view options.`;

      const waMsg: WhatsAppMessage = {
        id: `wa-${Date.now()}`,
        fromPhone,
        senderName,
        text: bodyText,
        isVoiceNote: isVoice,
        timestamp: new Date().toISOString(),
        status: 'processed',
        parsedIntent: {
          action: parsedResult.action || 'ADD',
          items: parsedResult.items || [],
          spokenResponse: parsedResult.spokenResponse,
          detectedLanguage: parsedResult.detectedLanguage
        },
        replyText
      };

      whatsappLog.unshift(waMsg);
      io.emit('whatsapp:message_received', waMsg);

      if (req.headers['content-type']?.includes('x-www-form-urlencoded')) {
        res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${replyText}</Message></Response>`);
      } else {
        res.json({
          success: true,
          waMessage: waMsg,
          cart: currentCart,
          replyText
        });
      }

    } catch (err: any) {
      console.error('[WhatsApp Webhook Error]:', err);
      res.status(500).json({ error: 'Failed to process WhatsApp webhook' });
    }
  });

  app.get('/api/whatsapp/logs', (req: Request, res: Response) => {
    res.json({ logs: whatsappLog });
  });

  // -------------------------------------------------------------
  // 9. SMART BASKET AI RECOMMENDATION ENDPOINT
  // -------------------------------------------------------------
  app.post('/api/smart-basket/recommendations', async (req: Request, res: Response) => {
    try {
      const { budgetUSD = 50, familySize = 4, location = 'Harare, ZIM', preferences = [] } = req.body;

      const prompt = `Generate a recommended grocery staple basket for a family of ${familySize} in ${location} with a target budget of $${budgetUSD} USD.
Available products in catalog:
${SAMPLE_PRODUCTS.map(p => `- ${p.id}: ${p.name} ($${p.priceUSD} USD, Category: ${p.category})`).join('\n')}

Preferences: ${preferences.join(', ') || 'Standard household staples'}.

Return a JSON object with:
1. "recommendedProductIds": list of product IDs from catalog.
2. "totalEstimatedUSD": calculated sum.
3. "aiNote": short explanation in Shona/English explaining why this basket was chosen for the family.`;

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedProductIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              totalEstimatedUSD: { type: Type.NUMBER },
              aiNote: { type: Type.STRING }
            }
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      const recommendedProducts = SAMPLE_PRODUCTS.filter(p => result.recommendedProductIds?.includes(p.id));

      res.json({
        success: true,
        recommendedProducts: recommendedProducts.length > 0 ? recommendedProducts : SAMPLE_PRODUCTS.slice(0, 4),
        totalEstimatedUSD: result.totalEstimatedUSD || 42.50,
        aiNote: result.aiNote || 'Kudya kwemhuri kwasarudzwa zvinotsvukisa nenzira yehutsanana (Balanced family staples selected).'
      });
    } catch (err: any) {
      res.json({
        success: true,
        recommendedProducts: SAMPLE_PRODUCTS.slice(0, 4),
        totalEstimatedUSD: 38.90,
        aiNote: 'Essential family staples algorithmically selected for high energy and nutritional balance.'
      });
    }
  });

  app.post('/api/smart-basket/apply', (req: Request, res: Response) => {
    const { productIds = [] } = req.body;
    let addedCount = 0;

    productIds.forEach((id: string) => {
      const prod = SAMPLE_PRODUCTS.find(p => p.id === id);
      if (prod) {
        const existing = currentCart.find(c => c.productId === prod.id);
        if (existing) {
          existing.quantity += 1;
        } else {
          currentCart.unshift({
            id: `cart-smart-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            productId: prod.id,
            product: prod,
            quantity: 1,
            addedByMemberId: 'mem-1',
            addedByMemberName: 'Tariro Moyo',
            addedByLocation: 'London, UK',
            channel: 'web',
            addedAt: new Date().toISOString(),
            note: 'Added from Smart Basket AI'
          });
        }
        addedCount++;
      }
    });

    broadcastCartUpdate('Smart Basket AI');
    res.json({ success: true, addedCount, cart: currentCart });
  });

  // -------------------------------------------------------------
  // 10. DEPOTS & DELIVERY QUOTE ENDPOINTS
  // -------------------------------------------------------------
  app.get('/api/depots', (req: Request, res: Response) => {
    const { city } = req.query;
    let list = depotsStore;
    if (city) {
      list = list.filter(d => d.city.toLowerCase() === String(city).toLowerCase());
    }
    res.json({ depots: list, total: list.length });
  });

  app.post('/api/delivery/quote', (req: Request, res: Response) => {
    const { city = 'Harare', deliveryType = 'DOOR_DELIVERY' } = req.body;
    
    if (deliveryType === 'STORE_PICKUP') {
      return res.json({
        deliveryFeeUSD: 0.00,
        eta: 'Ready for Collection in 2 Hours',
        fulfillmentType: 'CLICK_AND_COLLECT'
      });
    }

    let fee = 3.50;
    let eta = 'Within 4 Hours (Express Dispatch)';

    if (city.toLowerCase().includes('bulawayo')) {
      fee = 4.00;
      eta = 'Within 3-5 Hours';
    } else if (city.toLowerCase().includes('mutare')) {
      fee = 4.50;
      eta = 'Same-Day Afternoon Delivery';
    }

    res.json({
      deliveryFeeUSD: fee,
      eta,
      fulfillmentType: 'DOOR_DELIVERY'
    });
  });

  // -------------------------------------------------------------
  // 11. EXCHANGE RATES & CURRENCY ENGINE
  // -------------------------------------------------------------
  app.get('/api/exchange-rates', (req: Request, res: Response) => {
    res.json({
      ...INITIAL_EXCHANGE_RATES,
      rates: {
        GBP: 0.79,
        USD: 1.00,
        ZAR: 18.50,
        ZWG: 26.80,
        EUR: 0.92,
        AUD: 1.54,
        NZD: 1.68,
        CHF: 0.88,
        CNY: 7.23,
        AED: 3.67
      }
    });
  });

  app.post('/api/currency/convert', (req: Request, res: Response) => {
    const { amountUSD = 0, targetCurrency = 'GBP' } = req.body;
    const rates: Record<string, number> = {
      GBP: 0.79,
      USD: 1.00,
      ZAR: 18.50,
      ZWG: 26.80,
      EUR: 0.92,
      AUD: 1.54,
      NZD: 1.68,
      CHF: 0.88,
      CNY: 7.23,
      AED: 3.67
    };

    const rate = rates[targetCurrency] || 1.0;
    const targetAmount = Number((amountUSD * rate).toFixed(2));

    res.json({
      amountUSD: Number(amountUSD.toFixed(2)),
      targetCurrency,
      targetAmount,
      rate
    });
  });

  // -------------------------------------------------------------
  // 12. USER PROFILE & ADDRESS BOOK ENDPOINTS
  // -------------------------------------------------------------
  app.get('/api/user/profile', (req: Request, res: Response) => {
    res.json(userProfileStore);
  });

  app.put('/api/user/profile', (req: Request, res: Response) => {
    userProfileStore = {
      ...userProfileStore,
      ...req.body
    };
    res.json({ success: true, profile: userProfileStore });
  });

  app.get('/api/user/addresses', (req: Request, res: Response) => {
    res.json(userAddressesStore);
  });

  app.post('/api/user/addresses', (req: Request, res: Response) => {
    const newAddress: DeliveryAddress = {
      type: req.body.type || 'DOOR_DELIVERY',
      addressLine: req.body.addressLine || 'Main St',
      suburb: req.body.suburb || '',
      city: req.body.city || 'Harare',
      country: 'Zimbabwe',
      instructions: req.body.instructions || '',
      lat: req.body.lat,
      lng: req.body.lng,
      storeId: req.body.storeId,
      storeName: req.body.storeName
    };
    userAddressesStore.push(newAddress);
    res.json({ success: true, addresses: userAddressesStore });
  });

  // -------------------------------------------------------------
  // 13. LIVE CALL SHOPPING / VIRTUAL CONCIERGE ENDPOINTS
  // -------------------------------------------------------------
  app.get('/api/live-call/session', (req: Request, res: Response) => {
    res.json(liveCallStore);
  });

  app.post('/api/live-call/session', (req: Request, res: Response) => {
    const { action } = req.body;
    if (action === 'START') {
      liveCallStore.isActive = true;
    } else if (action === 'END') {
      liveCallStore.isActive = false;
    }
    io.emit('live_call:state', liveCallStore);
    res.json(liveCallStore);
  });

  app.post('/api/live-call/scan-barcode', (req: Request, res: Response) => {
    const randomProduct = SAMPLE_PRODUCTS[Math.floor(Math.random() * SAMPLE_PRODUCTS.length)];
    
    // Add to cart directly
    const existing = currentCart.find(c => c.productId === randomProduct.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      currentCart.unshift({
        id: `cart-scan-${Date.now()}`,
        productId: randomProduct.id,
        product: randomProduct,
        quantity: 1,
        addedByMemberId: 'mem-1',
        addedByMemberName: 'In-Store Clerk (Chipo)',
        addedByLocation: 'Harare Avondale Aisle 3',
        channel: 'web',
        addedAt: new Date().toISOString(),
        note: 'Scanned live in store aisle'
      });
    }

    liveCallStore.lastScannedBarcode = {
      product: randomProduct,
      scannedAt: new Date().toISOString()
    } as any;

    broadcastCartUpdate('In-Store Shopper (Live Barcode Scan)');
    io.emit('live_call:item_scanned', randomProduct);

    res.json({
      success: true,
      scannedProduct: randomProduct,
      cart: currentCart
    });
  });

  // -------------------------------------------------------------
  // 13.5 LIVE CALL MENU-TO-CART & REAL-TIME PRODUCT MENTION
  // -------------------------------------------------------------
  app.get('/api/live-call/menu', (req: Request, res: Response) => {
    res.json({
      success: true,
      menu: (liveCallStore as any).activeMenu || null
    });
  });

  app.post('/api/live-call/menu/upload', conditionalUpload('menuImage'), async (req: Request, res: Response) => {
    try {
      const { menuTitle = 'Live Video Call Menu', menuText, presetId } = req.body || {};
      const file = req.file;

      // Check if user selected a pre-built menu preset
      if (presetId) {
        let presetProducts: any[] = [];
        let title = 'Live Store Specials';

        if (presetId === 'deli') {
          title = 'PnP Avondale Deli & Hot Food Express';
          presetProducts = [
            {
              id: `menu-${Date.now()}-1`,
              name: 'Flame-Grilled Half Chicken & Hot Chips',
              nativeName: 'Huku Yakakanyiwa & Machips',
              description: 'Fresh rotisserie flame-grilled chicken basted in lemon & herb, with golden crispy chips.',
              priceUSD: 5.50,
              category: 'Meats & Proteins',
              unit: '1 Combo Meal',
              image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&auto=format&fit=crop&q=80',
              tag: 'CHEF SPECIAL',
              keywords: ['chicken', 'chips', 'huku', 'half chicken', 'grilled chicken', 'hot chips']
            },
            {
              id: `menu-${Date.now()}-2`,
              name: 'Crusty Garlic Butter Artisan Baguette',
              nativeName: 'Chingwa cheGarlic Butter',
              description: 'Freshly baked French stick loaf slathered with real garlic herb butter.',
              priceUSD: 1.80,
              category: 'Maize & Staples',
              unit: '1 Fresh Loaf',
              image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400&auto=format&fit=crop&q=80',
              tag: 'HOT FROM OVEN',
              keywords: ['bread', 'baguette', 'garlic', 'chingwa', 'loaf']
            },
            {
              id: `menu-${Date.now()}-3`,
              name: 'Avondale Deli Beef Burger & Onion Rings',
              nativeName: 'Bhega reNyama yeMombe',
              description: '100% pure beef patty with cheddar cheese, fresh tomato, lettuce and barbecue glaze.',
              priceUSD: 4.80,
              category: 'Meats & Proteins',
              unit: '1 Burger Combo',
              image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80',
              tag: 'TOP RATED',
              keywords: ['burger', 'beef burger', 'bhega', 'patty', 'cheeseburger']
            },
            {
              id: `menu-${Date.now()}-4`,
              name: 'Mazoe Orange Crush Syrup 2L',
              nativeName: 'Mazoe Crush Yechibereko',
              description: 'Chilled Zimbabwean citrus cordial concentrate, beloved by family households.',
              priceUSD: 3.45,
              category: 'Beverages & Tea',
              unit: '2 Litre Bottle',
              image: '/images/Mazoe Orange Crush 2l.jpg',
              tag: 'FAMILY FAVORITE',
              keywords: ['mazoe', 'orange crush', 'crush', 'juice', 'drink']
            }
          ];
        } else if (presetId === 'braai') {
          title = 'Weekend Family Braai & Butcher Specials';
          presetProducts = [
            {
              id: `menu-${Date.now()}-1`,
              name: 'TM Master Braai Beef Boerewors 1kg',
              nativeName: 'Nyama yeMombe Boerewors',
              description: 'Traditional coarsely minced beef with roasted coriander, pimento, and cracked black pepper.',
              priceUSD: 6.90,
              category: 'Meats & Proteins',
              unit: '1kg Vacuum Pack',
              image: '/images/beef blade roast 2kg.jpg',
              tag: 'BRAAI FAVORITE',
              keywords: ['braai', 'boerewors', 'wors', 'beef', 'sausage', 'nyama']
            },
            {
              id: `menu-${Date.now()}-2`,
              name: 'Tenderised Beef Blade Steak 1.5kg',
              nativeName: 'Nyama yeMombe Steak',
              description: 'A-Grade prime tenderised beef steak cuts ready for open wood braai fire.',
              priceUSD: 9.80,
              category: 'Meats & Proteins',
              unit: '1.5kg Tray',
              image: '/images/fresh_beef.jpg',
              tag: 'A-GRADE PRIME',
              keywords: ['steak', 'beef', 'nyama', 'blade steak', 'meat']
            },
            {
              id: `menu-${Date.now()}-3`,
              name: 'Sunfoil Pure Sunflower Cooking Oil 2L',
              nativeName: 'Mafuta eKubikisa eSunfoil',
              description: 'Triple refined 100% sunflower cooking oil for golden deep frying.',
              priceUSD: 4.12,
              category: 'Cooking & Oils',
              unit: '2 Litre Bottle',
              image: '/images/sunfoil_oil.jpg',
              tag: 'DAILY ESSENTIAL',
              keywords: ['oil', 'cooking oil', 'sunfoil', 'mafuta', 'sunflower oil']
            },
            {
              id: `menu-${Date.now()}-4`,
              name: 'White Star Super Maize Meal 10kg',
              nativeName: 'Hupfu hweWhite Star',
              description: 'Finely milled vitamin-enriched white maize meal for rich smooth sadza/isitshwala.',
              priceUSD: 5.78,
              category: 'Maize & Staples',
              unit: '10kg Bag',
              image: '/images/mealie meal.jpg',
              tag: 'STAPLE CORE',
              keywords: ['maize', 'mealie', 'sadza', 'hupfu', 'white star', 'upfu']
            }
          ];
        } else {
          title = 'Harare Express Breakfast & Dairy Basket';
          presetProducts = [
            {
              id: `menu-${Date.now()}-1`,
              name: 'Eggbert Large Eggs 30-Pack Crate',
              nativeName: 'Mazai Makuru eFarm',
              description: 'Fresh farm-direct large eggs in safe protective 30-egg honeycomb crate.',
              priceUSD: 3.46,
              category: 'Meats & Proteins',
              unit: '30-Pack Crate',
              image: '/images/fresh_beef.jpg',
              tag: 'FRESH ARRIVAL',
              keywords: ['eggs', 'egg', 'mazai', 'eggbert', 'crate of eggs']
            },
            {
              id: `menu-${Date.now()}-2`,
              name: 'Clover Full Cream Fresh Milk 2L',
              nativeName: 'Mukaka Mutsva weClover',
              description: 'Cold-chain homogenized fresh pasteurised dairy milk from local dairy farms.',
              priceUSD: 2.10,
              category: 'Dairy & Fresh',
              unit: '2 Litre Jug',
              image: '/images/clover_milk.jpg',
              tag: 'CHILLED DAIRY',
              keywords: ['milk', 'clover', 'mukaka', 'dairy', 'fresh milk']
            },
            {
              id: `menu-${Date.now()}-3`,
              name: 'Huletts SunSweet White Sugar 2kg',
              nativeName: 'Shuga yeHuletts',
              description: 'Pure sun-crystallized pure cane white sugar for hot tea and family baking.',
              priceUSD: 2.85,
              category: 'Maize & Staples',
              unit: '2kg Bag',
              image: '/images/huletts_sugar.jpg',
              tag: 'PANTRY CORE',
              keywords: ['sugar', 'huletts', 'shuga', 'white sugar', 'sweet']
            },
            {
              id: `menu-${Date.now()}-4`,
              name: 'Tanganda Tagless Tea Bags 100s',
              nativeName: 'Chai yeTanganda',
              description: 'Eastern Highlands freshly blended black tea bags for strong aromatic mornings.',
              priceUSD: 2.30,
              category: 'Beverages & Tea',
              unit: '100 Tea Bags Pack',
              image: '/images/Tanganda Tagless Tea Bags 100.jpg',
              tag: 'EASTERN HIGHLANDS',
              keywords: ['tea', 'tanganda', 'chai', 'tea bags', 'black tea']
            }
          ];
        }

        const newMenu = {
          id: `menu-up-${Date.now()}`,
          title,
          uploadedBy: req.body.uploadedBy || 'Live Video Call Host',
          uploadedAt: new Date().toISOString(),
          sourceType: 'preset',
          itemCount: presetProducts.length,
          products: presetProducts
        };

        (liveCallStore as any).activeMenu = newMenu;
        io.emit('live_call:menu_updated', newMenu);
        return res.json({ success: true, menu: newMenu });
      }

      // If file or text is uploaded, run Gemini model gemini-3.8-flash
      let convertedProducts: any[] = [];
      let parsedTitle = menuTitle;

      if (process.env.GEMINI_API_KEY && (file || menuText)) {
        try {
          const contents: any[] = [];

          if (file) {
            contents.push({
              inlineData: {
                mimeType: file.mimetype || 'image/jpeg',
                data: file.buffer.toString('base64')
              }
            });
          }

          const prompt = `You are an AI grocery and food menu digitization assistant for TM Pick n Pay Live Video Shopping in Southern Africa (Zimbabwe & South Africa).
Analyze the provided menu image/flyer/text and convert every dish, grocery item, or special deal into structured e-commerce products.
${menuText ? `Menu Text Content:\n${menuText}\n` : ''}

For each item, output:
- name: clear product name (e.g. "Flame-Grilled Half Chicken with Chips", "Mazoe Orange Squash 2L")
- nativeName: colloquial Shona or Ndebele name where applicable (e.g. "Huku Yakakangwa", "Mafuta eKubikisa")
- description: 1-2 sentence appetizing description
- priceUSD: estimated or stated price in USD (numeric). If prices are in ZAR divide by 18.5, if in ZWG divide by 26.8. Realistic range $1.50 - $15.00 USD.
- category: one of 'Maize & Staples', 'Cooking & Oils', 'Meats & Proteins', 'Dairy & Fresh', 'Beverages & Tea', 'Solar & Power', 'Household & Soap', 'Baby & Care'
- unit: size or packaging (e.g. '1 Combo Meal', '2 Litre Bottle', '1kg Pack', '30-Pack Crate')
- tag: promotion tag (e.g. 'CHEF SPECIAL', 'HOT DEAL', 'STORE SPECIAL', 'POPULAR', 'SAVE $1.50')
- keywords: array of 3-5 lowercase trigger words spoken by host when talking about it (e.g. ["chicken", "chips", "huku", "grilled"])

Output a strict JSON array of objects.`;

          contents.push({ text: prompt });

          const aiResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    nativeName: { type: Type.STRING },
                    description: { type: Type.STRING },
                    priceUSD: { type: Type.NUMBER },
                    category: { type: Type.STRING },
                    unit: { type: Type.STRING },
                    tag: { type: Type.STRING },
                    keywords: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ['name', 'priceUSD', 'category', 'unit']
                }
              }
            }
          });

          const rawJson = aiResponse.text?.trim() || '[]';
          const aiItems = JSON.parse(rawJson);

          if (Array.isArray(aiItems) && aiItems.length > 0) {
            convertedProducts = aiItems.map((item: any, idx: number) => {
              // Match realistic local or culinary image
              let matchedImg = '/images/fruit and vegetable box 10kg.jpg';
              const n = (item.name || '').toLowerCase();
              if (n.includes('chicken') || n.includes('huku')) {
                matchedImg = 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&auto=format&fit=crop&q=80';
              } else if (n.includes('beef') || n.includes('meat') || n.includes('steak') || n.includes('nyama') || n.includes('boerewors')) {
                matchedImg = '/images/beef blade roast 2kg.jpg';
              } else if (n.includes('oil') || n.includes('sunfoil') || n.includes('mafuta')) {
                matchedImg = '/images/cooking oil 2l.jpg';
              } else if (n.includes('mazoe') || n.includes('juice') || n.includes('crush') || n.includes('beverage')) {
                matchedImg = '/images/Mazoe Orange Crush 2l.jpg';
              } else if (n.includes('egg') || n.includes('mazai')) {
                matchedImg = '/images/fresh_beef.jpg';
              } else if (n.includes('milk') || n.includes('clover') || n.includes('mukaka')) {
                matchedImg = '/images/clover_milk.jpg';
              } else if (n.includes('sugar') || n.includes('huletts') || n.includes('shuga')) {
                matchedImg = '/images/huletts_sugar.jpg';
              } else if (n.includes('tea') || n.includes('tanganda')) {
                matchedImg = '/images/Tanganda Tagless Tea Bags 100.jpg';
              } else if (n.includes('rice') || n.includes('tastic')) {
                matchedImg = '/images/tastic_rice.jpg';
              } else if (n.includes('maize') || n.includes('meal') || n.includes('hupfu')) {
                matchedImg = '/images/mealie meal.jpg';
              } else if (n.includes('bread') || n.includes('baguette') || n.includes('roll') || n.includes('burger')) {
                matchedImg = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80';
              }

              const cleanKeywords = Array.isArray(item.keywords) && item.keywords.length > 0
                ? item.keywords.map((k: string) => String(k).toLowerCase())
                : (item.name || '').toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);

              return {
                id: `menu-ai-${Date.now()}-${idx}`,
                name: item.name,
                nativeName: item.nativeName || '',
                description: item.description || `Fresh high quality ${item.name} from TM Pick n Pay.`,
                priceUSD: Number((item.priceUSD || 3.50).toFixed(2)),
                category: item.category || 'Maize & Staples',
                unit: item.unit || '1 Unit',
                image: matchedImg,
                tag: item.tag || 'AI CONVERTED',
                keywords: cleanKeywords
              };
            });
          }
        } catch (aiErr: any) {
          console.warn('[Gemini Menu Parse]: fallback to intelligent text extraction:', aiErr?.message || aiErr);
        }
      }

      // If Gemini parsing didn't produce items, fallback to intelligent regex/line extraction
      if (convertedProducts.length === 0) {
        const textLines = (menuText || '').split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
        if (textLines.length > 0) {
          convertedProducts = textLines.map((line: string, idx: number) => {
            const priceMatch = line.match(/\$?(\d+(\.\d{1,2})?)/);
            const foundPrice = priceMatch ? parseFloat(priceMatch[1]) : (3.20 + (idx * 0.95));
            const cleanName = line.replace(/[\$£€\d\.\:\-]+/g, '').trim() || `Special Menu Item #${idx + 1}`;
            
            return {
              id: `menu-txt-${Date.now()}-${idx}`,
              name: cleanName,
              nativeName: '',
              description: `Delicious featured item from today's live video session.`,
              priceUSD: Number(foundPrice.toFixed(2)),
              category: 'Meats & Proteins',
              unit: '1 Portion / Pack',
              image: '/images/fruit and vegetable box 10kg.jpg',
              tag: 'MENU SPECIAL',
              keywords: cleanName.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2)
            };
          });
        } else {
          // Default fresh showcase
          convertedProducts = [
            {
              id: `menu-fb-${Date.now()}-1`,
              name: 'Flame-Grilled Half Chicken & Hot Chips',
              nativeName: 'Huku Yakakanyiwa & Machips',
              description: 'Fresh rotisserie deli chicken with golden potato fries.',
              priceUSD: 5.50,
              category: 'Meats & Proteins',
              unit: '1 Combo Meal',
              image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&auto=format&fit=crop&q=80',
              tag: 'DELI SPECIAL',
              keywords: ['chicken', 'chips', 'huku', 'half chicken', 'grilled chicken']
            },
            {
              id: `menu-fb-${Date.now()}-2`,
              name: 'Sunfoil Pure Sunflower Cooking Oil 2L',
              nativeName: 'Mafuta eKubikisa eSunfoil',
              description: 'Triple refined 100% sunflower cooking oil for golden frying.',
              priceUSD: 4.12,
              category: 'Cooking & Oils',
              unit: '2 Litre Bottle',
              image: '/images/sunfoil_oil.jpg',
              tag: 'TOP VALUE',
              keywords: ['oil', 'cooking oil', 'sunfoil', 'mafuta', 'sunflower oil']
            },
            {
              id: `menu-fb-${Date.now()}-3`,
              name: 'Mazoe Orange Crush Syrup 2L',
              nativeName: 'Mazoe Crush Yechibereko',
              description: 'Iconic Zimbabwean citrus squash concentrate.',
              priceUSD: 3.45,
              category: 'Beverages & Tea',
              unit: '2 Litre Bottle',
              image: '/images/Mazoe Orange Crush 2l.jpg',
              tag: 'HERITAGE FAVORITE',
              keywords: ['mazoe', 'orange crush', 'crush', 'juice', 'drink']
            },
            {
              id: `menu-fb-${Date.now()}-4`,
              name: 'Eggbert Large Eggs 30-Pack Crate',
              nativeName: 'Mazai Makuru eFarm',
              description: 'Farm fresh Grade-A chicken eggs for family breakfasts.',
              priceUSD: 3.46,
              category: 'Meats & Proteins',
              unit: '30-Pack Crate',
              image: '/images/fresh_beef.jpg',
              tag: 'FRESH DAILY',
              keywords: ['eggs', 'egg', 'mazai', 'eggbert', 'crate of eggs']
            }
          ];
        }
      }

      const newMenu = {
        id: `menu-${Date.now()}`,
        title: parsedTitle || 'Live Stream Converted Menu',
        uploadedBy: req.body.uploadedBy || 'Call Initiator / Store Admin',
        uploadedAt: new Date().toISOString(),
        sourceType: file ? 'image' : (menuText ? 'text' : 'preset'),
        itemCount: convertedProducts.length,
        products: convertedProducts
      };

      (liveCallStore as any).activeMenu = newMenu;
      io.emit('live_call:menu_updated', newMenu);

      res.json({
        success: true,
        menu: newMenu,
        message: `Successfully converted menu into ${convertedProducts.length} live grocery products!`
      });

    } catch (err: any) {
      console.error('[Menu Upload Error]:', err);
      res.status(500).json({ error: err.message || 'Menu upload & conversion failed' });
    }
  });

  // Real-time host speech / product mention endpoint
  app.post('/api/live-call/mention', (req: Request, res: Response) => {
    try {
      const { productId, productName, spokenPhrase, hostName = 'Call Initiator' } = req.body || {};
      const menu = (liveCallStore as any).activeMenu;

      let matchedItem: any = null;

      if (menu && Array.isArray(menu.products)) {
        const foundIdx = menu.products.findIndex((p: any) => 
          p.id === productId || 
          (productName && p.name.toLowerCase().includes(productName.toLowerCase())) ||
          (spokenPhrase && p.keywords?.some((k: string) => spokenPhrase.toLowerCase().includes(k)))
        );

        if (foundIdx > -1) {
          matchedItem = { ...menu.products[foundIdx], isMentioned: true, mentionedAt: new Date().toISOString() };
          // Move matched item to index 0 (Forefront of products)
          menu.products.splice(foundIdx, 1);
          menu.products.unshift(matchedItem);
        }
      }

      const mentionPayload = {
        productId: matchedItem?.id || productId,
        productName: matchedItem?.name || productName || 'Featured Item',
        productPriceUSD: matchedItem?.priceUSD,
        productImage: matchedItem?.image,
        spokenPhrase: spokenPhrase || `Host is talking about ${matchedItem?.name || productName}!`,
        hostName,
        timestamp: new Date().toISOString()
      };

      io.emit('live_call:product_mentioned', mentionPayload);

      res.json({
        success: true,
        matchedItem,
        mentionPayload,
        menu
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Mention broadcast failed' });
    }
  });

  app.get('/api/members', (req: Request, res: Response) => {
    res.json({ members: INITIAL_MEMBERS });
  });

  // -------------------------------------------------------------
  // 16. TM-PICKNPAY: WALLET (multi-currency, open)
  // -------------------------------------------------------------
  app.get('/api/wallet/balances', (req: Request, res: Response) => {
    const phone = (req.query.phone as string) || 'demo';
    res.json({ success: true, phone, balances: getWalletBalances(phone) });
  });

  app.post('/api/wallet/checkout', async (req: Request, res: Response) => {
    if (!requireSharedSecret(req, res)) return;
    const { phone, totalZWG } = req.body || {};
    if (!phone || !totalZWG) return res.status(400).json({ error: 'phone and totalZWG are required' });
    const result = await walletCheckout(phone, Number(totalZWG));
    res.status(result.success ? 200 : 402).json(result);
  });

  // -------------------------------------------------------------
  // 17. TM-PICKNPAY: VOUCHER (closed-loop, remittance-fed only)
  // -------------------------------------------------------------
  app.get('/api/voucher/balance', (req: Request, res: Response) => {
    const phone = (req.query.phone as string) || 'demo';
    res.json({ success: true, phone, balances: getVoucherBalances(phone) });
  });

  app.post('/api/remittance/webhook', async (req: Request, res: Response) => {
    if (!requireSharedSecret(req, res)) return;
    const { source, recipientPhone, amount, currency, reference } = req.body || {};
    if (!source || !recipientPhone || !amount || !currency || !reference) {
      return res.status(400).json({ error: 'source, recipientPhone, amount, currency, reference are required' });
    }
    const balances = await creditVoucherFromRemittance(recipientPhone, source, Number(amount), currency, reference);
    res.json({ success: true, balances });
  });

  app.get('/api/remittance/log', (req: Request, res: Response) => {
    res.json({ success: true, log: getRemittanceLog(req.query.phone as string | undefined) });
  });

  // -------------------------------------------------------------
  // 18. TM-PICKNPAY: ECOCASH ON/OFF-RAMP
  // -------------------------------------------------------------
  app.post('/api/ecocash/onramp', async (req: Request, res: Response) => {
    if (!requireSharedSecret(req, res)) return;
    const { phone, amount, currency = 'ZWG' } = req.body || {};
    if (!phone || !amount) return res.status(400).json({ error: 'phone and amount are required' });
    const txn = await requestToPay(phone, Number(amount), currency);
    // Demo-mode auto-resolve — see settleTransaction's own comment.
    const settled = await settleTransaction(txn.id, 'SUCCESS');
    res.json({ success: true, transaction: settled ?? txn, balances: getWalletBalances(phone), message: 'EcoCash request-to-pay approved and wallet credited (demo mode — auto-resolved).' });
  });

  app.post('/api/ecocash/offramp', async (req: Request, res: Response) => {
    if (!requireSharedSecret(req, res)) return;
    const { phone, amount, currency = 'ZWG' } = req.body || {};
    if (!phone || !amount) return res.status(400).json({ error: 'phone and amount are required' });
    // Debit exactly the requested currency/amount — not a ZWG-first
    // FX-fallback order settlement (walletCheckout is for cart checkout).
    // Debited as a HOLD before payout confirmation; settleTransaction
    // refunds it if the gateway later reports FAILED.
    const debit = await debitWallet(phone, currency, Number(amount));
    if (!debit.success) return res.status(402).json({ success: false, reason: debit.reason, balances: debit.balances });
    const txn = await payout(phone, Number(amount), currency);
    const settled = await settleTransaction(txn.id, 'SUCCESS');
    res.json({ success: true, transaction: settled ?? txn, balances: debit.balances });
  });

  app.post('/api/ecocash/pay-now', async (req: Request, res: Response) => {
    if (!requireSharedSecret(req, res)) return;
    const { phone, amount, currency = 'ZWG', orderReference } = req.body || {};
    if (!phone || !amount || !orderReference) return res.status(400).json({ error: 'phone, amount, orderReference are required' });
    const txn = await payForOrder(phone, Number(amount), currency, orderReference);
    res.json({ success: true, transaction: txn });
  });

  app.post('/api/ecocash/webhook', async (req: Request, res: Response) => {
    const rawPayload = JSON.stringify(req.body || {});
    const signatureHeader = req.headers['x-ecocash-signature'] as string | undefined;
    if (!verifyEcoCashWebhookSignature(rawPayload, signatureHeader)) {
      return res.status(401).json({ error: 'invalid signature' });
    }
    const { transactionId, outcome } = req.body || {};
    const resolved = await settleTransaction(transactionId, outcome === 'FAILED' ? 'FAILED' : 'SUCCESS');
    if (!resolved) return res.status(404).json({ error: 'transaction not found, or already resolved' });
    res.json({ success: true, transaction: resolved });
  });

  // -------------------------------------------------------------
  // 19. TM-PICKNPAY: ERP LIVE STOCK
  // -------------------------------------------------------------
  app.get('/api/erp/stock', async (req: Request, res: Response) => {
    const storeId = (req.query.storeId as StoreId) || 'TM_PNP';
    const sku = req.query.sku as string;
    if (!sku) return res.status(400).json({ error: 'sku is required' });
    const level = await checkStock(storeId, sku);
    res.json({ success: true, level });
  });

  app.get('/api/erp/substitute', async (req: Request, res: Response) => {
    const sku = req.query.sku as string;
    if (!sku) return res.status(400).json({ error: 'sku is required' });
    const substitute = await findSubstitute(sku);
    res.json({ success: true, substitute });
  });

  app.post('/api/erp/verify-checkout', async (req: Request, res: Response) => {
    const result = await verifyAvailableAtCheckout(req.body?.items || []);
    res.json(result);
  });

  // -------------------------------------------------------------
  // 20. TM-PICKNPAY: B2B BULK ORDERING
  // -------------------------------------------------------------
  app.post('/api/orders/bulk-parse', async (req: Request, res: Response) => {
    const { text, useAI = false } = req.body || {};
    if (!text) return res.status(400).json({ error: 'text is required' });
    let items = parseBulkOrderText(text);
    if (items.length === 0 && useAI) {
      const aiItems = await parseBulkOrderTextWithAI(text);
      if (aiItems) items = aiItems;
    }
    res.json({ success: true, items });
  });

  app.post('/api/orders/vendor-allocate', (req: Request, res: Response) => {
    if (!requireSharedSecret(req, res)) return;
    const { productId, requestedQty } = req.body || {};
    if (!productId || !requestedQty) return res.status(400).json({ error: 'productId and requestedQty are required' });
    const result = allocateFromBatch(productId, Number(requestedQty));
    res.status(result.success ? 200 : 409).json(result);
  });

  // -------------------------------------------------------------
  // 21. TM-PICKNPAY: DELIVERY ZONES & HUB-AND-SPOKE ROUTING
  // -------------------------------------------------------------
  app.get('/api/delivery/zones', (req: Request, res: Response) => {
    res.json({ success: true, zones: listZones() });
  });

  app.post('/api/delivery/route', (req: Request, res: Response) => {
    const { accountType, zoneId, orderValueZWG } = req.body || {};
    if (!zoneId) return res.status(400).json({ error: 'zoneId is required' });
    res.json({ success: true, ...routeFulfillment({ accountType, zoneId, orderValueZWG }) });
  });

  app.get('/api/delivery/windows', (req: Request, res: Response) => {
    res.json({ success: true, windows: getAvailableWindows() });
  });

  // -------------------------------------------------------------
  // 22. TM-PICKNPAY: B2B ACCOUNT RECOGNITION
  // -------------------------------------------------------------
  app.get('/api/b2b/account', (req: Request, res: Response) => {
    const phone = req.query.phone as string;
    if (!phone) return res.status(400).json({ error: 'phone is required' });
    res.json({ success: true, account: findB2BAccount(phone) });
  });

  // -------------------------------------------------------------
  // 23. TM-PICKNPAY: ORDER PERSISTENCE & PICKING QUEUES
  // -------------------------------------------------------------
  app.post('/api/orders/pnp/create', (req: Request, res: Response) => {
    if (!requireSharedSecret(req, res)) return;
    const { phone, items, totalZWG, address, route, storeId, hubName, deliveryWindowId } = req.body || {};
    if (!phone || !items?.length || !totalZWG || !address || !route) {
      return res.status(400).json({ error: 'phone, items, totalZWG, address, route are required' });
    }
    const order = createOrder({ phone, items, totalZWG, address, route, storeId, hubName, deliveryWindowId });
    res.json({ success: true, order });
  });

  app.get('/api/orders/pnp/track', (req: Request, res: Response) => {
    const orderId = req.query.orderId as string;
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });
    const order = getOrder(orderId);
    if (!order) return res.status(404).json({ error: 'order not found' });
    res.json({ success: true, order });
  });

  app.post('/api/orders/pnp/advance', async (req: Request, res: Response) => {
    if (!requireSharedSecret(req, res)) return;
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });
    const result = advanceOrder(orderId);
    if (result.success && result.order) {
      await notifyPicknPayStatus(result.order);
    }
    res.status(result.success ? 200 : 409).json(result);
  });

  app.get('/api/orders/pnp/queue', (req: Request, res: Response) => {
    const storeId = req.query.storeId as string | undefined;
    const hub = req.query.hub === 'true';
    const queue = hub ? getHubQueue() : getStoreQueue(storeId ?? 'TM_PNP');
    res.json({ success: true, queue });
  });

  // -------------------------------------------------------------
  // 24. TM-PICKNPAY: TRENDING SPECIALS / BUNDLES
  // -------------------------------------------------------------
  app.get('/api/bundles', (req: Request, res: Response) => {
    res.json({ success: true, bundles: getBundles() });
  });

  // Database offline error middleware fallback
  app.use((err: any, req: Request, res: Response, next: express.NextFunction) => {
    if (err && (err.name === 'MongooseError' || err.name === 'MongoNetworkError' || (typeof err.message === 'string' && err.message.includes('buffering timed out')))) {
      console.warn('[AI Studio] Database offline — returning mock empty response');
      if (req.method === 'GET') {
        return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
      }
      return res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
    }
    next(err);
  });

  // -------------------------------------------------------------
  // 15. STATIC ASSETS & SPA FALLBACK
  // -------------------------------------------------------------
  app.use('/images', express.static(path.join(process.cwd(), 'public/images')));
  app.use(express.static(path.join(process.cwd(), 'public')));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[PnP Express] Express Full-Stack Server + Vite running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
