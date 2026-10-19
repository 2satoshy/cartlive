import React, { useState, useEffect } from 'react';
import { socket } from './utils/socket';

import { MultiStoreCatalog } from './components/MultiStoreCatalog';
import { FamilyCart } from './components/FamilyCart';
import { VoiceAIAssistant } from './components/VoiceAIAssistant';
import { WhatsAppSimulator } from './components/WhatsAppSimulator';
import { MonorepoDocsModal } from './components/MonorepoDocsModal';
import { FloatingBottomNav, NavTab } from './components/FloatingBottomNav';
import { SmartBasketModal } from './components/SmartBasketModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { DiscoverView } from './components/DiscoverView';
import { MyShopView } from './components/MyShopView';
import { ProfileView } from './components/ProfileView';
import { LiveCallShoppingView } from './components/LiveCallShoppingView';
import { 
  CartItem, 
  Member, 
  Currency, 
  Product, 
  ExchangeRates, 
  WhatsAppMessage 
} from './types';
import { SAMPLE_PRODUCTS, INITIAL_MEMBERS, INITIAL_EXCHANGE_RATES, getProductBySlugOrId } from './data/products';
import { STORES_BY_REGION, DEFAULT_REGION, DEFAULT_STORE } from './data/stores';
import { 
  Users, 
  Smartphone, 
  Mic, 
  Sparkles, 
  Zap, 
  ShoppingCart, 
  ShieldCheck, 
  Globe, 
  Check, 
  Bell,
  ArrowRight,
  Compass,
  Store,
  User,
  Home,
  Eye,
  EyeOff,
  Video
} from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(INITIAL_EXCHANGE_RATES);
  const [currency, setCurrency] = useState<Currency>('GBP');
  const [lowDataMode, setLowDataMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavTab>('livecall');
  const [isLiveCallOngoing, setIsLiveCallOngoing] = useState<boolean>(false);

  // Personal Cart (for viewers & participants to have their own individual cart)
  const [personalCart, setPersonalCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('pnp_personal_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pnp_personal_cart', JSON.stringify(personalCart));
    } catch {
      // ignore
    }
  }, [personalCart]);

  // Preferred Store & Region State (Managed from Profile Page)
  const [selectedRegion, setSelectedRegion] = useState<string>(() => {
    try {
      return localStorage.getItem('pnp_selected_region') || DEFAULT_REGION;
    } catch {
      return DEFAULT_REGION;
    }
  });

  const [selectedStore, setSelectedStore] = useState<string>(() => {
    try {
      return localStorage.getItem('pnp_selected_store') || DEFAULT_STORE;
    } catch {
      return DEFAULT_STORE;
    }
  });

  const handleRegionChange = (newRegion: string) => {
    setSelectedRegion(newRegion);
    try {
      localStorage.setItem('pnp_selected_region', newRegion);
    } catch {
      // ignore
    }
    const list = STORES_BY_REGION[newRegion];
    if (list && list.length > 0) {
      setSelectedStore(list[0]);
      try {
        localStorage.setItem('pnp_selected_store', list[0]);
      } catch {
        // ignore
      }
    }
  };

  const handleStoreChange = (newStore: string) => {
    setSelectedStore(newStore);
    try {
      localStorage.setItem('pnp_selected_store', newStore);
    } catch {
      // ignore
    }
  };

  // Modals / Drawers
  const [showVoiceAI, setShowVoiceAI] = useState<boolean>(false);
  const [showWhatsAppSim, setShowWhatsAppSim] = useState<boolean>(false);
  const [showSmartBasket, setShowSmartBasket] = useState<boolean>(false);
  const [isBasketTilting, setIsBasketTilting] = useState<boolean>(false);
  const [showDocs, setShowDocs] = useState<boolean>(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);

  const handleViewProduct = (product: Product) => {
    setSelectedProductForDetail(product);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({ productId: product.id }, '', `/${product.slug || product.id}`);
    }
  };

  const handleCloseProductDetail = () => {
    setSelectedProductForDetail(null);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', '/');
    }
  };

  // Dedicated Product Link Deep-Linking Check
  useEffect(() => {
    const checkUrlForProduct = () => {
      if (typeof window === 'undefined') return;
      const path = window.location.pathname.replace(/^\/+/, '');
      if (path && path !== '' && !['cart', 'discover', 'myshop', 'profile', 'livecall'].includes(path)) {
        const matched = getProductBySlugOrId(path);
        if (matched) {
          setSelectedProductForDetail(matched);
        }
      }
      const searchParams = new URLSearchParams(window.location.search);
      const prodParam = searchParams.get('product') || searchParams.get('p') || searchParams.get('slug');
      if (prodParam) {
        const matched = getProductBySlugOrId(prodParam);
        if (matched) setSelectedProductForDetail(matched);
      }
    };

    checkUrlForProduct();
    window.addEventListener('popstate', checkUrlForProduct);
    return () => window.removeEventListener('popstate', checkUrlForProduct);
  }, []);

  const triggerBasketTilt = () => {
    setIsBasketTilting(true);
    setTimeout(() => setIsBasketTilting(false), 700);
  };

  // Real-Time Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(
    '🟢 Connected live to PnP Socket.io & WhatsApp Engine'
  );

  useEffect(() => {
    // Hide initial toast after 5s
    const timer = setTimeout(() => setToastMessage(null), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch initial cart from backend REST API
  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      try {
        const res = await fetch('/api/cart');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data) {
          if (data.cart) setCart(data.cart);
          if (data.members) setMembers(data.members);
        }
      } catch (err) {
        // Quiet fallback to default local state
      }
    };
    fetchInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Socket.io Real-Time Synchronization
  useEffect(() => {
    socket.on('connect_error', () => {
      // Silently handle socket connection error
    });

    socket.on('cart:init', (data) => {
      if (data.cart) setCart(data.cart);
      if (data.members) setMembers(data.members);
      if (data.exchangeRates) setExchangeRates(data.exchangeRates);
    });

    socket.on('cart:update', (data) => {
      if (data.cart) setCart(data.cart);
      if (data.initiator) {
        triggerToast(`⚡ Cart updated in real-time by ${data.initiator}`);
      }
    });

    socket.on('whatsapp:message_received', (waMsg: WhatsAppMessage) => {
      triggerToast(`💬 WhatsApp message received from ${waMsg.senderName}`);
    });

    return () => {
      socket.off('cart:init');
      socket.off('cart:update');
      socket.off('whatsapp:message_received');
    };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Cart operations
  const handleAddToCart = async (
    productId: string,
    memberId?: string,
    noteOrQty?: string | number,
    quantityArg?: number
  ) => {
    let note: string | undefined = undefined;
    let qty: number = 1;

    if (typeof noteOrQty === 'number') {
      qty = noteOrQty;
    } else if (typeof noteOrQty === 'string') {
      note = noteOrQty;
      if (typeof quantityArg === 'number') {
        qty = quantityArg;
      }
    } else if (typeof quantityArg === 'number') {
      qty = quantityArg;
    }

    const targetMemberId = memberId || members[0]?.id || 'mem-1';
    const member = members.find((m) => m.id === targetMemberId) || members[0];
    const product = products.find((p) => p.id === productId) || SAMPLE_PRODUCTS.find((p) => p.id === productId);

    if (!product) return;

    // Instant optimistic UI update
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((i) => i.productId === productId);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qty,
          note: note || updated[existingIndex].note
        };
        return updated;
      } else {
        const newItem: CartItem = {
          id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          product,
          quantity: qty,
          addedByMemberId: member.id,
          addedByMemberName: member.name,
          addedByLocation: member.location,
          channel: member.channel || 'web',
          addedAt: new Date().toISOString(),
          note
        };
        return [newItem, ...prevCart];
      }
    });

    triggerToast(`Added ${qty > 1 ? `${qty}x ` : ''}${product.name} for ${member.name}`);

    // Backend sync
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantity: qty,
          memberId: member.id,
          memberName: member.name,
          memberLocation: member.location,
          channel: member.channel,
          note
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.cart) setCart(data.cart);
      }
    } catch (err) {
      console.error('Add to cart sync error:', err);
    }
  };

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      const res = await fetch('/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity })
      });
      const data = await res.json();
      if (data.cart) setCart(data.cart);
    } catch (err) {
      console.error('Update quantity error:', err);
    }
  };

  const handleClearCart = async () => {
    try {
      const res = await fetch('/api/cart/clear', { method: 'POST' });
      const data = await res.json();
      if (data.cart) setCart(data.cart);
      triggerToast('Shared family cart cleared');
    } catch (err) {
      console.error('Clear cart error:', err);
    }
  };

  // Personal Cart Operations (Viewers & Call Participants)
  const handleAddToPersonalCart = (
    itemData: {
      id?: string;
      name: string;
      priceUSD: number;
      image?: string;
      category?: any;
      unit?: string;
      description?: string;
    },
    qty: number = 1,
    note?: string
  ) => {
    const prodId = itemData.id || `menu-prod-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setPersonalCart((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.productId === prodId || i.product.name.toLowerCase() === itemData.name.toLowerCase()
      );

      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: copy[existingIdx].quantity + qty,
          note: note || copy[existingIdx].note
        };
        return copy;
      }

      const existingCatalog = products.find((p) => p.id === prodId);
      const productObj: Product = existingCatalog || {
        id: prodId,
        name: itemData.name,
        brand: 'TM Pick n Pay',
        category: itemData.category || 'Meats & Proteins',
        storeId: 'TM_PNP',
        storeName: 'TM Pick n Pay Express',
        priceUSD: itemData.priceUSD,
        priceZAR: Number((itemData.priceUSD * exchangeRates.USD_ZAR).toFixed(2)),
        priceZWG: Number((itemData.priceUSD * exchangeRates.USD_ZWG).toFixed(2)),
        image: itemData.image || '/images/fruit and vegetable box 10kg.jpg',
        unit: itemData.unit || '1 Item',
        fulfillmentTag: 'Harare Express',
        inStock: true
      };

      const newItem: CartItem = {
        id: `personal-cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: productObj.id,
        product: productObj,
        quantity: qty,
        addedByMemberId: 'me-personal',
        addedByMemberName: 'Me (Personal Cart)',
        addedByLocation: 'Harare / Diaspora',
        channel: 'web',
        addedAt: new Date().toISOString(),
        note: note || 'Added to Personal Cart'
      };

      return [newItem, ...prev];
    });

    triggerToast(`Added ${itemData.name} to My Personal Cart`);
  };

  const handleUpdatePersonalQuantity = (itemId: string, quantity: number) => {
    setPersonalCart((prev) => {
      if (quantity <= 0) {
        return prev.filter((i) => i.id !== itemId);
      }
      return prev.map((i) => (i.id === itemId ? { ...i, quantity } : i));
    });
  };

  const handleClearPersonalCart = () => {
    setPersonalCart([]);
    triggerToast('Personal Cart cleared');
  };

  const handleAddAllToPersonalCart = (itemsToAdd: any[]) => {
    if (!itemsToAdd || itemsToAdd.length === 0) return;
    setPersonalCart((prev) => {
      const copy = [...prev];
      for (const item of itemsToAdd) {
        const prodId = item.id || `menu-prod-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
        const existingIdx = copy.findIndex(
          (c) => c.productId === prodId || c.product.name.toLowerCase() === item.name.toLowerCase()
        );
        if (existingIdx > -1) {
          copy[existingIdx] = {
            ...copy[existingIdx],
            quantity: copy[existingIdx].quantity + 1
          };
        } else {
          const productObj: Product = {
            id: prodId,
            name: item.name,
            brand: 'TM Pick n Pay',
            category: item.category || 'Meats & Proteins',
            storeId: 'TM_PNP',
            storeName: 'TM Pick n Pay Express',
            priceUSD: item.priceUSD || 3.50,
            priceZAR: Number(((item.priceUSD || 3.50) * exchangeRates.USD_ZAR).toFixed(2)),
            priceZWG: Number(((item.priceUSD || 3.50) * exchangeRates.USD_ZWG).toFixed(2)),
            image: item.image || '/images/fruit and vegetable box 10kg.jpg',
            unit: item.unit || '1 Item',
            fulfillmentTag: 'Harare Express',
            inStock: true
          };
          copy.push({
            id: `personal-cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            productId: productObj.id,
            product: productObj,
            quantity: 1,
            addedByMemberId: 'me-personal',
            addedByMemberName: 'Me (Personal Cart)',
            addedByLocation: 'Harare / Diaspora',
            channel: 'web',
            addedAt: new Date().toISOString(),
            note: 'Added via Menu to Cart'
          });
        }
      }
      return copy;
    });
    triggerToast(`Added all ${itemsToAdd.length} menu items to My Personal Cart!`);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0) + personalCart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-stone-900 font-sans flex flex-col justify-between selection:bg-[#FFB81C] selection:text-[#002D62]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 sm:bottom-4 right-4 z-50 bg-[#002D62] text-[#FFB81C] px-4 py-3 rounded-2xl shadow-2xl border border-[#004A99]/50 flex items-center gap-3 animate-fade-in max-w-sm text-xs font-bold">
          <Bell className="w-4 h-4 text-[#D0021B] flex-shrink-0 animate-bounce" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Body */}
      <main className={`flex-1 w-full ${activeTab === 'livecall' ? 'p-0 max-w-none' : 'max-w-7xl mx-auto px-2.5 sm:px-6 py-3 sm:py-6 pb-28 sm:pb-32 space-y-3 sm:space-y-6'}`}>

        {/* Dynamic Main Views */}
        {activeTab === 'livecall' && (
          <div className="w-full min-h-screen bg-[#071320]">
            <LiveCallShoppingView
              cart={cart}
              personalCart={personalCart}
              members={members}
              currency={currency}
              exchangeRates={exchangeRates}
              onUpdateQuantity={handleUpdateQuantity}
              onClearCart={handleClearCart}
              onAddToCart={(productId, memberId, note) => handleAddToCart(productId, memberId, note)}
              onAddToPersonalCart={handleAddToPersonalCart}
              onUpdatePersonalQuantity={handleUpdatePersonalQuantity}
              onClearPersonalCart={handleClearPersonalCart}
              onAddAllToPersonalCart={handleAddAllToPersonalCart}
              onLeaveCall={() => {
                setActiveTab('home');
              }}
              onEndCall={() => {
                setIsLiveCallOngoing(false);
              }}
              onStartLiveCall={() => {
                setIsLiveCallOngoing(true);
              }}
              isLiveCallOngoing={isLiveCallOngoing}
              onOpenCatalog={() => setActiveTab('home')}
              onOpenWhatsAppSim={() => setShowWhatsAppSim(true)}
            />
          </div>
        )}

        {activeTab === 'home' && (
          <MultiStoreCatalog
            products={products}
            members={members}
            currency={currency}
            lowDataMode={lowDataMode}
            onAddToCart={handleAddToCart}
            onViewProduct={handleViewProduct}
          />
        )}

        {activeTab === 'discover' && (
          <DiscoverView
            products={products}
            members={members}
            currency={currency}
            onAddToCart={(prod, mId, qty) => {
              handleAddToCart(prod.id, mId);
              triggerToast(`Added ${prod.name} to Family Cart`);
            }}
            onOpenVoiceAI={() => setShowVoiceAI(true)}
            onOpenWhatsAppSim={() => setShowWhatsAppSim(true)}
          />
        )}

        {activeTab === 'myshop' && (
          <MyShopView
            members={members}
            products={products}
            currency={currency}
            onAddToCart={handleAddToCart}
            onSelectStoreFilter={() => setActiveTab('home')}
            onOpenWhatsAppSim={() => setShowWhatsAppSim(true)}
          />
        )}

        {activeTab === 'previouslyBought' && (
          <MyShopView
            members={members}
            products={products}
            currency={currency}
            onAddToCart={handleAddToCart}
            onSelectStoreFilter={() => setActiveTab('home')}
            onOpenWhatsAppSim={() => setShowWhatsAppSim(true)}
            initialSection="previouslyBought"
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            currency={currency}
            onCurrencyChange={setCurrency}
            lowDataMode={lowDataMode}
            onToggleLowData={() => setLowDataMode(!lowDataMode)}
            selectedRegion={selectedRegion}
            selectedStore={selectedStore}
            onRegionChange={handleRegionChange}
            onStoreChange={handleStoreChange}
          />
        )}

        {activeTab === 'cart' && (
          <FamilyCart
            cart={cart}
            members={members}
            currency={currency}
            exchangeRates={exchangeRates}
            onUpdateQuantity={handleUpdateQuantity}
            onClearCart={handleClearCart}
            onClose={() => setActiveTab('home')}
            onOpenWhatsAppSim={() => setShowWhatsAppSim(true)}
            onAddToCart={(productId, memberId, note) => handleAddToCart(productId, memberId, note)}
            onStartLiveCall={() => {
              setIsLiveCallOngoing(true);
              setActiveTab('livecall');
            }}
            isLiveCallOngoing={isLiveCallOngoing}
            onEndLiveCall={() => setIsLiveCallOngoing(false)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#001D42] text-blue-200/90 border-t border-[#002D62] py-6 px-4 text-xs mt-10 pb-24 sm:pb-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2 text-white font-black text-sm">
              <span>PnP (TM Pick n Pay)</span>
              <span className="bg-[#D0021B] text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase">Express</span>
              <span className="text-[#FFB81C] font-sans text-xs">• Cross-Border Grocery</span>
            </div>
            <p className="text-[11px] text-stone-300/80">
              TM Pick n Pay cross-border collaborative grocery shopping engine for South Africa (SA) and Zimbabwe (ZIM). Powered by Socket.io, Gemini Voice & WhatsApp API.
            </p>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-bold text-[#FFB81C]">
            <button onClick={() => setShowDocs(true)} className="hover:underline cursor-pointer">
              Monorepo Guide
            </button>
            <span>•</span>
            <button onClick={() => setShowVoiceAI(true)} className="hover:underline cursor-pointer">
              Voice AI Assistant
            </button>
            <span>•</span>
            <button onClick={() => setShowWhatsAppSim(true)} className="hover:underline cursor-pointer">
              WhatsApp Fallback
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Bottom Navigation Bar & TikTok Vertical Action Stack */}
      <FloatingBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        cartCount={totalCartCount}
        onOpenVoiceAI={() => setShowVoiceAI(true)}
        onOpenWhatsAppSim={() => setShowWhatsAppSim(true)}
        onOpenSmartBasket={() => setShowSmartBasket(true)}
        onStartLiveCall={() => {
          setIsLiveCallOngoing(true);
          setActiveTab('livecall');
        }}
        isBasketTilting={isBasketTilting}
      />

      {/* Modals */}
      <ProductDetailModal
        product={selectedProductForDetail}
        isOpen={!!selectedProductForDetail}
        onClose={handleCloseProductDetail}
        currency={currency}
        members={members}
        selectedMemberId={members[0]?.id || 'mem-1'}
        onAddToCart={handleAddToCart}
        onShowToast={triggerToast}
      />

      <SmartBasketModal
        isOpen={showSmartBasket}
        onClose={() => setShowSmartBasket(false)}
        onAddToCart={handleAddToCart}
        onItemDroppedInBasket={triggerBasketTilt}
        currency={currency}
        members={members}
        selectedMemberId={members[0]?.id || 'mem-1'}
        onOpenCart={() => setActiveTab('cart')}
      />

      {showVoiceAI && (
        <VoiceAIAssistant
          onClose={() => setShowVoiceAI(false)}
          onVoiceSuccess={() => {
            setActiveTab('cart');
          }}
          cart={cart}
          onAddToCart={handleAddToCart}
          members={members}
          currency={currency}
          exchangeRates={exchangeRates}
          onNavigateToCart={() => {
            setShowVoiceAI(false);
            setActiveTab('cart');
          }}
        />
      )}

      {showWhatsAppSim && (
        <WhatsAppSimulator
          onClose={() => setShowWhatsAppSim(false)}
          onWhatsAppSuccess={() => {
            setActiveTab('cart');
          }}
        />
      )}

      {showDocs && <MonorepoDocsModal onClose={() => setShowDocs(false)} />}
    </div>
  );
}
