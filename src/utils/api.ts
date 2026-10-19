import { 
  CartItem, 
  Product, 
  Member, 
  ExchangeRates, 
  Currency, 
  WhatsAppMessage, 
  VoiceAIResult, 
  OrchestrationResponse,
  DeliveryAddress,
  StoreId
} from '../types';

export interface PastOrder {
  id: string;
  invoiceNumber: string;
  date: string;
  timestamp: string;
  status: 'DELIVERED' | 'OUT_FOR_DELIVERY' | 'READY_FOR_COLLECTION' | 'PROCESSING';
  statusLabel: string;
  statusColor: string;
  storePartner: string;
  fulfillmentType: 'DOOR_DELIVERY' | 'CLICK_AND_COLLECT';
  fulfillmentLocation: string;
  recipientName: string;
  recipientPhone: string;
  collectionCode?: string;
  paymentMethod: {
    type: 'VISA_CARD' | 'ECOCASH' | 'MUKURU' | 'INNBUCKS' | 'PNP_WALLET' | 'CONTIPAY' | 'PESAPAL' | 'COINBASE_USDC';
    label: string;
    details: string;
    authRef: string;
  };
  subtotalUSD: number;
  deliveryFeeUSD: number;
  vatTaxUSD: number;
  totalUSD: number;
  items: Array<{
    id: string;
    name: string;
    nativeName?: string;
    quantity: number;
    unitPriceUSD: number;
    totalUSD: number;
    image: string;
    store: string;
    weightOrVol: string;
  }>;
  trackingSteps: Array<{
    title: string;
    description: string;
    time: string;
    completed: boolean;
    current?: boolean;
  }>;
}

export interface CommercialInvoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  date: string;
  timestamp: string;
  customerName: string;
  customerLocation: string;
  recipientName: string;
  recipientAddress: string;
  storePartner: string;
  paymentRail: string;
  settlementAccount: string;
  forexReportingCode: string;
  subtotalUSD: number;
  deliveryFeeUSD: number;
  vatTaxUSD: number;
  totalUSD: number;
  currencyEquivalents: {
    GBP: number;
    ZAR: number;
    ZWG: number;
    EUR: number;
    AUD: number;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPriceUSD: number;
    totalUSD: number;
  }>;
}

export interface DepotLocation {
  id: string;
  name: string;
  chain: string;
  address: string;
  city: string;
  phone: string;
  hours: string;
  hasColdStorage: boolean;
  hasLockers: boolean;
  coordinates: { lat: number; lng: number };
}

// ----------------------------------------------------
// API Client Functions
// ----------------------------------------------------

