import React, { useState, useMemo, useEffect } from 'react';
import { 
  Store, 
  Building2, 
  MapPin, 
  Users, 
  CheckCircle2, 
  ShieldCheck, 
  PhoneCall, 
  Clock, 
  Share2, 
  Plus, 
  Copy, 
  Check, 
  ShoppingBag, 
  RotateCcw, 
  Search, 
  History, 
  Sparkles, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Truck, 
  ArrowRight, 
  Package,
  ShoppingBasket,
  Navigation,
  LocateFixed,
  Star,
  ExternalLink,
  Car,
  ArrowLeft
} from 'lucide-react';
import { Member, StoreId, Currency, Product } from '../types';
import { SAMPLE_PRODUCTS } from '../data/products';
import { formatPrice } from '../utils/currency';
import { getProductImagePath, handleProductImageError } from '../utils/productImages';

interface MyShopViewProps {
  members: Member[];
  products?: Product[];
  currency?: Currency;
  onAddToCart?: (productId: string, memberId: string, note?: string) => void;
  onSelectStoreFilter?: (storeId: StoreId) => void;
  onOpenWhatsAppSim: () => void;
  initialSection?: 'frequent' | 'orders' | 'previouslyBought';
  onBack?: () => void;
}

export interface PnPBranch {
  id: string;
  name: string;
  region: 'Harare' | 'Bulawayo' | 'Midlands' | 'Manicaland' | 'South Africa';
  suburb: string;
  address: string;
  lat: number;
  lng: number;
  hours: string;
  expressDelivery: string;
  deliveryTimeEst: string;
  phone: string;
  image: string;
  services: string[];
  isHyper?: boolean;
}

