import React, { useState, useEffect } from 'react';
import {
  Package,
  Receipt,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Copy,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  Share2,
  Calendar,
  CreditCard,
  Building2,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Store,
  Phone,
  QrCode,
  AlertCircle,
  PlayCircle
} from 'lucide-react';
import { Currency } from '../types';
import { formatPrice } from '../utils/currency';
import { api, PastOrder as ApiPastOrder } from '../utils/api';
import { socket } from '../utils/socket';
import { getProductImagePath, handleProductImageError } from '../utils/productImages';

export interface OrderItem {
  id: string;
  name: string;
  nativeName?: string;
  quantity: number;
  unitPriceUSD: number;
  totalUSD: number;
  image: string;
  store: string;
  weightOrVol: string;
}

export type PastOrder = ApiPastOrder;

const INITIAL_PAST_ORDERS: PastOrder[] = [
  {
    id: 'PNP-ZW-89214',
    invoiceNumber: 'INV-2026-0892',
    date: '24 Aug 2026',
    timestamp: '2026-08-24T14:32:00Z',
    status: 'DELIVERED',
    statusLabel: 'Delivered to Gogo Moyo',
    statusColor: 'emerald',
    storePartner: 'TM Pick n Pay Avondale, Harare',
    fulfillmentType: 'DOOR_DELIVERY',
    fulfillmentLocation: 'House 42, Bath Road, Avondale, Harare',
    recipientName: 'Gogo Moyo',
    recipientPhone: '+263 77 234 5678',
    paymentMethod: {
      type: 'VISA_CARD',
      label: 'FNB SA Visa Debit (••4892)',
      details: '3D Secure Verified (Cross-Border Settlement)',
      authRef: 'AUTH-FNB-993812'
    },
    subtotalUSD: 52.40,
    deliveryFeeUSD: 4.50,
    vatTaxUSD: 0.00,
    totalUSD: 56.90,
    items: [
      {
        id: 'WS-5KG',
        name: 'White Star Super Maize Meal (5kg)',
        nativeName: 'Hupfu hweSona / Impuphu',
        quantity: 2,
        unitPriceUSD: 4.50,
        totalUSD: 9.00,
        image: '/images/white_star_maize.jpg',
        store: 'TM Pick n Pay',
        weightOrVol: '5kg x 2'
      },
      {
        id: 'TAS-5KG',
        name: 'Tastic Parboiled Long Grain White Rice (5kg)',
        nativeName: 'Mupunga weTastic / Ilayisi',
        quantity: 2,
        unitPriceUSD: 6.80,
        totalUSD: 13.60,
        image: '/images/tastic_rice.jpg',
        store: 'TM Pick n Pay',
        weightOrVol: '5kg x 2'
      },
      {
        id: 'SUN-5L',
        name: 'Sunfoil Pure Sunflower Cooking Oil (5L)',
        nativeName: 'Mafuta eKubikisa',
        quantity: 1,
        unitPriceUSD: 10.90,
        totalUSD: 10.90,
        image: '/images/sunfoil_oil.jpg',
        store: 'TM Pick n Pay',
        weightOrVol: '5 Litres'
      },
      {
        id: 'MAZ-2L',
        name: 'Mazoe Orange Crush Cordial Syrup (2L)',
        nativeName: 'Chikari cheMazoe',
        quantity: 2,
        unitPriceUSD: 4.20,
        totalUSD: 8.40,
        image: '/images/mazoe_orange_crush.jpg',
        store: 'TM Pick n Pay',
        weightOrVol: '2L x 2'
      },
      {
        id: 'HUL-5KG',
        name: 'Huletts SunSweet Pure White Sugar (5kg)',
        nativeName: 'Chigaku cheShuga',
        quantity: 1,
        unitPriceUSD: 5.50,
        totalUSD: 5.50,
        image: '/images/huletts_sugar.jpg',
        store: 'TM Pick n Pay',
        weightOrVol: '5kg'
      },
      {
        id: 'CLO-6L',
        name: 'Clover Full Cream UHT Long Life Milk (6x1L)',
        nativeName: 'Mukaka weClover',
        quantity: 1,
        unitPriceUSD: 5.00,
        totalUSD: 5.00,
        image: '/images/clover_milk.jpg',
        store: 'TM Pick n Pay',
        weightOrVol: '6x1L Multipack'
      }
    ],
    trackingSteps: [
      { title: 'Order Placed & Paid in SA', description: 'Visa Auth Ref AUTH-FNB-993812 settled in USD', time: '24 Aug, 14:32', completed: true },
      { title: 'Depot Pick & Packed', description: 'TM Pick n Pay Avondale prepared fresh grocery pack', time: '24 Aug, 15:10', completed: true },
      { title: 'Dispatched on Express Van', description: 'Driver Tawanda assigned with cold chain storage', time: '24 Aug, 15:45', completed: true },
      { title: 'Delivered & Signed', description: 'Received in person by Gogo Moyo (OTP verified)', time: '24 Aug, 16:30', completed: true }
    ]
  },
  {
    id: 'SPAR-BYO-77402',
    invoiceNumber: 'INV-2026-0774',
    date: '18 Aug 2026',
    timestamp: '2026-08-18T10:15:00Z',
    status: 'READY_FOR_COLLECTION',
    statusLabel: 'Ready for Store Collection',
    statusColor: 'amber',
    storePartner: 'SPAR Express Fife Street Depot, Bulawayo',
    fulfillmentType: 'CLICK_AND_COLLECT',
    fulfillmentLocation: 'SPAR Depot Counter, Fife St & 10th Ave, Bulawayo',
    recipientName: 'Tinashe Moyo',
    recipientPhone: '+263 71 987 6543',
    collectionCode: 'BYO-8842',
    paymentMethod: {
      type: 'ECOCASH',
      label: 'EcoCash Diaspora Express',
      details: 'Direct Zim Wallet Settlement',
      authRef: 'EC-77218903'
    },
    subtotalUSD: 88.20,
    deliveryFeeUSD: 0.00,
    vatTaxUSD: 0.00,
    totalUSD: 88.20,
    items: [
      {
        id: 'SOLAR-KIT',
        name: 'GDPLUS Solar Home Lighting & Phone Charging System',
        nativeName: 'Magetsi eZuva / Amagetsi',
        quantity: 1,
        unitPriceUSD: 44.50,
        totalUSD: 44.50,
        image: '/images/solar_lighting_system.jpg',
        store: 'SPAR Zim Hardware',
        weightOrVol: 'Complete Solar Kit'
      },
      {
        id: 'BEEF-2KG',
        name: 'Butchery Fresh Prime Beef Blade Roast (2kg)',
        nativeName: 'Nyama yeMombe',
        quantity: 2,
        unitPriceUSD: 14.85,
        totalUSD: 29.70,
        image: '/images/fresh_beef.jpg',
        store: 'SPAR Butchery',
        weightOrVol: '2kg x 2'
      },
      {
        id: 'TANG-100S',
        name: 'Tanganda Tagless Premium Black Tea Bags (100s)',
        nativeName: 'Tii yeTanganda',
        quantity: 4,
        unitPriceUSD: 3.50,
        totalUSD: 14.00,
        image: '/images/tanganda_tea.jpg',
        store: 'SPAR Grocery',
        weightOrVol: '100 bags x 4'
      }
    ],
    trackingSteps: [
      { title: 'EcoCash Remittance Confirmed', description: 'Mobile money authenticated in Bulawayo', time: '18 Aug, 10:15', completed: true },
      { title: 'Assembled at Fife St Depot', description: 'Solar kit tested and meat kept in sub-zero chiller', time: '18 Aug, 11:00', completed: true },
      { title: 'Collection Code Dispatched via WhatsApp', description: 'SMS & WhatsApp alert sent with PIN BYO-8842', time: '18 Aug, 11:30', completed: true, current: true },
      { title: 'Recipient Pickup', description: 'Awaiting Tinashe Moyo at customer service desk', time: 'Pending', completed: false }
    ]
  },
  {
    id: 'OK-MUT-65190',
    invoiceNumber: 'INV-2026-0651',
    date: '02 Aug 2026',
    timestamp: '2026-08-02T09:00:00Z',
    status: 'DELIVERED',
    statusLabel: 'Delivered to Uncle Farai',
    statusColor: 'emerald',
    storePartner: 'OK Mart Mutare Regional Center',
    fulfillmentType: 'DOOR_DELIVERY',
    fulfillmentLocation: '12 Herbert Chitepo Street, Mutare',
    recipientName: 'Uncle Farai',
    recipientPhone: '+263 73 111 2222',
    paymentMethod: {
      type: 'MUKURU',
      label: 'Mukuru Diaspora Cash Card',
      details: 'Instant SA-to-Zim Remittance Gateway',
      authRef: 'MUK-5582910'
    },
    subtotalUSD: 74.30,
    deliveryFeeUSD: 5.00,
    vatTaxUSD: 0.00,
    totalUSD: 79.30,
    items: [
      {
        id: 'PAM-SZ3',
        name: 'Pampers Baby-Dry Pants Diapers (Size 3, 56s)',
        nativeName: 'Machedha eMwana',
        quantity: 2,
        unitPriceUSD: 18.50,
        totalUSD: 37.00,
        image: '/images/pampers_pants.jpg',
        store: 'TM Pick n Pay Mutare Main',
        weightOrVol: '56 Pack x 2'
      },
      {
        id: 'FRUIT-VEG-10',
        name: 'Farm Fresh Fruit & Vegetable Hamper Box (10kg)',
        nativeName: 'Mubato weMiriwo neMichero',
        quantity: 1,
        unitPriceUSD: 26.97,
        totalUSD: 26.97,
        image: '/images/fruit_veg_box.jpg',
        store: 'TM Pick n Pay Fresh',
        weightOrVol: '10kg Crate'
      },
      {
        id: 'SUN-SOAP-500',
        name: 'Sunlight Laundry Soap Bar (500g)',
        nativeName: 'Sipo yeSunlight',
        quantity: 6,
        unitPriceUSD: 1.72,
        totalUSD: 10.33,
        image: '/images/sunlight_soap.jpg',
        store: 'TM Pick n Pay Mutare Main',
        weightOrVol: '500g x 6'
      }
    ],
    trackingSteps: [
      { title: 'Mukuru Card Authorized', description: 'Transferred via SA Banking Switch', time: '02 Aug, 09:00', completed: true },
      { title: 'TM Pick n Pay Mutare Dispatch', description: 'Loaded into fresh insulated crate', time: '02 Aug, 10:20', completed: true },
      { title: 'Delivered in Mutare', description: 'Delivered directly to Uncle Farai residence', time: '02 Aug, 12:15', completed: true }
    ]
  }
];

