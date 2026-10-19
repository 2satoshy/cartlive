import mongoose, { Schema, Document, Model } from 'mongoose';

// CRITICAL: fail fast, don't hang if MongoDB is offline or unavailable
mongoose.set('bufferCommands', false);

const MONGODB_URI = process.env.MONGODB_URI;

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  if (!MONGODB_URI) {
    console.warn('[MongoDB] MONGODB_URI not set — in-memory fallback active');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'pnpexpress'
    });
    console.log('[MongoDB] Connected successfully to Atlas database: pnpexpress');
  } catch (error) {
    console.warn('[MongoDB] Connection error (using in-memory fallback):', error);
  }
}

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;
  role: string;
  walletAddress?: string;
  cdpProjectId?: string;
  phone?: string;
  country?: string;
  city?: string;
  currencyPreference?: string;
  lowDataPreference?: boolean;
  walletBalanceUSD: number;
  /** Telegram numeric user id, as a string. Set only for accounts created via
   * the Telegram Mini App login — sparse/unique so email-only accounts are
   * unaffected. */
  telegramId?: string;
  telegramUsername?: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface IActivityLog extends Document {
  userId: string;
  userEmail?: string;
  action: string;
  details?: any;
  ip?: string;
  timestamp: Date;
}

export interface IOrder extends Document {
  orderId: string;
  invoiceNumber: string;
  userId?: string;
  date?: string;
  timestamp: Date;
  status: string;
  statusLabel?: string;
  statusColor?: string;
  storePartner?: string;
  fulfillmentType: string;
  fulfillmentLocation?: string;
  recipientName?: string;
  recipientPhone?: string;
  collectionCode?: string;
  paymentMethod?: any;
  subtotalUSD: number;
  deliveryFeeUSD: number;
  vatTaxUSD: number;
  totalUSD: number;
  items: any[];
  trackingSteps: any[];
}

export interface ICDPWallet extends Document {
  userId: string;
  userEmail: string;
  address: string;
  projectId?: string;
  network: string;
  paymasterUrl?: string;
  balanceEth: number;
  balanceUsdc: number;
  createdAt: Date;
  updatedAt: Date;
}

// User Schema
const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  password: { type: String, required: false },
  role: { type: String, default: 'Sponsor / Diaspora' },
  walletAddress: { type: String },
  cdpProjectId: { type: String, default: process.env.VITE_CDP_PROJECT_ID },
  phone: { type: String },
  country: { type: String, default: 'United Kingdom' },
  city: { type: String, default: 'London' },
  currencyPreference: { type: String, default: 'GBP' },
  lowDataPreference: { type: Boolean, default: false },
  walletBalanceUSD: { type: Number, default: 245.00 },
  telegramId: { type: String, unique: true, sparse: true, index: true },
  telegramUsername: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: Date.now }
});

// User Session / Activity Log Schema
const ActivityLogSchema = new Schema<IActivityLog>({
  userId: { type: String, required: true, index: true },
  userEmail: { type: String },
  action: { type: String, required: true },
  details: { type: Schema.Types.Mixed },
  ip: { type: String },
  timestamp: { type: Date, default: Date.now }
});

// Order Schema
const OrderSchema = new Schema<IOrder>({
  orderId: { type: String, required: true, unique: true, index: true },
  invoiceNumber: { type: String, required: true },
  userId: { type: String },
  date: { type: String },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'PROCESSING' },
  statusLabel: { type: String },
  statusColor: { type: String, default: 'blue' },
  storePartner: { type: String },
  fulfillmentType: { type: String, default: 'DOOR_DELIVERY' },
  fulfillmentLocation: { type: String },
  recipientName: { type: String },
  recipientPhone: { type: String },
  collectionCode: { type: String },
  paymentMethod: {
    type: { type: String },
    label: { type: String },
    details: { type: String },
    authRef: { type: String }
  },
  subtotalUSD: { type: Number, required: true },
  deliveryFeeUSD: { type: Number, default: 3.50 },
  vatTaxUSD: { type: Number, default: 0.00 },
  totalUSD: { type: Number, required: true },
  items: [],
  trackingSteps: []
});