const PICK_N_PAY_BRANCHES: PnPBranch[] = [
  {
    id: 'pnp-msasa',
    name: 'TM Pick n Pay Msasa Hyper',
    region: 'Harare',
    suburb: 'Msasa Industrial',
    address: 'Mutare Road & Harrow Rd, Msasa, Harare',
    lat: -17.8345,
    lng: 31.1158,
    hours: '07:00 - 20:00 Daily',
    expressDelivery: 'Same-day 45 Min Express',
    deliveryTimeEst: '~4 mins drive',
    phone: '+263 24 248 6800',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80',
    services: ['Hyper Depot', 'Bakery & Deli', 'Butchery', 'Click & Collect Lockers', 'EcoCash Cashout', 'Mukuru Remittance'],
    isHyper: true,
  },
  {
    id: 'pnp-borrowdale',
    name: 'Pick n Pay Borrowdale',
    region: 'Harare',
    suburb: 'Borrowdale',
    address: "Sam Levy's Village, Borrowdale Road, Harare",
    lat: -17.7583,
    lng: 31.0881,
    hours: '07:30 - 20:30 Daily',
    expressDelivery: 'Rapid 30 Min Express',
    deliveryTimeEst: '~5 mins drive',
    phone: '+263 24 288 2301',
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&auto=format&fit=crop&q=80',
    services: ['Premium Aisles', 'Fresh Bakery', 'Liquor Store', 'Express Locker', 'Mukuru Remittance Desk', 'Pharmacy'],
  },
  {
    id: 'pnp-avondale',
    name: 'Pick n Pay Avondale',
    region: 'Harare',
    suburb: 'Avondale',
    address: 'King George Rd & Bath Rd, Avondale Shopping Centre, Harare',
    lat: -17.7915,
    lng: 31.0345,
    hours: '07:30 - 19:30 Daily',
    expressDelivery: 'Same-day 45 Min Express',
    deliveryTimeEst: '~7 mins drive',
    phone: '+263 24 233 4455',
    image: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=400&auto=format&fit=crop&q=80',
    services: ['Bakery & Deli', 'Fresh Produce', 'In-Store ATM', 'Rapid Click & Collect', 'EcoCash Cashout'],
  },
  {
    id: 'pnp-joina',
    name: 'TM Pick n Pay Joina City',
    region: 'Harare',
    suburb: 'Harare CBD',
    address: 'Joina City Mall, Jason Moyo Ave & Inez Terrace, Harare CBD',
    lat: -17.8315,
    lng: 31.0502,
    hours: '07:30 - 19:00 Daily',
    expressDelivery: '30 Min CBD Express',
    deliveryTimeEst: '~3 mins drive',
    phone: '+263 24 277 8899',
    image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&auto=format&fit=crop&q=80',
    services: ['City Express', 'Ready Meals Deli', 'In-Store EcoCash', 'Quick Pickup Counter'],
  },
  {
    id: 'pnp-kamfinsa',
    name: 'TM Pick n Pay Kamfinsa',
    region: 'Harare',
    suburb: 'Greendale',
    address: 'Kamfinsa Shopping Centre, Arcturus Rd, Greendale, Harare',
    lat: -17.8090,
    lng: 31.1215,
    hours: '07:30 - 19:30 Daily',
    expressDelivery: 'Same-day 45 Min Express',
    deliveryTimeEst: '~6 mins drive',
    phone: '+263 24 249 7120',
    image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400&auto=format&fit=crop&q=80',
    services: ['Fresh Bakery', 'Family Hampers Depot', 'Butchery', 'Click & Collect Lockers'],
  },
  {
    id: 'pnp-byo-hyper',
    name: 'TM Pick n Pay Bulawayo Hyper',
    region: 'Bulawayo',
    suburb: 'Bulawayo CBD',
    address: '9th Avenue & Fife Street, Bulawayo CBD',
    lat: -20.1569,
    lng: 28.5833,
    hours: '07:30 - 19:30 Daily',
    expressDelivery: 'Same-day 60 Min Express',
    deliveryTimeEst: '~5 mins drive',
    phone: '+263 29 288 1234',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80',
    services: ['Flagship Hyper', 'Staples Distribution', 'Click & Collect Counter', 'Mukuru & EcoCash Remittance'],
    isHyper: true,
  },
  {
    id: 'pnp-bradfield',
    name: 'Pick n Pay Bradfield',
    region: 'Bulawayo',
    suburb: 'Bradfield',
    address: 'Zemco Complex, Hillside Rd, Bradfield, Bulawayo',
    lat: -20.1772,
    lng: 28.5995,
    hours: '08:00 - 19:00 Daily',
    expressDelivery: 'Same-day 45 Min Express',
    deliveryTimeEst: '~6 mins drive',
    phone: '+263 29 276 5432',
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&auto=format&fit=crop&q=80',
    services: ['Fresh Bakery', 'Butchery', 'Liquor Store', 'Click & Collect', 'Secure Parking'],
  },
  {
    id: 'pnp-gweru-megawatt',
    name: 'Pick n Pay Gweru Megawatt',
    region: 'Midlands',
    suburb: 'Gweru CBD',
    address: 'Megawatt Complex, Robert Mugabe Way, Gweru CBD',
    lat: -19.4583,
    lng: 29.8167,
    hours: '07:30 - 18:30 Daily',
    expressDelivery: 'Same-day Regional Dispatch',
    deliveryTimeEst: '~8 mins drive',
    phone: '+263 54 222 3456',
    image: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=400&auto=format&fit=crop&q=80',
    services: ['Midlands Distribution Depot', 'Agricultural Staples', 'Click & Collect Desk', 'EcoCash Cashout'],
  },
  {
    id: 'pnp-mutare-main',
    name: 'Pick n Pay Mutare Main',
    region: 'Manicaland',
    suburb: 'Mutare CBD',
    address: '104 Herbert Chitepo Street, Mutare CBD',
    lat: -18.9728,
    lng: 32.6695,
    hours: '07:30 - 18:30 Daily',
    expressDelivery: 'Same-day Regional Dispatch',
    deliveryTimeEst: '~5 mins drive',
    phone: '+263 20 645 6789',
    image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&auto=format&fit=crop&q=80',
    services: ['Eastern Highlands Hub', 'Tea & Staples Depot', 'Click & Collect Counter', 'Mukuru Cash Desk'],
  },
  {
    id: 'pnp-sa-export-hub',
    name: 'Pick n Pay SA Export & Fulfillment Hub',
    region: 'South Africa',
    suburb: 'City Deep & Beitbridge Corridor',
    address: 'City Deep Logistics Corridor, Heidelberg Rd, Johannesburg, SA',
    lat: -26.2201,
    lng: 28.0825,
    hours: '06:00 - 18:00 (Mon-Sat)',
    expressDelivery: 'Direct 24-48hr Cross-Border Truck to Zim Doorstep',
    deliveryTimeEst: 'Direct Cross-Border Road Freight',
    phone: '+27 11 856 7000',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&auto=format&fit=crop&q=80',
    services: ['Cross-Border Freight Export', 'Beitbridge Fast-Track', 'Pallet & Bulk Hamper Dispatch', 'FNB / Nedbank Pay-in'],
    isHyper: true,
  },
];

interface LocationPreset {
  label: string;
  lat: number;
  lng: number;
  description: string;
}

const LOCATION_PRESETS: LocationPreset[] = [
  { label: 'Harare Borrowdale', lat: -17.7583, lng: 31.0881, description: 'Harare North / Sam Levy’s' },
  { label: 'Harare Msasa', lat: -17.8345, lng: 31.1158, description: 'Harare East / Mutare Rd' },
  { label: 'Harare CBD', lat: -17.8315, lng: 31.0502, description: 'Central Business District' },
  { label: 'Bulawayo Central', lat: -20.1569, lng: 28.5833, description: 'Bulawayo CBD & Hyper' },
  { label: 'Gweru Central', lat: -19.4583, lng: 29.8167, description: 'Midlands Capital' },
  { label: 'Mutare Central', lat: -18.9728, lng: 32.6695, description: 'Manicaland / Eastern Border' },
  { label: 'Johannesburg (SA)', lat: -26.2201, lng: 28.0825, description: 'Gauteng & Cross-Border Hub' },
];

// Haversine formula to compute distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