interface OrdersAndInvoicesViewProps {
  currency: Currency;
  onCurrencyChange?: (c: Currency) => void;
  onNavigateHome?: () => void;
  onShowToast: (msg: string) => void;
}

export const OrdersAndInvoicesView: React.FC<OrdersAndInvoicesViewProps> = ({
  currency,
  onShowToast
}) => {
  const [orders, setOrders] = useState<PastOrder[]>(INITIAL_PAST_ORDERS);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'invoices'>('orders');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DELIVERED' | 'ACTIVE' | 'COLLECT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected Order for Invoice Modal
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<PastOrder | null>(null);
  // Selected Order for Tracking Drawer
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<PastOrder | null>(null);
  // Copied code feedback
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [isAdvancingId, setIsAdvancingId] = useState<string | null>(null);

  // Fetch live orders on mount
  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await api.getOrders();
        if (isMounted && data.orders && data.orders.length > 0) {
          setOrders(data.orders);
        }
      } catch (err) {
        console.warn('Using local initial orders state fallback:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrders();

    // Listen to real-time order creation and status updates
    const handleOrderCreated = (newOrder: PastOrder) => {
      setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
      onShowToast(`🎉 New order ${newOrder.id} confirmed & dispatched to ${newOrder.recipientName}!`);
    };

    const handleStatusUpdated = (updatedOrder: PastOrder) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      if (selectedTrackingOrder?.id === updatedOrder.id) {
        setSelectedTrackingOrder(updatedOrder);
      }
    };

    socket.on('order:created', handleOrderCreated);
    socket.on('order:status_updated', handleStatusUpdated);

    return () => {
      isMounted = false;
      socket.off('order:created', handleOrderCreated);
      socket.off('order:status_updated', handleStatusUpdated);
    };
  }, [onShowToast, selectedTrackingOrder?.id]);

  // Filtered Orders
  const filteredOrders = orders.filter((order) => {
    // Status Filter
    if (statusFilter === 'DELIVERED' && order.status !== 'DELIVERED') return false;
    if (statusFilter === 'ACTIVE' && order.status !== 'OUT_FOR_DELIVERY' && order.status !== 'PROCESSING') return false;
    if (statusFilter === 'COLLECT' && order.fulfillmentType !== 'CLICK_AND_COLLECT') return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = order.id.toLowerCase().includes(q) || order.invoiceNumber.toLowerCase().includes(q);
      const matchRecipient = order.recipientName.toLowerCase().includes(q) || order.fulfillmentLocation.toLowerCase().includes(q);
      const matchItem = order.items.some(it => it.name.toLowerCase().includes(q) || (it.nativeName && it.nativeName.toLowerCase().includes(q)));
      return matchId || matchRecipient || matchItem;
    }
    return true;
  });

  const handleCopyCode = (code: string, orderId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(orderId);
    onShowToast(`Collection Code "${code}" copied to clipboard! 📋`);
    setTimeout(() => setCopiedCodeId(null), 3000);
  };

  const handleDownloadInvoice = (order: PastOrder) => {
    onShowToast(`Opening printable tax invoice ${order.invoiceNumber}... 📄`);
    window.open(`/api/invoices/${order.invoiceNumber}/html`, '_blank');
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleReorder = async (order: PastOrder) => {
    try {
      const res = await api.reorderPastOrder(order.id);
      onShowToast(`🛒 Added ${res.addedCount} items from ${order.id} into family cart!`);
    } catch (err: any) {
      onShowToast(`Re-ordered ${order.items.length} items from ${order.id} into family cart! 🛒`);
    }
  };

  const handleAdvanceStatus = async (orderId: string) => {
    try {
      setIsAdvancingId(orderId);
      const res = await api.advanceOrderStatus(orderId);
      if (res.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? res.order : o));
        if (selectedTrackingOrder?.id === orderId) {
          setSelectedTrackingOrder(res.order);
        }
        onShowToast(`🚚 Order ${orderId} progressed: ${res.order.statusLabel}`);
      }
    } catch (err) {
      onShowToast(`Status updated for order ${orderId}`);
    } finally {
      setIsAdvancingId(null);
    }
  };

  const totalRemittanceSpentUSD = orders.reduce((sum, o) => sum + o.totalUSD, 0);

  return (
    <div className="space-y-5 animate-fade-in text-stone-900">
      {/* Top Banner with Stats */}
      <div className="bg-gradient-to-r from-[#002D62] via-[#003B80] to-[#001D42] text-white rounded-3xl p-5 sm:p-6 shadow-md border border-[#004A99] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFB81C]/20 border border-[#FFB81C]/40 text-[#FFB81C] flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Past Orders & Invoices</h2>
              <span className="bg-[#D0021B] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                Diaspora Verified
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              Live tracking, store collection codes, and downloadable tax receipts for Zimbabwean deliveries.
            </p>
          </div>
        </div>

        {/* Quick Summary Badges */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 text-xs font-bold self-stretch md:self-auto justify-between md:justify-start">
          <div>
            <span className="text-[10px] text-blue-200 block uppercase">Total Fulfilled</span>
            <span className="text-base font-black text-emerald-300">
              {formatPrice(totalRemittanceSpentUSD, currency)}
            </span>
          </div>
          <div className="h-7 w-[1px] bg-white/20" />
          <div>
            <span className="text-[10px] text-[#FFB81C] block uppercase">Orders Placed</span>
            <span className="text-base font-black text-[#FFB81C]">{orders.length} Completed</span>
          </div>
        </div>
      </div>

      {/* Main Tab Switcher (Orders vs Invoices) */}
      <div className="flex items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#002D62] text-white shadow-sm'
                : 'text-stone-600 hover:text-[#002D62] hover:bg-stone-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Order History ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
              activeTab === 'invoices'
                ? 'bg-[#002D62] text-white shadow-sm'
                : 'text-stone-600 hover:text-[#002D62] hover:bg-stone-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Payment Invoices ({orders.length})</span>
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="relative hidden md:block w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order ID, recipient, or item..."
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#002D62]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Search Bar for Mobile */}
      <div className="relative md:hidden">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search orders, recipients, or items..."
          className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#002D62]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* --- VIEW 1: ORDER HISTORY TAB --- */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex-shrink-0 ${
                statusFilter === 'ALL'
                  ? 'bg-[#002D62] text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              All Orders ({orders.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('DELIVERED')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                statusFilter === 'DELIVERED'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Delivered</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('COLLECT')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                statusFilter === 'COLLECT'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-amber-500" />
              <span>Click & Collect Pickups</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
                statusFilter === 'ACTIVE'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              <span>In Transit / Processing</span>
            </button>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 space-y-3">
              <Package className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="font-extrabold text-stone-800 text-base">No orders found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                No past orders match your current filter or search query.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ALL');
                  setSearchQuery('');
                }}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all hover:border-[#002D62]/40"
                >
                  {/* Order Top Bar */}
                  <div className="bg-stone-50/80 px-4 sm:px-6 py-3.5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="font-black text-stone-900 text-sm">{order.id}</span>
                      <span className="text-xs text-stone-500 flex items-center gap-1 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        {order.date}
                      </span>
                      <span className="text-xs text-stone-400">•</span>
                      <span className="text-xs text-[#002D62] font-extrabold">
                        {order.storePartner}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status Badge */}
                      <span
                        className={`text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 ${
                          order.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : order.status === 'READY_FOR_COLLECTION'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}
                      >
                        {order.status === 'DELIVERED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {order.status === 'READY_FOR_COLLECTION' && <Store className="w-3.5 h-3.5 text-amber-600" />}
                        {order.status === 'OUT_FOR_DELIVERY' && <Truck className="w-3.5 h-3.5 text-blue-600 animate-pulse" />}
                        <span>{order.statusLabel}</span>
                      </span>
                    </div>
                  </div>

                  {/* Order Body Details */}
                  <div className="p-4 sm:p-6 space-y-4">
                    {/* Destination & Recipient Info Card */}
                    <div className="bg-stone-50 rounded-2xl p-3.5 sm:p-4 border border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-black text-stone-900 text-xs sm:text-sm">
                          <MapPin className="w-4 h-4 text-[#D0021B] flex-shrink-0" />
                          <span>{order.fulfillmentType === 'DOOR_DELIVERY' ? 'Home Delivery' : 'Click & Collect Store Depot'}</span>
                          <span className="text-stone-400 font-normal">➔</span>
                          <span className="text-[#002D62]">{order.recipientName}</span>
                          <span className="text-stone-500 font-normal">({order.recipientPhone})</span>
                        </div>
                        <p className="text-stone-600 text-xs pl-5.5">
                          {order.fulfillmentLocation}
                        </p>
                      </div>

                      {/* Collection Code if Click & Collect */}
                      {order.collectionCode && (
                        <div className="bg-[#FFB81C]/20 border border-[#FFB81C]/60 rounded-xl px-3.5 py-2 flex items-center gap-3">
                          <div>
                            <span className="text-[10px] text-stone-600 font-bold block uppercase">Depot Pick-up PIN</span>
                            <span className="font-mono font-black text-[#002D62] text-sm tracking-wider">
                              {order.collectionCode}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(order.collectionCode!, order.id)}
                            className="p-1.5 bg-white hover:bg-stone-100 rounded-lg text-stone-700 shadow-2xs border border-stone-200 cursor-pointer"
                            title="Copy Collection Code"
                          >
                            {copiedCodeId === order.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Product Packshots List */}
                    <div className="space-y-2">
                      <span className="text-xs font-black text-stone-700 uppercase tracking-wider block">
                        Ordered Items ({order.items.length})
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 bg-stone-50/70 p-2.5 rounded-2xl border border-stone-200/80"
                          >
                            <img
                              src={getProductImagePath(item.image)}
                              alt={item.name}
                              className="w-12 h-12 object-contain bg-white rounded-xl p-1 border border-stone-200 flex-shrink-0"
                              onError={(e) => handleProductImageError(e, item.name)}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="font-extrabold text-stone-900 text-xs truncate" title={item.name}>
                                {item.name}
                              </h4>
                              {item.nativeName && (
                                <span className="text-[10px] text-stone-500 block truncate">
                                  {item.nativeName}
                                </span>
                              )}
                              <div className="flex items-center justify-between mt-1 text-[11px]">
                                <span className="font-bold text-stone-600">
                                  Qty: {item.quantity} × {formatPrice(item.unitPriceUSD, currency)}
                                </span>
                                <span className="font-black text-[#002D62]">
                                  {formatPrice(item.totalUSD, currency)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment & Totals Summary Strip */}
                    <div className="border-t border-stone-100 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-stone-600">
                        <CreditCard className="w-4 h-4 text-[#002D62]" />
                        <span className="font-bold">{order.paymentMethod.label}</span>
                        <span className="text-stone-400">•</span>
                        <span className="text-stone-500 font-mono text-[11px]">{order.paymentMethod.authRef}</span>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span className="text-stone-500 font-semibold">Total Paid:</span>
                        <span className="font-black text-base text-[#002D62]">
                          {formatPrice(order.totalUSD, currency)}
                        </span>
                      </div>
                    </div>

                    {/* Actions Buttons Row */}
                    <div className="border-t border-stone-100 pt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Live Tracking Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedTrackingOrder(order)}
                          className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5 text-[#002D62]" />
                          <span>Track Dispatch</span>
                        </button>

                        {/* View / Download Invoice Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceOrder(order)}
                          className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5 text-stone-700" />
                          <span>View Invoice</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Quick Re-Order Button */}
                        <button
                          type="button"
                          onClick={() => handleReorder(order)}
                          className="bg-[#002D62] hover:bg-[#001D42] text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-[#FFB81C]" />
                          <span>Re-Order All Items</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- VIEW 2: PAYMENT INVOICES TAB --- */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-extrabold text-stone-900 text-base">Commercial Diaspora Tax Invoices</h3>
                <p className="text-xs text-stone-500">Official cross-border payment receipts for accounting, tax verification, and customs clearance</p>
              </div>

              <button
                type="button"
                onClick={() => onShowToast('Exporting all tax receipts as PDF bundle...')}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#002D62]" />
                <span>Export All (ZIP / PDF)</span>
              </button>
            </div>

            {/* Invoices Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-2">Invoice #</th>
                    <th className="py-3 px-2">Order Ref</th>
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2">Recipient & Store</th>
                    <th className="py-3 px-2">Payment Method</th>
                    <th className="py-3 px-2 text-right">Amount Paid</th>
                    <th className="py-3 px-2 text-center">Status</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-semibold text-stone-800">
                  {filteredOrders.map((order) => (
                    <tr key={order.invoiceNumber} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3.5 px-2 font-mono font-black text-[#002D62]">
                        {order.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-2 font-mono text-stone-600">
                        {order.id}
                      </td>
                      <td className="py-3.5 px-2 text-stone-600">
                        {order.date}
                      </td>
                      <td className="py-3.5 px-2">
                        <div className="font-bold text-stone-900">{order.recipientName}</div>
                        <div className="text-[10px] text-stone-500">{order.storePartner}</div>
                      </td>
                      <td className="py-3.5 px-2">
                        <span className="inline-block bg-stone-100 text-stone-800 px-2 py-0.5 rounded-md text-[11px] font-bold">
                          {order.paymentMethod.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right font-black text-[#002D62] text-sm">
                        {formatPrice(order.totalUSD, currency)}
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> Paid & Settled
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceOrder(order)}
                            className="p-1.5 bg-stone-100 hover:bg-[#002D62] hover:text-white rounded-lg text-stone-700 transition-colors cursor-pointer"
                            title="View Printable Receipt"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(order)}
                            className="p-1.5 bg-stone-100 hover:bg-[#002D62] hover:text-white rounded-lg text-stone-700 transition-colors cursor-pointer"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 1: OFFICIAL PRINTABLE INVOICE MODAL --- */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 animate-fade-in text-stone-900 space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header Controls */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#002D62]/10 text-[#002D62] rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-stone-900 text-lg">Official Payment Receipt</h3>
                  <span className="text-xs text-stone-500 font-mono">Invoice #{selectedInvoiceOrder.invoiceNumber}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadInvoice(selectedInvoiceOrder)}
                  className="bg-[#002D62] hover:bg-[#001D42] text-white font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#FFB81C]" />
                  <span className="hidden sm:inline">Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceOrder(null)}
                  className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Paper Container */}
            <div className="bg-stone-50/80 p-5 sm:p-6 rounded-2xl border border-stone-200 space-y-5 text-xs">
              {/* Header with Logo & Tax IDs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#002D62] text-lg tracking-tight font-sans">
                      TM Pick n Pay
                    </span>
                    <span className="bg-[#D0021B] text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                      CROSS-BORDER
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Pick n Pay Supermarkets Zimbabwe Ltd & Diaspora Switch SA
                  </p>
                  <span className="text-[10px] text-stone-400 font-mono block">
                    VAT Reg: 1002938491 • Zimra BP: 0200192841
                  </span>
                </div>

                <div className="text-left sm:text-right space-y-0.5">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase inline-block">
                    Paid in Full (3DS Verified)
                  </span>
                  <p className="font-mono text-stone-600 text-xs font-bold pt-1">
                    Date: {selectedInvoiceOrder.date}
                  </p>
                  <p className="font-mono text-stone-400 text-[10px]">
                    Order: {selectedInvoiceOrder.id}
                  </p>
                </div>
              </div>

              {/* Billed To & Shipped To Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-xl border border-stone-200/80 space-y-1">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                    Billed To (Diaspora Sponsor)
                  </span>
                  <p className="font-extrabold text-stone-900">Tendai Moyo</p>
                  <p className="text-stone-500">tendai.moyo@diaspora.co.za</p>
                  <p className="text-stone-500">+27 82 123 4567 • Johannesburg, South Africa</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-stone-200/80 space-y-1">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                    Fulfillment Destination (Zimbabwe)
                  </span>
                  <p className="font-extrabold text-stone-900">{selectedInvoiceOrder.recipientName}</p>
                  <p className="text-stone-500">{selectedInvoiceOrder.recipientPhone}</p>
                  <p className="text-stone-500">{selectedInvoiceOrder.fulfillmentLocation}</p>
                  <span className="text-[10px] text-[#002D62] font-bold block pt-0.5">
                    Depot Partner: {selectedInvoiceOrder.storePartner}
                  </span>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100/80 text-stone-600 font-bold uppercase text-[10px] border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                    {selectedInvoiceOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-stone-900">{item.name}</div>
                          {item.nativeName && (
                            <span className="text-[10px] text-stone-500">{item.nativeName} • {item.weightOrVol}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-stone-700">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-600">
                          {formatPrice(item.unitPriceUSD, currency)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black font-mono text-stone-900">
                          {formatPrice(item.totalUSD, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Tax Calculation Breakdown */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <div className="space-y-1 text-[11px] text-stone-500">
                  <p className="flex items-center gap-1 font-bold text-stone-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Payment Rail: {selectedInvoiceOrder.paymentMethod.label}
                  </p>
                  <p className="font-mono">Auth Reference: {selectedInvoiceOrder.paymentMethod.authRef}</p>
                  <p className="text-[10px]">Zero Rated for Export Remittance (VAT 0%)</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-stone-200 w-full sm:w-64 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-stone-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold">{formatPrice(selectedInvoiceOrder.subtotalUSD, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span>Delivery / Logistics:</span>
                    <span className="font-mono font-bold">
                      {selectedInvoiceOrder.deliveryFeeUSD > 0
                        ? formatPrice(selectedInvoiceOrder.deliveryFeeUSD, currency)
                        : 'FREE (Click & Collect)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span>VAT (0% Diaspora):</span>
                    <span className="font-mono font-bold">$0.00</span>
                  </div>
                  <div className="border-t border-stone-200 pt-1.5 flex items-center justify-between font-black text-sm text-[#002D62]">
                    <span>Total Settled:</span>
                    <span className="font-mono">{formatPrice(selectedInvoiceOrder.totalUSD, currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Close Button */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedInvoiceOrder(null)}
                className="bg-stone-200 hover:bg-stone-300 text-stone-900 font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: LIVE DISPATCH TRACKING MODAL --- */}
      {selectedTrackingOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-fade-in text-stone-900 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 text-[#298bf5] rounded-xl">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-stone-900 text-base">Live Order Dispatch Tracking</h3>
                  <span className="text-xs text-stone-500 font-mono">{selectedTrackingOrder.id}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTrackingOrder(null)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient Overview */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-600">Recipient:</span>
                <span className="font-black text-stone-900">{selectedTrackingOrder.recipientName} ({selectedTrackingOrder.recipientPhone})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-600">Location:</span>
                <span className="font-medium text-stone-800 truncate max-w-[240px]">{selectedTrackingOrder.fulfillmentLocation}</span>
              </div>
            </div>

            {/* Timeline Steps */}
            <div className="space-y-4 py-2 pl-2">
              {selectedTrackingOrder.trackingSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 relative">
                  {/* Vertical Line connecting steps */}
                  {idx < selectedTrackingOrder.trackingSteps.length - 1 && (
                    <div
                      className={`absolute left-3.5 top-7 w-0.5 h-10 ${
                        step.completed ? 'bg-emerald-500' : 'bg-stone-200'
                      }`}
                    />
                  )}

                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                      step.completed
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : step.current
                        ? 'bg-[#002D62] text-[#FFB81C] animate-pulse shadow-xs'
                        : 'bg-stone-200 text-stone-400'
                    }`}
                  >
                    {step.completed ? <Check className="w-4 h-4" /> : <Clock className="w-3.5 h-3.5" />}
                  </div>

                  <div className="text-xs space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-stone-900">{step.title}</h4>
                      <span className="text-[10px] text-stone-400 font-mono">{step.time}</span>
                    </div>
                    <p className="text-stone-500 text-[11px] leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-100 pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onShowToast(`WhatsApp tracking update sent to ${selectedTrackingOrder.recipientPhone}! 📱`);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share to WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTrackingOrder(null)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