export const api = {
  // 0. Telegram Mini App auth
  async loginWithTelegram(initData: string): Promise<{ success: boolean; user: any; token: string }> {
    const res = await fetch('/api/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    });
    if (!res.ok) throw new Error('Telegram login failed');
    return res.json();
  },

  // 1. Products & Catalog
  async getProducts(params?: {
    category?: string;
    storeId?: StoreId;
    search?: string;
    fulfillmentTag?: string;
    inStock?: boolean;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.storeId) query.set('storeId', params.storeId);
    if (params?.search) query.set('search', params.search);
    if (params?.fulfillmentTag) query.set('fulfillmentTag', params.fulfillmentTag);
    if (params?.inStock !== undefined) query.set('inStock', String(params.inStock));
    if (params?.sort) query.set('sort', params.sort);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const res = await fetch(`/api/products?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  async getProductById(id: string): Promise<Product> {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error('Product not found');
    return res.json();
  },

  async getCategories(): Promise<Array<{ name: string; count: number; nativeLabel: string }>> {
    const res = await fetch('/api/products/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async getStores(): Promise<Array<{ id: StoreId; name: string; tag: string; depotCount: number; logo: string }>> {
    const res = await fetch('/api/products/stores');
    if (!res.ok) throw new Error('Failed to fetch stores');
    return res.json();
  },

  // 2. Family Collaborative Cart
  async getCart(): Promise<{ cart: CartItem[]; members: Member[]; totals: any }> {
    const res = await fetch('/api/cart');
    if (!res.ok) throw new Error('Failed to fetch cart');
    return res.json();
  },

  async addToCart(data: {
    productId: string;
    quantity?: number;
    memberId?: string;
    memberName?: string;
    memberLocation?: string;
    channel?: 'web' | 'whatsapp' | 'voice_ai';
    note?: string;
  }): Promise<{ success: boolean; cart: CartItem[] }> {
    const res = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add item to cart');
    return res.json();
  },

  async updateCartItem(itemId: string, quantity: number, note?: string): Promise<{ success: boolean; cart: CartItem[] }> {
    const res = await fetch('/api/cart/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, quantity, note }),
    });
    if (!res.ok) throw new Error('Failed to update cart');
    return res.json();
  },

  async removeCartItem(itemId: string): Promise<{ success: boolean; cart: CartItem[] }> {
    const res = await fetch('/api/cart/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId }),
    });
    if (!res.ok) throw new Error('Failed to remove cart item');
    return res.json();
  },

  async clearCart(): Promise<{ success: boolean; cart: CartItem[] }> {
    const res = await fetch('/api/cart/clear', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to clear cart');
    return res.json();
  },

  async calculateSplit(splitMethod: string, customRatios?: Record<string, number>): Promise<any> {
    const res = await fetch('/api/cart/split-calculator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ splitMethod, customRatios }),
    });
    if (!res.ok) throw new Error('Failed to calculate split');
    return res.json();
  },

  // 3. Orders & Tracking
  async getOrders(params?: { status?: string; search?: string }): Promise<{ orders: PastOrder[]; totalCount: number }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`/api/orders?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async getOrderById(orderId: string): Promise<PastOrder> {
    const res = await fetch(`/api/orders/${orderId}`);
    if (!res.ok) throw new Error('Order not found');
    return res.json();
  },

  async reorderPastOrder(orderId: string): Promise<{ success: boolean; cart: CartItem[]; addedCount: number }> {
    const res = await fetch('/api/orders/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });
    if (!res.ok) throw new Error('Failed to reorder items');
    return res.json();
  },

  async advanceOrderStatus(orderId: string, nextStatus?: string): Promise<{ success: boolean; order: PastOrder }> {
    const res = await fetch(`/api/orders/${orderId}/advance-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nextStatus }),
    });
    if (!res.ok) throw new Error('Failed to advance order status');
    return res.json();
  },

  // 4. Commercial Invoices
  async getInvoices(): Promise<{ invoices: CommercialInvoice[]; totalCount: number }> {
    const res = await fetch('/api/invoices');
    if (!res.ok) throw new Error('Failed to fetch invoices');
    return res.json();
  },

  async getInvoiceById(invoiceId: string): Promise<CommercialInvoice> {
    const res = await fetch(`/api/invoices/${invoiceId}`);
    if (!res.ok) throw new Error('Invoice not found');
    return res.json();
  },

  // 5. Payment Orchestration
  async orchestratePayment(payload: {
    card: any;
    payerMemberId?: string;
    payerMemberName?: string;
    deliveryAddresses?: Record<string, DeliveryAddress>;
  }): Promise<OrchestrationResponse> {
    const res = await fetch('/api/checkout/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.userMessage || 'Payment orchestration failed');
    }
    return data;
  },

  async getPaymentOrchestratorLogs(): Promise<any> {
    const res = await fetch('/api/payment-orchestrator/logs');
    if (!res.ok) throw new Error('Failed to fetch payment orchestrator logs');
    return res.json();
  },

  // 6. Voice AI & Gemini
  async sendVoiceAI(formData: FormData): Promise<{ success: boolean; result: VoiceAIResult; cart: CartItem[] }> {
    const res = await fetch('/api/voice-ai', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Voice AI processing failed');
    return res.json();
  },

  async getRecipeSuggestion(recipeQuery: string): Promise<any> {
    const res = await fetch('/api/ai/recipe-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeQuery }),
    });
    if (!res.ok) throw new Error('Recipe suggestion failed');
    return res.json();
  },

  async getShoppingAdvisor(query: string): Promise<{ response: string; recommendations: Product[] }> {
    const res = await fetch('/api/ai/shopping-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error('Shopping advisor failed');
    return res.json();
  },

  // 7. WhatsApp Simulator
  async sendWhatsAppMessage(data: {
    fromPhone: string;
    senderName: string;
    text: string;
    isVoiceNote?: boolean;
  }): Promise<{ success: boolean; waMessage: WhatsAppMessage; cart: CartItem[]; replyText: string }> {
    const res = await fetch('/api/whatsapp/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('WhatsApp webhook failed');
    return res.json();
  },

  async getWhatsAppLogs(): Promise<{ logs: WhatsAppMessage[] }> {
    const res = await fetch('/api/whatsapp/logs');
    if (!res.ok) throw new Error('Failed to fetch WhatsApp logs');
    return res.json();
  },

  // 8. Smart Basket AI
  async getSmartBasketRecommendations(params: {
    budgetUSD?: number;
    familySize?: number;
    location?: string;
    preferences?: string[];
  }): Promise<{ success: boolean; recommendedProducts: Product[]; totalEstimatedUSD: number; aiNote: string }> {
    const res = await fetch('/api/smart-basket/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to get smart basket recommendations');
    return res.json();
  },

  async applySmartBasket(productIds: string[]): Promise<{ success: boolean; cart: CartItem[] }> {
    const res = await fetch('/api/smart-basket/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds }),
    });
    if (!res.ok) throw new Error('Failed to apply smart basket');
    return res.json();
  },

  // 9. Depots & Delivery
  async getDepots(city?: string): Promise<{ depots: DepotLocation[] }> {
    const query = city ? `?city=${encodeURIComponent(city)}` : '';
    const res = await fetch(`/api/depots${query}`);
    if (!res.ok) throw new Error('Failed to fetch depots');
    return res.json();
  },

  async getDeliveryQuote(city: string, suburb?: string, deliveryType?: string): Promise<{ deliveryFeeUSD: number; eta: string }> {
    const res = await fetch('/api/delivery/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, suburb, deliveryType }),
    });
    if (!res.ok) throw new Error('Failed to get delivery quote');
    return res.json();
  },

  // 10. Exchange Rates
  async getExchangeRates(): Promise<ExchangeRates & { rates: Record<string, number> }> {
    const res = await fetch('/api/exchange-rates');
    if (!res.ok) throw new Error('Failed to fetch exchange rates');
    return res.json();
  },

  async convertCurrency(amountUSD: number, targetCurrency: Currency): Promise<{ targetAmount: number; currency: Currency; formatted: string }> {
    const res = await fetch('/api/currency/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountUSD, targetCurrency }),
    });
    if (!res.ok) throw new Error('Failed to convert currency');
    return res.json();
  },

  // 11. User Profile & Saved Addresses
  async getUserProfile(): Promise<any> {
    const res = await fetch('/api/user/profile');
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  async updateUserProfile(profileData: any): Promise<any> {
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    if (!res.ok) throw new Error('Failed to update user profile');
    return res.json();
  },

  async getUserAddresses(): Promise<any[]> {
    const res = await fetch('/api/user/addresses');
    if (!res.ok) throw new Error('Failed to fetch addresses');
    return res.json();
  },

  async addUserAddress(address: any): Promise<any> {
    const res = await fetch('/api/user/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(address),
    });
    if (!res.ok) throw new Error('Failed to add address');
    return res.json();
  },

  // 12. Live Call Personal Shopper
  async getLiveCallSession(): Promise<any> {
    const res = await fetch('/api/live-call/session');
    if (!res.ok) throw new Error('Failed to get live call session');
    return res.json();
  },

  async triggerBarcodeScan(barcode?: string): Promise<{ success: boolean; scannedProduct: Product; cart: CartItem[] }> {
    const res = await fetch('/api/live-call/scan-barcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode }),
    });
    if (!res.ok) throw new Error('Failed to scan barcode');
    return res.json();
  }
};