// CDP Wallet Schema
const CDPWalletSchema = new Schema<ICDPWallet>({
  userId: { type: String, required: true, index: true },
  userEmail: { type: String, required: true },
  address: { type: String, required: true, unique: true },
  projectId: { type: String, default: process.env.VITE_CDP_PROJECT_ID },
  network: { type: String, default: 'base-sepolia' },
  paymasterUrl: { type: String, default: process.env.CDP_PAYMASTER_URL_TESTNET },
  balanceEth: { type: Number, default: 0.05 },
  balanceUsdc: { type: Number, default: 500.00 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const RealUser: Model<IUser> = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
const RealActivityLog: Model<IActivityLog> = (mongoose.models.ActivityLog as Model<IActivityLog>) || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
const RealOrderModel: Model<IOrder> = (mongoose.models.Order as Model<IOrder>) || mongoose.model<IOrder>('Order', OrderSchema);
const RealCDPWallet: Model<ICDPWallet> = (mongoose.models.CDPWallet as Model<ICDPWallet>) || mongoose.model<ICDPWallet>('CDPWallet', CDPWalletSchema);

// In-Memory Storage for Zero-Database / Offline Running
const inMemoryUsers = new Map<string, any>();
const inMemoryLogs: any[] = [];
const inMemoryOrders = new Map<string, any>();
const inMemoryWallets = new Map<string, any>();

function createInMemoryUser(data: any) {
  const doc: any = {
    _id: data._id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: data.email,
    name: data.name,
    password: data.password || 'demo_pass_123',
    role: data.role || 'Sponsor / Diaspora',
    walletAddress: data.walletAddress || '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    cdpProjectId: data.cdpProjectId || process.env.VITE_CDP_PROJECT_ID,
    phone: data.phone || '+44 7700 900123',
    country: data.country || 'United Kingdom',
    city: data.city || 'London',
    currencyPreference: data.currencyPreference || 'GBP',
    lowDataPreference: !!data.lowDataPreference,
    walletBalanceUSD: data.walletBalanceUSD ?? 250.00,
    telegramId: data.telegramId,
    telegramUsername: data.telegramUsername,
    createdAt: data.createdAt || new Date(),
    lastLoginAt: data.lastLoginAt || new Date(),
    save: async function() {
      inMemoryUsers.set(String(this._id), this);
      inMemoryUsers.set(`email:${this.email}`, this);
      if (this.telegramId) inMemoryUsers.set(`tg:${this.telegramId}`, this);
      return this;
    }
  };
  inMemoryUsers.set(String(doc._id), doc);
  inMemoryUsers.set(`email:${doc.email}`, doc);
  if (doc.telegramId) inMemoryUsers.set(`tg:${doc.telegramId}`, doc);
  return doc;
}

export const User: Model<IUser> = new Proxy(RealUser, {
  construct(target, args) {
    if (mongoose.connection.readyState === 1) {
      return new (target as any)(...args);
    }
    return createInMemoryUser(args[0] || {});
  },
  get(target, prop, receiver) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.get(target, prop, receiver);
    }
    if (prop === 'findOne') {
      return async (query: any) => {
        if (!query) return null;
        if (query.email) return inMemoryUsers.get(`email:${query.email}`) || null;
        if (query.telegramId) return inMemoryUsers.get(`tg:${query.telegramId}`) || null;
        if (query._id) return inMemoryUsers.get(String(query._id)) || null;
        for (const u of inMemoryUsers.values()) {
          let match = true;
          for (const [k, v] of Object.entries(query)) {
            if (u[k] !== v) { match = false; break; }
          }
          if (match) return u;
        }
        return null;
      };
    }
    if (prop === 'findById') {
      return async (id: any) => inMemoryUsers.get(String(id)) || null;
    }
    if (prop === 'create') {
      return async (data: any) => createInMemoryUser(data);
    }
    return Reflect.get(target, prop, receiver);
  }
}) as Model<IUser>;

export const ActivityLog: Model<IActivityLog> = new Proxy(RealActivityLog, {
  get(target, prop, receiver) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.get(target, prop, receiver);
    }
    if (prop === 'create') {
      return async (data: any) => {
        const log = { ...data, _id: `log_${Date.now()}`, timestamp: data.timestamp || new Date() };
        inMemoryLogs.unshift(log);
        return log;
      };
    }
    if (prop === 'find') {
      return (query: any) => {
        const filtered = query?.userId ? inMemoryLogs.filter(l => l.userId === query.userId) : inMemoryLogs;
        return {
          sort: () => ({
            limit: (n: number) => Promise.resolve(filtered.slice(0, n))
          }),
          limit: (n: number) => Promise.resolve(filtered.slice(0, n)),
          exec: () => Promise.resolve(filtered),
          then: (resolve: any, reject: any) => Promise.resolve(filtered).then(resolve, reject)
        };
      };
    }
    return Reflect.get(target, prop, receiver);
  }
}) as Model<IActivityLog>;

export const OrderModel: Model<IOrder> = new Proxy(RealOrderModel, {
  get(target, prop, receiver) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.get(target, prop, receiver);
    }
    if (prop === 'updateOne') {
      return async (query: any, update: any) => {
        const targetId = query.orderId || query.id;
        if (targetId && inMemoryOrders.has(targetId)) {
          Object.assign(inMemoryOrders.get(targetId), update.$set || update);
        }
        return { acknowledged: true, modifiedCount: 1 };
      };
    }
    if (prop === 'find') {
      return () => Promise.resolve(Array.from(inMemoryOrders.values()));
    }
    if (prop === 'create') {
      return async (data: any) => {
        const doc = { ...data, _id: `order_${Date.now()}` };
        if (doc.orderId) inMemoryOrders.set(doc.orderId, doc);
        return doc;
      };
    }
    return Reflect.get(target, prop, receiver);
  }
}) as Model<IOrder>;

export const CDPWallet: Model<ICDPWallet> = new Proxy(RealCDPWallet, {
  get(target, prop, receiver) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.get(target, prop, receiver);
    }
    if (prop === 'findOne') {
      return async (query: any) => {
        if (!query) return null;
        if (query.userId) return inMemoryWallets.get(`user:${query.userId}`) || null;
        if (query.address) return inMemoryWallets.get(`addr:${query.address}`) || null;
        return Array.from(inMemoryWallets.values())[0] || null;
      };
    }
    if (prop === 'create') {
      return async (data: any) => {
        const wallet = {
          ...data,
          _id: `wallet_${Date.now()}`,
          address: data.address || '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
          balanceEth: data.balanceEth ?? 0.05,
          balanceUsdc: data.balanceUsdc ?? 500.00,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        inMemoryWallets.set(`user:${wallet.userId}`, wallet);
        inMemoryWallets.set(`addr:${wallet.address}`, wallet);
        return wallet;
      };
    }
    return Reflect.get(target, prop, receiver);
  }
}) as Model<ICDPWallet>;
