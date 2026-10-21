import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  Megaphone, 
  Trash2, 
  Sparkles, 
  CreditCard, 
  Wallet, 
  Package, 
  LifeBuoy, 
  Star, 
  FileText, 
  Lock, 
  LogOut, 
  ChevronRight, 
  ChevronDown,
  ArrowLeft, 
  Check, 
  Plus, 
  Phone, 
  Mail, 
  ShieldCheck, 
  DollarSign, 
  Gift, 
  Building2, 
  Store, 
  Clock, 
  ExternalLink, 
  MessageCircle, 
  AlertTriangle, 
  RotateCcw, 
  Download, 
  Send, 
  CheckCircle2, 
  ThumbsUp, 
  Edit3,
  Globe,
  Bell,
  RefreshCw,
  HelpCircle,
  X,
  Upload,
  Camera,
  Receipt,
  ShoppingBag,
  History
} from 'lucide-react';
import { Currency, Member, Product } from '../types';
import { ALL_CURRENCIES, formatPrice } from '../utils/currency';
import { OrdersAndInvoicesView } from './OrdersAndInvoicesView';
import { STORES_BY_REGION, DEFAULT_REGION, DEFAULT_STORE } from '../data/stores';
import { SAMPLE_PRODUCTS } from '../data/products';
import { getProductImagePath, handleProductImageError } from '../utils/productImages';

interface ProfileViewProps {
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  lowDataMode: boolean;
  onToggleLowData: () => void;
  selectedRegion?: string;
  selectedStore?: string;
  onRegionChange?: (region: string) => void;
  onStoreChange?: (store: string) => void;
  members?: Member[];
  products?: Product[];
  onAddToCart?: (productId: string, memberId: string, note?: string) => void;
  onOpenWhatsAppSim?: () => void;
  initialSubView?: SubViewType;
}

type SubViewType = 
  | null
  | 'orders'
  | 'invoices'
  | 'history'
  | 'edit-details'
  | 'saved-addresses'
  | 'comm-prefs'
  | 'delete-account'
  | 'pnp'
  | 'bank-cards'
  | 'wallet'
  | 'credits-returns'
  | 'help'
  | 'rate-us'
  | 'terms'
  | 'privacy';