interface PreviousOrder {
  orderId: string;
  date: string;
  status: 'Delivered' | 'Collected' | 'Completed';
  deliveryMode: 'Door Delivery' | 'Store Pickup';
  destination: string;
  storeName: string;
  totalUSD: number;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    priceUSD: number;
    recipientMemberId: string;
    recipientName: string;
  }>;
}

const PREVIOUS_ORDERS: PreviousOrder[] = [
  {
    orderId: 'ZKS-8921',
    date: '24 Jul 2026',
    status: 'Delivered',
    deliveryMode: 'Door Delivery',
    destination: '78 Samora Machel Ave, Harare',
    storeName: 'TM Pick n Pay Msasa Hyper (Harare)',
    totalUSD: 48.50,
    items: [
      { productId: 'prod-1', productName: 'Tastic Parboiled Rice (10kg)', quantity: 1, priceUSD: 14.50, recipientMemberId: 'mem-2', recipientName: 'Gogo Moyo' },
      { productId: 'prod-2', productName: 'Mazoe Blackberry Flavoured Syrup (2L)', quantity: 2, priceUSD: 11.00, recipientMemberId: 'mem-2', recipientName: 'Gogo Moyo' },
      { productId: 'prod-3', productName: 'Sunfoil Pure Sunflower Cooking Oil (2L)', quantity: 1, priceUSD: 6.80, recipientMemberId: 'mem-3', recipientName: 'Tinashe Moyo' },
      { productId: 'prod-5', productName: 'White Star Super Maize Meal (10kg)', quantity: 1, priceUSD: 16.20, recipientMemberId: 'mem-2', recipientName: 'Gogo Moyo' },
    ]
  },
  {
    orderId: 'ZKS-7740',
    date: '10 Jul 2026',
    status: 'Delivered',
    deliveryMode: 'Door Delivery',
    destination: 'Fife St & 12th Ave, Bulawayo',
    storeName: 'TM Pick n Pay Bulawayo Hyper',
    totalUSD: 62.10,
    items: [
      { productId: 'prod-6', productName: 'Iwisa No.1 Super Maize Meal (10kg)', quantity: 2, priceUSD: 30.00, recipientMemberId: 'mem-3', recipientName: 'Tinashe Moyo' },
      { productId: 'prod-4', productName: 'Huletts SunSweet Pure Sugar (2kg)', quantity: 2, priceUSD: 7.60, recipientMemberId: 'mem-3', recipientName: 'Tinashe Moyo' },
      { productId: 'prod-7', productName: 'Dettol Herbal Hygiene Soap (175g 4-pack)', quantity: 2, priceUSD: 7.00, recipientMemberId: 'mem-1', recipientName: 'Uncle Farai' },
      { productId: 'prod-10', productName: 'Sunlight Auto Washing Powder (2kg)', quantity: 1, priceUSD: 17.50, recipientMemberId: 'mem-1', recipientName: 'Uncle Farai' },
    ]
  },
  {
    orderId: 'ZKS-6102',
    date: '28 Jun 2026',
    status: 'Collected',
    deliveryMode: 'Store Pickup',
    destination: 'Pick n Pay SA Export Hub (Joburg ➔ Zim)',
    storeName: 'Pick n Pay SA Export Hub (Joburg ➔ Zim)',
    totalUSD: 31.80,
    items: [
      { productId: 'prod-1', productName: 'Tastic Parboiled Rice (10kg)', quantity: 1, priceUSD: 14.50, recipientMemberId: 'mem-2', recipientName: 'Gogo Moyo' },
      { productId: 'prod-9', productName: 'Gloria Cake Wheat Flour (2kg)', quantity: 2, priceUSD: 9.80, recipientMemberId: 'mem-2', recipientName: 'Gogo Moyo' },
      { productId: 'prod-8', productName: 'Anchor Instant Dry Yeast (100g)', quantity: 3, priceUSD: 7.50, recipientMemberId: 'mem-2', recipientName: 'Gogo Moyo' },
    ]
  }
];

const PREVIOUSLY_BOUGHT_META: Record<string, {
  timesBought: number;
  lastOrdered: string;
  boughtBy: string;
  defaultRecipientId: string;
}> = {
  'prod-1': { timesBought: 6, lastOrdered: '24 Jul 2026', boughtBy: 'You & Gogo Moyo', defaultRecipientId: 'mem-2' },
  'prod-2': { timesBought: 5, lastOrdered: '24 Jul 2026', boughtBy: 'You (For Gogo)', defaultRecipientId: 'mem-2' },
  'prod-3': { timesBought: 4, lastOrdered: '24 Jul 2026', boughtBy: 'Tinashe Moyo', defaultRecipientId: 'mem-3' },
  'prod-4': { timesBought: 3, lastOrdered: '10 Jul 2026', boughtBy: 'Uncle Farai', defaultRecipientId: 'mem-1' },
  'prod-5': { timesBought: 7, lastOrdered: '24 Jul 2026', boughtBy: 'Family Group Favorite', defaultRecipientId: 'mem-2' },
  'prod-6': { timesBought: 4, lastOrdered: '10 Jul 2026', boughtBy: 'Tinashe Moyo', defaultRecipientId: 'mem-3' },
  'prod-7': { timesBought: 3, lastOrdered: '10 Jul 2026', boughtBy: 'Uncle Farai', defaultRecipientId: 'mem-1' },
  'prod-8': { timesBought: 2, lastOrdered: '28 Jun 2026', boughtBy: 'Gogo Moyo', defaultRecipientId: 'mem-2' },
  'prod-9': { timesBought: 3, lastOrdered: '28 Jun 2026', boughtBy: 'Gogo Moyo', defaultRecipientId: 'mem-2' },
  'prod-10': { timesBought: 2, lastOrdered: '10 Jul 2026', boughtBy: 'Uncle Farai', defaultRecipientId: 'mem-1' },
};