export const ProfileView: React.FC<ProfileViewProps> = ({
  currency,
  onCurrencyChange,
  lowDataMode,
  onToggleLowData,
  selectedRegion,
  selectedStore,
  onRegionChange,
  onStoreChange,
  members = [],
  products = SAMPLE_PRODUCTS,
  onAddToCart,
  onOpenWhatsAppSim,
  initialSubView = null,
}) => {
  const [internalRegion, setInternalRegion] = useState<string>(() => {
    try {
      return localStorage.getItem('pnp_selected_region') || DEFAULT_REGION;
    } catch {
      return DEFAULT_REGION;
    }
  });

  const [internalStore, setInternalStore] = useState<string>(() => {
    try {
      return localStorage.getItem('pnp_selected_store') || DEFAULT_STORE;
    } catch {
      return DEFAULT_STORE;
    }
  });

  const activeRegion = selectedRegion || internalRegion;
  const activeStore = selectedStore || internalStore;

  const handleRegionSelect = (newRegion: string) => {
    if (onRegionChange) {
      onRegionChange(newRegion);
    } else {
      setInternalRegion(newRegion);
      try { localStorage.setItem('pnp_selected_region', newRegion); } catch {}
      const list = STORES_BY_REGION[newRegion];
      if (list && list.length > 0) {
        setInternalStore(list[0]);
        try { localStorage.setItem('pnp_selected_store', list[0]); } catch {}
      }
    }
    showToast(`Fulfillment region set to ${newRegion}`);
  };

  const handleStoreSelect = (newStore: string) => {
    if (onStoreChange) {
      onStoreChange(newStore);
    } else {
      setInternalStore(newStore);
      try { localStorage.setItem('pnp_selected_store', newStore); } catch {}
    }
    showToast(`Preferred store branch updated to ${newStore}`);
  };

  const [activeSubView, setActiveSubView] = useState<SubViewType>(initialSubView || null);

  React.useEffect(() => {
    if (initialSubView) {
      setActiveSubView(initialSubView);
    }
  }, [initialSubView]);

  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<string>('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [showLogOutModal, setShowLogOutModal] = useState(false);

  // User State
  const [userDetails, setUserDetails] = useState({
    name: 'Tendai Moyo',
    email: 'tendai.moyo@diaspora.co.za',
    saPhone: '+27 82 123 4567',
    zimPhone: '+263 77 123 4567',
    primaryLocation: 'Sandton, Johannesburg, SA',
    recipientCity: 'Harare, Zimbabwe',
    language: 'Shona',
    memberId: 'PNP-SA-88421',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  });

  // Saved Addresses State
  const [addresses, setAddresses] = useState([
    {
      id: 'addr-1',
      title: 'Gogo Moyo (Harare Home)',
      addressLine: 'House 42, Bath Road, Avondale',
      suburb: 'Avondale',
      city: 'Harare',
      country: 'Zimbabwe',
      recipientName: 'Gogo Moyo',
      recipientPhone: '+263 77 234 5678',
      type: 'Primary Recipient',
      isDefault: true,
    },
    {
      id: 'addr-2',
      title: 'Bulawayo Click & Collect Depot',
      addressLine: 'SPAR Store Depot, Fife Street',
      suburb: 'Central',
      city: 'Bulawayo',
      country: 'Zimbabwe',
      recipientName: 'Tinashe Moyo',
      recipientPhone: '+263 71 987 6543',
      type: 'Store Pickup',
      isDefault: false,
    },
    {
      id: 'addr-3',
      title: 'Uncle Farai (Mutare House)',
      addressLine: '12 Herbert Chitepo Street',
      suburb: 'Main Town',
      city: 'Mutare',
      country: 'Zimbabwe',
      recipientName: 'Uncle Farai',
      recipientPhone: '+263 73 111 2222',
      type: 'Door Delivery',
      isDefault: false,
    }
  ]);
  const [showAddAddrModal, setShowAddAddrModal] = useState(false);
  const [newAddrForm, setNewAddrForm] = useState({
    title: '',
    addressLine: '',
    city: 'Harare',
    recipientName: '',
    recipientPhone: '+263 ',
    type: 'Door Delivery'
  });

  // Communication Preferences State
  const [commPrefs, setCommPrefs] = useState({
    whatsappOrders: true,
    smsDispatch: true,
    socketCartAlerts: true,
    diasporaPromos: true,
    emailStatements: true,
  });

  // Bank Cards State
  const [cards, setCards] = useState([
    { id: 'card-1', name: 'FNB SA Visa Debit', last4: '4892', expiry: '08/28', type: 'VISA', isDefault: true, icon: '💳' },
    { id: 'card-2', name: 'Nedbank SA Mastercard', last4: '1092', expiry: '11/27', type: 'MASTERCARD', isDefault: false, icon: '💳' },
    { id: 'card-3', name: 'EcoCash Zim Mobile Wallet', last4: '4567', expiry: 'Mobile Direct', type: 'ECOCASH', isDefault: false, icon: '📱' },
    { id: 'card-4', name: 'Mukuru Diaspora Cash', last4: '0988', expiry: 'Instant SA-ZIM', type: 'MUKURU', isDefault: false, icon: '💸' },
    { id: 'card-5', name: 'InnBucks USD Wallet', last4: 'moyo', expiry: 'Harare & BYO', type: 'INNBUCKS', isDefault: false, icon: '💵' },
  ]);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newCardForm, setNewCardForm] = useState({
    holderName: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
  });

  // Wallet State
  const [walletBalanceUSD, setWalletBalanceUSD] = useState(245.00);
  const [topUpAmount, setTopUpAmount] = useState('50');
  const [autoReload, setAutoReload] = useState(true);
  const [walletLogs, setWalletLogs] = useState([
    { id: 'log-1', type: 'Top-Up', date: '28 Jul 2026', amount: '+ $100.00', method: 'FNB Card', status: 'Completed' },
    { id: 'log-2', type: 'Grocery Order #PNP-8921', date: '24 Jul 2026', amount: '- $48.50', method: 'PnP Harare Depot', status: 'Completed' },
    { id: 'log-3', type: 'Store Refund Credit', date: '20 Jul 2026', amount: '+ $15.00', method: 'Damaged Item Refund', status: 'Completed' },
    { id: 'log-4', type: 'Grocery Order #PNP-7740', date: '10 Jul 2026', amount: '- $62.10', method: 'Pick n Pay Bulawayo', status: 'Completed' },
  ]);

  // PnP Smart Points State
  const [pnpPoints, setPnpPoints] = useState(4850);

  // Credits & Returns State
  const [creditsBalanceUSD] = useState(15.00);
  const [returnsList, setReturnsList] = useState([
    { id: 'RET-402', item: 'Mazoe Blackberry Syrup 2L', date: '20 Jul 2026', status: 'Refund Approved', refundUSD: 5.50, reason: 'Bottle cap cracked in transit' },
    { id: 'RET-219', item: 'Sunlight Wash Powder 2kg', date: '04 Jun 2026', status: 'Credit Issued', refundUSD: 9.50, reason: 'Wrong size delivered' },
  ]);
  const [showFileReturnModal, setShowFileReturnModal] = useState(false);
  const [returnForm, setReturnForm] = useState({
    orderId: 'PNP-8921',
    item: 'Tastic Parboiled Rice (10kg)',
    reason: 'Packaging damaged',
    comments: ''
  });

  // Rate Us State
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingTags, setRatingTags] = useState<string[]>(['Fast Delivery ⚡', 'EcoCash Payments 💸']);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Delete Account Form
  const [deleteReason, setDeleteReason] = useState('No longer sending groceries');
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleTopUpWallet = (amt: number) => {
    setWalletBalanceUSD((prev) => prev + amt);
    setWalletLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        type: 'Top-Up',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        amount: `+ $${amt.toFixed(2)}`,
        method: 'EcoCash / SA Card Direct',
        status: 'Completed'
      },
      ...prev
    ]);
    showToast(`Successfully added ${amt.toFixed(2)} to PnP Wallet! 💵`);
  };

  const handleRedeemVoucher = (pts: number, valUSD: number) => {
    if (pnpPoints < pts) {
      showToast('Insufficient PnP Points to redeem this voucher');
      return;
    }
    setPnpPoints((prev) => prev - pts);
    setWalletBalanceUSD((prev) => prev + valUSD);
    showToast(`Redeemed ${pts} PnP Points for ${valUSD} Grocery Voucher! 🎉`);
  };

  const handleAddAddress = () => {
    if (!newAddrForm.title || !newAddrForm.addressLine) {
      showToast('Please enter title and street address');
      return;
    }
    const newAddr = {
      id: `addr-${Date.now()}`,
      title: newAddrForm.title,
      addressLine: newAddrForm.addressLine,
      suburb: newAddrForm.city,
      city: newAddrForm.city,
      country: 'Zimbabwe',
      recipientName: newAddrForm.recipientName || 'Family Member',
      recipientPhone: newAddrForm.recipientPhone,
      type: newAddrForm.type,
      isDefault: false
    };
    setAddresses((prev) => [...prev, newAddr]);
    setShowAddAddrModal(false);
    setNewAddrForm({ title: '', addressLine: '', city: 'Harare', recipientName: '', recipientPhone: '+263 ', type: 'Door Delivery' });
    showToast('New Zimbabwe delivery address saved!');
  };

  const handleAddCard = () => {
    if (!newCardForm.cardNumber || !newCardForm.holderName) {
      showToast('Please fill in card details');
      return;
    }
    const last4 = newCardForm.cardNumber.slice(-4) || '8812';
    const newC = {
      id: `card-${Date.now()}`,
      name: `${newCardForm.holderName}'s Card`,
      last4,
      expiry: newCardForm.expiry || '12/28',
      type: 'VISA',
      isDefault: false,
      icon: '💳'
    };
    setCards((prev) => [...prev, newC]);
    setShowAddCardModal(false);
    setNewCardForm({ holderName: '', cardNumber: '', expiry: '', cvc: '' });
    showToast('New bank card linked successfully!');
  };

  const handleSubmitReturn = () => {
    const newRet = {
      id: `RET-${Math.floor(100 + Math.random() * 900)}`,
      item: returnForm.item,
      date: 'Today',
      status: 'Under Review',
      refundUSD: 14.50,
      reason: returnForm.reason
    };
    setReturnsList((prev) => [newRet, ...prev]);
    setShowFileReturnModal(false);
    showToast('Return request submitted! Our Harare team will process it within 2 hours.');
  };

  // If user clicked Log Out
  if (isLoggedOut) {
    return (
      <div className="bg-[#f1f3f7] min-h-[70vh] p-4 sm:p-6 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#002D62]/10 text-[#002D62] flex items-center justify-center">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-stone-900">You are logged out</h2>
        <p className="text-xs text-stone-500 max-w-sm">
          Log back in as Tendai Moyo to manage your family cart, wallet balance, and delivery addresses in Zimbabwe.
        </p>
        <button
          onClick={() => {
            setIsLoggedOut(false);
            showToast('Welcome back, Tendai! 🇿🇼');
          }}
          className="bg-[#002D62] hover:bg-[#001D42] text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-md transition-all cursor-pointer"
        >
          Log Back In as Tendai Moyo
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#f1f3f7] min-h-[85vh] p-3 sm:p-6 rounded-3xl space-y-5 text-stone-900 relative pb-24">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 z-50 bg-[#002D62] text-[#FFB81C] px-4 py-3 rounded-2xl shadow-2xl border border-[#004A99]/40 flex items-center gap-3 animate-fade-in max-w-sm text-xs font-bold">
          <Sparkles className="w-4 h-4 text-[#D0021B] flex-shrink-0 animate-bounce" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* --- SUB-VIEW RENDER ENGINE --- */}
      {activeSubView !== null ? (
        <div className="space-y-4">
          {/* Sub View Header with Back Button */}
          <div className="flex items-center justify-between bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveSubView(null)}
              className="flex items-center gap-2 text-stone-700 hover:text-[#002D62] font-extrabold text-xs bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#002D62]" />
              <span>Back to My Account</span>
            </button>

            <span className="text-xs font-black text-[#002D62] uppercase tracking-wider hidden sm:inline">
              PnP Account Services
            </span>
          </div>

          {/* 0. PAST ORDERS & INVOICES VIEW */}
          {(activeSubView === 'orders' || activeSubView === 'invoices') && (
            <OrdersAndInvoicesView
              currency={currency}
              onCurrencyChange={onCurrencyChange}
              onShowToast={showToast}
            />
          )}

          {/* 0.5 PURCHASE HISTORY & PREVIOUSLY BOUGHT VIEW */}
          {activeSubView === 'history' && (
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200/80 shadow-xs space-y-6">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#002D62]/10 text-[#002D62] rounded-2xl flex-shrink-0">
                    <History className="w-6 h-6 text-[#002D62]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-lg sm:text-xl">Purchase History & Previously Bought</h3>
                    <p className="text-xs text-stone-500">1-click re-order past staples, view previous orders, and restock family items in Zimbabwe</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                    10 Saved Staples
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                    3 Completed Orders
                  </span>
                </div>
              </div>

              {/* Search Bar & Category Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="Search past bought groceries (e.g. Tastic Rice, Mazoe, Sunfoil Oil)..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#002D62] focus:bg-white transition-all"
                  />
                  <Clock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  {historySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setHistorySearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {['ALL', 'Staples', 'Cooking & Oils', 'Beverages', 'Household & Cleaning', 'Dairy & Fresh'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setHistoryCategoryFilter(cat)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                        historyCategoryFilter === cat
                          ? 'bg-[#002D62] text-white shadow-xs'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Previously Bought Items Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#002D62]" />
                    <span>Frequently Bought Grocery Staples</span>
                  </h4>
                  <span className="text-[11px] text-stone-400">Click &quot;Buy Again&quot; to re-add to cart</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {[
                    {
                      id: 'prod-1',
                      name: 'Tastic Parboiled Rice (10kg)',
                      category: 'Staples',
                      priceUSD: 14.50,
                      unit: '10kg Bag',
                      image: '/images/tastic_rice.jpg',
                      timesBought: 6,
                      lastOrdered: '24 Jul 2026',
                      boughtFor: 'Gogo Moyo',
                      memberId: 'mem-2',
                      tag: '⭐ MOST BOUGHT'
                    },
                    {
                      id: 'prod-2',
                      name: 'Mazoe Blackberry Flavoured Syrup (2L)',
                      category: 'Beverages',
                      priceUSD: 5.50,
                      unit: '2 Litre Bottle',
                      image: '/images/mazoe_blackberry.jpg',
                      timesBought: 5,
                      lastOrdered: '24 Jul 2026',
                      boughtFor: 'Gogo Moyo',
                      memberId: 'mem-2',
                      tag: '🍇 FAMILY FAVOURITE'
                    },
                    {
                      id: 'prod-3',
                      name: 'Sunfoil Pure Sunflower Cooking Oil (2L)',
                      category: 'Cooking & Oils',
                      priceUSD: 4.12,
                      unit: '2 Litre Bottle',
                      image: '/images/sunfoil_oil.jpg',
                      timesBought: 4,
                      lastOrdered: '24 Jul 2026',
                      boughtFor: 'Tinashe Moyo',
                      memberId: 'mem-3',
                      tag: '🍳 PANTRY STAPLE'
                    },
                    {
                      id: 'prod-5',
                      name: 'White Star Super Maize Meal (10kg)',
                      category: 'Staples',
                      priceUSD: 5.78,
                      unit: '10kg Sack',
                      image: '/images/white_star_maize.jpg',
                      timesBought: 7,
                      lastOrdered: '24 Jul 2026',
                      boughtFor: 'Gogo Moyo',
                      memberId: 'mem-2',
                      tag: '🌽 #1 STAPLE'
                    },
                    {
                      id: 'prod-4',
                      name: 'Huletts SunSweet Pure White Sugar (2kg)',
                      category: 'Staples',
                      priceUSD: 2.85,
                      unit: '2kg Bag',
                      image: '/images/huletts_sugar.jpg',
                      timesBought: 3,
                      lastOrdered: '10 Jul 2026',
                      boughtFor: 'Uncle Farai',
                      memberId: 'mem-1',
                      tag: '🍬 DAILY'
                    },
                    {
                      id: 'prod-6',
                      name: 'Iwisa No.1 Super Maize Meal (10kg)',
                      category: 'Staples',
                      priceUSD: 6.20,
                      unit: '10kg Sack',
                      image: '/images/white_star_maize.jpg',
                      timesBought: 4,
                      lastOrdered: '10 Jul 2026',
                      boughtFor: 'Tinashe Moyo',
                      memberId: 'mem-3',
                      tag: '🌽 BRAAI READY'
                    },
                    {
                      id: 'prod-7',
                      name: 'Dettol Herbal Hygiene Soap (175g 4-pack)',
                      category: 'Household & Cleaning',
                      priceUSD: 2.95,
                      unit: '4x175g Pack',
                      image: '/images/dettol_soap.jpg',
                      timesBought: 3,
                      lastOrdered: '10 Jul 2026',
                      boughtFor: 'Uncle Farai',
                      memberId: 'mem-1',
                      tag: '🧼 HYGIENE'
                    },
                    {
                      id: 'prod-8',
                      name: 'Clover Fresh Full Cream Milk (2L)',
                      category: 'Dairy & Fresh',
                      priceUSD: 2.10,
                      unit: '2L Bottle',
                      image: '/images/clover_milk.jpg',
                      timesBought: 2,
                      lastOrdered: '28 Jun 2026',
                      boughtFor: 'Gogo Moyo',
                      memberId: 'mem-2',
                      tag: '🥛 FRESH'
                    },
                    {
                      id: 'prod-10',
                      name: 'Sunlight Auto Washing Powder (2kg)',
                      category: 'Household & Cleaning',
                      priceUSD: 4.80,
                      unit: '2kg Box',
                      image: '/images/sunlight_soap.jpg',
                      timesBought: 3,
                      lastOrdered: '28 Jun 2026',
                      boughtFor: 'Uncle Farai',
                      memberId: 'mem-1',
                      tag: '✨ CLEANING'
                    }
                  ]
                    .filter((item) => {
                      const matchesSearch = item.name.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
                        item.category.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
                        item.boughtFor.toLowerCase().includes(historySearchQuery.toLowerCase());
                      const matchesCategory = historyCategoryFilter === 'ALL' || item.category === historyCategoryFilter;
                      return matchesSearch && matchesCategory;
                    })
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-stone-50 border border-stone-200/90 hover:border-[#002D62]/40 rounded-2xl p-3 flex flex-col justify-between transition-all group shadow-2xs hover:shadow-xs"
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-900 border border-stone-200 flex-shrink-0">
                            <img
                              src={getProductImagePath(item.image)}
                              alt={item.name}
                              onError={(e) => handleProductImageError(e, item.name, 'PANTRY')}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <span className="absolute top-1 left-1 bg-[#D0021B] text-white text-[7px] font-black px-1 py-0.2 rounded uppercase">
                              {item.timesBought}x
                            </span>
                          </div>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[9px] font-black text-[#002D62] bg-blue-50 px-1.5 py-0.2 rounded">
                                {item.tag}
                              </span>
                              <span className="text-[9px] text-stone-400">
                                {item.lastOrdered}
                              </span>
                            </div>

                            <h5 className="font-extrabold text-xs text-stone-900 truncate group-hover:text-[#002D62] transition-colors">
                              {item.name}
                            </h5>
                            <p className="text-[10px] text-stone-500 truncate">{item.unit} • For {item.boughtFor}</p>

                            <div className="flex items-baseline gap-1.5 pt-1">
                              <span className="font-black text-xs text-emerald-700">
                                {formatPrice(item.priceUSD, currency)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Buy Again Button */}
                        <div className="pt-2.5 mt-2 border-t border-stone-200/70 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-stone-500 font-medium">
                            Bought {item.timesBought} times
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              if (onAddToCart) {
                                onAddToCart(item.id, item.memberId, `Re-ordered from Purchase History`);
                              }
                              showToast(`Added ${item.name} to Family Cart! 🛒`);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Buy Again</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Past Order Delivery Slips */}
              <div className="space-y-3 pt-2 border-t border-stone-200/80">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#002D62]" />
                    <span>Past Order Slips & Deliveries ({3})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveSubView('orders')}
                    className="text-xs text-[#002D62] font-bold hover:underline"
                  >
                    View Official Tax Invoices →
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      orderId: 'ZKS-8921',
                      date: '24 Jul 2026',
                      status: 'Delivered',
                      deliveryMode: 'Door Delivery Express',
                      destination: 'House 42, Bath Road, Avondale, Harare',
                      storeName: 'TM Pick n Pay Msasa Hyper (Harare)',
                      totalUSD: 48.50,
                      recipient: 'Gogo Moyo (+263 77 234 5678)',
                      items: [
                        { id: 'prod-1', name: 'Tastic Parboiled Rice (10kg)', qty: 1, priceUSD: 14.50 },
                        { id: 'prod-2', name: 'Mazoe Blackberry Flavoured Syrup (2L)', qty: 2, priceUSD: 11.00 },
                        { id: 'prod-3', name: 'Sunfoil Pure Sunflower Cooking Oil (2L)', qty: 1, priceUSD: 4.12 },
                        { id: 'prod-5', name: 'White Star Super Maize Meal (10kg)', qty: 1, priceUSD: 5.78 }
                      ]
                    },
                    {
                      orderId: 'ZKS-7740',
                      date: '10 Jul 2026',
                      status: 'Delivered',
                      deliveryMode: 'Store Pickup (Click & Collect)',
                      destination: 'Fife St & 12th Ave Depot, Bulawayo',
                      storeName: 'TM Pick n Pay Bulawayo Hyper',
                      totalUSD: 62.10,
                      recipient: 'Tinashe Moyo (+263 71 987 6543)',
                      items: [
                        { id: 'prod-6', name: 'Iwisa No.1 Super Maize Meal (10kg)', qty: 2, priceUSD: 12.40 },
                        { id: 'prod-4', name: 'Huletts SunSweet Pure Sugar (2kg)', qty: 2, priceUSD: 5.70 },
                        { id: 'prod-7', name: 'Dettol Herbal Hygiene Soap 4-pack', qty: 2, priceUSD: 5.90 },
                        { id: 'prod-10', name: 'Sunlight Auto Washing Powder (2kg)', qty: 1, priceUSD: 4.80 }
                      ]
                    }
                  ].map((ord) => (
                    <div
                      key={ord.orderId}
                      className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-stone-900 text-sm">{ord.orderId}</span>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {ord.status}
                          </span>
                          <span className="text-xs text-stone-400 font-medium">• {ord.date}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-black text-sm text-stone-900">
                            {formatPrice(ord.totalUSD, currency)}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              showToast(`📺 Opening recorded stream for order ${ord.orderId}...`);
                            }}
                            className="bg-[#0b1f36] hover:bg-[#1a406b] text-cyan-300 font-extrabold text-[11px] px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 border border-cyan-400/30"
                          >
                            <Video className="w-3 h-3 text-cyan-400" />
                            <span>Rejoin</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              ord.items.forEach((it) => {
                                if (onAddToCart) {
                                  onAddToCart(it.id, 'mem-2', `Re-order from ${ord.orderId}`);
                                }
                              });
                              showToast(`Re-added all items from ${ord.orderId} to Family Cart! 🛒`);
                            }}
                            className="bg-[#002D62] hover:bg-[#001D42] text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3 h-3 text-[#FFB81C]" />
                            <span>Re-order Basket</span>
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-stone-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Store className="w-3.5 h-3.5 text-[#002D62]" />
                          <span>Fulfillment Store: <strong className="text-stone-900">{ord.storeName}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span>Delivered to: {ord.destination} ({ord.recipient})</span>
                        </div>
                      </div>

                      {/* Items mini-list */}
                      <div className="bg-white p-2.5 rounded-xl border border-stone-200/70 divide-y divide-stone-100 text-xs">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="py-1 first:pt-0 last:pb-0 flex items-center justify-between">
                            <span className="text-stone-800 font-medium">
                              {it.qty}x {it.name}
                            </span>
                            <span className="font-bold text-stone-900">
                              {formatPrice(it.priceUSD, currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 1. EDIT MY DETAILS VIEW */}
          {activeSubView === 'edit-details' && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                <div className="p-3 bg-[#002D62]/10 text-[#002D62] rounded-2xl">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-lg">Edit My Details</h3>
                  <p className="text-xs text-stone-500">Update your profile, primary contact info, and diaspora location</p>
                </div>
              </div>

              {/* Avatar Update */}
              <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <div className="relative">
                  <img
                    src={userDetails.avatar}
                    alt={userDetails.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#002D62]"
                  />
                  <button
                    type="button"
                    onClick={() => showToast('Avatar upload simulated')}
                    className="absolute bottom-0 right-0 p-1 bg-[#002D62] text-white rounded-full shadow cursor-pointer"
                    title="Change Photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-sm">{userDetails.name}</h4>
                  <span className="text-xs text-stone-500 block">Member ID: {userDetails.memberId}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full inline-block mt-1">
                    Verified Diaspora Sponsor 🟢
                  </span>
                </div>
              </div>

              {/* Input Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-stone-600 block">Full Name</label>
                  <input
                    type="text"
                    value={userDetails.name}
                    onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#298bf5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-600 block">Email Address</label>
                  <input
                    type="email"
                    value={userDetails.email}
                    onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#298bf5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-600 block">South Africa Phone Number (Mukuru / FNB)</label>
                  <input
                    type="text"
                    value={userDetails.saPhone}
                    onChange={(e) => setUserDetails({ ...userDetails, saPhone: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#298bf5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-600 block">Zimbabwe Phone Number (EcoCash / WhatsApp)</label>
                  <input
                    type="text"
                    value={userDetails.zimPhone}
                    onChange={(e) => setUserDetails({ ...userDetails, zimPhone: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#298bf5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-600 block">Primary Residence</label>
                  <input
                    type="text"
                    value={userDetails.primaryLocation}
                    onChange={(e) => setUserDetails({ ...userDetails, primaryLocation: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#298bf5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-600 block">Preferred Language for Voice AI</label>
                  <select
                    value={userDetails.language}
                    onChange={(e) => setUserDetails({ ...userDetails, language: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#298bf5] cursor-pointer"
                  >
                    <option value="Shona">Shona (ChiShona)</option>
                    <option value="Ndebele">Ndebele (SiNdebele)</option>
                    <option value="English">English</option>
                    <option value="Zulu">isiZulu</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => showToast('Profile details updated successfully! Saved to cloud.')}
                  className="bg-[#1a115e] hover:bg-[#241a7d] text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-[#ffb81c]" />
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. SAVED ADDRESSES VIEW */}
          {activeSubView === 'saved-addresses' && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 text-[#298bf5] rounded-2xl">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-lg">Saved Delivery Destinations</h3>
                    <p className="text-xs text-stone-500">Manage door delivery and Click & Collect store addresses in Zimbabwe</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddAddrModal(true)}
                  className="bg-[#1a115e] hover:bg-[#241a7d] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#ffb81c]" />
                  <span>Add New Address</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-[#1a115e] text-sm">{addr.title}</span>
                        {addr.isDefault && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                            Default Address
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-700 font-medium">{addr.addressLine}, {addr.city}, {addr.country}</p>
                      <div className="text-[11px] text-stone-500 font-mono">
                        👤 Recipient: <strong className="text-stone-800">{addr.recipientName}</strong> ({addr.recipientPhone})
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 text-xs">
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {addr.type}
                      </span>
                      <div className="flex items-center gap-2">
                        {!addr.isDefault && (
                          <button
                            type="button"
                            onClick={() => {
                              setAddresses(addresses.map(a => ({ ...a, isDefault: a.id === addr.id })));
                              showToast(`Set "${addr.title}" as default address`);
                            }}
                            className="text-[11px] text-[#298bf5] hover:underline font-bold"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setAddresses(addresses.filter(a => a.id !== addr.id));
                            showToast('Address removed');
                          }}
                          className="text-[11px] text-red-600 hover:underline font-bold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. COMMUNICATION PREFERENCES VIEW */}
          {activeSubView === 'comm-prefs' && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-lg">Communication Preferences</h3>
                  <p className="text-xs text-stone-500">Configure order alerts, WhatsApp voice notifications, and discount deals</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'whatsappOrders', label: 'WhatsApp Order Updates & Voice Receipts', desc: 'Receive instant WhatsApp receipts and delivery status for family in ZIM' },
                  { key: 'smsDispatch', label: 'SMS Delivery Notifications', desc: 'Send direct SMS alerts to recipients when driver is 10 mins away' },
                  { key: 'socketCartAlerts', label: 'Socket.io Live Cart Member Alerts', desc: 'Notify me when family members add or edit items in the shared cart' },
                  { key: 'diasporaPromos', label: 'Diaspora Special Discount Alerts', desc: 'Get notified about weekly SA-to-ZIM wholesale deals & fee waivers' },
                  { key: 'emailStatements', label: 'Monthly Expense PDF Statements', desc: 'Receive a monthly summary of family grocery spend for accounting' },
                ].map((item) => (
                  <div key={item.key} className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm">{item.label}</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">{item.desc}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCommPrefs({ ...commPrefs, [item.key]: !commPrefs[item.key as keyof typeof commPrefs] })}
                      className={`w-11 h-6 rounded-full p-1 transition-all flex-shrink-0 cursor-pointer ${
                        commPrefs[item.key as keyof typeof commPrefs] ? 'bg-emerald-500' : 'bg-stone-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                          commPrefs[item.key as keyof typeof commPrefs] ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => showToast('Communication preferences saved!')}
                className="bg-[#1a115e] hover:bg-[#241a7d] text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          )}

          {/* 4. REQUEST ACCOUNT DELETION VIEW */}
          {activeSubView === 'delete-account' && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-3 border-b border-red-100 pb-4">
                <div className="p-3 bg-red-500/10 text-red-600 rounded-2xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-lg">Request Account Deletion</h3>
                  <p className="text-xs text-stone-500">Permanently close your PnP account and unlink family members</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2 text-xs text-red-900">
                <span className="font-black text-sm flex items-center gap-1.5 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  Warning: Irreversible Action
                </span>
                <p>
                  Deleting your account will forfeit your <strong>4,850 PnP Loyalty Points ($48.50 value)</strong>, unlink your Moyo Family Shared Cart, and clear saved address presets.
                </p>
              </div>

              <div className="space-y-3 text-xs font-bold">
                <div>
                  <label className="text-stone-700 block mb-1">Reason for closing account:</label>
                  <select
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 focus:outline-none cursor-pointer"
                  >
                    <option value="No longer sending groceries">No longer sending groceries to Zimbabwe</option>
                    <option value="Created duplicate account">Created a duplicate account</option>
                    <option value="Privacy concerns">Privacy concerns</option>
                    <option value="Other">Other reason</option>
                  </select>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-stone-900 block">Download My Account Data</span>
                    <span className="text-[10px] text-stone-500 font-normal">Export your order history and receipts as a JSON archive</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast('Exporting data archive... File downloaded!')}
                    className="bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#298bf5]" />
                    <span>Export ZIP</span>
                  </button>
                </div>

                <label className="flex items-center gap-2 pt-2 cursor-pointer font-bold text-stone-800">
                  <input
                    type="checkbox"
                    checked={deleteConfirmed}
                    onChange={(e) => setDeleteConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                  />
                  <span>I understand that this action is permanent and unlinks my family members.</span>
                </label>
              </div>

              <button
                type="button"
                disabled={!deleteConfirmed}
                onClick={() => {
                  showToast('Account deletion request submitted to PnP Compliance.');
                  setActiveSubView(null);
                }}
                className={`w-full py-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
                  deleteConfirmed
                    ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-md'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Request Account Deletion</span>
              </button>
            </div>
          )}

          {/* 5. PNP VIEW */}
          {activeSubView === 'pnp' && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-xs space-y-5">
              <div className="bg-gradient-to-r from-[#002D62] to-[#003B80] text-white p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#004A99]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFB81C]/20 border border-[#FFB81C]/40 flex items-center justify-center text-[#FFB81C] flex-shrink-0">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                      <span>PnP Smart Shopping Assistant</span>
                      <span className="bg-[#D0021B] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                        Gold Sponsor Tier
                      </span>
                    </h3>
                    <p className="text-xs text-blue-200">Earn points on every SA-to-ZIM order & auto-replenish family staples</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-center self-end sm:self-auto">
                  <span className="text-[10px] text-[#FFB81C] font-bold block uppercase">Points Balance</span>
                  <span className="font-black text-[#FFB81C] text-xl">{pnpPoints.toLocaleString()} pts</span>
                  <span className="text-[10px] text-blue-200 block font-semibold">(${(pnpPoints / 100).toFixed(2)} USD Value)</span>
                </div>
              </div>

              {/* Redeem Vouchers Section */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                  <Gift className="w-4 h-4 text-[#FFB81C]" />
                  <span>Redeem PnP Points for Grocery Vouchers</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { pts: 1000, usd: 10, title: '$10 Grocery Voucher' },
                    { pts: 2500, usd: 25, title: '$25 Family Feast Voucher' },
                    { pts: 5000, usd: 50, title: '$50 Supermarket Voucher' },
                  ].map((v) => (
                    <div key={v.pts} className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2 flex flex-col justify-between">
                      <div>
                        <span className="font-extrabold text-[#002D62] text-sm block">{v.title}</span>
                        <span className="text-xs text-amber-700 font-bold block mt-1">{v.pts} PnP Points</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRedeemVoucher(v.pts, v.usd)}
                        className="w-full bg-[#002D62] hover:bg-[#001D42] text-white font-extrabold text-xs py-2 rounded-xl transition-all cursor-pointer"
                      >
                        Redeem ${v.usd}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Smart AI Recommendation */}
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 space-y-2">
                <span className="font-extrabold text-amber-900 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  PnP Smart Replenishment Tip
                </span>
                <p className="text-xs text-amber-900 leading-snug">
                  Based on past order cycles, Gogo Moyo in Harare will need <strong>Tastic Rice 10kg</strong> in 3 days. Would you like PnP to auto-add it to your cart with a 5% PnP discount?
                </p>
                <button
                  type="button"
                  onClick={() => showToast('Added Tastic Rice 10kg with 5% PnP Discount!')}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer inline-block"
                >
                  Auto-Add Tastic Rice
                </button>
              </div>
            </div>
          )}

          {/* 6. BANK CARDS VIEW */}
          {activeSubView === 'bank-cards' && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-lg">Bank Cards & Payment Methods</h3>
                    <p className="text-xs text-stone-500">Manage SA Visa/Mastercard, EcoCash Zim, Mukuru, and InnBucks USD</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddCardModal(true)}
                  className="bg-[#1a115e] hover:bg-[#241a7d] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#ffb81c]" />
                  <span>Link New Card / Wallet</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map((card) => (
                  <div key={card.id} className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{card.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-stone-900 text-sm">{card.name}</h4>
                          {card.isDefault && (
                            <span className="bg-blue-100 text-[#298bf5] text-[9px] font-black px-1.5 py-0.2 rounded">
                              Primary
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-stone-500 font-mono">**** {card.last4} • {card.expiry}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCards(cards.filter(c => c.id !== card.id));
                        showToast('Payment method removed');
                      }}
                      className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. WALLET BALANCE VIEW */}
          {activeSubView === 'wallet' && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-xs space-y-5">
              <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/10 text-emerald-300 rounded-2xl border border-white/20">
                    <Wallet className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider block">Prepaid Family Shopping Wallet</span>
                    <h3 className="font-black text-white text-2xl sm:text-3xl">${walletBalanceUSD.toFixed(2)} USD</h3>
                    <span className="text-xs text-emerald-200 font-semibold block mt-0.5">Approx. R{(walletBalanceUSD * 18.4).toFixed(0)} ZAR</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleTopUpWallet(50)}
                    className="bg-[#ffb81c] hover:bg-[#ffc63b] text-[#1a115e] font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow cursor-pointer"
                  >
                    Quick Top-Up $50
                  </button>
                </div>
              </div>

              {/* Custom Top Up Form */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                <h4 className="font-extrabold text-stone-900 text-sm">Add Funds to Family Wallet</h4>
                <div className="flex items-center gap-2 flex-wrap">
                  {['20', '50', '100', '200'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpAmount(amt)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        topUpAmount === amt ? 'bg-[#1a115e] text-white' : 'bg-white text-stone-800 border border-stone-300'
                      }`}
                    >
                      ${amt} USD
                    </button>
                  ))}

                  <input
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="Custom $"
                    className="w-24 bg-white border border-stone-300 rounded-xl p-2 text-xs font-bold text-stone-900 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => handleTopUpWallet(parseFloat(topUpAmount) || 20)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    Top-Up Now
                  </button>
                </div>
              </div>

              {/* Wallet Ledger Logs */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-stone-900 text-sm">Recent Wallet Transactions</h4>
                <div className="space-y-2">
                  {walletLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold text-stone-900 block">{log.type}</span>
                        <span className="text-[10px] text-stone-500">{log.date} • {log.method}</span>
                      </div>
                      <span className={`font-black text-sm ${log.amount.startsWith('+') ? 'text-emerald-700' : 'text-stone-900'}`}>
                        {log.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 8. CREDITS & RETURNS VIEW */}
          {activeSubView === 'credits-returns' && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-teal-500/10 text-teal-600 rounded-2xl">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-lg">Credits & Returns Hub</h3>
                    <p className="text-xs text-stone-500">Track item refunds, return disputes, and store credit balance</p>
                  </div>
                </div>

                <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-bold">
                  Store Credit: <strong>${creditsBalanceUSD.toFixed(2)} USD</strong>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-stone-900 text-sm">Return Requests & Dispatched Credits</h4>
                  <button
                    type="button"
                    onClick={() => setShowFileReturnModal(true)}
                    className="bg-[#1a115e] hover:bg-[#241a7d] text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#ffb81c]" />
                    <span>File Return Claim</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {returnsList.map((ret) => (
                    <div key={ret.id} className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-stone-900">{ret.item}</span>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {ret.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-stone-500 block mt-0.5">Claim ID: #{ret.id} • Reason: {ret.reason}</span>
                      </div>
                      <span className="font-black text-emerald-700 text-sm">
                        +${ret.refundUSD.toFixed(2)} USD
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 9. HELP ME VIEW */}
          {activeSubView === 'help' && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                <div className="p-3 bg-sky-500/10 text-sky-600 rounded-2xl">
                  <LifeBuoy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-lg">Help Me & Customer Support</h3>
                  <p className="text-xs text-stone-500">24/7 Diaspora assistance, Harare delivery support, and FAQ guide</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-emerald-900 space-y-2">
                  <span className="font-extrabold text-sm block flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-emerald-700" />
                    WhatsApp Live Chat
                  </span>
                  <p className="text-xs text-emerald-800">Instant chat with our diaspora team in Johannesburg & Harare</p>
                  <button
                    type="button"
                    onClick={() => showToast('Opening PnP WhatsApp Support Chat...')}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl cursor-pointer"
                  >
                    Open WhatsApp
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-blue-900 space-y-2">
                  <span className="font-extrabold text-sm block flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-blue-700" />
                    Harare Depot Hotline
                  </span>
                  <p className="text-xs text-blue-800">+263 24 2000 123 (08:00 - 18:00 ZIM Time)</p>
                  <button
                    type="button"
                    onClick={() => showToast('Calling Harare Hotline...')}
                    className="bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl cursor-pointer"
                  >
                    Call Support
                  </button>
                </div>

                <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl text-stone-900 space-y-2">
                  <span className="font-extrabold text-sm block flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-[#002D62]" />
                    Email Support
                  </span>
                  <p className="text-xs text-stone-600 font-medium">support@pnp.co.zw (Guaranteed response in 2 hrs)</p>
                  <button
                    type="button"
                    onClick={() => showToast('Ticket draft created!')}
                    className="bg-[#002D62] hover:bg-[#001D42] text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl cursor-pointer"
                  >
                    Send Email
                  </button>
                </div>
              </div>

              {/* Accordion FAQ */}
              <div className="space-y-3 pt-2">
                <h4 className="font-extrabold text-stone-900 text-sm">Frequently Asked Questions</h4>
                <div className="space-y-2 text-xs">
                  {[
                    { q: 'How fast is door delivery in Harare and Bulawayo?', a: 'Same-day 2-hour express delivery is available for orders placed before 15:00. Standard delivery arrives next morning.' },
                    { q: 'Can my family collect orders directly at OK or Pick n Pay depots?', a: 'Yes! Select "Store Pickup" at checkout and your family will receive an instant 6-digit collection code on WhatsApp.' },
                    { q: 'What payment methods can I use from South Africa?', a: 'We accept SA Visa/Mastercard (FNB, Nedbank, Capitec), Mukuru Cash Transfer, EcoCash Mobile, and InnBucks USD.' },
                  ].map((faq, i) => (
                    <div key={i} className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                      <span className="font-extrabold text-stone-900 block">Q: {faq.q}</span>
                      <p className="text-stone-600 font-medium">A: {faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 10. RATE US VIEW */}
          {activeSubView === 'rate-us' && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
                  <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-lg">Rate Your PnP Experience</h3>
                  <p className="text-xs text-stone-500">Your feedback helps us improve SA-to-ZIM cross-border grocery delivery</p>
                </div>
              </div>

              {ratingSubmitted ? (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-emerald-900 text-base">Tatenda! Thank you for rating us!</h4>
                  <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                    We’ve credited <strong>+100 Bonus PnP Points</strong> to your account for leaving a review.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Star Rating Bar */}
                  <div className="flex items-center justify-center gap-2 py-3 bg-stone-50 rounded-2xl border border-stone-200">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingStars(star)}
                        className="p-1 transition-transform hover:scale-125 cursor-pointer"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= ratingStars ? 'text-amber-400 fill-amber-400' : 'text-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Rating Tag Pills */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 block">What did you love most?</label>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {['Fast Delivery ⚡', 'EcoCash Payments 💸', 'Voice AI 🎙️', 'Store Prices 🏷️', 'WhatsApp Ease 📱'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (ratingTags.includes(tag)) {
                              setRatingTags(ratingTags.filter(t => t !== tag));
                            } else {
                              setRatingTags([...ratingTags, tag]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                            ratingTags.includes(tag)
                              ? 'bg-[#1a115e] text-white'
                              : 'bg-stone-100 text-stone-700 border border-stone-300'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-stone-700 block">Write your review or suggestion:</label>
                    <textarea
                      rows={3}
                      value={ratingFeedback}
                      onChange={(e) => setRatingFeedback(e.target.value)}
                      placeholder="e.g. My family in Harare received their mealie meal in under 2 hours! Excellent service."
                      className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 font-medium text-stone-900 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setRatingSubmitted(true);
                      setPnpPoints((p) => p + 100);
                      showToast('Submitted review! +100 PnP Points added!');
                    }}
                    className="w-full bg-[#D0021B] hover:bg-[#b00217] text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow cursor-pointer"
                  >
                    Submit 5-Star Review
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 11. TERMS & CONDITIONS VIEW */}
          {activeSubView === 'terms' && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-xs space-y-4 text-xs leading-relaxed text-stone-700">
              <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                <div className="p-3 bg-stone-100 text-stone-800 rounded-2xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-lg">Terms & Conditions</h3>
                  <p className="text-xs text-stone-500">Last updated: July 2026 • TM Pick n Pay Cross-Border Technologies</p>
                </div>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                <h4 className="font-extrabold text-stone-900 text-sm">1. Service Overview</h4>
                <p>TM Pick n Pay facilitates cross-border grocery ordering and store depot pick-up between South Africa, the United Kingdom, and Zimbabwe. All grocery fulfillment is guaranteed through authorized TM Pick n Pay branches and regional fulfillment centers across Zimbabwe and South Africa.</p>

                <h4 className="font-extrabold text-stone-900 text-sm">2. Payments & Currency Rates</h4>
                <p>Payments made via EcoCash, Mukuru, FNB, or Nedbank cards are processed in real-time according to official bank exchange rates. All wallet top-ups are non-expiring and redeemable for goods across all partner depots.</p>

                <h4 className="font-extrabold text-stone-900 text-sm">3. Delivery & Collection Code</h4>
                <p>Door deliveries require recipient phone verification in Harare or Bulawayo. For Click & Collect orders, the recipient must present the 6-digit WhatsApp collection code at the depot counter.</p>
              </div>
            </div>
          )}

          {/* 12. PRIVACY POLICY VIEW */}
          {activeSubView === 'privacy' && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-xs space-y-4 text-xs leading-relaxed text-stone-700">
              <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                <div className="p-3 bg-stone-100 text-stone-800 rounded-2xl">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-lg">Privacy Policy</h3>
                  <p className="text-xs text-stone-500">POPIA & GDPR Compliant Security</p>
                </div>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                <h4 className="font-extrabold text-stone-900 text-sm">1. Information Protection</h4>
                <p>We strictly encrypt all user details, recipient delivery addresses in Zimbabwe, and bank payment tokens using 256-bit AES encryption. Your location data is never shared with third parties.</p>

                <h4 className="font-extrabold text-stone-900 text-sm">2. Voice AI Processing</h4>
                <p>WhatsApp voice messages submitted for grocery orders are parsed anonymously using Gemini AI models and deleted immediately after item extraction.</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* --- MAIN "MY ACCOUNT" MENU HUB (Matches User Screenshots) --- */
        <div className="space-y-6">
          {/* Header User Card */}
          <div className="bg-gradient-to-r from-[#002D62] via-[#003B80] to-[#001D42] text-white rounded-3xl p-5 sm:p-6 shadow-md border border-[#004A99] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={userDetails.avatar}
                  alt={userDetails.name}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full object-cover border-3 border-[#FFB81C] shadow-md"
                />
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#002D62]" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white font-sans">
                    {userDetails.name}
                  </h2>
                  <span className="bg-[#D0021B] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Diaspora Sponsor
                  </span>
                </div>
                <p className="text-xs text-blue-200 mt-0.5 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-[#FFB81C]" />
                  {userDetails.primaryLocation} ➔ {userDetails.recipientCity}
                </p>
                <span className="text-[11px] text-stone-300 font-mono mt-1 block">
                  Member ID: {userDetails.memberId} • Verified EcoCash & Mukuru
                </span>
              </div>
            </div>

            {/* Wallet & PnP Quick Pill */}
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 flex items-center gap-4 text-xs font-bold self-end sm:self-auto">
              <div>
                <span className="text-[10px] text-blue-200 block uppercase font-semibold">Wallet</span>
                <span className="font-black text-emerald-300 text-sm">${walletBalanceUSD.toFixed(2)}</span>
              </div>
              <div className="h-6 w-[1px] bg-white/20" />
              <div>
                <span className="text-[10px] text-[#FFB81C] block uppercase font-semibold">PnP Points</span>
                <span className="font-black text-[#FFB81C] text-sm">{pnpPoints.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Quick Primary Tab Switcher */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 bg-white p-2 rounded-2xl border border-stone-200/90 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveSubView(null)}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-black text-xs transition-all bg-[#002D62] text-white shadow-xs cursor-pointer"
            >
              <User className="w-4 h-4 text-[#FFB81C]" />
              <span>Account Hub</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView('orders')}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-black text-xs transition-all bg-stone-100 hover:bg-[#002D62]/10 text-stone-800 hover:text-[#002D62] cursor-pointer"
            >
              <Package className="w-4 h-4 text-[#D0021B]" />
              <span>Past Orders & Invoices (3)</span>
            </button>
          </div>

          {/* FULFILLMENT REGION & STORE BRANCH (Moved from Top Banner) */}
          <div className="bg-gradient-to-r from-red-50 via-white to-amber-50 rounded-3xl p-5 sm:p-6 border-2 border-[#C51D4A]/25 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#C51D4A] text-white flex items-center justify-center shadow-xs">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-stone-900 text-sm sm:text-base">Fulfillment Region & Store Branch</h3>
                  <p className="text-[11px] text-stone-500 font-medium">Configure your preferred TM Pick n Pay branch in Zimbabwe for orders</p>
                </div>
              </div>
              <span className="bg-[#C51D4A]/10 text-[#C51D4A] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider hidden sm:inline-block">
                74+ Branches
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Region Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C51D4A]" />
                  <span>Region:</span>
                </label>
                <div className="relative">
                  <select
                    value={activeRegion}
                    onChange={(e) => handleRegionSelect(e.target.value)}
                    className="w-full bg-white border-2 border-stone-300 hover:border-[#C51D4A] focus:border-[#C51D4A] rounded-2xl px-3.5 py-2.5 text-xs font-extrabold text-stone-900 shadow-xs focus:outline-none transition-all cursor-pointer appearance-none pr-8"
                  >
                    {Object.keys(STORES_BY_REGION).map((reg) => (
                      <option key={reg} value={reg}>
                        {reg} ({(STORES_BY_REGION[reg] || []).length} branches)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-stone-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Store Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-[#002D62]" />
                  <span>Store:</span>
                </label>
                <div className="relative">
                  <select
                    value={activeStore}
                    onChange={(e) => handleStoreSelect(e.target.value)}
                    className="w-full bg-white border-2 border-stone-300 hover:border-[#002D62] focus:border-[#002D62] rounded-2xl px-3.5 py-2.5 text-xs font-extrabold text-stone-900 shadow-xs focus:outline-none transition-all cursor-pointer appearance-none pr-8"
                  >
                    {(STORES_BY_REGION[activeRegion] || []).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-stone-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Active Store Confirmation Banner */}
            <div className="bg-white p-3 rounded-2xl border border-stone-200 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-stone-800 font-semibold text-[11px]">
                  Active Branch: <strong className="text-stone-950 font-black">{activeStore}</strong> ({activeRegion})
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-black bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                Click & Collect Ready 📦
              </span>
            </div>
          </div>

          {/* SECTION 1: MY ACCOUNT */}
          <div className="space-y-3">
            <h3 className="font-black text-stone-900 text-base sm:text-lg px-1">My Account</h3>

            <div className="space-y-2.5">
              {/* 0. Past Orders & Invoices (Top Shortcut) */}
              <button
                type="button"
                onClick={() => setActiveSubView('orders')}
                className="w-full bg-gradient-to-r from-blue-50 via-white to-amber-50 hover:from-blue-100 hover:to-amber-100 text-left p-4 rounded-3xl border border-blue-200/90 shadow-2xs transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#002D62] text-[#FFB81C] flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-black text-stone-900 text-sm sm:text-base block">Past Orders & Invoices</span>
                    <span className="text-[11px] text-[#002D62] font-bold block">3 Completed Orders • Official VAT Tax Receipts</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#D0021B] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase hidden sm:inline">
                    Live Dispatch
                  </span>
                  <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-[#002D62] group-hover:translate-x-1 transition-all" />
                </div>
              </button>

              {/* 1. Edit My Details */}
              <button
                type="button"
                onClick={() => setActiveSubView('edit-details')}
                className="w-full bg-white hover:bg-stone-50 text-left p-4 rounded-3xl border border-stone-200/90 shadow-2xs transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-stone-100 group-hover:bg-[#002D62]/10 text-stone-800 group-hover:text-[#002D62] flex items-center justify-center transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-stone-900 text-sm sm:text-base">Edit My Details</span>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-[#002D62] group-hover:translate-x-1 transition-all" />
              </button>

              {/* 2. Saved Addresses */}
              <button
                type="button"
                onClick={() => setActiveSubView('saved-addresses')}
                className="w-full bg-white hover:bg-stone-50 text-left p-4 rounded-3xl border border-stone-200/90 shadow-2xs transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-stone-100 group-hover:bg-[#002D62]/10 text-stone-800 group-hover:text-[#002D62] flex items-center justify-center transition-colors">
                    <Store className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-stone-900 text-sm sm:text-base">Saved Addresses</span>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-[#002D62] group-hover:translate-x-1 transition-all" />
              </button>

              {/* 3. Communication Preferences */}
              <button
                type="button"
                onClick={() => setActiveSubView('comm-prefs')}
                className="w-full bg-white hover:bg-stone-50 text-left p-4 rounded-3xl border border-stone-200/90 shadow-2xs transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-stone-100 group-hover:bg-[#002D62]/10 text-stone-800 group-hover:text-[#002D62] flex items-center justify-center transition-colors">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-stone-900 text-sm sm:text-base">Communication Preferences</span>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-[#002D62] group-hover:translate-x-1 transition-all" />
              </button>

              {/* 4. Request Account Deletion */}
              <button
                type="button"
                onClick={() => setActiveSubView('delete-account')}
                className="w-full bg-white hover:bg-stone-50 text-left p-4 rounded-3xl border border-stone-200/90 shadow-2xs transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-stone-100 group-hover:bg-red-50 text-stone-800 group-hover:text-red-600 flex items-center justify-center transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-stone-900 text-sm sm:text-base">Request Account Deletion</span>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>

          {/* SECTION 2: MY SHOPPING */}
          <div className="space-y-3">
            <h3 className="font-black text-stone-900 text-base sm:text-lg px-1">My Shopping</h3>

            <div className="space-y-2.5">
              {/* 0. Orders & Invoices */}
              <button
                type="button"
                onClick={() => setActiveSubView('orders')}
                className="w-full bg-white hover:bg-stone-50 text-left p-4 rounded-3xl border border-stone-200/90 shadow-2xs transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-stone-100 group-hover:bg-[#002D62]/10 text-stone-800 group-hover:text-[#002D62] flex items-center justify-center transition-colors">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-stone-900 text-sm sm:text-base block">Orders & Invoices</span>
                    <span className="text-[11px] text-stone-500 font-medium block">Track past deliveries & download tax invoices</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    3 Completed
                  </span>
                  <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-[#002D62] group-hover:translate-x-1 transition-all" />
                </div>
              </button>

              {/* 1. PnP Smart Assistant */}
              <button
                type="button"
                onClick={() => setActiveSubView('pnp')}
                className="w-full bg-white hover:bg-stone-50 text-left p-4 rounded-3xl border border-stone-200/90 shadow-2xs transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-[#002D62]/10 text-[#002D62] flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-[#D0021B]" />
                  </div>
                  <div>
                    <span className="font-extrabold text-stone-900 text-sm sm:text-base block">PnP Loyalty & Smart Assistant</span>
                    <span className="text-[11px] text-[#002D62] font-bold block">{pnpPoints.toLocaleString()} Points Available</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-[#002D62] group-hover:translate-x-1 transition-all" />
              </button>

              {/* 2. Bank Cards */}
              <button
                type="button"
                onClick={() => setActiveSubView('bank-cards')}
                className="w-full bg-white hover:bg-stone-50 text-left p-4 rounded-3xl border border-stone-200/90 shadow-2xs transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-stone-100 group-hover:bg-[#002D62]/10 text-stone-800 group-hover:text-[#002D62] flex items-center justify-center transition-colors">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-stone-900 text-sm sm:text-base">Bank Cards</span>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-[#002D62] group-hover:translate-x-1 transition-all" />
              </button>

              {/* 3. Wallet Balance */}
              <button
                type="button"
                onClick={() => setActiveSubView('wallet')}
                className="w-full bg-white hover:bg-stone-50 text-left p-4 rounded-3xl border border-stone-200/90 shadow-2xs transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-stone-100 group-hover:bg-emerald-50 text-stone-800 group-hover:text-emerald-700 flex items-center justify-center transition-colors">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-stone-900 text-sm sm:text-base">Wallet Balance</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-full">
                    ${walletBalanceUSD.toFixed(2)} USD
                  </span>
                  <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-[#002D62] group-hover:translate-x-1 transition-all" />
                </div>
              </button>

              {/* 4. Credits & Returns */}
              <button
                type="button"
                onClick={() => setActiveSubView('credits-returns')}
                className="w-full bg-white hover:bg-stone-50 text-left p-4 rounded-3xl border border-stone-200/90 shadow-2xs transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-stone-100 group-hover:bg-[#002D62]/10 text-stone-800 group-hover:text-[#002D62] flex items-center justify-center transition-colors">
                    <Package className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-stone-900 text-sm sm:text-base">Credits & Returns</span>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-[#002D62] group-hover:translate-x-1 transition-all" />
              </button>

              {/* 5. Help Me */}
              <button
                type="button"
                onClick={() => setActiveSubView('help')}
                className="w-full bg-white hover:bg-stone-50 text-left p-4 rounded-3xl border border-stone-200/90 shadow-2xs transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-stone-100 group-hover:bg-[#002D62]/10 text-stone-800 group-hover:text-[#002D62] flex items-center justify-center transition-colors">
                    <LifeBuoy className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-stone-900 text-sm sm:text-base">Help Me</span>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-[#002D62] group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>

          {/* SECTION 3: LEGAL & RATING OPTIONS */}
          <div className="space-y-2.5 pt-2">
            {/* Rate Us */}
            <button
              type="button"
              onClick={() => setActiveSubView('rate-us')}
              className="w-full bg-white hover:bg-stone-50 text-left p-4 rounded-3xl border border-stone-200/90 shadow-2xs transition-all flex items-center justify-between group cursor-pointer"
            >
              <span className="font-extrabold text-stone-900 text-sm sm:text-base pl-1">Rate Us</span>
              <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-[#002D62] group-hover:translate-x-1 transition-all" />
            </button>

            {/* Terms & Conditions */}
            <button
              type="button"
              onClick={() => setActiveSubView('terms')}
              className="w-full bg-white hover:bg-stone-50 text-left p-4 rounded-3xl border border-stone-200/90 shadow-2xs transition-all flex items-center justify-between group cursor-pointer"
            >
              <span className="font-extrabold text-stone-900 text-sm sm:text-base pl-1">Terms & Conditions</span>
              <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-[#002D62] group-hover:translate-x-1 transition-all" />
            </button>

            {/* Privacy Policy */}
            <button
              type="button"
              onClick={() => setActiveSubView('privacy')}
              className="w-full bg-white hover:bg-stone-50 text-left p-4 rounded-3xl border border-stone-200/90 shadow-2xs transition-all flex items-center justify-between group cursor-pointer"
            >
              <span className="font-extrabold text-stone-900 text-sm sm:text-base pl-1">Privacy Policy</span>
              <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-[#002D62] group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          {/* FOOTER ROW: Log Out Button & Version Badge (From Screenshot 3) */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setShowLogOutModal(true)}
              className="bg-stone-200/80 hover:bg-stone-300/80 text-stone-900 font-extrabold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <span>Log Out</span>
              <LogOut className="w-4 h-4 text-stone-700" />
            </button>

            <span className="bg-[#e2f5f4] text-[#0f766e] text-xs font-bold px-3 py-1.5 rounded-xl border border-[#b2ece8]">
              Ver. 2.8.0
            </span>
          </div>
        </div>
      )}

      {/* --- MODAL 1: ADD ADDRESS MODAL --- */}
      {showAddAddrModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl border border-stone-200 animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#298bf5]" />
                Add Zimbabwe Delivery Address
              </h3>
              <button
                type="button"
                onClick={() => setShowAddAddrModal(false)}
                className="text-stone-400 hover:text-stone-700 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 font-semibold">
              <div>
                <label className="text-stone-600 block mb-1">Preset Title (e.g., Gogo's House)</label>
                <input
                  type="text"
                  placeholder="Gogo's House"
                  value={newAddrForm.title}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, title: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-stone-600 block mb-1">Street Address</label>
                <input
                  type="text"
                  placeholder="42 Bath Road, Avondale"
                  value={newAddrForm.addressLine}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, addressLine: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-stone-600 block mb-1">City</label>
                  <select
                    value={newAddrForm.city}
                    onChange={(e) => setNewAddrForm({ ...newAddrForm, city: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 focus:outline-none cursor-pointer"
                  >
                    <option value="Harare">Harare</option>
                    <option value="Bulawayo">Bulawayo</option>
                    <option value="Mutare">Mutare</option>
                    <option value="Gweru">Gweru</option>
                    <option value="Chitungwiza">Chitungwiza</option>
                  </select>
                </div>

                <div>
                  <label className="text-stone-600 block mb-1">Fulfillment Type</label>
                  <select
                    value={newAddrForm.type}
                    onChange={(e) => setNewAddrForm({ ...newAddrForm, type: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 focus:outline-none cursor-pointer"
                  >
                    <option value="Door Delivery">Door Delivery</option>
                    <option value="Store Pickup">Store Pickup</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-stone-600 block mb-1">Recipient Full Name</label>
                <input
                  type="text"
                  placeholder="Gogo Moyo"
                  value={newAddrForm.recipientName}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, recipientName: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-stone-600 block mb-1">Recipient Contact Phone (WhatsApp)</label>
                <input
                  type="text"
                  value={newAddrForm.recipientPhone}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, recipientPhone: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleAddAddress}
                className="w-full bg-[#002D62] hover:bg-[#001D42] text-white font-extrabold py-2.5 rounded-xl cursor-pointer"
              >
                Save Destination
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: LINK CARD MODAL --- */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl border border-stone-200 animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                Link Card or Wallet
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCardModal(false)}
                className="text-stone-400 hover:text-stone-700 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 font-semibold">
              <div>
                <label className="text-stone-600 block mb-1">Cardholder Name</label>
                <input
                  type="text"
                  placeholder="Tendai Moyo"
                  value={newCardForm.holderName}
                  onChange={(e) => setNewCardForm({ ...newCardForm, holderName: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-stone-600 block mb-1">Card Number / Mobile Wallet ID</label>
                <input
                  type="text"
                  placeholder="4532 **** **** 8812"
                  value={newCardForm.cardNumber}
                  onChange={(e) => setNewCardForm({ ...newCardForm, cardNumber: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-stone-600 block mb-1">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    placeholder="12/28"
                    value={newCardForm.expiry}
                    onChange={(e) => setNewCardForm({ ...newCardForm, expiry: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-stone-600 block mb-1">CVC</label>
                  <input
                    type="text"
                    placeholder="882"
                    value={newCardForm.cvc}
                    onChange={(e) => setNewCardForm({ ...newCardForm, cvc: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddCard}
              className="w-full bg-[#002D62] hover:bg-[#001D42] text-white font-extrabold py-2.5 rounded-xl cursor-pointer"
            >
              Link Payment Method
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 3: FILE RETURN MODAL --- */}
      {showFileReturnModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl border border-stone-200 animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-1.5">
                <Package className="w-4 h-4 text-teal-600" />
                File Item Return or Damage Claim
              </h3>
              <button
                type="button"
                onClick={() => setShowFileReturnModal(false)}
                className="text-stone-400 hover:text-stone-700 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 font-semibold">
              <div>
                <label className="text-stone-600 block mb-1">Select Order ID</label>
                <select
                  value={returnForm.orderId}
                  onChange={(e) => setReturnForm({ ...returnForm, orderId: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 focus:outline-none cursor-pointer"
                >
                  <option value="PNP-8921">Order #PNP-8921 (24 Jul 2026)</option>
                  <option value="PNP-7740">Order #PNP-7740 (10 Jul 2026)</option>
                </select>
              </div>

              <div>
                <label className="text-stone-600 block mb-1">Item to Return</label>
                <input
                  type="text"
                  value={returnForm.item}
                  onChange={(e) => setReturnForm({ ...returnForm, item: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-stone-600 block mb-1">Reason for Claim</label>
                <select
                  value={returnForm.reason}
                  onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2 text-stone-900 focus:outline-none cursor-pointer"
                >
                  <option value="Packaging damaged">Damaged / Broken in transit</option>
                  <option value="Wrong item delivered">Wrong item delivered</option>
                  <option value="Missing item">Item missing from delivery bag</option>
                </select>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-dashed border-stone-300 text-center">
                <Upload className="w-5 h-5 text-stone-400 mx-auto mb-1" />
                <span className="text-stone-600 text-[11px] block font-bold">Attach Photo of Damaged Goods</span>
                <span className="text-[10px] text-stone-400">Click to upload image</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmitReturn}
              className="w-full bg-[#002D62] hover:bg-[#001D42] text-white font-extrabold py-2.5 rounded-xl cursor-pointer"
            >
              Submit Return Request
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 4: LOG OUT CONFIRMATION MODAL --- */}
      {showLogOutModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 text-center shadow-2xl border border-stone-200 animate-fade-in text-xs">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-stone-900 text-base">Log Out of PnP?</h3>
            <p className="text-stone-500">
              You can log back in anytime as <strong>Tendai Moyo</strong>.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogOutModal(false)}
                className="w-1/2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold py-2.5 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogOutModal(false);
                  setIsLoggedOut(true);
                }}
                className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-extrabold py-2.5 rounded-xl cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