export const MyShopView: React.FC<MyShopViewProps> = ({
  members,
  products = SAMPLE_PRODUCTS,
  currency = 'USD' as Currency,
  onAddToCart,
  onSelectStoreFilter,
  onOpenWhatsAppSim,
  initialSection = 'frequent',
  onBack,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'depots' | 'myitems' | 'family'>('depots');
  const [myItemsSection, setMyItemsSection] = useState<'frequent' | 'orders' | 'previouslyBought'>(initialSection);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipientMap, setSelectedRecipientMap] = useState<Record<string, string>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>('ZKS-8921');

  // User Proximity Location State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: -17.8292,
    lng: 31.0522, // Harare Central default
  });
  const [locationName, setLocationName] = useState<string>('Harare Central');
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('ALL');
  const [preferredBranchId, setPreferredBranchId] = useState<string>(() => {
    return localStorage.getItem('tm_pnp_preferred_branch') || 'pnp-borrowdale';
  });

  // GPS Auto-Detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setToastMsg('Geolocation is not supported by your browser');
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsDetectingLocation(false);
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationName('Live GPS Detected Location');
        setToastMsg('📍 Live location detected! Branches sorted by proximity.');
        setTimeout(() => setToastMsg(null), 3500);
      },
      (error) => {
        setIsDetectingLocation(false);
        console.warn('Geolocation error:', error);
        setToastMsg('Location access denied or unavailable. Using preset selector.');
        setTimeout(() => setToastMsg(null), 3500);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectPreset = (preset: LocationPreset) => {
    setUserCoords({ lat: preset.lat, lng: preset.lng });
    setLocationName(preset.label);
    setToastMsg(`📍 Reference location set to ${preset.label}`);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleSetPreferredBranch = (branch: PnPBranch) => {
    setPreferredBranchId(branch.id);
    localStorage.setItem('tm_pnp_preferred_branch', branch.id);
    setToastMsg(`⭐ ${branch.name} saved as your primary Pick n Pay branch!`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Compute branches with real proximity distances and sort nearest to farthest
  const branchesWithDistance = useMemo(() => {
    const list = PICK_N_PAY_BRANCHES.map((b) => {
      const distanceKm = calculateDistanceKm(userCoords.lat, userCoords.lng, b.lat, b.lng);
      return {
        ...b,
        distanceKm,
      };
    });

    // Sort by proximity
    list.sort((a, b) => a.distanceKm - b.distanceKm);
    return list;
  }, [userCoords]);

  // Filtered branches based on region and search query
  const filteredBranches = useMemo(() => {
    return branchesWithDistance.filter((b) => {
      const matchRegion = selectedRegionFilter === 'ALL' || b.region === selectedRegionFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        b.name.toLowerCase().includes(q) ||
        b.suburb.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q) ||
        b.region.toLowerCase().includes(q) ||
        b.services.some((s) => s.toLowerCase().includes(q));

      return matchRegion && matchSearch;
    });
  }, [branchesWithDistance, selectedRegionFilter, searchQuery]);

  // Nearest branch in current view
  const nearestBranch = useMemo(() => {
    return branchesWithDistance[0];
  }, [branchesWithDistance]);

  // List of previously bought items
  const previouslyBoughtProducts = useMemo(() => {
    return products.filter((p) => PREVIOUSLY_BOUGHT_META[p.id]);
  }, [products]);

  const copyInviteLink = () => {
    navigator.clipboard?.writeText('https://tmpnponline.co.zw/join/moyo-family-group');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddSingleProduct = (productId: string) => {
    if (!onAddToCart) return;
    const prod = products.find((p) => p.id === productId);
    const meta = PREVIOUSLY_BOUGHT_META[productId];
    const memberId = selectedRecipientMap[productId] || meta?.defaultRecipientId || members[0]?.id || 'mem-2';
    const recipient = members.find((m) => m.id === memberId) || members[0];

    onAddToCart(productId, memberId, `Reordered from My Items`);
    setToastMsg(`Added ${prod?.name || 'Item'} for ${recipient?.name || 'Family Member'} to Family Cart! 🛒`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleBuyAgainOrder = (order: PreviousOrder) => {
    if (!onAddToCart) return;
    order.items.forEach((item) => {
      const recipientId = item.recipientMemberId || members[0]?.id || 'mem-2';
      for (let i = 0; i < item.quantity; i++) {
        onAddToCart(item.productId, recipientId, `Reordered from Order #${order.orderId}`);
      }
    });

    setToastMsg(`Re-added all ${order.items.length} items from Order #${order.orderId} to Family Cart! 🛒`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6 relative">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-stone-700 hover:text-[#002D62] bg-white hover:bg-stone-50 border border-stone-200/80 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 cursor-pointer shadow-2xs w-fit"
          title="Back to Store Catalog"
        >
          <ArrowLeft className="w-4 h-4 text-[#002D62]" />
          <span>Back to Store Catalog</span>
        </button>
      )}

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 z-50 bg-[#002D62] text-[#FFB81C] px-4 py-3 rounded-2xl shadow-2xl border border-[#004A99]/40 flex items-center gap-3 animate-fade-in max-w-sm text-xs font-bold">
          <ShoppingBag className="w-4 h-4 text-[#D0021B] flex-shrink-0 animate-bounce" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner - Exclusive Pick n Pay Branding */}
      <div className="bg-gradient-to-r from-[#941135] via-[#C51D4A] to-[#002D62] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-[#a8143d] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#FFB81C] text-[#002D62] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Exclusively Pick n Pay
            </span>
            <span className="text-pink-100 text-xs font-semibold">
              TM Pick n Pay Cross-Border Hub
            </span>
          </div>
          <h2 className="text-2xl font-black text-white font-sans">
            Pick n Pay Branches in Your Vicinity
          </h2>
          <p className="text-xs text-pink-100/90 mt-0.5 max-w-xl">
            Locate authorized TM Pick n Pay supermarkets and fulfillment hubs nearest to you based on real-time location proximity, check store facilities, set your primary branch, and reorder staples.
          </p>
        </div>

        {/* Tab Toggle (Nearby Branches, My Items, Family Group) */}
        <div className="flex bg-[#680b22] p-1.5 rounded-xl border border-white/20 text-xs font-bold gap-1 flex-wrap sm:flex-nowrap w-full md:w-auto justify-stretch sm:justify-start">
          <button
            type="button"
            onClick={() => setActiveTab('depots')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer ${
              activeTab === 'depots'
                ? 'bg-white text-[#941135] shadow-xs font-extrabold'
                : 'text-stone-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-[#FFB81C]" />
            <span>Nearby Branches ({PICK_N_PAY_BRANCHES.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('myitems')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer ${
              activeTab === 'myitems'
                ? 'bg-[#FFB81C] text-[#002D62] shadow-xs font-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#FFB81C]" />
            <span>My Items ({previouslyBoughtProducts.length})</span>
            <span className="bg-[#941135] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
              Reorder
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('family')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer ${
              activeTab === 'family'
                ? 'bg-white text-[#002D62] shadow-xs font-extrabold'
                : 'text-stone-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#FFB81C]" />
            <span>Family Group ({members.length})</span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: PICK N PAY BRANCHES BASED ON PROXIMITY --- */}
      {activeTab === 'depots' && (
        <div className="space-y-4">
          {/* Proximity Controller Bar */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-[#C51D4A]/10 text-[#C51D4A] rounded-lg">
                    <Navigation className="w-4 h-4 text-[#C51D4A]" />
                  </span>
                  <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    Location Proximity & Distance Calculation
                  </h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    GPS Active 📍
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Current Reference: <strong className="text-stone-800">{locationName}</strong> ({userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)})
                </p>
              </div>

              {/* Action Buttons for Location */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={isDetectingLocation}
                  className="bg-[#002D62] hover:bg-[#001D42] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Detect GPS location using browser coordinates"
                >
                  <LocateFixed className={`w-3.5 h-3.5 text-[#FFB81C] ${isDetectingLocation ? 'animate-spin' : ''}`} />
                  <span>{isDetectingLocation ? 'Detecting...' : 'Detect My Location'}</span>
                </button>

                {/* Quick Presets Dropdown */}
                <div className="relative">
                  <select
                    value={locationName}
                    onChange={(e) => {
                      const found = LOCATION_PRESETS.find((p) => p.label === e.target.value);
                      if (found) handleSelectPreset(found);
                    }}
                    aria-label="Select reference vicinity location"
                    className="bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 text-xs font-bold rounded-xl px-2.5 py-1.5 cursor-pointer focus:outline-none"
                  >
                    <option value="" disabled>Change Vicinity Area...</option>
                    {LOCATION_PRESETS.map((p) => (
                      <option key={p.label} value={p.label}>
                        📍 {p.label} ({p.description})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Location Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-stone-100">
              <span className="text-[11px] font-bold text-stone-400 whitespace-nowrap mr-1">
                Popular Cities:
              </span>
              {LOCATION_PRESETS.map((preset) => {
                const isCurrent = locationName === preset.label;
                return (
                  <button
                    key={preset.label}
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[#C51D4A] text-white shadow-2xs font-extrabold'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Region Tabs & Live Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter by Region */}
            <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold gap-1 overflow-x-auto scrollbar-none">
              {['ALL', 'Harare', 'Bulawayo', 'Midlands', 'Manicaland', 'South Africa'].map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => setSelectedRegionFilter(region)}
                  className={`px-3 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    selectedRegionFilter === region
                      ? 'bg-[#002D62] text-white shadow-xs font-extrabold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {region === 'ALL' ? 'All Branches' : region}
                </button>
              ))}
            </div>

            {/* Branch Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Pick n Pay branch, suburb, or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#C51D4A]"
              />
            </div>
          </div>

          {/* Nearby Branches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBranches.map((branch, index) => {
              const isNearest = index === 0 && selectedRegionFilter === 'ALL' && searchQuery === '';
              const isPreferred = preferredBranchId === branch.id;

              return (
                <div
                  key={branch.id}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3.5 relative ${
                    isPreferred 
                      ? 'border-[#FFB81C] ring-2 ring-[#FFB81C]/40 bg-amber-50/10'
                      : isNearest
                      ? 'border-emerald-300 ring-1 ring-emerald-200'
                      : 'border-stone-200'
                  }`}
                >
                  {/* Top Row: Brand, Image, Name & Distance Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <img
                          src={branch.image}
                          alt={branch.name}
                          className="w-14 h-14 rounded-xl object-cover border border-stone-200 flex-shrink-0 shadow-2xs"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-black text-stone-900 text-sm sm:text-base leading-snug">
                              {branch.name}
                            </h4>
                            {branch.isHyper && (
                              <span className="bg-[#941135] text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                                Hyper
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 text-xs text-stone-500 font-medium mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-[#C51D4A] flex-shrink-0" />
                            <span className="truncate">{branch.address}</span>
                          </div>

                          <div className="text-[11px] text-stone-400 font-semibold mt-0.5">
                            <span>Region: {branch.region} • {branch.suburb}</span>
                          </div>
                        </div>
                      </div>

                      {/* Proximity Distance Badge */}
                      <div className="text-right flex flex-col items-end flex-shrink-0">
                        <span className={`text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs whitespace-nowrap ${
                          isNearest
                            ? 'bg-emerald-600 text-white animate-pulse'
                            : 'bg-stone-100 text-[#002D62] border border-stone-200'
                        }`}>
                          <Navigation className="w-3 h-3 text-[#FFB81C]" />
                          <span>{branch.distanceKm} km</span>
                        </span>

                        <span className="text-[10px] text-stone-500 font-bold mt-1">
                          {branch.deliveryTimeEst}
                        </span>
                      </div>
                    </div>

                    {/* Preferred Branch or Nearest Branch Banner */}
                    <div className="flex items-center gap-2 pt-2 flex-wrap">
                      {isPreferred && (
                        <span className="bg-[#FFB81C] text-[#002D62] text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current text-[#002D62]" />
                          <span>My Preferred Primary Branch</span>
                        </span>
                      )}

                      {isNearest && !isPreferred && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Closest Pick n Pay in Your Vicinity</span>
                        </span>
                      )}
                    </div>

                    {/* Operational Details Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2.5">
                      <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-stone-150">
                        <span className="text-[10px] text-stone-400 block font-semibold">
                          Trading Hours
                        </span>
                        <span className="font-bold text-stone-800 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-[#FFB81C]" />
                          {branch.hours}
                        </span>
                      </div>

                      <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-stone-150">
                        <span className="text-[10px] text-stone-400 block font-semibold">
                          Fulfillment Speed
                        </span>
                        <span className="font-bold text-[#002D62] mt-0.5 block truncate">
                          {branch.expressDelivery}
                        </span>
                      </div>
                    </div>

                    {/* In-Store Services Chips */}
                    <div className="pt-2.5">
                      <span className="text-[10px] font-bold text-stone-400 block mb-1">
                        In-Store Services & Amenities:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {branch.services.map((service, sIdx) => (
                          <span
                            key={sIdx}
                            className="bg-stone-100 text-stone-700 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-stone-200"
                          >
                            ✓ {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSetPreferredBranch(branch)}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                          isPreferred
                            ? 'bg-[#FFB81C]/20 text-[#002D62] border border-[#FFB81C]'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                        }`}
                        title="Set this store as your default branch"
                      >
                        <Star className={`w-3.5 h-3.5 ${isPreferred ? 'fill-current text-[#FFB81C]' : 'text-stone-400'}`} />
                        <span>{isPreferred ? 'Primary Store' : 'Set as Primary'}</span>
                      </button>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${branch.lat},${branch.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[#002D62] hover:underline flex items-center gap-1 px-1 py-1"
                        title="Open in Google Maps"
                      >
                        <Car className="w-3.5 h-3.5 text-[#002D62]" />
                        <span className="hidden sm:inline">Directions</span>
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${branch.phone}`}
                        className="bg-stone-100 hover:bg-stone-200 text-stone-800 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title={`Call branch at ${branch.phone}`}
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-stone-600" />
                        <span className="hidden xs:inline">Call</span>
                      </a>

                      {onSelectStoreFilter && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectStoreFilter('TM_PNP');
                            setToastMsg(`Shopping from ${branch.name}`);
                          }}
                          className="bg-[#C51D4A] hover:bg-[#a8143d] text-white px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 cursor-pointer shadow-xs flex items-center gap-1"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-[#FFB81C]" />
                          <span>Shop Branch</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredBranches.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-6 space-y-2">
              <Store className="w-10 h-10 text-stone-300 mx-auto" />
              <h4 className="font-extrabold text-stone-800 text-sm">No Pick n Pay branches found</h4>
              <p className="text-xs text-stone-500">
                Try searching for another suburb or select "All Branches".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRegionFilter('ALL');
                }}
                className="bg-[#002D62] text-white text-xs font-bold px-3 py-1.5 rounded-xl mt-2 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: MY ITEMS (PREVIOUSLY BOUGHT & ORDERS REORDER HUB) --- */}
      {activeTab === 'myitems' && (
        <div className="space-y-5">
          {/* Top Sub-Header Section */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl border border-amber-200">
                <History className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-stone-900 text-base sm:text-lg flex items-center gap-2">
                  <span>My Previously Bought Items & Orders</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    Auto-Add & Reorder 🛍️
                  </span>
                </h3>
                <p className="text-xs text-stone-500">
                  Easily re-add staple items previously ordered from Pick n Pay by you or your Moyo family group
                </p>
              </div>
            </div>

            {/* Sub-Section Switcher */}
            <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setMyItemsSection('frequent')}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 flex-1 cursor-pointer ${
                  myItemsSection === 'frequent'
                    ? 'bg-[#002D62] text-white shadow-xs font-extrabold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-pink-400" />
                <span>Bought Previously ({previouslyBoughtProducts.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMyItemsSection('orders')}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 flex-1 cursor-pointer ${
                  myItemsSection === 'orders'
                    ? 'bg-[#002D62] text-white shadow-xs font-extrabold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Order History ({PREVIOUS_ORDERS.length})</span>
              </button>
            </div>
          </div>

          {/* Search Bar for Previously Bought Items */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search previously ordered staple items (e.g., Tastic, White Star, Mazoe, Oil)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#C51D4A]"
            />
          </div>

          {/* --- SUB-SECTION 1: FREQUENTLY BOUGHT INDIVIDUAL PRODUCTS --- */}
          {myItemsSection === 'frequent' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-500 font-semibold px-1">
                <span>Showing {previouslyBoughtProducts.length} Reorder Staples</span>
                <span className="text-amber-800 font-bold">Assign recipient per item before adding</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {previouslyBoughtProducts.map((product) => {
                  const meta = PREVIOUSLY_BOUGHT_META[product.id];
                  const currentRecipientId = selectedRecipientMap[product.id] || meta?.defaultRecipientId || members[0]?.id || 'mem-2';

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-stone-200/90 p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-3 group hover:border-amber-300"
                    >
                      <div className="space-y-2.5">
                        {/* Top Metadata Row */}
                        <div className="flex items-center justify-between text-[10px] text-stone-500 font-semibold border-b border-stone-100 pb-2">
                          <span className="bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                            Bought {meta?.timesBought || 1}x by {meta?.boughtBy || 'Group'}
                          </span>
                          <span className="text-stone-400 font-medium">
                            Last: {meta?.lastOrdered || 'Recently'}
                          </span>
                        </div>

                        {/* Product Info Row */}
                        <div className="flex items-start gap-3">
                          <img
                            src={getProductImagePath(product.image)}
                            alt={product.name}
                            onError={(e) => handleProductImageError(e, product.name, product.category)}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            className="w-16 h-16 rounded-xl object-contain bg-stone-50 border border-stone-200 p-1 flex-shrink-0 group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-stone-400">
                              <span>{product.brand}</span>
                              <span>•</span>
                              <span className="text-[#C51D4A]">{product.category}</span>
                            </div>

                            <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm line-clamp-2 leading-snug">
                              {product.name}
                            </h4>

                            {product.nativeName && (
                              <span className="text-[10px] text-amber-800 font-bold italic block mt-0.5">
                                "{product.nativeName}"
                              </span>
                            )}

                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-stone-900 font-black text-sm">
                                {formatPrice(product.priceUSD, currency)}
                              </span>
                              <span className="text-[10px] text-stone-400 font-semibold">
                                ({product.unit})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Recipient Selection Dropdown */}
                        <div className="bg-stone-50 p-2 rounded-xl border border-stone-200 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-stone-500">
                            <span>Assign Recipient:</span>
                            <span className="text-[#002D62]">Select Member</span>
                          </div>
                          <select
                            value={currentRecipientId}
                            onChange={(e) =>
                              setSelectedRecipientMap((prev) => ({
                                ...prev,
                                [product.id]: e.target.value,
                              }))
                            }
                            aria-label={`Assign recipient for ${product.name}`}
                            className="w-full bg-white text-stone-900 font-bold text-xs py-1 px-2 rounded-lg border border-stone-300 focus:outline-none cursor-pointer"
                          >
                            {members.map((m) => (
                              <option key={m.id} value={m.id}>
                                For: {m.name} ({m.location.split(',')[0]})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        type="button"
                        onClick={() => handleAddSingleProduct(product.id)}
                        className="w-full bg-[#002D62] hover:bg-[#001D42] text-white font-extrabold text-xs py-2 px-3 rounded-xl transition-all active:scale-98 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-[#FFB81C]" />
                        <span>Add to Family Cart</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- SUB-SECTION 2: PREVIOUS ORDERS & BUY AGAIN REORDER --- */}
          {myItemsSection === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-[#C51D4A]" />
                  <span>Past Pick n Pay Family Group Orders</span>
                </h4>
                <span className="text-xs text-stone-500 font-medium">
                  Click "Buy Again" to auto-add all items in an order
                </span>
              </div>

              <div className="space-y-3.5">
                {PREVIOUS_ORDERS.map((order) => {
                  const isExpanded = expandedOrderId === order.orderId;

                  return (
                    <div
                      key={order.orderId}
                      className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden hover:border-stone-300 transition-all"
                    >
                      {/* Order Header Row */}
                      <div className="p-4 bg-stone-50/80 border-b border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-stone-900 text-sm sm:text-base font-mono">
                              Order #{order.orderId}
                            </span>
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {order.status}
                            </span>
                            <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                              {order.deliveryMode}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-stone-500 font-medium flex-wrap">
                            <span>📅 {order.date}</span>
                            <span>•</span>
                            <span>🏬 {order.storeName}</span>
                            <span>•</span>
                            <span className="text-stone-700 font-bold">📍 {order.destination}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-right">
                            <span className="text-[10px] text-stone-400 block font-bold uppercase">Total Price</span>
                            <span className="font-black text-stone-900 text-base">
                              {formatPrice(order.totalUSD, currency)}
                            </span>
                          </div>

                          {/* Primary Buy Again Button */}
                          <button
                            type="button"
                            onClick={() => handleBuyAgainOrder(order)}
                            className="bg-[#C51D4A] hover:bg-[#a8143d] text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
                            title="Auto-add all items from this order to Family Cart"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-white" />
                            <span>Buy Again 🛒</span>
                          </button>
                        </div>
                      </div>

                      {/* Order Items Breakdown */}
                      <div className="p-4 space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-bold text-stone-500 border-b border-stone-100 pb-2">
                          <span>Items in this Order ({order.items.length}):</span>
                          <button
                            type="button"
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.orderId)}
                            className="text-[#002D62] hover:underline text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Collapse' : 'Expand Details'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <div className={`space-y-2 ${isExpanded ? 'block' : 'line-clamp-2'}`}>
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="bg-[#002D62] text-white text-[10px] font-black px-2 py-0.5 rounded-md flex-shrink-0">
                                  {item.quantity}x
                                </span>
                                <div className="min-w-0">
                                  <span className="font-bold text-stone-900 truncate block">
                                    {item.productName}
                                  </span>
                                  <span className="text-[10px] text-stone-500 block">
                                    Recipient: <strong className="text-stone-700">{item.recipientName}</strong>
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="font-extrabold text-stone-900">
                                  {formatPrice(item.priceUSD * item.quantity, currency)}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleAddSingleProduct(item.productId)}
                                  className="bg-white hover:bg-stone-100 text-[#002D62] border border-stone-300 text-[10px] font-bold px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                  title="Add just this item to cart"
                                >
                                  <Plus className="w-3 h-3 text-[#002D62]" />
                                  <span>Add</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: FAMILY GROUP MEMBERS --- */}
      {activeTab === 'family' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C51D4A]" />
                <span>Moyo Family Group Members</span>
              </h3>
              <p className="text-xs text-stone-500">
                Shared cart participants connected to TM Pick n Pay branches in Johannesburg SA and Zimbabwe
              </p>
            </div>

            <button
              onClick={copyInviteLink}
              className="bg-[#002D62] hover:bg-[#001D42] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Invite Member'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="bg-[#f8fafc] p-3.5 rounded-2xl border border-stone-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        member.isOnline ? 'bg-emerald-500' : 'bg-stone-300'
                      }`}
                    />
                  </div>

                  <div>
                    <h4 className="font-extrabold text-stone-900 text-sm">
                      {member.name}
                    </h4>
                    <span className="text-xs text-stone-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#C51D4A]" />
                      {member.location}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="bg-[#002D62] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full block mb-1">
                    {member.role}
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    {member.channel === 'whatsapp' ? '📱 WhatsApp' : '🌐 Web Live'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 text-xs text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <span>Low data family members can order directly through Pick n Pay via WhatsApp Voice Notes in Shona or Ndebele!</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
              <button
                onClick={onOpenWhatsAppSim}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] whitespace-nowrap cursor-pointer"
                title="Open Demo WhatsApp Simulator"
              >
                Test WhatsApp (Demo)
              </button>
              <a
                href="https://wa.me/27630718449"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 py-1.5 rounded-lg font-extrabold text-[11px] whitespace-nowrap cursor-pointer flex items-center gap-1 shadow-sm border border-emerald-200"
                title="Chat on Real Live WhatsApp (+27 63 071 8449)"
              >
                <svg className="w-3.5 h-3.5 fill-current text-white flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-0.999 3.648 3.742-0.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.375-.883-.71-1.48-1.588-1.653-1.886-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.422s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <span>Live WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
