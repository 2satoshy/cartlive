import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  UserPlus, 
  Maximize2, 
  Minimize2, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  CreditCard, 
  Calculator, 
  Users, 
  X, 
  Radio, 
  Camera, 
  Sparkles, 
  Smile, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare,
  LayoutGrid,
  Columns,
  Store,
  LogOut,
  Upload,
  FileText,
  Flame,
  Zap,
  Volume2,
  VolumeX,
  Eye,
  Play,
  Pause,
  Layers,
  MoveHorizontal,
  MoveVertical,
  Snowflake,
  Pin,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  FolderUp,
  Sliders,
  Wand2,
  UserCheck,
  BadgePercent,
  ShoppingCart,
  Tag,
  Copy,
  BarChart2
} from 'lucide-react';
import { CartItem, Member, Currency, SplitMethod, ExchangeRates, Product, ProductCategory, LiveMenuProduct, LiveMenuUpload } from '../types';
import { formatPrice } from '../utils/currency';
import { getProductImagePath, handleProductImageError } from '../utils/productImages';
import { SAMPLE_PRODUCTS } from '../data/products';
import { socket } from '../utils/socket';

export interface CallParticipant {
  id: string;
  name: string;
  avatar: string;
  location: string;
  mode: 'video' | 'audio-only';
  role?: string;
}

interface LiveCallShoppingViewProps {
  cart: CartItem[];
  personalCart?: CartItem[];
  members: Member[];
  currency: Currency;
  exchangeRates: ExchangeRates;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onClearCart: () => void;
  onAddToCart: (productId: string, memberId: string, note?: string) => void;
  onAddToPersonalCart?: (item: any, quantity?: number, note?: string) => void;
  onUpdatePersonalQuantity?: (itemId: string, quantity: number) => void;
  onClearPersonalCart?: () => void;
  onAddAllToPersonalCart?: (items: any[]) => void;
  onEndCall: () => void; // Ends call for all participants
  onStartLiveCall?: () => void; // Starts a live call
  isLiveCallOngoing?: boolean; // Whether live call is currently active
  onLeaveCall?: () => void; // User leaves call while others carry on
  onOpenWhatsAppSim?: () => void;
  onOpenCatalog?: () => void; // Open catalog to browse more products
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export const LiveCallShoppingView: React.FC<LiveCallShoppingViewProps> = ({
  cart,
  personalCart = [],
  members,
  currency,
  exchangeRates,
  onUpdateQuantity,
  onClearCart,
  onAddToCart,
  onAddToPersonalCart,
  onUpdatePersonalQuantity,
  onClearPersonalCart,
  onAddAllToPersonalCart,
  onEndCall,
  onStartLiveCall,
  isLiveCallOngoing = false,
  onLeaveCall,
  onOpenWhatsAppSim,
  onOpenCatalog,
  onFullscreenChange
}) => {
  // Suggestion index state for Live Shopping recommendations
  const [suggestionIndex, setSuggestionIndex] = useState<number>(0);

  const LIVE_SUGGESTIONS = [
    {
      id: 'sug-1',
      name: 'Eggbert Large Eggs 30-Pack',
      category: 'Meats & Proteins' as ProductCategory,
      priceUSD: 3.46,
      originalPriceUSD: 4.99,
      unit: '30-Pack Crate',
      image: '/images/fresh_beef.jpg',
      tag: 'REGULARS',
      discount: 'SAVE £1.53',
      deliveryInfo: '7-8 AM Delivery • Added by Amanda',
      description: 'Farm fresh grade-A large chicken eggs packed for family breakfasts.',
    },
    {
      id: 'sug-2',
      name: 'Sunfoil Pure Sunflower Oil',
      category: 'Cooking & Oils' as ProductCategory,
      priceUSD: 4.12,
      originalPriceUSD: 5.50,
      unit: '2 Litre Bottle',
      image: '/images/sunfoil_oil.jpg',
      tag: 'POPULAR',
      discount: 'SAVE £1.38',
      deliveryInfo: 'Same-day Dispatch • Mazai Makuru',
      description: '100% triple refined sunflower cooking oil for deep frying and cooking.',
    },
    {
      id: 'sug-3',
      name: 'Huletts Pure White Sugar',
      category: 'Maize & Staples' as ProductCategory,
      priceUSD: 2.85,
      originalPriceUSD: 3.80,
      unit: '2kg Bag',
      image: '/images/huletts_sugar.jpg',
      tag: 'DAILY ESSENTIAL',
      discount: 'SAVE £0.95',
      deliveryInfo: 'Harare Central Depot • In Stock',
      description: 'Pure sun-crystallized cane sugar perfect for tea and baking.',
    },
    {
      id: 'sug-4',
      name: 'Fresh Dairy Pasteurised Milk',
      category: 'Dairy & Fresh' as ProductCategory,
      priceUSD: 2.10,
      originalPriceUSD: 2.80,
      unit: '2L Bottle',
      image: '/images/clover_milk.jpg',
      tag: 'FRESH DAIRY',
      discount: 'SAVE £0.70',
      deliveryInfo: 'Cold-chain Express • Local Farm',
      description: 'Chilled full-cream fresh milk bottled daily.',
    }
  ];

  // Swipable Hero Live Call Cards with Live Video Previews & Sale Overlays
  const HERO_PREVIEW_SLIDES = [
    {
      id: 'slide-primary',
      badge: 'LIVE SHOPPING FIRST PLATFORM',
      badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/20',
      title: 'Start a Live Video Call with Family or Watch Live Feeds Below',
      subtitle: 'Bulawayo & Harare Multi-Family Live Shopping Room',
      description: 'Collaborate on grocery baskets in real-time across South Africa & Zimbabwe with multi-currency checkout, Gemini voice AI, and WhatsApp sync.',
      hostName: 'Pick n Pay Live • Family Room',
      hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      location: 'TM Pick n Pay Bradfield, Bulawayo',
      storeName: 'Pick n Pay Bradfield Central',
      viewers: 1420,
      likes: '48.2K',
      videoPoster: '/images/tastic_rice.jpg',
      isPrimaryRoom: true,
      productsOnSale: [
        {
          id: 'h-prod-1',
          name: 'Tastic Rice Parboiled Long Grain (5kg)',
          priceUSD: 6.80,
          originalPriceUSD: 8.00,
          discount: 'SAVE $1.20',
          unit: '5kg Bag',
          image: '/images/tastic_rice.jpg',
          category: 'PANTRY' as ProductCategory,
          tag: '🔥 FLASH SALE'
        },
        {
          id: 'h-prod-2',
          name: 'Sunfoil Pure Sunflower Cooking Oil (2L)',
          priceUSD: 3.15,
          originalPriceUSD: 3.80,
          discount: '17% OFF',
          unit: '2L Bottle',
          image: '/images/sunfoil_oil.jpg',
          category: 'PANTRY' as ProductCategory,
          tag: '⭐ BESTSELLER'
        },
        {
          id: 'h-prod-3',
          name: 'White Star Super Maize Meal (10kg)',
          priceUSD: 5.78,
          originalPriceUSD: 6.50,
          discount: 'SAVE $0.72',
          unit: '10kg Sack',
          image: '/images/white_star_maize.jpg',
          category: 'PANTRY' as ProductCategory,
          tag: '🌽 STAPLE'
        },
        {
          id: 'h-prod-4',
          name: 'Clover Fresh Full Cream Milk (2L)',
          priceUSD: 2.10,
          originalPriceUSD: 2.80,
          discount: '25% OFF',
          unit: '2L Jug',
          image: '/images/clover_milk.jpg',
          category: 'DAIRY' as ProductCategory,
          tag: '🥛 FRESH FARM'
        },
        {
          id: 'h-prod-5',
          name: 'Fresh Beef Blade Roast (2kg Pack)',
          priceUSD: 11.50,
          originalPriceUSD: 13.80,
          discount: 'SAVE $2.30',
          unit: '2kg Vacuum Pack',
          image: '/images/fresh_beef.jpg',
          category: 'MEAT' as ProductCategory,
          tag: '🥩 BUTCHER PROMO'
        }
      ]
    },
    {
      id: 'slide-gogo',
      badge: 'BUTCHER & VEGGIES LIVE STREAM',
      badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-500/20',
      title: 'Gogo Moyo & Family Bulk Grocery Shopping at TM Hyper Bulawayo',
      subtitle: 'Live In-Store Butcher Inspection & Farm Crate Verification',
      description: 'Join Gogo Moyo as she inspects prime beef roasts, fresh vegetable crates, and Mazoe cordial direct from cold storage.',
      hostName: 'Gogo Moyo (Verified Host)',
      hostAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      location: 'TM Hyper Bulawayo, Zimbabwe',
      storeName: 'TM Hyper Cold Storage Aisle 3',
      viewers: 2150,
      likes: '62.4K',
      videoPoster: '/images/fresh_beef.jpg',
      isPrimaryRoom: false,
      productsOnSale: [
        {
          id: 'h-prod-6',
          name: 'Fresh Beef Blade Roast (2kg Vacuum Sealed)',
          priceUSD: 11.50,
          originalPriceUSD: 13.80,
          discount: '16% OFF',
          unit: '2kg Cut',
          image: '/images/fresh_beef.jpg',
          category: 'MEAT' as ProductCategory,
          tag: '🥩 PRIME CUT'
        },
        {
          id: 'h-prod-7',
          name: 'Farm Fresh Fruit & Veg Box (10kg)',
          priceUSD: 9.20,
          originalPriceUSD: 11.50,
          discount: '20% OFF',
          unit: '10kg Wooden Crate',
          image: '/images/fruit_veg_box.jpg',
          category: 'VEGETABLES' as ProductCategory,
          tag: '🥬 ORGANIC'
        },
        {
          id: 'h-prod-8',
          name: 'Mazoe Orange Crush Concentrated (2L)',
          priceUSD: 3.45,
          originalPriceUSD: 4.10,
          discount: 'SAVE $0.65',
          unit: '2L Bottle',
          image: '/images/Mazoe Orange Crush 2l.jpg',
          category: 'BEVERAGES' as ProductCategory,
          tag: '🍊 ZIM CLASSIC'
        },
        {
          id: 'h-prod-9',
          name: 'Tanganda Tagless Tea Bags (100s)',
          priceUSD: 2.40,
          originalPriceUSD: 2.95,
          discount: '18% OFF',
          unit: '100 Pack',
          image: '/images/tanganda_tea.jpg',
          category: 'PANTRY' as ProductCategory,
          tag: '☕ HIGHLANDS'
        }
      ]
    },
    {
      id: 'slide-kuda',
      badge: 'CROSS-BORDER DISPATCH LIVE',
      badgeColor: 'border-cyan-500/40 text-cyan-300 bg-cyan-500/20',
      title: 'Cross-Border Solar Kit & Bulk Loading for Harare Express Delivery',
      subtitle: 'Johannesburg Wholesale Depot ➔ Harare Same-Day Dispatch',
      description: 'Live packing verification of solar power systems, 5L bulk cooking oil, and sugar sacks heading cross-border to Harare families.',
      hostName: 'Kudakwashe (Logistics Lead)',
      hostAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      location: 'Johannesburg Terminal ➔ Harare Transit',
      storeName: 'JHB Wholesaler Cross-Border Hub',
      viewers: 2890,
      likes: '96.4K',
      videoPoster: '/images/solar kit.jpg',
      isPrimaryRoom: false,
      productsOnSale: [
        {
          id: 'h-prod-10',
          name: 'Solar Home Lighting System 100W Kit',
          priceUSD: 85.00,
          originalPriceUSD: 110.00,
          discount: 'SAVE $25.00',
          unit: 'Complete Set',
          image: '/images/solar kit.jpg',
          category: 'HOUSEHOLD' as ProductCategory,
          tag: '⚡ 100W SOLAR'
        },
        {
          id: 'h-prod-11',
          name: 'Pure Cooking Oil (5L Bulk Jerrycan)',
          priceUSD: 8.50,
          originalPriceUSD: 10.20,
          discount: '17% OFF',
          unit: '5L Jerrycan',
          image: '/images/cooking oil 5l.jpg',
          category: 'PANTRY' as ProductCategory,
          tag: '🛢️ BULK SAVER'
        },
        {
          id: 'h-prod-12',
          name: 'Huletts SunSweet Brown Sugar (5kg Pack)',
          priceUSD: 5.20,
          originalPriceUSD: 6.00,
          discount: 'SAVE $0.80',
          unit: '5kg Sack',
          image: '/images/huletts_sugar.jpg',
          category: 'PANTRY' as ProductCategory,
          tag: '🍬 PURE CANE'
        },
        {
          id: 'h-prod-13',
          name: 'Sunlight Laundry Soap Bar Pack (4x500g)',
          priceUSD: 1.80,
          originalPriceUSD: 2.30,
          discount: '22% OFF',
          unit: '4-Pack',
          image: '/images/sunlight_soap.jpg',
          category: 'HOUSEHOLD' as ProductCategory,
          tag: '🧼 ESSENTIAL'
        }
      ]
    },
    {
      id: 'slide-tendai',
      badge: 'WEEKEND BRAAI & FAMILY PANTRY',
      badgeColor: 'border-rose-500/40 text-rose-300 bg-rose-500/20',
      title: 'Mutare Family Sunday Braai & Mazoe Crush Stockup',
      subtitle: 'Live Tasting, Marinades & Weekend Party Basket Haul',
      description: 'Watch live marinades tasting and baby essentials stockup with one-click personal cart adds during the stream.',
      hostName: 'Tendai Mutare',
      hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      location: 'Mutare, Manicaland',
      storeName: 'Pick n Pay Mutare Central',
      viewers: 950,
      likes: '31.9K',
      videoPoster: '/images/Mazoe Orange Crush 2l.jpg',
      isPrimaryRoom: false,
      productsOnSale: [
        {
          id: 'h-prod-14',
          name: 'Mazoe Orange Crush Concentrated (2L)',
          priceUSD: 3.45,
          originalPriceUSD: 4.10,
          discount: '15% OFF',
          unit: '2L Bottle',
          image: '/images/Mazoe Orange Crush 2l.jpg',
          category: 'BEVERAGES' as ProductCategory,
          tag: '🍊 PARTY BUNDLE'
        },
        {
          id: 'h-prod-15',
          name: 'Pampers Baby Dry Pants (Size 4, 56s)',
          priceUSD: 14.90,
          originalPriceUSD: 18.00,
          discount: 'SAVE $3.10',
          unit: '56 Pack',
          image: '/images/pampers_pants.jpg',
          category: 'BABY' as ProductCategory,
          tag: '👶 BABY CARE'
        },
        {
          id: 'h-prod-16',
          name: 'Fresh Beef Blade Roast (2kg Vacuum Sealed)',
          priceUSD: 11.50,
          originalPriceUSD: 13.80,
          discount: '16% OFF',
          unit: '2kg Cut',
          image: '/images/fresh_beef.jpg',
          category: 'MEAT' as ProductCategory,
          tag: '🥩 BRAAI READY'
        },
        {
          id: 'h-prod-17',
          name: 'Tastic Rice Parboiled (5kg)',
          priceUSD: 6.80,
          originalPriceUSD: 8.00,
          discount: 'SAVE $1.20',
          unit: '5kg',
          image: '/images/tastic_rice.jpg',
          category: 'PANTRY' as ProductCategory,
          tag: '🍚 SUNDAY FEAST'
        }
      ]
    }
  ];

  // Call state
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isCameraOff, setIsCameraOff] = useState<boolean>(false);
  const [callTimer, setCallTimer] = useState<number>(185); // 03:05 initial time
  const [activeSpeakerId, setActiveSpeakerId] = useState<string>('mem-2'); // Gogo Moyo speaking
  const [speakingBadgeMap, setSpeakingBadgeMap] = useState<Record<string, boolean>>({});
  const [callToast, setCallToast] = useState<string | null>(
    '📹 Live Video Call Connected — Shopping Cart is synced in real-time!'
  );
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string; x: number }[]>([]);

  useEffect(() => {
    if (activeSpeakerId) {
      setSpeakingBadgeMap((prev) => ({ ...prev, [activeSpeakerId]: true }));
      const timer = setTimeout(() => {
        setSpeakingBadgeMap((prev) => ({ ...prev, [activeSpeakerId]: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeSpeakerId]);

  // Live Menu & AI Conversion State
  const [liveMenu, setLiveMenu] = useState<LiveMenuUpload | null>(null);
  const [showMenuUploadModal, setShowMenuUploadModal] = useState<boolean>(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false);
  const [isConvertingMenu, setIsConvertingMenu] = useState<boolean>(false);
  const [uploadTab, setUploadTab] = useState<'preset' | 'file' | 'text'>('preset');
  const [menuTextInput, setMenuTextInput] = useState<string>('');
  const [menuTitleInput, setMenuTitleInput] = useState<string>('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('deli');
  const [uploadedMenuFileName, setUploadedMenuFileName] = useState<string | null>(null);
  const [uploadedMenuFile, setUploadedMenuFile] = useState<File | null>(null);

  // Real-time Host Speech & Product Mention Flash state
  const [flashingProductId, setFlashingProductId] = useState<string | null>(null);
  const [spotlightBanner, setSpotlightBanner] = useState<{
    productId: string;
    productName: string;
    priceUSD?: number;
    image?: string;
    phrase?: string;
  } | null>(null);
  const [isHostMicListening, setIsHostMicListening] = useState<boolean>(false);
  const [hostSpokenText, setHostSpokenText] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  // Personal Cart UI drawer / modal state
  const [showPersonalCartDrawer, setShowPersonalCartDrawer] = useState<boolean>(false);
  const [activeCartViewMode, setActiveCartViewMode] = useState<'family' | 'personal'>('family');
  const [personalCheckoutDone, setPersonalCheckoutDone] = useState<boolean>(false);
  
  // Poll States
  const [activePoll, setActivePoll] = useState<{ id: string; question: string; options: { label: string; votes: number }[] } | null>(null);
  const [showPollModal, setShowPollModal] = useState<boolean>(false);
  const [newPollQuestion, setNewPollQuestion] = useState<string>('');
  const [newPollOptions, setNewPollOptions] = useState<string>('Product A,Product B');

  // Swipable Hero Live Call Preview Card State
  const [activeHeroSlideIndex, setActiveHeroSlideIndex] = useState<number>(0);
  const [productOverlayLayout, setProductOverlayLayout] = useState<'bottom-horizontal' | 'vertical-right' | 'vertical-split-video-pane'>('vertical-split-video-pane');
  const [expandedPreviewSlide, setExpandedPreviewSlide] = useState<typeof HERO_PREVIEW_SLIDES[0] | null>(null);
  const [heroCardMuted, setHeroCardMuted] = useState<boolean>(true);
  const [heroCardLikedMap, setHeroCardLikedMap] = useState<Record<string, number>>({});

  // Freeze Frame Video States (allows watching video/frozen frame while scrolling menu products vertically)
  const [isHeroVideoFrozen, setIsHeroVideoFrozen] = useState<boolean>(false);
  const [isExpandedVideoFrozen, setIsExpandedVideoFrozen] = useState<boolean>(false);
  const [isLiveCallVideoFrozen, setIsLiveCallVideoFrozen] = useState<boolean>(false);
  // Controls vertical menu visibility on single click in full screen video
  const [isVerticalMenuVisible, setIsVerticalMenuVisible] = useState<boolean>(false);

  // Real-Time Product Tagging & Host Mention Spotlight State
  const [activeMentionedProduct, setActiveMentionedProduct] = useState<typeof HERO_PREVIEW_SLIDES[0]['productsOnSale'][0] | null>(null);
  const [isMentionFlashActive, setIsMentionFlashActive] = useState<boolean>(false);
  const [hostSpokenTranscript, setHostSpokenTranscript] = useState<string>('Welcome to live stream! Watch out for special tagged deals.');
  const [spotlightTimeLeft, setSpotlightTimeLeft] = useState<number>(10);

  // Real-Time Simulated Viewer Count State for Live Video Stream Cards
  const [liveViewerCounts, setLiveViewerCounts] = useState<Record<string, number>>({
    'hero-1': 1420,
    'hero-2': 2150,
    'hero-3': 2890,
    'hero-4': 950,
    'stream-1': 1420,
    'stream-2': 2890,
    'stream-3': 950
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveViewerCounts((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          const delta = Math.floor(Math.random() * 25) - 10;
          next[key] = Math.max(120, (next[key] || 1500) + delta);
        });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Real-Time Product Tagging Simulation Effect when Expanded Preview is Open
  useEffect(() => {
    if (!expandedPreviewSlide) {
      setActiveMentionedProduct(null);
      return;
    }

    const products = expandedPreviewSlide.productsOnSale || [];
    if (products.length === 0) return;

    const phrases = [
      "Look at this incredible quality! Grab yours now directly from the stream.",
      "This is our number one bestselling item in Harare today! Don't miss out.",
      "Incredible cross-border value! Add this to your cart with just one click.",
      "Fresh stock just arrived at our store depot! Highly recommended for family."
    ];

    const interval = setInterval(() => {
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      
      setActiveMentionedProduct(randomProduct);
      setHostSpokenTranscript(randomPhrase);
      setIsMentionFlashActive(true);
      setSpotlightTimeLeft(10); // Reset timer
      setCallToast(`🎯 Host Tagged & Mentioned: ${randomProduct.name}!`);
      setTimeout(() => setCallToast(null), 3500);

      setTimeout(() => {
        setIsMentionFlashActive(false);
      }, 3500);
    }, 12000);

    return () => clearInterval(interval);
  }, [expandedPreviewSlide]);

  // Spotlight timer decrement effect
  useEffect(() => {
    if (!activeMentionedProduct) {
      setSpotlightTimeLeft(10);
      return;
    }
    
    setSpotlightTimeLeft(10);
    const timer = setInterval(() => {
      setSpotlightTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [activeMentionedProduct]);

  // Touch & Mouse Gestures for Swipable Hero Card
  const heroTouchStartX = useRef<number | null>(null);
  const heroTouchStartY = useRef<number | null>(null);
  const heroTouchEndX = useRef<number | null>(null);
  const heroTouchEndY = useRef<number | null>(null);
  const heroMouseDownX = useRef<number | null>(null);

  const handleHeroTouchStart = (e: React.TouchEvent) => {
    heroTouchStartX.current = e.touches[0].clientX;
    heroTouchStartY.current = e.touches[0].clientY;
    heroTouchEndX.current = null;
    heroTouchEndY.current = null;
  };

  const handleHeroTouchMove = (e: React.TouchEvent) => {
    heroTouchEndX.current = e.touches[0].clientX;
    heroTouchEndY.current = e.touches[0].clientY;
  };

  const handleHeroTouchEnd = () => {
    if (heroTouchStartX.current !== null && heroTouchEndX.current !== null) {
      const deltaX = heroTouchStartX.current - heroTouchEndX.current;
      const deltaY = (heroTouchStartY.current || 0) - (heroTouchEndY.current || 0);

      // Only swipe if horizontal motion exceeds vertical motion
      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
        if (deltaX > 0) {
          // Swipe left -> Next slide
          setActiveHeroSlideIndex((prev) => (prev < HERO_PREVIEW_SLIDES.length - 1 ? prev + 1 : 0));
        } else {
          // Swipe right -> Previous slide
          setActiveHeroSlideIndex((prev) => (prev > 0 ? prev - 1 : HERO_PREVIEW_SLIDES.length - 1));
        }
      }
    }
    heroTouchStartX.current = null;
    heroTouchStartY.current = null;
    heroTouchEndX.current = null;
    heroTouchEndY.current = null;
  };

  const handleHeroMouseDown = (e: React.MouseEvent) => {
    heroMouseDownX.current = e.clientX;
  };

  const handleHeroMouseUp = (e: React.MouseEvent) => {
    if (heroMouseDownX.current !== null) {
      const deltaX = heroMouseDownX.current - e.clientX;
      if (Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          setActiveHeroSlideIndex((prev) => (prev < HERO_PREVIEW_SLIDES.length - 1 ? prev + 1 : 0));
        } else {
          setActiveHeroSlideIndex((prev) => (prev > 0 ? prev - 1 : HERO_PREVIEW_SLIDES.length - 1));
        }
      }
      heroMouseDownX.current = null;
    }
  };

  // Full-Screen Swipe Gestures
  const fullTouchStartX = useRef<number | null>(null);
  const fullTouchStartY = useRef<number | null>(null);
  const fullTouchEndX = useRef<number | null>(null);
  const fullTouchEndY = useRef<number | null>(null);

  const handleFullTouchStart = (e: React.TouchEvent) => {
    fullTouchStartX.current = e.touches[0].clientX;
    fullTouchStartY.current = e.touches[0].clientY;
    fullTouchEndX.current = null;
    fullTouchEndY.current = null;
  };

  const handleFullTouchMove = (e: React.TouchEvent) => {
    fullTouchEndX.current = e.touches[0].clientX;
    fullTouchEndY.current = e.touches[0].clientY;
  };

  const handleFullTouchEnd = () => {
    if (fullTouchStartX.current !== null && fullTouchEndX.current !== null && fullTouchStartY.current !== null && fullTouchEndY.current !== null) {
      const deltaX = fullTouchStartX.current - fullTouchEndX.current;
      const deltaY = fullTouchStartY.current - fullTouchEndY.current;

      // Vertical swipe (up/down) to transition between streams like a vertical video feed (Reels/TikTok style)
      if (Math.abs(deltaY) > 35 && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY > 0) {
          // Swipe up -> Next stream
          const nextIdx = activeHeroSlideIndex < HERO_PREVIEW_SLIDES.length - 1 ? activeHeroSlideIndex + 1 : 0;
          setActiveHeroSlideIndex(nextIdx);
          setExpandedPreviewSlide(HERO_PREVIEW_SLIDES[nextIdx]);
          setCallToast(`📺 Swiped to next live stream: ${HERO_PREVIEW_SLIDES[nextIdx].title}`);
          setTimeout(() => setCallToast(null), 2000);
        } else {
          // Swipe down -> Previous stream
          const prevIdx = activeHeroSlideIndex > 0 ? activeHeroSlideIndex - 1 : HERO_PREVIEW_SLIDES.length - 1;
          setActiveHeroSlideIndex(prevIdx);
          setExpandedPreviewSlide(HERO_PREVIEW_SLIDES[prevIdx]);
          setCallToast(`📺 Swiped to previous live stream: ${HERO_PREVIEW_SLIDES[prevIdx].title}`);
          setTimeout(() => setCallToast(null), 2000);
        }
      }
      // Horizontal swipe fallback
      else if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
        if (deltaX > 0) {
          const nextIdx = activeHeroSlideIndex < HERO_PREVIEW_SLIDES.length - 1 ? activeHeroSlideIndex + 1 : 0;
          setActiveHeroSlideIndex(nextIdx);
          setExpandedPreviewSlide(HERO_PREVIEW_SLIDES[nextIdx]);
        } else {
          const prevIdx = activeHeroSlideIndex > 0 ? activeHeroSlideIndex - 1 : HERO_PREVIEW_SLIDES.length - 1;
          setActiveHeroSlideIndex(prevIdx);
          setExpandedPreviewSlide(HERO_PREVIEW_SLIDES[prevIdx]);
        }
      }
    }
    fullTouchStartX.current = null;
    fullTouchStartY.current = null;
    fullTouchEndX.current = null;
    fullTouchEndY.current = null;
  };

  // Mouse Wheel / Trackpad Vertical Scrolling between streams in Full Screen mode
  useEffect(() => {
    if (!expandedPreviewSlide) return;

    let wheelTimeout = false;
    const handleWheel = (e: WheelEvent) => {
      if (wheelTimeout) return;
      if (Math.abs(e.deltaY) > 30) {
        wheelTimeout = true;
        setTimeout(() => { wheelTimeout = false; }, 600);

        if (e.deltaY > 0) {
          // Scroll down -> Next stream
          const nextIdx = activeHeroSlideIndex < HERO_PREVIEW_SLIDES.length - 1 ? activeHeroSlideIndex + 1 : 0;
          setActiveHeroSlideIndex(nextIdx);
          setExpandedPreviewSlide(HERO_PREVIEW_SLIDES[nextIdx]);
        } else {
          // Scroll up -> Previous stream
          const prevIdx = activeHeroSlideIndex > 0 ? activeHeroSlideIndex - 1 : HERO_PREVIEW_SLIDES.length - 1;
          setActiveHeroSlideIndex(prevIdx);
          setExpandedPreviewSlide(HERO_PREVIEW_SLIDES[prevIdx]);
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [expandedPreviewSlide, activeHeroSlideIndex]);

  // Keyboard Navigation: ArrowLeft / ArrowRight to swipe card, Escape to exit full page preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveHeroSlideIndex((prev) => {
          const nextIdx = prev > 0 ? prev - 1 : HERO_PREVIEW_SLIDES.length - 1;
          if (expandedPreviewSlide) {
            setExpandedPreviewSlide(HERO_PREVIEW_SLIDES[nextIdx]);
          }
          return nextIdx;
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveHeroSlideIndex((prev) => {
          const nextIdx = prev < HERO_PREVIEW_SLIDES.length - 1 ? prev + 1 : 0;
          if (expandedPreviewSlide) {
            setExpandedPreviewSlide(HERO_PREVIEW_SLIDES[nextIdx]);
          }
          return nextIdx;
        });
      } else if (e.key === 'Escape' && expandedPreviewSlide) {
        setExpandedPreviewSlide(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedPreviewSlide]);

  // Sync fullscreen state with parent to auto-hide vertical menu buttons except cart
  useEffect(() => {
    if (onFullscreenChange) {
      onFullscreenChange(!!expandedPreviewSlide);
    }
  }, [expandedPreviewSlide, onFullscreenChange]);

  const handleLikeSlide = (slideId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setHeroCardLikedMap((prev) => ({
      ...prev,
      [slideId]: (prev[slideId] || 0) + 1
    }));
    triggerReaction('❤️');
  };

  const handleAddAllSlideProductsToPersonalCart = (slide: typeof HERO_PREVIEW_SLIDES[0], e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    slide.productsOnSale.forEach((p) => {
      handleAddProductToPersonalCart(p as any, `Added from ${slide.hostName} Live Sale`);
    });
    setCallToast(`⚡ Added all ${slide.productsOnSale.length} sale items from "${slide.hostName}" to your Personal Cart!`);
    triggerReaction('🛒');
    setShowPersonalCartDrawer(true);
  };

  // Fetch initial active live menu from server
  useEffect(() => {
    let isMounted = true;
    const fetchMenu = async () => {
      try {
        const res = await fetch('/api/live-call/menu');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.menu) {
          setLiveMenu(data.menu);
        }
      } catch (err) {
        console.warn('Initial live menu fetch error:', err);
      }
    };
    fetchMenu();
    return () => {
      isMounted = false;
    };
  }, []);

  // Socket.io listeners for real-time menu updates & product mentions
  useEffect(() => {
    const handleMenuUpdated = (updatedMenu: LiveMenuUpload) => {
      setLiveMenu(updatedMenu);
      setCallToast(`📋 New Store Menu uploaded: ${updatedMenu.title} (${updatedMenu.products.length} items live)!`);
      triggerReaction('🛒');
      setTimeout(() => setCallToast(null), 4500);
    };

    const handleProductMentioned = (data: {
      productId: string;
      productName: string;
      productPriceUSD?: number;
      productImage?: string;
      spokenPhrase?: string;
      hostName?: string;
    }) => {
      // Flash the product
      setFlashingProductId(data.productId);
      setSpotlightBanner({
        productId: data.productId,
        productName: data.productName,
        priceUSD: data.productPriceUSD,
        image: data.productImage,
        phrase: data.spokenPhrase
      });

      // Bring to forefront (index 0) in menu products
      setLiveMenu((prev) => {
        if (!prev || !prev.products) return prev;
        const copy = [...prev.products];
        const idx = copy.findIndex((p) => p.id === data.productId || p.name.toLowerCase() === data.productName.toLowerCase());
        if (idx > -1) {
          const [item] = copy.splice(idx, 1);
          copy.unshift({ ...item, isMentioned: true, mentionedAt: new Date().toISOString() });
        }
        return { ...prev, products: copy };
      });

      // Floating reaction
      triggerReaction('🔥');

      // Auto clear flash after 8 seconds
      setTimeout(() => {
        setFlashingProductId((curr) => (curr === data.productId ? null : curr));
      }, 8000);

      // Auto clear banner after 9 seconds
      setTimeout(() => {
        setSpotlightBanner((curr) => (curr?.productId === data.productId ? null : curr));
      }, 9000);
    };

    socket.on('live_call:menu_updated', handleMenuUpdated);
    socket.on('live_call:product_mentioned', handleProductMentioned);

    return () => {
      socket.off('live_call:menu_updated', handleMenuUpdated);
      socket.off('live_call:product_mentioned', handleProductMentioned);
    };
  }, []);

  // Trigger Mention helper (broadcasts to all users via REST and socket)
  const triggerMention = async (productId: string, productName: string, spokenPhrase?: string) => {
    const matchedProduct = liveMenu?.products.find((p) => p.id === productId || p.name.toLowerCase().includes(productName.toLowerCase()));

    // Optimistic local forefront update
    setFlashingProductId(productId);
    setSpotlightBanner({
      productId,
      productName: matchedProduct?.name || productName,
      priceUSD: matchedProduct?.priceUSD,
      image: matchedProduct?.image,
      phrase: spokenPhrase || `Host is talking about ${productName}!`
    });

    setLiveMenu((prev) => {
      if (!prev || !prev.products) return prev;
      const copy = [...prev.products];
      const idx = copy.findIndex((p) => p.id === productId || p.name.toLowerCase().includes(productName.toLowerCase()));
      if (idx > -1) {
        const [item] = copy.splice(idx, 1);
        copy.unshift({ ...item, isMentioned: true, mentionedAt: new Date().toISOString() });
      }
      return { ...prev, products: copy };
    });

    triggerReaction('🔥');

    try {
      await fetch('/api/live-call/mention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          productName,
          spokenPhrase: spokenPhrase || `Host is presenting ${productName} live right now!`,
          hostName: 'Call Initiator'
        })
      });
    } catch (err) {
      console.error('Mention broadcast error:', err);
    }

    setTimeout(() => {
      setFlashingProductId((curr) => (curr === productId ? null : curr));
    }, 8000);
  };

  // Host Web Speech Recognition for Real-Time Mic Mention Detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    if (isHostMicListening) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          setHostSpokenText(transcript);

          const lower = transcript.toLowerCase();

          // Check if any product in liveMenu is mentioned
          if (liveMenu && Array.isArray(liveMenu.products)) {
            for (const prod of liveMenu.products) {
              const nameWords = prod.name.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
              const keywords = prod.keywords || [];
              const allTriggers = [...nameWords, ...keywords];

              const isMatched = allTriggers.some((kw) => lower.includes(kw.toLowerCase()));
              if (isMatched && flashingProductId !== prod.id) {
                triggerMention(prod.id, prod.name, `"${transcript.slice(-40)}..."`);
                break;
              }
            }
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e);
        };

        recognition.onend = () => {
          if (isHostMicListening) {
            try {
              recognition.start();
            } catch {
              // ignore
            }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Could not start speech recognition:', err);
      }
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [isHostMicListening, liveMenu, flashingProductId]);

  // Convert & Upload Menu Handler
  const handleUploadMenuSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsConvertingMenu(true);

    try {
      if (uploadTab === 'preset') {
        const res = await fetch('/api/live-call/menu/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            presetId: selectedPresetId,
            menuTitle: menuTitleInput || 'Live Stream Store Specials',
            uploadedBy: 'Call Initiator'
          })
        });
        const data = await res.json();
        if (data.menu) {
          setLiveMenu(data.menu);
          setCallToast(`✨ Converted preset menu into ${data.menu.products.length} live products!`);
          setShowMenuUploadModal(false);
        }
      } else if (uploadTab === 'file' && uploadedMenuFile) {
        const formData = new FormData();
        formData.append('menuImage', uploadedMenuFile);
        formData.append('menuTitle', menuTitleInput || uploadedMenuFileName || 'Uploaded Photo Menu');
        formData.append('uploadedBy', 'Call Initiator / Admin');

        const res = await fetch('/api/live-call/menu/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.menu) {
          setLiveMenu(data.menu);
          setCallToast(`✨ Gemini converted menu image into ${data.menu.products.length} grocery items!`);
          setShowMenuUploadModal(false);
          setUploadedMenuFile(null);
          setUploadedMenuFileName(null);
        }
      } else if (uploadTab === 'text') {
        const res = await fetch('/api/live-call/menu/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            menuText: menuTextInput,
            menuTitle: menuTitleInput || 'Live Text Menu',
            uploadedBy: 'Call Initiator / Admin'
          })
        });
        const data = await res.json();
        if (data.menu) {
          setLiveMenu(data.menu);
          setCallToast(`✨ Converted menu text into ${data.menu.products.length} live products!`);
          setShowMenuUploadModal(false);
          setMenuTextInput('');
        }
      }
    } catch (err: any) {
      console.error('Menu conversion error:', err);
      setCallToast(`⚠️ Menu conversion error: ${err.message || 'Please retry'}`);
    } finally {
      setIsConvertingMenu(false);
    }
  };

  // Add single item to personal cart helper
  const handleAddProductToPersonalCart = (product: LiveMenuProduct | Product, note?: string) => {
    if (onAddToPersonalCart) {
      onAddToPersonalCart(product, 1, note || 'Added from Live Video Call Shelf');
    }
    setCallToast(`👤 Added ${product.name} to My Personal Cart!`);
    triggerReaction('🛒');
    setTimeout(() => setCallToast(null), 3500);
  };

  // Add ALL menu items to personal cart helper
  const handleAddAllMenuToPersonalCart = () => {
    if (!liveMenu || !liveMenu.products || liveMenu.products.length === 0) return;
    if (onAddAllToPersonalCart) {
      onAddAllToPersonalCart(liveMenu.products);
    } else if (onAddToPersonalCart) {
      liveMenu.products.forEach((p) => onAddToPersonalCart(p, 1, 'Added via Add All Menu'));
    }
    setCallToast(`⚡ Added ALL ${liveMenu.products.length} menu products to your Personal Cart!`);
    triggerReaction('🎉');
    setShowPersonalCartDrawer(true);
    setTimeout(() => setCallToast(null), 4000);
  };

  // Layout View Mode: 'split' (side-by-side equal), 'max-cart' (expanded cart), 'max-video' (expanded video)
  const [viewLayoutMode, setViewLayoutMode] = useState<'split' | 'max-cart' | 'max-video'>('split');

  // Split method state
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('BY_SUBMITTER');
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [checkoutComplete, setCheckoutComplete] = useState<boolean>(false);

  // Quick Add Modal / Target member selection
  const [selectedMemberForAdd, setSelectedMemberForAdd] = useState<Member | null>(null);
  const [showQuickAddModal, setShowQuickAddModal] = useState<boolean>(false);

  // Invite / Add Member Modal state
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberLocation, setNewMemberLocation] = useState<string>('Harare, Zimbabwe');
  const [newMemberMode, setNewMemberMode] = useState<'video' | 'audio-only'>('video');

  // Participants List
  const [callParticipants, setCallParticipants] = useState<CallParticipant[]>(() =>
    members.map((m) => ({
      id: m.id,
      name: m.name,
      avatar: m.avatar,
      location: m.location,
      mode: m.id === 'mem-4' || m.id === 'mem-5' ? 'audio-only' : 'video',
      role: m.role
    }))
  );

  // Sync if new members added
  useEffect(() => {
    if (members.length > callParticipants.length) {
      const missing = members.filter((m) => !callParticipants.some((cp) => cp.id === m.id));
      if (missing.length > 0) {
        setCallParticipants((prev) => [
          ...prev,
          ...missing.map((m) => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            location: m.location,
            mode: 'video' as const,
            role: m.role
          }))
        ]);
      }
    }
  }, [members]);

  // Real WebRTC Camera Stream
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);

  // Video call timer increment
  useEffect(() => {
    const interval = setInterval(() => {
      setCallTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Speaker rotation for natural group feel
  useEffect(() => {
    const speakerInterval = setInterval(() => {
      if (callParticipants.length > 0) {
        const randomMember = callParticipants[Math.floor(Math.random() * callParticipants.length)];
        setActiveSpeakerId(randomMember.id);
      }
    }, 5500);
    return () => clearInterval(speakerInterval);
  }, [callParticipants]);

  // MediaStream camera initialization
  useEffect(() => {
    let streamInstance: MediaStream | null = null;

    async function startCamera() {
      if (!isCameraOff) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
            audio: !isMicMuted
          });
          streamInstance = stream;
          setCameraStream(stream);
          setHasCameraPermission(true);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.warn('Camera access unavailable:', err);
          setHasCameraPermission(false);
        }
      } else {
        if (cameraStream) {
          cameraStream.getTracks().forEach((t) => t.stop());
          setCameraStream(null);
        }
      }
    }

    startCamera();

    return () => {
      if (streamInstance) {
        streamInstance.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isCameraOff, isMicMuted]);

  useEffect(() => {
    if (localVideoRef.current && cameraStream) {
      localVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Format call timer mm:ss
  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Leave call (initiating/current user exits, others carry on)
  const handleLeaveCall = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
    }
    if (onLeaveCall) {
      onLeaveCall();
    } else {
      onEndCall();
    }
  };

  // End call for everyone in the group
  const handleEndCallAll = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
    }
    onEndCall();
  };

  // Share Live Link helper
  const handleShareLiveLink = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://pnp.co.zw/live';
    const shareText = `🛒 Join my live TM Pick n Pay shopping session! Watch live feeds and shop groceries together: ${currentUrl}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).catch(() => {});
    }

    setCallToast('🔗 Live session link copied! Ready to share on WhatsApp or SMS.');
    setTimeout(() => setCallToast(null), 3500);
  };

  // Reactions
  const triggerReaction = (emoji: string) => {
    const reaction = {
      id: Date.now() + Math.random(),
      emoji,
      x: Math.floor(Math.random() * 65) + 20
    };
    setFloatingReactions((prev) => [...prev, reaction]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== reaction.id));
    }, 2200);
  };

  // Handle adding new participant to call
  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const avatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80'
    ];
    const newParticipant: CallParticipant = {
      id: `call-mem-${Date.now()}`,
      name: newMemberName.trim(),
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      location: newMemberLocation,
      mode: newMemberMode,
      role: 'Family Member'
    };

    setCallParticipants((prev) => [...prev, newParticipant]);
    setCallToast(`🎉 ${newParticipant.name} joined the Live Call (${newMemberMode === 'video' ? 'Video' : 'Audio Only'})!`);
    triggerReaction('🎉');
    setShowAddMemberModal(false);
    setNewMemberName('');
    setTimeout(() => setCallToast(null), 4000);
  };

  // Toggle participant mode
  const toggleParticipantMode = (id: string) => {
    setCallParticipants((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextMode = p.mode === 'video' ? 'audio-only' : 'video';
          setCallToast(`🎙️ ${p.name.split(' ')[0]} switched to ${nextMode === 'video' ? 'Live Video' : 'Audio Only'}`);
          setTimeout(() => setCallToast(null), 3000);
          return { ...p, mode: nextMode };
        }
        return p;
      })
    );
  };

  // Handle Quick Add item
  const handleQuickAddItem = (product: Product, targetMember?: Member | CallParticipant) => {
    const member = targetMember || selectedMemberForAdd || members[0];
    onAddToCart(product.id, member.id, 'Added during Live Video Shopping Call');
    setCallToast(`🛒 ${member.name.split(' ')[0]} added ${product.name} to the cart!`);
    triggerReaction('🛒');
    setShowQuickAddModal(false);
    setSelectedMemberForAdd(null);
    setTimeout(() => setCallToast(null), 4000);
  };

  // Total USD
  const totalUSD = cart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
  const totalZAR = totalUSD * exchangeRates.USD_ZAR;
  const totalZWG = totalUSD * exchangeRates.USD_ZWG;

  const formatCurrency = (valUSD: number) => formatPrice(valUSD, currency);

  // Group items by added member
  const memberSubtotals = members.map((member) => {
    const memberItems = cart.filter(
      (i) =>
        i.addedByMemberId === member.id ||
        i.addedByMemberName.toLowerCase().includes(member.name.toLowerCase().split(' ')[0])
    );
    return {
      member,
      subtotalUSD: memberItems.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0),
      itemCount: memberItems.reduce((sum, item) => sum + item.quantity, 0)
    };
  });

  if (!isLiveCallOngoing) {
    const OTHER_LIVE_STREAMS = [
      {
        id: 'stream-1',
        title: 'Gogo Moyo & Family Bulk Grocery Shopping at TM Hyper Bulawayo',
        host: 'Gogo Moyo',
        location: 'Bulawayo, Zimbabwe',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
        viewers: 1420,
        likes: '48.2K',
        videoPoster: '/images/fresh_beef.jpg',
        featuredProduct: {
          name: 'White Star Maize Meal 10kg',
          priceUSD: 5.78,
          image: '/images/white_star_maize.jpg'
        }
      },
      {
        id: 'stream-2',
        title: 'Cross-Border Solar Kit & Rice Loading for Harare Express Delivery',
        host: 'Kudakwashe',
        location: 'Johannesburg, SA ➔ Harare',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        viewers: 2890,
        likes: '96.4K',
        videoPoster: '/images/solar kit.jpg',
        featuredProduct: {
          name: 'Solar Home Lighting System 100W',
          priceUSD: 85.00,
          image: '/images/solar kit.jpg'
        }
      },
      {
        id: 'stream-3',
        title: 'Mutare Family Sunday Braai & Mazoe Crush Stockup',
        host: 'Tendai Mutare',
        location: 'Mutare, Manicaland',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        viewers: 950,
        likes: '31.9K',
        videoPoster: '/images/Mazoe Orange Crush 2l.jpg',
        featuredProduct: {
          name: 'Mazoe Orange Crush 2L',
          priceUSD: 3.45,
          image: '/images/Mazoe Orange Crush 2l.jpg'
        }
      }
    ];

    return (
      <div className="min-h-screen bg-[#071320] text-white flex flex-col font-sans select-none pb-28">



        {/* Horizontal Scrollable Live Users / Hosts Bar */}
        <div className="bg-[#091828] border-b border-[#18395e] py-3 px-4">

            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'host-1', name: 'Tinashe', location: 'Johannesburg', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', status: 'LIVE' },
                { id: 'host-2', name: 'Gogo Moyo', location: 'Harare', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', status: 'LIVE' },
                { id: 'host-3', name: 'Amai', location: 'Bulawayo', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', status: 'LIVE' },
                { id: 'host-4', name: 'Uncle', location: 'Mutare', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', status: 'AUDIO' },
                { id: 'host-5', name: 'Kudakwashe', location: 'Sandton', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', status: 'LIVE' }
              ].map((host) => (
                <div 
                  key={host.id} 
                  onClick={() => {
                    if (onStartLiveCall) onStartLiveCall();
                  }}
                  className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
                >
                  <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 group-hover:scale-105 transition-transform shadow-lg">
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden border-2 border-[#071320] bg-stone-900">
                      <img src={host.avatar} alt={host.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    {/* Status Badge */}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      {host.status === 'LIVE' ? (
                        <span className="bg-gradient-to-r from-rose-600 to-pink-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase shadow-md flex items-center gap-1 border border-white/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          LIVE
                        </span>
                      ) : (
                        <span className="bg-amber-500 text-stone-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase shadow-md flex items-center gap-1">
                          AUDIO
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-white mt-2 group-hover:text-emerald-400 transition-colors">
                    {host.name}
                  </span>
                  <span className="text-[10px] text-blue-200/70 tracking-tight">
                    {host.location}
                  </span>
                </div>
              ))}
            </div>
        </div>

        {/* Vertical Timeline Feed */}
        <div className="max-w-2xl mx-auto w-full p-3 sm:p-6 space-y-6 flex-1">
          {/* Swipable Hero Live Call Card with Video Previews & Floating Sale Menu Overlay */}
          <div className="relative group/deck">
            {/* Swipable Card Container */}
            <div
              onTouchStart={handleHeroTouchStart}
              onTouchMove={handleHeroTouchMove}
              onTouchEnd={handleHeroTouchEnd}
              onMouseDown={handleHeroMouseDown}
              onMouseUp={handleHeroMouseUp}
              className="bg-gradient-to-br from-[#0c233c] via-[#08182b] to-[#040e1b] border-2 border-emerald-500/50 rounded-3xl shadow-2xl relative overflow-hidden transition-all duration-300 min-h-[500px] flex flex-col justify-between"
            >
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Top Card Controls & Progress Bar */}
              <div className="p-3 sm:p-4 z-20 flex items-center justify-between gap-2 border-b border-emerald-500/20 bg-[#071526]/80 backdrop-blur-md">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <div className={`inline-flex items-center gap-1.5 border px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${HERO_PREVIEW_SLIDES[activeHeroSlideIndex].badgeColor || 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'}`}>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>{HERO_PREVIEW_SLIDES[activeHeroSlideIndex].badge}</span>
                  </div>

                  <span className="text-[11px] font-extrabold text-blue-200/90 hidden sm:inline-block">
                    Card {activeHeroSlideIndex + 1} of {HERO_PREVIEW_SLIDES.length}
                  </span>
                </div>

                {/* Right controls: Freeze Frame toggle, Overlay Layout toggle, Audio mute toggle, Expand Fullscreen */}
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {/* Freeze Frame Video Toggle Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsHeroVideoFrozen((prev) => !prev);
                      setCallToast(!isHeroVideoFrozen ? '❄️ Video Frame Frozen! Products scroll smoothly below.' : '▶️ Live Video Resumed');
                      setTimeout(() => setCallToast(null), 2500);
                    }}
                    title={isHeroVideoFrozen ? 'Resume live video streaming' : 'Freeze frame: hold current video frame while scrolling menu products'}
                    className={`text-[10px] font-bold px-2 py-1 rounded-xl flex items-center gap-1 cursor-pointer transition-all active:scale-95 border ${
                      isHeroVideoFrozen
                        ? 'bg-cyan-400 text-stone-950 border-cyan-200 font-black shadow-md shadow-cyan-400/30 ring-1 ring-cyan-200 animate-pulse'
                        : 'bg-[#122e4d] hover:bg-[#1a416d] text-cyan-300 border-cyan-400/30'
                    }`}
                  >
                    <Snowflake className={`w-3 h-3 ${isHeroVideoFrozen ? 'animate-spin' : ''}`} />
                    <span className="hidden xs:inline">{isHeroVideoFrozen ? 'Frozen ❄️' : 'Freeze Frame'}</span>
                  </button>

                  {/* Overlay Position Toggle: Cycles through Vertical Split (Pinned Video Top + Scroll Under) -> Bottom Horizontal -> Vertical Right */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProductOverlayLayout((prev) =>
                        prev === 'vertical-split-video-pane'
                          ? 'bottom-horizontal'
                          : prev === 'bottom-horizontal'
                          ? 'vertical-right'
                          : 'vertical-split-video-pane'
                      );
                    }}
                    title="Toggle Layout: Video Pane Split, Bottom Shelf, or Right Sidebar"
                    className="bg-[#122e4d] hover:bg-[#1a416d] text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-1 rounded-xl flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    {productOverlayLayout === 'vertical-split-video-pane' ? (
                      <>
                        <Layers className="w-3 h-3 text-amber-300" />
                        <span className="hidden xs:inline">Split: Pane</span>
                      </>
                    ) : productOverlayLayout === 'bottom-horizontal' ? (
                      <>
                        <MoveHorizontal className="w-3 h-3 text-cyan-300" />
                        <span className="hidden xs:inline">Shelf: Bottom</span>
                      </>
                    ) : (
                      <>
                        <MoveVertical className="w-3 h-3 text-emerald-400" />
                        <span className="hidden xs:inline">Shelf: Right</span>
                      </>
                    )}
                  </button>

                  {/* Audio Mute / Unmute Preview */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setHeroCardMuted((prev) => !prev);
                      setCallToast(heroCardMuted ? '🔊 Stream audio preview unmuted' : '🔇 Stream audio muted');
                      setTimeout(() => setCallToast(null), 2500);
                    }}
                    title={heroCardMuted ? 'Unmute preview sound' : 'Mute preview sound'}
                    className="p-1.5 rounded-xl bg-[#122e4d] hover:bg-[#1a416d] text-blue-200 border border-blue-400/20 cursor-pointer active:scale-95 transition-all"
                  >
                    {heroCardMuted ? (
                      <VolumeX className="w-3.5 h-3.5 text-stone-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    )}
                  </button>

                  {/* Click to Expand to Full Screen Vertical Mobile Video */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedPreviewSlide(HERO_PREVIEW_SLIDES[activeHeroSlideIndex]);
                    }}
                    title="Enable video to fill full vertical mobile screen"
                    className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black px-2.5 py-1 rounded-xl text-[10px] flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md shadow-emerald-500/20"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span className="hidden xs:inline">Full Screen Video</span>
                  </button>
                </div>
              </div>

              {/* Live Video Preview Body with Sticky / Frozen Viewport */}
              <div
                onClick={() => setExpandedPreviewSlide(HERO_PREVIEW_SLIDES[activeHeroSlideIndex])}
                className="relative flex-1 cursor-pointer group/video overflow-hidden min-h-[280px] flex flex-col justify-between p-3.5 sm:p-5"
              >
                {/* Background Video Poster with subtle zoom or Crisp Freeze-Frame Hold */}
                <img
                  src={HERO_PREVIEW_SLIDES[activeHeroSlideIndex].videoPoster}
                  alt={HERO_PREVIEW_SLIDES[activeHeroSlideIndex].title}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 pointer-events-none ${
                    isHeroVideoFrozen
                      ? 'opacity-85 scale-100 ring-2 ring-cyan-400/60'
                      : 'opacity-35 group-hover/video:scale-105 group-hover/video:opacity-45'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#040e1b] via-[#07182c]/80 to-transparent pointer-events-none" />

                {/* Floating Freeze Frame Banner Indicator */}
                {isHeroVideoFrozen && (
                  <div className="absolute top-12 left-4 z-20 bg-cyan-950/95 border border-cyan-400/80 text-cyan-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xl backdrop-blur-md">
                    <Snowflake className="w-3 h-3 text-cyan-300 animate-spin" />
                    <span>Video Frozen on Current Frame • Scroll products freely</span>
                  </div>
                )}

                {/* Floating Video Status Badges on Top */}
                <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {isHeroVideoFrozen ? (
                      <span className="bg-cyan-500 text-stone-950 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg border border-cyan-200">
                        <Snowflake className="w-2.5 h-2.5 animate-spin" />
                        FROZEN FRAME
                      </span>
                    ) : (
                      <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        LIVE
                      </span>
                    )}

                    <span className="bg-black/60 backdrop-blur-md text-cyan-200 border border-cyan-400/30 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                      <Users className="w-3 h-3 text-cyan-400 animate-pulse" />
                      <span>{(liveViewerCounts[HERO_PREVIEW_SLIDES[activeHeroSlideIndex].id] || HERO_PREVIEW_SLIDES[activeHeroSlideIndex].viewers).toLocaleString()}</span>
                    </span>

                    {/* Quick Overlay Action Icons */}
                    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-cyan-400/30 shadow-md">
                      {/* WhatsApp Share Icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://pnp.co.zw/live';
                          const shareText = `🛒 Join my live TM Pick n Pay shopping session! Watch live feeds & shop together: ${currentUrl}`;
                          const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
                          if (typeof window !== 'undefined') {
                            window.open(whatsappUrl, '_blank');
                          }
                          setCallToast('💬 Opening WhatsApp to invite friends!');
                          setTimeout(() => setCallToast(null), 3000);
                        }}
                        className="p-1 rounded-full hover:bg-emerald-600/40 text-emerald-300 transition-all cursor-pointer active:scale-95"
                        title="Invite via WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      </button>

                      {/* Copy Deep Link Icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareLiveLink();
                        }}
                        className="p-1 rounded-full hover:bg-blue-600/40 text-cyan-300 transition-all cursor-pointer active:scale-95"
                        title="Copy Live Link"
                      >
                        <Copy className="w-3.5 h-3.5 text-cyan-300" />
                      </button>

                      {/* Live Analytics Dashboard Icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAnalyticsModal(true);
                        }}
                        className="p-1 rounded-full hover:bg-amber-600/40 text-amber-300 transition-all cursor-pointer active:scale-95"
                        title="Live Analytics & Peak Product Interest"
                      >
                        <BarChart2 className="w-3.5 h-3.5 text-[#ffb703]" />
                      </button>
                    </div>

                    <span className="bg-stone-900/70 backdrop-blur-md text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2 py-1 rounded-full hidden sm:flex items-center gap-1">
                      📍 {HERO_PREVIEW_SLIDES[activeHeroSlideIndex].location}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleLikeSlide(HERO_PREVIEW_SLIDES[activeHeroSlideIndex].id, e)}
                      className="bg-black/60 hover:bg-black/80 backdrop-blur-md text-pink-300 border border-pink-400/30 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                    >
                      <span>❤️</span>
                      <span>
                        {heroCardLikedMap[HERO_PREVIEW_SLIDES[activeHeroSlideIndex].id]
                          ? (Number(HERO_PREVIEW_SLIDES[activeHeroSlideIndex].likes.replace('K', '')) + heroCardLikedMap[HERO_PREVIEW_SLIDES[activeHeroSlideIndex].id] * 0.1).toFixed(1) + 'K'
                          : HERO_PREVIEW_SLIDES[activeHeroSlideIndex].likes}
                      </span>
                    </button>

                    <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[9px] font-black px-2 py-0.5 rounded-full uppercase hidden md:flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>Click to Expand</span>
                    </div>
                  </div>
                </div>

                {/* Center Content: Title, Subtitle, Description */}
                <div className={`relative z-10 my-auto text-left space-y-2.5 ${productOverlayLayout === 'vertical-right' ? 'max-w-[calc(100%-17rem)]' : 'max-w-xl'}`}>
                  <div className="inline-flex items-center gap-2 text-cyan-300 text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{HERO_PREVIEW_SLIDES[activeHeroSlideIndex].subtitle}</span>
                  </div>

                  <h2 className="text-lg sm:text-2xl font-black text-white leading-tight drop-shadow-md">
                    {HERO_PREVIEW_SLIDES[activeHeroSlideIndex].title}
                  </h2>

                  <p className="text-xs sm:text-sm text-blue-200/90 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                    {HERO_PREVIEW_SLIDES[activeHeroSlideIndex].description}
                  </p>



                  <div className="flex items-center gap-2 bg-[#091d33]/80 border border-blue-400/20 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                      <img
                        src={HERO_PREVIEW_SLIDES[activeHeroSlideIndex].hostAvatar}
                        alt={HERO_PREVIEW_SLIDES[activeHeroSlideIndex].hostName}
                        className="w-6 h-6 rounded-full object-cover border border-emerald-400"
                      />
                      <div className="leading-tight">
                        <span className="text-[11px] font-bold text-white block">
                          {HERO_PREVIEW_SLIDES[activeHeroSlideIndex].hostName}
                        </span>
                        <span className="text-[9px] text-blue-300/70">
                          {HERO_PREVIEW_SLIDES[activeHeroSlideIndex].storeName}
                        </span>
                      </div>
                    </div>
                </div>

                {/* Floating Expand Video Center Prompt Hint */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/video:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-stone-950/80 backdrop-blur-md border border-emerald-400/50 text-white px-4 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-2xl">
                    <Maximize2 className="w-4 h-4 text-emerald-400" />
                    <span>Click to Expand Video to Full Page</span>
                  </div>
                </div>
              </div>

              {/* FLOATING INDEPENDENT SCROLLABLE MENU OVERLAY OF PRODUCTS ON SALE */}
              {productOverlayLayout === 'vertical-split-video-pane' ? (
                /* 1. FREEZE FRAME PINNED VIDEO + VERTICAL SCROLL PRODUCTS UNDER VIDEO PANE */
                <div
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  className="z-30 m-2 sm:m-3 bg-[#061322]/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-2.5 sm:p-3 shadow-2xl flex flex-col space-y-2 max-h-[380px]"
                >
                  {/* Top Bar for Vertical Pane Mode */}
                  <div className="flex items-center justify-between gap-1.5 border-b border-[#183a61] pb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="p-1 bg-cyan-500/20 text-cyan-300 rounded-lg">
                        <Snowflake className={`w-3.5 h-3.5 ${isHeroVideoFrozen ? 'text-cyan-300 animate-spin' : 'text-blue-300'}`} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-black text-xs text-white truncate">
                            Sale Menu ({HERO_PREVIEW_SLIDES[activeHeroSlideIndex].productsOnSale.length} Items)
                          </h4>
                          {isHeroVideoFrozen ? (
                            <span className="bg-cyan-500 text-stone-950 font-black text-[8px] px-1.5 py-0.2 rounded uppercase">
                              Frozen Frame ❄️
                            </span>
                          ) : (
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[8px] font-black px-1.5 py-0.2 rounded uppercase">
                              Video Pinned Above 🎥
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-cyan-200/70 truncate">
                          {isHeroVideoFrozen ? 'Video frame frozen — scroll products below' : 'Watching live video — scroll products vertically below'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Freeze Frame Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsHeroVideoFrozen((prev) => !prev);
                          setCallToast(!isHeroVideoFrozen ? '❄️ Video Frame Frozen! Products scroll smoothly below.' : '▶️ Live Video Resumed');
                          setTimeout(() => setCallToast(null), 2500);
                        }}
                        className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                          isHeroVideoFrozen
                            ? 'bg-cyan-500 text-stone-950 border-cyan-300 font-black'
                            : 'bg-[#122e4d] hover:bg-[#1a416d] text-cyan-300 border-cyan-400/30'
                        }`}
                        title="Freeze video on current frame"
                      >
                        <Snowflake className="w-2.5 h-2.5" />
                        <span>{isHeroVideoFrozen ? 'Unfreeze' : 'Freeze Video'}</span>
                      </button>

                      <button
                        onClick={(e) => handleAddAllSlideProductsToPersonalCart(HERO_PREVIEW_SLIDES[activeHeroSlideIndex], e)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black px-2 py-1 rounded-lg text-[9px] flex items-center gap-0.5 shadow-sm active:scale-95 cursor-pointer"
                      >
                        <Zap className="w-2.5 h-2.5 fill-stone-950" />
                        <span>Add All</span>
                      </button>

                      {/* Switch layout button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductOverlayLayout('bottom-horizontal');
                        }}
                        title="Switch to Bottom Horizontal Shelf"
                        className="p-1 rounded-lg bg-[#122e4d] hover:bg-[#1a416d] text-blue-200 border border-blue-400/20 cursor-pointer"
                      >
                        <MoveHorizontal className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Vertical Scrollable Products Under Video Pane with Independent Scroll */}
                  <div className="overflow-y-auto max-h-[220px] sm:max-h-[250px] space-y-2 pr-1 no-scrollbar flex-1 divide-y divide-[#133054]">
                    {HERO_PREVIEW_SLIDES[activeHeroSlideIndex].productsOnSale.map((item) => (
                      <div
                        key={item.id}
                        className="pt-2 first:pt-0 flex items-center justify-between gap-2.5 group/item hover:bg-[#0c223c]/60 p-1.5 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-stone-900 border border-blue-400/20 shrink-0">
                            <img
                              src={getProductImagePath(item.image)}
                              alt={item.name}
                              onError={(e) => handleProductImageError(e, item.name, item.category)}
                              className="w-full h-full object-cover group-hover/item:scale-105 transition-transform"
                            />
                            <span className="absolute top-0.5 left-0.5 bg-rose-600 text-white text-[7px] font-black px-1 rounded uppercase shadow">
                              {item.discount}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <h5 className="font-extrabold text-xs text-white truncate group-hover/item:text-emerald-300 transition-colors">
                              {item.name}
                            </h5>
                            <p className="text-[10px] text-blue-200/70 truncate">{item.unit}</p>
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-black text-xs text-cyan-300">
                                {formatCurrency(item.priceUSD)}
                              </span>
                              {item.originalPriceUSD && (
                                <span className="text-[9px] text-stone-400 line-through">
                                  {formatCurrency(item.originalPriceUSD)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Add to personal & family cart */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddProductToPersonalCart(item as any, `Added from ${HERO_PREVIEW_SLIDES[activeHeroSlideIndex].hostName} Live Sale`);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-1 px-2 rounded-lg text-[9px] flex items-center gap-0.5 shadow-sm active:scale-95 cursor-pointer"
                            title="Add to My Personal Cart"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>My Cart</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(item.id, members[0]?.id || 'mem-1', `Added from live stream sale`);
                              setCallToast(`🛒 Added ${item.name} to Shared Family Cart!`);
                              triggerReaction('🛒');
                              setTimeout(() => setCallToast(null), 3000);
                            }}
                            className="bg-[#153457] hover:bg-[#1d4879] text-cyan-200 border border-cyan-400/20 font-bold py-1 px-1.5 rounded-lg text-[9px] flex items-center justify-center active:scale-95 cursor-pointer"
                            title="Add to Shared Family Cart"
                          >
                            <span>+ Family</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : productOverlayLayout === 'bottom-horizontal' ? (
                /* 2. BOTTOM HORIZONTAL FLOATING OVERLAY */
                <div
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  className="z-30 m-3 p-3 bg-[#071626]/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl shadow-2xl space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-[#183a61] pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="p-1 bg-amber-500/20 text-amber-300 rounded-lg">
                        <Flame className="w-3.5 h-3.5" />
                      </span>
                      <h4 className="font-black text-xs text-white truncate">
                        Products on Sale in this Live Call ({HERO_PREVIEW_SLIDES[activeHeroSlideIndex].productsOnSale.length} Items)
                      </h4>
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                        Live Deals
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => handleAddAllSlideProductsToPersonalCart(HERO_PREVIEW_SLIDES[activeHeroSlideIndex], e)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black px-2.5 py-1 rounded-xl text-[10px] flex items-center gap-1 shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
                      >
                        <Zap className="w-3 h-3 fill-stone-950" />
                        <span>Add All to My Cart</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductOverlayLayout('vertical-right');
                        }}
                        title="Switch to Vertical Right Sidebar"
                        className="p-1 rounded-lg bg-[#122e4d] hover:bg-[#1a416d] text-blue-200 border border-blue-400/20 cursor-pointer"
                      >
                        <MoveVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Scrollable Products Shelf (Independent Scroll) */}
                  <div className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-1">
                    {HERO_PREVIEW_SLIDES[activeHeroSlideIndex].productsOnSale.map((item) => (
                      <div
                        key={item.id}
                        className="w-44 xs:w-48 bg-[#091a2e] border border-[#1b3e66] hover:border-emerald-400/60 rounded-xl p-2 flex-shrink-0 flex flex-col justify-between shadow-md transition-all group/item"
                      >
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-stone-900 mb-1.5">
                          <img
                            src={getProductImagePath(item.image)}
                            alt={item.name}
                            onError={(e) => handleProductImageError(e, item.name, item.category)}
                            className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-1 left-1 bg-rose-600/90 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase shadow">
                            {item.discount}
                          </span>
                          {item.tag && (
                            <span className="absolute bottom-1 right-1 bg-stone-950/80 text-amber-300 text-[7px] font-black px-1 py-0.5 rounded uppercase">
                              {item.tag}
                            </span>
                          )}
                        </div>

                        <div className="space-y-0.5 flex-1 min-w-0">
                          <h5 className="font-extrabold text-[11px] text-white truncate group-hover/item:text-emerald-300 transition-colors">
                            {item.name}
                          </h5>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-xs text-cyan-300">
                              {formatCurrency(item.priceUSD)}
                            </span>
                            {item.originalPriceUSD && (
                              <span className="text-[10px] text-stone-400 line-through">
                                {formatCurrency(item.originalPriceUSD)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Cart Actions */}
                        <div className="pt-2 grid grid-cols-2 gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddProductToPersonalCart(item as any, `Added from ${HERO_PREVIEW_SLIDES[activeHeroSlideIndex].hostName} Live Sale`);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-1 px-1 rounded-lg text-[9px] flex items-center justify-center gap-0.5 shadow-sm active:scale-95 cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>My Cart</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(item.id, members[0]?.id || 'mem-1', `Added from live stream sale`);
                              setCallToast(`🛒 Added ${item.name} to Shared Family Cart!`);
                              triggerReaction('🛒');
                              setTimeout(() => setCallToast(null), 3000);
                            }}
                            className="bg-[#153457] hover:bg-[#1d4879] text-cyan-200 border border-cyan-400/20 font-bold py-1 px-1 rounded-lg text-[9px] flex items-center justify-center gap-0.5 active:scale-95 cursor-pointer"
                          >
                            <span>+ Family</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* 3. VERTICAL RIGHT FLOATING OVERLAY */
                <div
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  className="absolute top-14 bottom-12 right-3 w-60 sm:w-68 z-30 bg-[#071626]/96 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-2.5 shadow-2xl flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-1 border-b border-[#183a61] pb-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <h4 className="font-black text-xs text-white truncate">
                        Live Sale ({HERO_PREVIEW_SLIDES[activeHeroSlideIndex].productsOnSale.length})
                      </h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleAddAllSlideProductsToPersonalCart(HERO_PREVIEW_SLIDES[activeHeroSlideIndex], e)}
                        title="Add All to My Cart"
                        className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black px-2 py-0.5 rounded-lg text-[9px] flex items-center gap-0.5 cursor-pointer"
                      >
                        <Zap className="w-2.5 h-2.5 fill-stone-950" />
                        <span>All</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductOverlayLayout('vertical-split-video-pane');
                        }}
                        title="Switch to Split Video Pane"
                        className="p-1 rounded-lg bg-[#122e4d] hover:bg-[#1a416d] text-blue-200 border border-blue-400/20 cursor-pointer"
                      >
                        <Layers className="w-3 h-3 text-amber-300" />
                      </button>
                    </div>
                  </div>

                  {/* Vertical Scrollable Products (Independent Scroll) */}
                  <div className="overflow-y-auto max-h-[260px] sm:max-h-[300px] space-y-2 pr-1 no-scrollbar flex-1">
                    {HERO_PREVIEW_SLIDES[activeHeroSlideIndex].productsOnSale.map((item) => (
                      <div
                        key={item.id}
                        className="bg-[#091a2e] border border-[#1b3e66] hover:border-emerald-400/60 rounded-xl p-1.5 flex items-center justify-between gap-2 shadow-sm group/item"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <img
                            src={getProductImagePath(item.image)}
                            alt={item.name}
                            onError={(e) => handleProductImageError(e, item.name, item.category)}
                            className="w-10 h-10 rounded-lg object-cover bg-stone-900 border border-blue-400/20 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] font-black text-rose-400 uppercase block">
                              {item.discount}
                            </span>
                            <h5 className="font-bold text-[10px] text-white truncate">{item.name}</h5>
                            <span className="font-black text-[11px] text-cyan-300">
                              {formatCurrency(item.priceUSD)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddProductToPersonalCart(item as any, `Added from ${HERO_PREVIEW_SLIDES[activeHeroSlideIndex].hostName} Live Sale`);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black p-1.5 rounded-lg text-[10px] flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
                          title="Add to Personal Cart"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Pagination Dots & Swipe Keyboard Instruction */}
              <div className="p-2.5 z-20 bg-[#061221]/90 border-t border-[#143254] flex items-center justify-between gap-2 text-[10px] text-blue-200/80">
                <div className="flex items-center gap-1.5">
                  {HERO_PREVIEW_SLIDES.map((slide, idx) => (
                    <button
                      key={slide.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveHeroSlideIndex(idx);
                      }}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === activeHeroSlideIndex
                          ? 'w-6 bg-emerald-400 shadow-md shadow-emerald-400/50'
                          : 'w-2 bg-[#1b3e66] hover:bg-[#2b598d]'
                      }`}
                      title={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1 font-semibold text-blue-300/80 truncate">
                  <span>⌨️ Use ← / → keys or swipe card</span>
                  <span className="hidden sm:inline">• Tap video to expand</span>
                </div>
              </div>
            </div>

            {/* Left & Right Floating Navigation Arrow Buttons */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveHeroSlideIndex((prev) => (prev > 0 ? prev - 1 : HERO_PREVIEW_SLIDES.length - 1));
              }}
              title="Previous Live Call Preview (Left Arrow Key)"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-[#071728]/90 hover:bg-emerald-500 text-white hover:text-stone-950 border border-emerald-400/40 flex items-center justify-center shadow-2xl transition-all active:scale-90 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveHeroSlideIndex((prev) => (prev < HERO_PREVIEW_SLIDES.length - 1 ? prev + 1 : 0));
              }}
              title="Next Live Call Preview (Right Arrow Key)"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-[#071728]/90 hover:bg-emerald-500 text-white hover:text-stone-950 border border-emerald-400/40 flex items-center justify-center shadow-2xl transition-all active:scale-90 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Timeline Feed Live Converted Menu Showcase */}
          {liveMenu && (
            <div className="bg-[#0b1d30] border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#183a61] pb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="p-1.5 bg-emerald-500/20 border border-emerald-400/40 rounded-xl flex items-center justify-center">
                      <FileText className="w-4 h-4 text-emerald-400" />
                    </span>
                    <h3 className="font-black text-sm sm:text-base text-white tracking-wide">
                      {liveMenu.title}
                    </h3>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-300" />
                      AI Converted ({liveMenu.products.length} Products)
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-200/70 mt-1">
                    Uploaded by {liveMenu.uploadedBy} • Add all or individual items to your personal cart as you watch!
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleAddAllMenuToPersonalCart}
                    className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/30 transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <Zap className="w-3.5 h-3.5 text-stone-950 fill-stone-950" />
                    <span>Add All to My Cart ({formatCurrency(liveMenu.products.reduce((s, p) => s + p.priceUSD, 0))})</span>
                  </button>

                  <button
                    onClick={() => setShowPersonalCartDrawer(true)}
                    className="bg-[#122e4d] hover:bg-[#1a406b] text-emerald-300 border border-emerald-400/40 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                    <span>My Cart ({personalCart.reduce((s, i) => s + i.quantity, 0)})</span>
                  </button>

                  <button
                    onClick={() => setShowMenuUploadModal(true)}
                    className="bg-[#122e4d] hover:bg-[#1a406b] text-cyan-200 border border-cyan-400/30 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan-300" />
                    <span className="hidden sm:inline">Upload Menu</span>
                  </button>
                </div>
              </div>

              {/* Horizontal Scrollable Menu Products */}
              <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar py-1">
                {liveMenu.products.map((p) => (
                  <div
                    key={p.id}
                    className="w-48 bg-[#071320] rounded-2xl border border-[#183a61] p-2.5 flex-shrink-0 flex flex-col justify-between hover:border-emerald-400/60 transition-all shadow-md"
                  >
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-stone-900 mb-2">
                      <img
                        src={getProductImagePath(p.image)}
                        alt={p.name}
                        onError={(e) => handleProductImageError(e, p.name, p.category)}
                        className="w-full h-full object-cover"
                      />
                      {p.tag && (
                        <span className="absolute bottom-1 left-1 bg-stone-950/80 text-amber-300 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                          {p.tag}
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5 flex-1 min-w-0">
                      <h4 className="font-extrabold text-xs text-white truncate">{p.name}</h4>
                      <p className="text-[10px] text-stone-400 truncate">{p.unit}</p>
                      <span className="font-black text-xs text-cyan-300 block pt-0.5">
                        {formatCurrency(p.priceUSD)}
                      </span>
                    </div>

                    <div className="pt-2 space-y-1">
                      <button
                        onClick={() => handleAddProductToPersonalCart(p)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-1.5 px-2 rounded-xl text-[10px] flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ My Personal Cart</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Live Family Streams & Video Timeline ({OTHER_LIVE_STREAMS.length})</span>
            </h3>
            <span className="text-[11px] text-blue-300/60 font-bold">Scroll Down for More</span>
          </div>

          {/* Scrollable Vertical Reels / Video Timeline */}
          <div className="space-y-6">
            {OTHER_LIVE_STREAMS.map((stream) => (
              <div
                key={stream.id}
                className="bg-[#0b1f36] border border-[#18395e] rounded-3xl overflow-hidden shadow-2xl relative group"
              >
                {/* Video / Poster Header (Click to Expand to Full Screen Vertical Mobile Video) */}
                <div
                  onClick={() => {
                    const slide = HERO_PREVIEW_SLIDES.find((s) => s.id === stream.id) || {
                      id: stream.id,
                      badge: 'LIVE NOW',
                      badgeColor: 'border-red-500/40 text-red-300 bg-red-500/20',
                      title: stream.title,
                      subtitle: `${stream.host} • ${stream.location}`,
                      description: `Live grocery shopping feed from TM Pick n Pay ${stream.location}.`,
                      hostName: stream.host,
                      hostAvatar: stream.avatar,
                      location: stream.location,
                      storeName: 'Pick n Pay Live',
                      viewers: stream.viewers,
                      likes: stream.likes,
                      videoPoster: stream.videoPoster,
                      isPrimaryRoom: false,
                      productsOnSale: [
                        {
                          id: `${stream.id}-item`,
                          name: stream.featuredProduct.name,
                          priceUSD: stream.featuredProduct.priceUSD,
                          unit: 'Featured Stream Deal',
                          image: stream.featuredProduct.image,
                          category: 'PANTRY' as ProductCategory,
                          tag: '⭐ FEATURED'
                        }
                      ]
                    };
                    setExpandedPreviewSlide(slide);
                  }}
                  className="relative aspect-[4/3] sm:aspect-video w-full bg-stone-950 overflow-hidden cursor-pointer group/stream"
                >
                  <img
                    src={stream.videoPoster}
                    alt={stream.title}
                    className="w-full h-full object-cover group-hover/stream:scale-105 transition-transform duration-700 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071320] via-transparent to-black/40 pointer-events-none" />

                  {/* Hover Prompt to Full Screen */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/stream:opacity-100 transition-opacity pointer-events-none">
                    <span className="bg-black/80 backdrop-blur-md text-emerald-300 border border-emerald-400/50 px-3.5 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-2xl">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Watch Full Screen Video</span>
                    </span>
                  </div>

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      LIVE
                    </span>
                    <span className="bg-black/60 backdrop-blur-md text-cyan-200 border border-cyan-400/30 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Users className="w-3 h-3 text-cyan-400 animate-pulse" />
                      {(liveViewerCounts[stream.id] || stream.viewers).toLocaleString()} watching
                    </span>
                  </div>

                  {/* Volume Controls Overlay */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Simulation: mute/unmute logic
                      }}
                      className="text-white hover:text-emerald-400 cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className="w-12 h-1 accent-emerald-400 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div className="absolute top-3 right-16">
                    <span className="bg-emerald-500/20 backdrop-blur-md text-emerald-300 border border-emerald-400/40 text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                      ❤️ {stream.likes}
                    </span>
                  </div>

                  {/* Host Info Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={stream.avatar}
                        alt={stream.host}
                        className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-lg"
                      />
                      <div>
                        <div className="font-extrabold text-sm text-white flex items-center gap-1.5">
                          <span>{stream.host}</span>
                          <span className="bg-blue-500 text-stone-950 text-[9px] font-black px-1.5 py-0.2 rounded">VERIFIED</span>
                        </div>
                        <p className="text-[11px] text-blue-200/80">{stream.location}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (onStartLiveCall) onStartLiveCall();
                      }}
                      className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black px-4 py-2 rounded-xl text-xs shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Call</span>
                    </button>
                  </div>
                </div>

                {/* Stream Title & Featured Product Card */}
                <div className="p-4 space-y-3 bg-[#0b1f36]">
                  <h4 className="font-bold text-sm text-white">{stream.title}</h4>

                  <div className="bg-[#071320] border border-[#18395e] rounded-2xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={stream.featuredProduct.image}
                        alt={stream.featuredProduct.name}
                        className="w-12 h-12 rounded-xl object-cover border border-blue-400/20"
                      />
                      <div>
                        <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider block">FEATURED LIVE ITEM</span>
                        <h5 className="font-bold text-xs sm:text-sm text-white">{stream.featuredProduct.name}</h5>
                        <span className="font-black text-cyan-300 text-xs">{formatCurrency(stream.featuredProduct.priceUSD)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onAddToCart('prod-1', members[0]?.id || 'mem-1', `Added from ${stream.host}'s Live Stream`);
                        setCallToast(`🛒 Added ${stream.featuredProduct.name} to Family Cart!`);
                        triggerReaction('🛒');
                        setTimeout(() => setCallToast(null), 3000);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Quick Add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Full Page Vertical Mobile Live Video Shopping Experience */}
        {expandedPreviewSlide && (
          <div
            onTouchStart={handleFullTouchStart}
            onTouchMove={handleFullTouchMove}
            onTouchEnd={handleFullTouchEnd}
            onClick={() => {
              setIsVerticalMenuVisible((prev) => !prev);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              triggerReaction('❤️');
            }}
            className="fixed inset-0 z-[10000] bg-black w-full h-[100dvh] min-h-[100dvh] flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-300"
          >
            {/* Independent Floating Back Button at Top Left */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedPreviewSlide(null);
              }}
              className="fixed top-3 sm:top-4 left-3 sm:left-4 z-[1000005] bg-black/80 hover:bg-black/95 text-white p-2.5 sm:p-3 rounded-full shadow-2xl border-2 border-white/40 backdrop-blur-md flex items-center justify-center transition-all transform active:scale-90 hover:scale-110 cursor-pointer group"
              title="Back to Live Shop (Esc)"
              aria-label="Back to Live Shop"
            >
              <ArrowLeft className="w-5 h-5 text-white group-hover:-translate-x-0.5 transition-transform" />
            </button>

            {/* 1. Main Live Video filling FULL VERTICAL MOBILE SCREEN */}
            <img
              src={expandedPreviewSlide.videoPoster}
              alt={expandedPreviewSlide.title}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 pointer-events-none ${
                isExpandedVideoFrozen
                  ? 'scale-100 filter-none ring-4 ring-cyan-400/50'
                  : 'scale-105'
              }`}
            />

            {/* Gradient Overlays for High-Contrast Text & Carousel Readability */}
            <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none z-10" />
            <div className="absolute bottom-0 inset-x-0 h-96 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-10" />

            {/* Floating Reactions Rising Layer (TikTok Live Style) */}
            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
              {floatingReactions.map((r) => (
                <div
                  key={r.id}
                  className="absolute text-3xl animate-bounce transition-all duration-1000"
                  style={{
                    left: `${r.x}%`,
                    bottom: '25%',
                    animation: 'floatUp 2.2s ease-out forwards'
                  }}
                >
                  {r.emoji}
                </div>
              ))}
            </div>

            {/* Freeze Frame Banner if Video is Frozen */}
            {isExpandedVideoFrozen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-20 left-3 right-3 sm:left-6 sm:right-auto z-30 bg-cyan-950/95 border-2 border-cyan-400 text-cyan-200 px-3.5 py-1.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-between gap-2 shadow-2xl backdrop-blur-md animate-in fade-in"
              >
                <div className="flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-cyan-300 animate-spin" />
                  <span>❄️ Video Frame Frozen • Scroll products freely below</span>
                </div>
                <button
                  onClick={() => setIsExpandedVideoFrozen(false)}
                  className="bg-cyan-400 text-stone-950 px-2 py-0.5 rounded-lg text-[10px] font-black cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  Resume ▶️
                </button>
              </div>
            )}

            {/* Real-Time Host Mention Product Spotlight Banner & Flash Animation */}
            {activeMentionedProduct && (
              <div
                onClick={(e) => e.stopPropagation()}
                className={`absolute top-20 sm:top-24 inset-x-3 sm:inset-x-6 z-40 bg-gradient-to-r from-emerald-950/95 via-stone-900/95 to-blue-950/95 border-2 ${
                  isMentionFlashActive ? 'border-emerald-300 ring-8 ring-emerald-400/50 scale-105 animate-pulse' : 'border-emerald-500/70'
                } rounded-3xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl transition-all duration-500 animate-in fade-in slide-in-from-top-4 flex items-center justify-between gap-3 pointer-events-auto`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-stone-900 border-2 border-emerald-400 shrink-0 shadow-lg">
                    <img
                      src={getProductImagePath(activeMentionedProduct.image)}
                      alt={activeMentionedProduct.name}
                      className="w-full h-full object-cover animate-pulse"
                    />
                    <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase shadow">
                      🎯 TAGGED
                    </span>
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-400/40 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-300 animate-spin" />
                        Host Mentioned!
                      </span>
                      <span className="text-[10px] text-cyan-300 font-bold truncate">
                        "{hostSpokenTranscript}"
                      </span>
                    </div>

                    <h4 className="font-black text-xs sm:text-sm text-white truncate">
                      {activeMentionedProduct.name}
                    </h4>

                    <div className="flex items-center gap-2">
                      <span className="font-black text-emerald-400 text-xs sm:text-sm">
                        {formatCurrency(activeMentionedProduct.priceUSD)}
                      </span>
                      <span className="text-[10px] text-stone-400 truncate">• {activeMentionedProduct.unit}</span>
                      {/* Countdown Timer */}
                      <span className="text-[10px] font-black text-rose-300 ml-2 animate-pulse">
                        ⏳ {spotlightTimeLeft}s left
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      handleAddProductToPersonalCart({
                        id: activeMentionedProduct.id,
                        name: activeMentionedProduct.name,
                        priceUSD: activeMentionedProduct.priceUSD,
                        image: activeMentionedProduct.image,
                        unit: activeMentionedProduct.unit,
                        category: activeMentionedProduct.category || 'PANTRY'
                      } as any);
                      setCallToast(`🛒 Added ${activeMentionedProduct.name} to Personal Cart!`);
                      setTimeout(() => setCallToast(null), 3000);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black px-3.5 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/40 active:scale-95 cursor-pointer whitespace-nowrap animate-bounce"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add to Cart</span>
                  </button>

                  <button
                    onClick={() => setActiveMentionedProduct(null)}
                    className="text-stone-400 hover:text-white p-1.5 rounded-xl bg-white/5 hover:bg-white/15 cursor-pointer"
                    title="Dismiss Spotlight"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 2. Top Header Bar: Host, Viewer Count, Freeze Frame, Sound, Cart, Close */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative z-30 p-3 sm:p-5 flex items-center justify-between gap-2"
            >
              {/* Host Pill (Indented slightly to accommodate independent floating back button at top-left) */}
              <div className="ml-12 xs:ml-14 sm:ml-16 flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/20 p-1.5 pr-3 rounded-full shadow-lg min-w-0">
                <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-emerald-400 shrink-0">
                  <img
                    src={expandedPreviewSlide.hostAvatar}
                    alt={expandedPreviewSlide.hostName}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black" />
                </div>
                <div className="leading-tight min-w-0">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <span className="font-extrabold text-xs text-white truncate max-w-[90px] xs:max-w-[130px]">
                      {expandedPreviewSlide.hostName}
                    </span>
                    {isExpandedVideoFrozen ? (
                      <span className="bg-cyan-500 text-stone-950 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase shrink-0">
                        FROZEN
                      </span>
                    ) : (
                      <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase flex items-center gap-0.5 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-cyan-300/80 truncate block">
                    {expandedPreviewSlide.storeName} • {expandedPreviewSlide.location}
                  </span>
                </div>
              </div>

              {/* Top Right Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Viewer Count */}
                <div className="bg-black/60 backdrop-blur-md text-cyan-200 border border-cyan-400/30 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Users className="w-3 h-3 text-cyan-400 animate-pulse" />
                  <span>{(liveViewerCounts[expandedPreviewSlide.id] || expandedPreviewSlide.viewers).toLocaleString()}</span>
                </div>

                {/* Freeze Frame Button */}
                <button
                  onClick={() => {
                    setIsExpandedVideoFrozen((prev) => !prev);
                    setCallToast(!isExpandedVideoFrozen ? '❄️ Video Frame Frozen! Products scroll smoothly below.' : '▶️ Live Video Resumed');
                    setTimeout(() => setCallToast(null), 2500);
                  }}
                  className={`p-1.5 sm:px-2.5 sm:py-1 rounded-full border flex items-center gap-1 text-[10px] sm:text-xs font-bold transition-all active:scale-95 cursor-pointer backdrop-blur-md ${
                    isExpandedVideoFrozen
                      ? 'bg-cyan-400 text-stone-950 border-cyan-200 font-black shadow-md'
                      : 'bg-black/60 hover:bg-black/80 text-cyan-300 border-cyan-400/30'
                  }`}
                  title={isExpandedVideoFrozen ? 'Resume live video' : 'Freeze video frame'}
                >
                  <Snowflake className={`w-3.5 h-3.5 ${isExpandedVideoFrozen ? 'animate-spin' : ''}`} />
                  <span className="hidden xs:inline">{isExpandedVideoFrozen ? 'Frozen' : 'Freeze'}</span>
                </button>

                {/* Audio Mute/Unmute */}
                <button
                  onClick={() => setHeroCardMuted((prev) => !prev)}
                  className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-blue-200 border border-white/20 cursor-pointer active:scale-95 transition-all backdrop-blur-md"
                  title={heroCardMuted ? 'Unmute' : 'Mute'}
                >
                  {heroCardMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-stone-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  )}
                </button>

                {/* Close Fullscreen */}
                <button
                  onClick={() => setExpandedPreviewSlide(null)}
                  className="p-2 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 cursor-pointer transition-colors active:scale-95 backdrop-blur-md"
                  title="Close Full Screen (Esc)"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Middle Touch Area with Stream Information */}
            <div className="flex-1 relative z-20 flex flex-col justify-end p-4 pointer-events-none">
              {/* Single Click Screen Hint / Swipe Channel Hint */}
              <div className="absolute top-4 inset-x-0 flex flex-col items-center gap-1 pointer-events-none">
                <span className="bg-black/50 backdrop-blur-md text-white/90 text-[10px] font-bold px-3 py-1 rounded-full border border-white/15 flex items-center gap-1.5 shadow-md">
                  <span>💡 Single click screen to {isVerticalMenuVisible ? 'hide' : 'show'} vertical menu</span>
                  <span>•</span>
                  <span>Swipe to change channel</span>
                </span>
              </div>

              {/* Title & Host Subtitle Tag */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="max-w-md pointer-events-auto space-y-1 drop-shadow-lg mb-2"
              >
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md">
                  {expandedPreviewSlide.badge}
                </span>
                <h3 className="text-white font-black text-sm sm:text-base leading-tight">
                  {expandedPreviewSlide.title}
                </h3>
                <p className="text-blue-200/90 text-[11px] line-clamp-2">
                  {expandedPreviewSlide.description}
                </p>
              </div>
            </div>

            {/* TikTok-Style Vertical Action Menu (Appears / Disappears on Single Click on Screen) */}
            <div
              onClick={(e) => e.stopPropagation()}
              className={`fixed right-3 sm:right-5 bottom-68 sm:bottom-72 z-40 flex flex-col items-center gap-2.5 transition-all duration-300 pointer-events-auto ${
                isVerticalMenuVisible
                  ? 'opacity-100 translate-x-0 scale-100'
                  : 'opacity-0 translate-x-12 scale-95 pointer-events-none'
              }`}
            >
              {/* Like Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLikeSlide(expandedPreviewSlide.id, e);
                }}
                className="w-10 h-10 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-md text-pink-400 border border-white/20 shadow-xl flex items-center justify-center transition-transform active:scale-125 cursor-pointer group"
                title="Like Stream"
              >
                <span className="text-lg group-hover:scale-125 transition-transform">❤️</span>
              </button>

              {/* Applause Reaction */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerReaction('👏');
                }}
                className="w-10 h-10 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-md text-lg border border-white/20 shadow-xl flex items-center justify-center transition-transform active:scale-125 cursor-pointer"
                title="Cheer / Clap"
              >
                👏
              </button>

              {/* Fire Reaction */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerReaction('🔥');
                }}
                className="w-10 h-10 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-md text-lg border border-white/20 shadow-xl flex items-center justify-center transition-transform active:scale-125 cursor-pointer"
                title="Fire Reaction"
              >
                🔥
              </button>

              {/* Freeze Frame Toggle Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpandedVideoFrozen((prev) => !prev);
                  setCallToast(!isExpandedVideoFrozen ? '❄️ Video Frame Frozen! Products scroll smoothly below.' : '▶️ Live Video Resumed');
                  setTimeout(() => setCallToast(null), 2500);
                }}
                className={`w-10 h-10 rounded-full backdrop-blur-md border shadow-xl flex items-center justify-center transition-transform active:scale-110 cursor-pointer ${
                  isExpandedVideoFrozen
                    ? 'bg-cyan-400 text-stone-950 border-cyan-200'
                    : 'bg-black/75 hover:bg-black/90 text-cyan-300 border-white/20'
                }`}
                title={isExpandedVideoFrozen ? 'Resume live video' : 'Freeze video frame'}
              >
                <Snowflake className={`w-4 h-4 ${isExpandedVideoFrozen ? 'animate-spin' : ''}`} />
              </button>

              {/* Audio Mute/Unmute */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setHeroCardMuted((prev) => !prev);
                  setCallToast(heroCardMuted ? '🔊 Stream audio unmuted' : '🔇 Stream audio muted');
                  setTimeout(() => setCallToast(null), 2500);
                }}
                className="w-10 h-10 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/20 shadow-xl flex items-center justify-center transition-transform active:scale-110 cursor-pointer text-blue-200"
                title={heroCardMuted ? 'Unmute preview sound' : 'Mute preview sound'}
              >
                {heroCardMuted ? (
                  <VolumeX className="w-4 h-4 text-stone-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                )}
              </button>

              {/* Join Live Call Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedPreviewSlide(null);
                  if (onStartLiveCall) onStartLiveCall();
                }}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#941135] to-[#e02657] text-white border-2 border-[#FFB81C] shadow-xl flex items-center justify-center transition-transform active:scale-110 cursor-pointer"
                title="Start / Join Live Video Call"
              >
                <Video className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Floating Cart Button Icon on bottom-right (Placed directly ABOVE the Horizontal Carousel) */}
            {/* Always visible directly above the horizontal carousel on the right */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPersonalCartDrawer(true);
              }}
              className="fixed right-3 sm:right-5 bottom-52 sm:bottom-56 z-[1000000] bg-gradient-to-tr from-[#002D62] via-[#004b9e] to-[#0284c7] hover:from-[#001D42] hover:to-[#0284c7] text-white p-3.5 rounded-full shadow-2xl border-2 border-emerald-400 flex items-center justify-center transition-all transform active:scale-90 hover:scale-110 pointer-events-auto cursor-pointer"
              title={`View Personal Cart (${personalCart.reduce((s, i) => s + i.quantity, 0)} items)`}
              aria-label="View Shopping Cart"
            >
              {(personalCart.length > 0 || cart.length > 0) ? (
                <span className="absolute -top-1.5 -right-1.5 bg-[#D0021B] text-white text-[10px] font-black min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                  {personalCart.reduce((s, i) => s + i.quantity, 0) + cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              ) : (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-stone-900 animate-pulse" />
              )}
              <ShoppingCart className="w-5 h-5 text-white" />
            </button>

            {/* 3. FLOATING HORIZONTAL CAROUSEL OF MENU PRODUCTS AT BOTTOM */}
            <div className="relative z-30 w-full px-2.5 sm:px-4 pb-3 sm:pb-5 space-y-2 pointer-events-auto">
              {/* Carousel Header Bar */}
              <div className="bg-[#071626]/90 backdrop-blur-xl border border-emerald-500/40 px-3 py-2 rounded-2xl flex items-center justify-between gap-2 shadow-2xl">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="p-1 bg-amber-500/20 text-amber-300 rounded-lg">
                    <Flame className="w-3.5 h-3.5" />
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-black text-xs text-white truncate">
                      Products on Sale in Video ({expandedPreviewSlide.productsOnSale.length} Items)
                    </h4>
                    <span className="text-[9px] text-cyan-200/70 block truncate">
                      Swipe horizontally to browse items on sale in this live stream
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAddAllSlideProductsToPersonalCart(expandedPreviewSlide)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black px-2.5 py-1 rounded-xl text-[10px] flex items-center gap-1 shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <Zap className="w-3 h-3 fill-stone-950" />
                    <span>Add All to Cart</span>
                  </button>

                  <button
                    onClick={() => {
                      setExpandedPreviewSlide(null);
                      if (onStartLiveCall) onStartLiveCall();
                    }}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold px-2.5 py-1 rounded-xl text-[10px] flex items-center gap-1 active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <Video className="w-3 h-3" />
                    <span>Join Call</span>
                  </button>
                </div>
              </div>

              {/* Horizontal Scrollable Products Carousel */}
              <div className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5">
                {expandedPreviewSlide.productsOnSale.map((item) => (
                  <div
                    key={item.id}
                    className="w-48 xs:w-52 bg-[#061424]/92 backdrop-blur-xl border border-emerald-400/40 hover:border-emerald-300 rounded-2xl p-2.5 shadow-2xl flex-shrink-0 flex flex-col justify-between transition-all hover:scale-[1.02] group/item"
                  >
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-stone-900 mb-1.5 border border-white/10">
                      <img
                        src={getProductImagePath(item.image)}
                        alt={item.name}
                        onError={(e) => handleProductImageError(e, item.name, item.category)}
                        className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-1 left-1 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase shadow">
                        {item.discount}
                      </span>
                      {item.tag && (
                        <span className="absolute bottom-1 right-1 bg-stone-950/85 text-amber-300 text-[7px] font-black px-1 py-0.5 rounded uppercase">
                          {item.tag}
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5 flex-1 min-w-0">
                      <h5 className="font-extrabold text-[11px] text-white truncate group-hover/item:text-emerald-300 transition-colors">
                        {item.name}
                      </h5>
                      <p className="text-[9px] text-blue-200/70 truncate">{item.unit}</p>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="font-black text-xs text-cyan-300">
                          {formatCurrency(item.priceUSD)}
                        </span>
                        {item.originalPriceUSD && (
                          <span className="text-[10px] text-stone-400 line-through">
                            {formatCurrency(item.originalPriceUSD)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Cart Actions */}
                    <div className="pt-2 grid grid-cols-2 gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddProductToPersonalCart(item as any, `Added from ${expandedPreviewSlide.hostName} Live Video`);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-1 px-1 rounded-xl text-[10px] flex items-center justify-center gap-0.5 shadow-sm active:scale-95 cursor-pointer"
                        title="Add to My Personal Cart"
                      >
                        <Plus className="w-3 h-3" />
                        <span>My Cart</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(item.id, members[0]?.id || 'mem-1', `Added from live stream sale`);
                          setCallToast(`🛒 Added ${item.name} to Shared Family Cart!`);
                          triggerReaction('🛒');
                          setTimeout(() => setCallToast(null), 3000);
                        }}
                        className="bg-[#153457] hover:bg-[#1d4879] text-cyan-200 border border-cyan-400/20 font-bold py-1 px-1 rounded-xl text-[10px] flex items-center justify-center gap-0.5 active:scale-95 cursor-pointer"
                        title="Add to Shared Family Cart"
                      >
                        <span>+ Family</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#071320] text-white flex flex-col font-sans select-none overflow-x-hidden">
      {/* 1. TOP DEDICATED HEADER BAR */}
      <header className="bg-[#0b1f36] border-b border-[#18395e] px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-1.5 sm:gap-2 sticky top-0 z-50 shadow-xl overflow-x-hidden">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={() => {
              if (onLeaveCall) onLeaveCall();
              else if (onEndCall) onEndCall();
            }}
            className="flex items-center gap-1 text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
            title="Back to Catalog"
            aria-label="Back to Catalog"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span className="hidden xs:inline">Back</span>
          </button>

          <div className="p-1 sm:p-2 bg-emerald-500/20 border border-emerald-400/40 rounded-xl flex items-center gap-1 shrink-0">
            <Video className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 animate-pulse" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden">
              <h1 className="font-black text-xs sm:text-base text-white tracking-wide whitespace-nowrap truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
                PnP Live Shopping Call
              </h1>
              <span className="bg-emerald-500/20 text-emerald-300 text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2.5 py-0.5 rounded-full border border-emerald-400/40 uppercase tracking-wider flex items-center gap-1 shrink-0 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {formatCallTime(callTimer)}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-blue-200/80 hidden md:block">
              {callParticipants.length} Family Members Connected • Real-Time Cart Sync
            </p>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* View Mode Toggle: Side-by-Side Split, Maximize Cart, Maximize Video */}
          <div className="hidden lg:flex bg-[#122e4d] p-1 rounded-xl border border-blue-400/20 text-xs gap-1">
            <button
              onClick={() => setViewLayoutMode('split')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                viewLayoutMode === 'split'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-blue-200 hover:text-white'
              }`}
              title="Side-by-Side Split View (Cart Left, Video Right)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side View</span>
            </button>

            <button
              onClick={() => setViewLayoutMode('max-cart')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                viewLayoutMode === 'max-cart'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-blue-200 hover:text-white'
              }`}
              title="Maximize Cart View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Cart</span>
            </button>

            <button
              onClick={() => setViewLayoutMode('max-video')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                viewLayoutMode === 'max-video'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-blue-200 hover:text-white'
              }`}
              title="Maximize Video Call Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Full Video</span>
            </button>
          </div>

          {/* Upload Menu (AI Digitizer) Button */}
          <button
            onClick={() => setShowMenuUploadModal(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 font-black p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/30 transition-transform active:scale-95 shrink-0 cursor-pointer"
            title="Upload store menu flyer (Gemini AI converts to products)"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-950" />
            <span className="hidden sm:inline">Upload Menu</span>
          </button>

          {/* Personal Cart Drawer Trigger */}
          <button
            onClick={() => setShowPersonalCartDrawer(true)}
            className="relative bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-400/50 font-black p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-transform active:scale-95 shrink-0 cursor-pointer"
            title="Open My Personal Cart"
          >
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            <span className="hidden sm:inline">My Personal Cart</span>
            {personalCart.length > 0 && (
              <span className="bg-emerald-400 text-stone-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {personalCart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>

          {/* Host Mention Detection Toggle */}
          <button
            onClick={() => setIsHostMicListening(!isHostMicListening)}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
              isHostMicListening 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse' 
                : 'bg-stone-800/80 hover:bg-stone-700 text-stone-300 border-stone-700'
            }`}
            title={isHostMicListening ? 'Stop Auto-Detecting Spoken Products' : 'Listen for Mentioned Products (Auto-flash on screen)'}
          >
            <Flame className={`w-3.5 h-3.5 ${isHostMicListening ? 'text-rose-400 animate-bounce' : 'text-stone-400'}`} />
            <span className="hidden xl:inline">{isHostMicListening ? 'Listening Mentions' : 'Mention Detect'}</span>
          </button>

          {/* Browse Catalog Button */}
          {onOpenCatalog && (
            <button
              onClick={onOpenCatalog}
              className="bg-[#133863] hover:bg-[#1a4a82] text-cyan-200 border border-cyan-400/30 font-bold p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-md transition-transform active:scale-95 shrink-0"
              title="Browse TM Pick n Pay Catalog & Stores"
            >
              <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ffb81c]" />
              <span className="hidden md:inline">Browse Catalog</span>
            </button>
          )}

          {/* + Invite Member Button */}
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-black p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-md transition-transform active:scale-95 shrink-0"
            title="Add user to call"
          >
            <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">+ Invite User</span>
          </button>

          {/* LEAVE CALL BUTTON: User exits call while others carry on */}
          <button
            onClick={handleLeaveCall}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-extrabold px-2 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[10px] sm:text-xs flex items-center gap-1 shadow-md transition-all active:scale-95 shrink-0 whitespace-nowrap"
            title="Leave the video call while other family members carry on"
          >
            <LogOut className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xs:inline">Leave Call</span>
          </button>

          {/* END CALL FOR ALL BUTTON: Terminates call session for everyone */}
          <button
            onClick={handleEndCallAll}
            className="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black px-2 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs flex items-center gap-1 shadow-lg shadow-red-600/30 transition-transform active:scale-95 shrink-0 whitespace-nowrap"
            title="End Video Call for all family members"
          >
            <PhoneOff className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">End Call for All</span>
            <span className="sm:hidden">End All</span>
          </button>
        </div>
      </header>

      {/* Floating Call Toast Banner */}
      {callToast && (
        <div className="bg-gradient-to-r from-cyan-950 via-[#0d3152] to-emerald-950 border-b border-cyan-500/30 px-4 py-2 text-xs font-bold text-cyan-200 flex items-center justify-between shadow-md">
          <span className="truncate pr-2">{callToast}</span>
          <button onClick={() => setCallToast(null)} className="text-cyan-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. MAIN CONTENT AREA: SIDE-BY-SIDE SPLIT GRID (Cart on Left, TikTok Video Grid on Right) */}
      <div className="flex-1 p-2 sm:p-5 grid grid-cols-12 gap-2 sm:gap-4 items-start max-w-7xl mx-auto w-full">
        {/* ========================================================= */}
        {/* LEFT SIDE: FAMILY CART & CHECKOUT ENGINE */}
        {/* ========================================================= */}
        <div
          className={`space-y-3 transition-all duration-300 col-span-6 ${
            viewLayoutMode === 'max-cart'
              ? 'col-span-8 lg:col-span-8'
              : viewLayoutMode === 'max-video'
              ? 'col-span-4 lg:col-span-4'
              : 'col-span-6 lg:col-span-6'
          }`}
        >
          {/* Cart Header Panel with Mode Switcher */}
          <div className="bg-[#0b1d30] rounded-2xl p-3 sm:p-4 border border-[#16385d] shadow-lg space-y-3">
            {/* Cart Switcher Tabs: Shared Family vs My Personal Cart */}
            <div className="flex bg-[#071320] p-1 rounded-2xl border border-[#183a61] text-xs">
              <button
                onClick={() => setActiveCartViewMode('family')}
                className={`flex-1 py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeCartViewMode === 'family'
                    ? 'bg-[#133863] text-white shadow-md'
                    : 'text-blue-300 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Shared Family Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
              </button>

              <button
                onClick={() => setActiveCartViewMode('personal')}
                className={`flex-1 py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeCartViewMode === 'personal'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-emerald-400 hover:text-white'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>My Personal Cart ({personalCart.reduce((s, i) => s + i.quantity, 0)})</span>
              </button>
            </div>

            {/* Sub-header info & actions */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-sm text-white">
                  {activeCartViewMode === 'personal' ? 'My Individual Shopping Basket' : 'Shared Moyo Family Basket'}
                </h3>
                <p className="text-[11px] text-blue-200/70">
                  {activeCartViewMode === 'personal'
                    ? 'Your private items — add from converted menu or video spotlight'
                    : 'Collaborative real-time basket synced with call participants'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {activeCartViewMode === 'personal' ? (
                  <>
                    <button
                      onClick={handleAddAllMenuToPersonalCart}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                      title="Add all menu items to personal cart"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span className="hidden sm:inline">Add All Menu</span>
                      <span className="sm:hidden">Add All</span>
                    </button>

                    {personalCart.length > 0 && onClearPersonalCart && (
                      <button
                        onClick={onClearPersonalCart}
                        className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/40"
                        title="Clear Personal Cart"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setSelectedMemberForAdd(members[0]);
                        setShowQuickAddModal(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Quick Add</span>
                    </button>

                    {cart.length > 0 && (
                      <button
                        onClick={onClearCart}
                        className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/40 cursor-pointer"
                        title="Clear Cart"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Cart Items List: Render Personal Cart or Family Cart */}
          {activeCartViewMode === 'personal' ? (
            /* ================= PERSONAL CART ITEMS ================= */
            personalCart.length === 0 ? (
              <div className="bg-[#091728] rounded-2xl border border-dashed border-emerald-500/30 p-8 text-center space-y-3">
                <ShoppingCart className="w-12 h-12 text-emerald-400/40 mx-auto" />
                <h3 className="font-bold text-white text-sm">Your Personal Cart is currently empty</h3>
                <p className="text-xs text-blue-200/60 max-w-xs mx-auto">
                  Click "+ My Personal Cart" on any product from the Live Converted Menu below or tap "Add All Menu to Personal Cart"!
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  <button
                    onClick={handleAddAllMenuToPersonalCart}
                    className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black px-4 py-2 rounded-xl text-xs shadow-md transition-all active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-stone-950 fill-stone-950" />
                    <span>Add All Menu Items to My Cart</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-emerald-700 scrollbar-track-transparent">
                {personalCart.map((item) => {
                  const itemTotalUSD = item.product.priceUSD * item.quantity;

                  return (
                    <div
                      key={item.id}
                      className="bg-[#0b1d30] rounded-2xl p-2 sm:p-3.5 border border-[#183a61] shadow-md flex flex-col xl:flex-row items-start xl:items-center justify-between gap-2 hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <img
                          src={getProductImagePath(item.product.image)}
                          alt={item.product.name}
                          onError={(e) => handleProductImageError(e, item.product.name, item.product.category)}
                          className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl object-cover border border-emerald-400/20 bg-stone-900 flex-shrink-0"
                        />
                        <div>
                          <h4 className="font-bold text-white text-xs sm:text-sm leading-tight">
                            {item.product.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-blue-200/80 mt-0.5">
                            <span>{item.product.unit}</span>
                            <span>•</span>
                            <span className="font-semibold text-emerald-300">
                              {formatCurrency(item.product.priceUSD)} each
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-400 italic mt-0.5 block">
                            {item.note || 'Personal Selection'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-[#071320] rounded-xl p-0.5 border border-[#183a61]">
                          <button
                            onClick={() => {
                              if (onUpdatePersonalQuantity) {
                                onUpdatePersonalQuantity(item.id, item.quantity - 1);
                              }
                            }}
                            className="p-1 hover:bg-[#122e4d] rounded-lg text-white transition-colors active:scale-95 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 font-black text-xs text-emerald-400">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => {
                              if (onUpdatePersonalQuantity) {
                                onUpdatePersonalQuantity(item.id, item.quantity + 1);
                              }
                            }}
                            className="p-1 hover:bg-[#122e4d] rounded-lg text-white transition-colors active:scale-95 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right min-w-[65px]">
                          <span className="text-[9px] text-blue-300/60 block uppercase font-bold">Subtotal</span>
                          <span className="font-black text-xs sm:text-sm text-emerald-300">
                            {formatCurrency(itemTotalUSD)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Personal Cart Summary Footer */}
                <div className="bg-[#091828] border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Personal Total</span>
                    <span className="font-black text-base text-emerald-300">
                      {formatCurrency(personalCart.reduce((s, i) => s + i.product.priceUSD * i.quantity, 0))}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowPersonalCartDrawer(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 active:scale-95 cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Personal Checkout</span>
                  </button>
                </div>
              </div>
            )
          ) : (
            /* ================= SHARED FAMILY CART ITEMS ================= */
            cart.length === 0 ? (
              <div className="bg-[#091728] rounded-2xl border border-dashed border-blue-500/30 p-8 text-center space-y-3">
                <ShoppingBag className="w-12 h-12 text-blue-400/40 mx-auto" />
                <h3 className="font-bold text-white text-sm">Family Cart is currently empty</h3>
                <p className="text-xs text-blue-200/60 max-w-xs mx-auto">
                  Use the Quick Add button above or select items from the Converted Menu to share with the family!
                </p>
                <button
                  onClick={() => {
                    if (SAMPLE_PRODUCTS.length > 0) {
                      handleQuickAddItem(SAMPLE_PRODUCTS[0], members[0]);
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md transition-all active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add 10kg Roller Meal (£5.78)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-cyan-700 scrollbar-track-transparent">
                {cart.map((item) => {
                  const itemTotalUSD = item.product.priceUSD * item.quantity;

                  return (
                    <div
                      key={item.id}
                      className="bg-[#0b1d30] rounded-2xl p-2 sm:p-3.5 border border-[#183a61] shadow-md flex flex-col xl:flex-row items-start xl:items-center justify-between gap-2 hover:border-cyan-500/40 transition-colors"
                    >
                      {/* Item Image & Description */}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <img
                          src={getProductImagePath(item.product.image)}
                          alt={item.product.name}
                          onError={(e) => handleProductImageError(e, item.product.name, item.product.category)}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl object-cover border border-blue-400/20 bg-stone-900 flex-shrink-0"
                        />
                        <div>
                          <h4 className="font-bold text-white text-xs sm:text-sm leading-tight">
                            {item.product.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-blue-200/80 mt-0.5">
                            <span>{item.product.unit}</span>
                            <span>•</span>
                            <span className="font-semibold text-amber-300">
                              {formatCurrency(item.product.priceUSD)} each
                            </span>
                          </div>

                          {/* Member Attribution Badge */}
                          <div className="mt-1 flex items-center gap-1">
                            <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <MessageSquare className="w-2.5 h-2.5 text-emerald-400" />
                              <span>Added by {item.addedByMemberName}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controls & Subtotal */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-[#071320] rounded-xl p-0.5 border border-[#183a61]">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-[#122e4d] rounded-lg text-white transition-colors active:scale-95 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 font-black text-xs text-amber-400">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-[#122e4d] rounded-lg text-white transition-colors active:scale-95 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right min-w-[65px]">
                          <span className="text-[9px] text-blue-300/60 block uppercase font-bold">Subtotal</span>
                          <span className="font-black text-xs sm:text-sm text-cyan-300">
                            {formatCurrency(itemTotalUSD)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* ========================================================= */}
        {/* RIGHT SIDE: LIVE TIKTOK / INSTAGRAM VIDEO PARTICIPANTS GRID */}
        {/* ========================================================= */}
        <div
          className={`space-y-3 transition-all duration-300 col-span-6 ${
            viewLayoutMode === 'max-video'
              ? 'col-span-8 lg:col-span-8'
              : viewLayoutMode === 'max-cart'
              ? 'col-span-4 lg:col-span-4'
              : 'col-span-6 lg:col-span-6'
          }`}
        >
          {/* Live Video Canvas Container */}
          <div className="bg-[#030a12] border-2 border-cyan-500/40 rounded-2xl sm:rounded-3xl p-2 sm:p-4 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[300px] sm:min-h-[380px]">
            {/* Ambient Lighting background glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Freeze Frame Banner Alert */}
            {isLiveCallVideoFrozen && (
              <div className="relative z-30 bg-cyan-950/95 border-2 border-cyan-400 text-cyan-200 p-2 rounded-2xl shadow-2xl flex items-center justify-between gap-2 mb-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-cyan-300 animate-spin" />
                  <div>
                    <span className="font-black text-xs block text-white">❄️ VIDEO STREAM FRAME FROZEN</span>
                    <span className="text-[10px] text-cyan-300">Video feeds are pinned & held stationary while you scroll products</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsLiveCallVideoFrozen(false)}
                  className="bg-cyan-400 text-stone-950 px-2.5 py-1 rounded-xl text-[10px] font-black cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  Resume Live ▶️
                </button>
              </div>
            )}

            {/* Floating Reactions Layer */}
            <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
              {floatingReactions.map((r) => (
                <div
                  key={r.id}
                  className="absolute text-3xl animate-bounce transition-all duration-1000"
                  style={{
                    left: `${r.x}%`,
                    bottom: '20%',
                    animation: 'floatUp 2.2s ease-out forwards'
                  }}
                >
                  {r.emoji}
                </div>
              ))}
            </div>

            {/* Real-time Host Mention Spotlight Banner on Video */}
            {spotlightBanner && (
              <div className="relative z-30 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-stone-950 p-2 sm:p-2.5 rounded-2xl shadow-2xl flex items-center justify-between gap-2 border-2 border-white/80 animate-bounce mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-stone-900 border border-white/40 shrink-0">
                    <img
                      src={getProductImagePath(spotlightBanner.image || '/images/fruit and vegetable box 10kg.jpg')}
                      alt={spotlightBanner.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 text-stone-950 font-black text-[9px] uppercase tracking-wider">
                      <Flame className="w-3 h-3 text-stone-950 animate-pulse" />
                      <span>Host Mentioned Just Now!</span>
                    </div>
                    <h5 className="font-black text-xs text-stone-950 truncate leading-tight">
                      {spotlightBanner.productName}
                    </h5>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      const prod = liveMenu?.products.find((p) => p.id === spotlightBanner.productId);
                      if (prod) {
                        handleAddProductToPersonalCart(prod);
                      } else {
                        handleAddProductToPersonalCart({
                          id: spotlightBanner.productId,
                          name: spotlightBanner.productName,
                          priceUSD: spotlightBanner.priceUSD || 3.50,
                          image: spotlightBanner.image || '/images/fruit and vegetable box 10kg.jpg'
                        } as any);
                      }
                    }}
                    className="bg-stone-950 hover:bg-stone-900 text-emerald-400 font-black px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs shadow-md flex items-center gap-1 active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to My Cart {spotlightBanner.priceUSD ? `(${formatCurrency(spotlightBanner.priceUSD)})` : ''}</span>
                  </button>
                  <button
                    onClick={() => setSpotlightBanner(null)}
                    className="p-1 text-stone-900 hover:text-stone-950 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 2x3 TikTok Style Video Participants Tile Grid */}
            <div className="relative z-10 grid grid-cols-2 gap-2 sm:gap-3 flex-1 my-1">
              {callParticipants.slice(0, 6).map((participant) => {
                const isSpeaking = activeSpeakerId === participant.id;
                const showSpeakingBadge = speakingBadgeMap[participant.id];
                const isSelf = participant.id === 'mem-1';
                const isAudioOnly = participant.mode === 'audio-only';

                return (
                  <div key={participant.id} className="flex flex-col items-center min-w-0 w-full">
                    <div
                      onClick={() => {
                        const foundMember = members.find((x) => x.id === participant.id);
                        setSelectedMemberForAdd(foundMember || members[0]);
                        setShowQuickAddModal(true);
                      }}
                      className={`relative aspect-square w-full rounded-2xl overflow-hidden bg-stone-900 border-2 transition-all cursor-pointer group shadow-lg ${
                        isSpeaking
                          ? 'border-emerald-400 shadow-emerald-500/30 ring-2 ring-emerald-400/40 animate-pulse'
                          : 'border-cyan-500/30 hover:border-cyan-400'
                      }`}
                      title={`Click tile to add product for ${participant.name}`}
                    >
                      {/* Badge Overlay */}
                      {(participant.name.includes('Gogo') || participant.name.includes('Tinashe')) && (
                        <div className="absolute top-1.5 left-1.5 z-20 bg-gradient-to-br from-amber-400 to-orange-500 text-stone-950 text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-md animate-pulse">
                          {participant.name.includes('Gogo') ? '⭐ Top Fan' : '🛍️ Expert'}
                        </div>
                      )}

                      {/* Real Local Camera Feed for initiating user */}
                      {isSelf && !isCameraOff && hasCameraPermission ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : isAudioOnly ? (
                        /* Audio-Only Mode Screen */
                        <div className="absolute inset-0 bg-gradient-to-b from-[#0e2a47] via-[#091b2e] to-[#040f1a] flex flex-col items-center justify-center p-1 text-center">
                          <img
                            src={participant.avatar}
                            alt={participant.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-md"
                          />
                          <div className="flex items-center gap-1 mt-1">
                            <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1 h-5 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      ) : isSelf && isCameraOff ? (
                        <div className="absolute inset-0 bg-stone-950 flex flex-col items-center justify-center text-stone-500 space-y-1">
                          <Camera className="w-7 h-7 text-stone-600" />
                          <span className="text-[9px] font-bold">Camera Off</span>
                        </div>
                      ) : (
                        /* Remote Video Tile */
                        <img
                          src={participant.avatar}
                          alt={participant.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}

                      {/* Briefly show Speaking overlay badge for 3 seconds when speaking starts */}
                      {showSpeakingBadge && (
                        <div className="absolute top-1.5 left-1.5 z-20 bg-emerald-600/90 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-md uppercase tracking-wider animate-in fade-in duration-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          Speaking
                        </div>
                      )}

                      {/* Subtle Quick Add Button on Tile Bottom Right */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const member = members.find((m) => m.id === participant.id) || members[0];
                          setSelectedMemberForAdd(member);
                          setShowQuickAddModal(true);
                        }}
                        className="absolute bottom-1.5 right-1.5 z-20 bg-emerald-500 hover:bg-emerald-400 text-stone-950 p-1 rounded-full shadow-md transition-transform group-hover:scale-110 active:scale-95 flex items-center justify-center"
                        title={`Add item for ${participant.name}`}
                      >
                        <Plus className="w-3 h-3 font-black" />
                      </button>
                    </div>

                    {/* Participant Name placed BELOW the square video box */}
                    <span className="font-extrabold text-[10px] sm:text-xs text-stone-200 block text-center mt-1 truncate max-w-full tracking-tight">
                      {participant.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Interactive Toolbar Controls */}
            <div className="relative z-20 bg-[#0a1c2e]/95 border border-cyan-500/30 rounded-2xl p-1.5 sm:p-2.5 mt-2 flex items-center justify-between gap-1 sm:gap-2 backdrop-blur-md overflow-hidden">
              {/* Mic & Camera Toggles */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setIsMicMuted(!isMicMuted)}
                  className={`p-1.5 sm:p-2 rounded-xl transition-all active:scale-90 ${
                    isMicMuted
                      ? 'bg-rose-600 text-white'
                      : 'bg-stone-800 hover:bg-stone-700 text-emerald-400'
                  }`}
                  title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isMicMuted ? <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>

                <button
                  onClick={() => setIsCameraOff(!isCameraOff)}
                  className={`p-1.5 sm:p-2 rounded-xl transition-all active:scale-90 ${
                    isCameraOff
                      ? 'bg-rose-600 text-white'
                      : 'bg-stone-800 hover:bg-stone-700 text-emerald-400'
                  }`}
                  title={isCameraOff ? 'Turn On Camera' : 'Turn Off Camera'}
                >
                  {isCameraOff ? <VideoOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>

                {/* Freeze Frame Video Button */}
                <button
                  onClick={() => {
                    setIsLiveCallVideoFrozen(!isLiveCallVideoFrozen);
                    setCallToast(!isLiveCallVideoFrozen ? '❄️ Video Frame Frozen: Video pinned while scrolling menu' : '▶️ Live Video Streams Resumed');
                    setTimeout(() => setCallToast(null), 2500);
                  }}
                  className={`p-1.5 sm:px-2.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-90 ${
                    isLiveCallVideoFrozen
                      ? 'bg-cyan-500 text-stone-950 font-black ring-2 ring-cyan-200'
                      : 'bg-stone-800 hover:bg-stone-700 text-cyan-300'
                  }`}
                  title={isLiveCallVideoFrozen ? 'Resume live video streaming' : 'Freeze video frame while scrolling menu products'}
                >
                  <Snowflake className={`w-3.5 h-3.5 ${isLiveCallVideoFrozen ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline">{isLiveCallVideoFrozen ? 'Frozen ❄️' : 'Freeze'}</span>
                </button>

                {/* Launch Poll Button */}
                <button
                  onClick={() => setShowPollModal(true)}
                  className="p-1.5 sm:px-2.5 sm:py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1 transition-all active:scale-90"
                  title="Launch Live Poll"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Poll</span>
                </button>
              </div>

              {/* Floating Emoji Reaction Triggers */}
              <div className="hidden sm:flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
                {['🛒', '❤️', '🎉', '🔥', '👏'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => triggerReaction(emoji)}
                    className="p-1 bg-stone-800/80 hover:bg-cyan-900 rounded-lg text-xs sm:text-sm transition-transform active:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Quick Actions: Add Item, Leave Call, End Call for All */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    setSelectedMemberForAdd(members[0]);
                    setShowQuickAddModal(true);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-[10px] sm:text-xs flex items-center justify-center gap-1 shadow-md transition-all active:scale-95 shrink-0"
                  title="Add Item"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Add Item</span>
                </button>

                <button
                  onClick={handleLeaveCall}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-[10px] sm:text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shrink-0 whitespace-nowrap"
                  title="Leave call (others carry on)"
                >
                  <LogOut className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xs:inline">Leave</span>
                </button>

                <button
                  onClick={handleEndCallAll}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-[10px] sm:text-xs flex items-center justify-center gap-1 shadow-md transition-all active:scale-95 shrink-0 whitespace-nowrap"
                  title="End call for everyone"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">End All</span>
                </button>
              </div>
            </div>
          </div>

          {/* Host Speech Simulator & Mention Trigger Strip */}
          <div className="bg-[#0b1d30] border border-[#183a61] rounded-2xl p-2.5 space-y-2 shadow-lg">
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <div className="flex items-center gap-1.5 text-amber-300 font-black uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Host Speech Mention Simulator</span>
              </div>
              <span className="text-[10px] text-blue-200/70 hidden sm:inline">Tap product to flash & bring to forefront:</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {liveMenu?.products.map((p) => {
                const isSelected = flashingProductId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => triggerMention(p.id, p.name, `Host is showcasing ${p.name} live!`)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 active:scale-95 ${
                      isSelected
                        ? 'bg-amber-400 text-stone-950 border-amber-300 font-black ring-2 ring-amber-300 animate-pulse'
                        : 'bg-[#071320] hover:bg-[#122e4d] text-cyan-200 border-[#183a61]'
                    }`}
                    title={`Simulate host saying "${p.name}"`}
                  >
                    <span>🗣️ {p.name.split(' ').slice(0, 2).join(' ')}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LIVE PRODUCT SUGGESTIONS CARD (Dynamic positioning directly below video frame) */}
          {LIVE_SUGGESTIONS.length > 0 && (
            <div className="bg-[#0b1d30] border border-[#183a61] rounded-2xl p-2.5 sm:p-3.5 space-y-2.5 shadow-xl relative overflow-hidden transition-all duration-300">
              {/* Top Header */}
              <div className="flex flex-col gap-1.5 border-b border-[#183a61]/60 pb-2">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                    <h3 className="font-extrabold text-xs text-white tracking-wide truncate">
                      Suggestion
                    </h3>
                  </div>

                  <button
                    onClick={() => setShowQuickAddModal(true)}
                    className="text-[10px] text-cyan-300 hover:text-white font-bold underline shrink-0 whitespace-nowrap"
                  >
                    Expand Details
                  </button>
                </div>

                {/* Badges Row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="bg-amber-500/20 text-amber-300 text-[8px] font-black px-1.5 py-0.5 rounded-md border border-amber-400/30 uppercase tracking-wider whitespace-nowrap">
                    {LIVE_SUGGESTIONS[suggestionIndex].tag}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[8px] font-black px-1.5 py-0.5 rounded-md border border-emerald-400/30 whitespace-nowrap">
                    {LIVE_SUGGESTIONS[suggestionIndex].discount}
                  </span>
                </div>
              </div>

              {/* Suggestion Body: Product Image, Details & Quick Action */}
              <div className="bg-[#071320] rounded-xl p-2 sm:p-2.5 border border-[#183a61] flex items-center gap-2 sm:gap-2.5 min-w-0">
                <img
                  src={getProductImagePath(LIVE_SUGGESTIONS[suggestionIndex].image)}
                  alt={LIVE_SUGGESTIONS[suggestionIndex].name}
                  onError={(e) => handleProductImageError(e, LIVE_SUGGESTIONS[suggestionIndex].name, LIVE_SUGGESTIONS[suggestionIndex].category)}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover bg-stone-900 border border-cyan-500/30 shrink-0"
                />

                <div className="flex-1 min-w-0 space-y-0.5">
                  <h4 className="font-extrabold text-xs text-white truncate leading-tight">
                    {LIVE_SUGGESTIONS[suggestionIndex].name}
                  </h4>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-black text-xs sm:text-sm text-cyan-300 whitespace-nowrap">
                      {formatCurrency(LIVE_SUGGESTIONS[suggestionIndex].priceUSD)}
                    </span>
                    <span className="text-[10px] text-stone-400 line-through whitespace-nowrap">
                      {formatCurrency(LIVE_SUGGESTIONS[suggestionIndex].originalPriceUSD)}
                    </span>
                  </div>
                  <p className="text-[9px] text-blue-200/70 truncate">
                    {LIVE_SUGGESTIONS[suggestionIndex].deliveryInfo}
                  </p>
                </div>
              </div>

              {/* Bottom Control Actions (Skip, Pagination, Add) */}
              <div className="flex items-center justify-between gap-1.5 pt-0.5 min-w-0">
                <button
                  onClick={() =>
                    setSuggestionIndex((prev) => (prev + 1) % LIVE_SUGGESTIONS.length)
                  }
                  className="bg-[#071320] hover:bg-[#122e4d] text-stone-300 border border-[#183a61] px-2 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95 shrink-0 whitespace-nowrap"
                >
                  ↑ Skip
                </button>

                <div className="flex items-center gap-1 bg-[#071320] px-1.5 py-0.5 rounded-lg border border-[#183a61] text-[9px] font-mono text-cyan-300 shrink-0">
                  <button
                    onClick={() =>
                      setSuggestionIndex((prev) =>
                        prev === 0 ? LIVE_SUGGESTIONS.length - 1 : prev - 1
                      )
                    }
                    className="hover:text-white px-0.5"
                  >
                    ‹
                  </button>
                  <span className="whitespace-nowrap">
                    {suggestionIndex + 1}/{LIVE_SUGGESTIONS.length}
                  </span>
                  <button
                    onClick={() =>
                      setSuggestionIndex((prev) => (prev + 1) % LIVE_SUGGESTIONS.length)
                    }
                    className="hover:text-white px-0.5"
                  >
                    ›
                  </button>
                </div>

                <button
                  onClick={() => {
                    const sug = LIVE_SUGGESTIONS[suggestionIndex];
                    const prodToInsert: Product = {
                      id: sug.id,
                      name: sug.name,
                      brand: 'Standard',
                      category: sug.category as ProductCategory,
                      storeId: 'TM_PNP',
                      storeName: 'TM Pick n Pay',
                      priceUSD: sug.priceUSD,
                      priceZAR: sug.priceUSD * 24,
                      priceZWG: sug.priceUSD * 32,
                      unit: sug.unit,
                      image: sug.image,
                      fulfillmentTag: 'Harare Express',
                      inStock: true
                    };
                    handleQuickAddItem(prodToInsert, selectedMemberForAdd || members[0]);
                    setSuggestionIndex((prev) => (prev + 1) % LIVE_SUGGESTIONS.length);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black px-2.5 py-1 rounded-lg text-[10px] sm:text-xs flex items-center justify-center gap-1 shadow-md transition-all active:scale-95 shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-3 h-3 text-stone-950 shrink-0" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* FULL WIDTH: LIVE CONVERTED STORE MENU TO CART SHELF */}
        {/* ========================================================= */}
        {liveMenu && (
          <div className="col-span-12 bg-[#0b1d30] rounded-2xl sm:rounded-3xl border-2 border-emerald-500/40 p-3.5 sm:p-5 space-y-4 shadow-2xl relative overflow-hidden">
            {/* Ambient emerald backlight */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header row: Menu Info, Converted Items, and Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#183a61] pb-3 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="p-1.5 bg-emerald-500/20 border border-emerald-400/40 rounded-xl flex items-center justify-center">
                    <FileText className="w-4 h-4 text-emerald-400" />
                  </span>
                  <h3 className="font-black text-sm sm:text-base text-white tracking-wide">
                    {liveMenu.title}
                  </h3>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-300" />
                    AI Converted ({liveMenu.products.length} Products)
                  </span>
                </div>
                <p className="text-[11px] text-blue-200/70">
                  Uploaded by {liveMenu.uploadedBy} • Tap "+ My Personal Cart" or "Add All" to shop during the live stream!
                </p>
              </div>

              {/* Action Buttons: Add All to Personal Cart & Upload New Menu */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleAddAllMenuToPersonalCart}
                  className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-black px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
                  title="Add all menu items into your personal basket"
                >
                  <Zap className="w-4 h-4 text-stone-950 fill-stone-950" />
                  <span>
                    Add All to Personal Cart ({formatCurrency(liveMenu.products.reduce((s, p) => s + p.priceUSD, 0))})
                  </span>
                </button>

                <button
                  onClick={() => setShowMenuUploadModal(true)}
                  className="bg-[#122e4d] hover:bg-[#1a406b] text-cyan-200 border border-cyan-400/30 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Upload / Scan Menu</span>
                </button>
              </div>
            </div>

            {/* Converted Products Rack */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5 relative z-10">
              {liveMenu.products.map((product) => {
                const isFlashed = flashingProductId === product.id;

                return (
                  <div
                    key={product.id}
                    className={`bg-[#071320] rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative group p-2.5 ${
                      isFlashed
                        ? 'border-amber-400 ring-4 ring-amber-400/60 shadow-[0_0_35px_rgba(245,158,11,0.9)] scale-[1.03] z-20 bg-gradient-to-b from-[#18375c] to-[#071320]'
                        : 'border-[#183a61] hover:border-cyan-500/50'
                    }`}
                  >
                    {/* Flashing Banner when mentioned */}
                    {isFlashed && (
                      <div className="absolute top-1.5 left-1.5 right-1.5 z-20 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-stone-950 font-black text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider text-center shadow-lg flex items-center justify-center gap-1 border border-white/40 animate-pulse">
                        <Flame className="w-3 h-3 text-stone-950 animate-bounce" />
                        <span>HOST TALKING NOW!</span>
                      </div>
                    )}

                    {/* Image */}
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-stone-900 border border-blue-400/20 mb-2">
                      <img
                        src={getProductImagePath(product.image)}
                        alt={product.name}
                        onError={(e) => handleProductImageError(e, product.name, product.category)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {product.tag && (
                        <span className="absolute bottom-1 left-1 bg-stone-950/85 backdrop-blur-xs text-amber-300 border border-amber-400/30 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                          {product.tag}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <h4 className="font-extrabold text-xs text-white leading-snug line-clamp-2">
                        {product.name}
                      </h4>
                      {product.nativeName && (
                        <p className="text-[10px] text-amber-300/80 italic truncate">{product.nativeName}</p>
                      )}
                      <p className="text-[9px] text-blue-200/60 line-clamp-1">{product.description}</p>
                      <div className="flex items-baseline justify-between pt-1">
                        <span className="font-black text-xs sm:text-sm text-cyan-300">
                          {formatCurrency(product.priceUSD)}
                        </span>
                        <span className="text-[9px] text-stone-400">{product.unit}</span>
                      </div>
                    </div>

                    {/* Action Buttons: Personal Cart & Family Cart */}
                    <div className="space-y-1 pt-2">
                      <button
                        onClick={() => handleAddProductToPersonalCart(product)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-1.5 px-2 rounded-xl text-[10px] sm:text-xs flex items-center justify-center gap-1 shadow-sm transition-transform active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ My Personal Cart</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            onAddToCart(
                              product.matchedCatalogProductId || 'prod-1',
                              members[0]?.id || 'mem-1',
                              `Added from Live Menu: ${product.name}`
                            );
                            setCallToast(`Added ${product.name} to Family Cart!`);
                          }}
                          className="flex-1 bg-stone-800/80 hover:bg-stone-700 text-cyan-200 font-bold py-1 px-1.5 rounded-lg text-[9px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>+ Family Cart</span>
                        </button>

                        <button
                          onClick={() => triggerMention(product.id, product.name, `Host is presenting ${product.name}`)}
                          className="p-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-400/20 rounded-lg text-[9px] cursor-pointer"
                          title="Simulate host speaking this product (flashes & jumps to front)"
                        >
                          <Flame className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* FULL WIDTH BOTTOM SECTION: LIVE SPLIT SHARES BREAKDOWN */}
        {/* ========================================================= */}
        {cart.length > 0 && (
          <div className="col-span-12 bg-[#0b1d30] rounded-2xl sm:rounded-3xl border border-[#16385d] p-4 sm:p-5 space-y-4 shadow-2xl mt-2">
            {/* Header row: Icon, Title, and Split Mode Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#183a61] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 border border-amber-400/40 rounded-xl shrink-0">
                  <Calculator className="w-5 h-5 text-[#ffb703]" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-white tracking-wide flex items-center gap-2">
                    Live Split Shares Breakdown
                  </h3>
                  <p className="text-xs text-blue-200/70">
                    Real-time calculation per family member or split evenly across order
                  </p>
                </div>
              </div>

              {/* Mode Toggle Buttons (By Request vs Split Equally) */}
              <div className="flex bg-[#071320] p-1 rounded-2xl border border-[#183a61] text-xs w-full sm:w-auto min-w-[260px] max-w-sm shrink-0">
                <button
                  onClick={() => setSplitMethod('BY_SUBMITTER')}
                  className={`flex-1 px-4 py-2 font-black rounded-xl transition-all text-center whitespace-nowrap ${
                    splitMethod === 'BY_SUBMITTER'
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'text-blue-300 hover:text-white'
                  }`}
                >
                  By Request
                </button>
                <button
                  onClick={() => setSplitMethod('EQUAL')}
                  className={`flex-1 px-4 py-2 font-black rounded-xl transition-all text-center whitespace-nowrap ${
                    splitMethod === 'EQUAL'
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'text-blue-300 hover:text-white'
                  }`}
                >
                  Split Equally
                </button>
              </div>
            </div>

            {/* Member Shares Grid: Full width 4 columns on desktop, 2 on mobile */}
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3">
              {memberSubtotals.map(({ member, subtotalUSD, itemCount }) => {
                let shareUSD = subtotalUSD;
                if (splitMethod === 'EQUAL') {
                  shareUSD = totalUSD / members.length;
                }

                return (
                  <div
                    key={member.id}
                    className="bg-[#071320] rounded-2xl p-3 sm:p-3.5 border border-[#16385d] hover:border-cyan-500/40 transition-all flex items-center justify-between gap-2 shadow-md"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-cyan-400/40 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-extrabold text-xs sm:text-sm text-white block truncate leading-tight">
                          {member.name.split(' ')[0]} {member.name.split(' ')[1]?.[0]}.
                        </span>
                        <span className="text-[10px] text-blue-300/70">{itemCount} items</span>
                      </div>
                    </div>

                    <span className="font-black text-sm sm:text-base text-[#ffb703] shrink-0">
                      {formatCurrency(shareUSD)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Bar: Total Order & Pay & Dispatch Button */}
            <div className="pt-3 border-t border-[#183a61] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-[10px] sm:text-xs text-blue-300/70 uppercase font-black block tracking-wider">
                    Total Order
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                      {formatCurrency(totalUSD)}
                    </span>
                    <span className="text-xs sm:text-sm text-blue-200/70 font-mono font-bold">
                      ({totalZAR.toFixed(2)} ZAR)
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowCheckoutModal(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-stone-950 font-black px-6 py-3.5 rounded-2xl text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                <CreditCard className="w-5 h-5 text-stone-950" />
                <span>Pay & Dispatch</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ADD MEMBER TO LIVE CALL MODAL */}
      {/* ========================================================= */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-[99999] bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1f36] border-2 border-cyan-500/40 rounded-3xl p-5 sm:p-6 max-w-md w-full text-white shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowAddMemberModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="flex items-center gap-1.5 text-cyan-200 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
                title="Back"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <div className="p-2 bg-cyan-600/20 border border-cyan-400/30 rounded-2xl shrink-0">
                <UserPlus className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm sm:text-base text-white truncate">Invite Family Member to Call</h3>
                <p className="text-[11px] text-blue-200/70 truncate">Connect video or audio live for collaborative shopping</p>
              </div>
            </div>

            <form onSubmit={handleAddParticipant} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-blue-200 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Uncle Farai Moyo"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full bg-[#071320] border border-[#183a61] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 placeholder:text-stone-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-blue-200 block mb-1">Location / Country</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. London, UK or Bulawayo, ZIM"
                  value={newMemberLocation}
                  onChange={(e) => setNewMemberLocation(e.target.value)}
                  className="w-full bg-[#071320] border border-[#183a61] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 placeholder:text-stone-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-blue-200 block mb-1">Initial Connection Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewMemberMode('video')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                      newMemberMode === 'video'
                        ? 'bg-cyan-600 border-cyan-300 text-white shadow-md'
                        : 'bg-[#071320] border-[#183a61] text-stone-300'
                    }`}
                  >
                    <Video className="w-4 h-4 text-emerald-400" />
                    <span>Live Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewMemberMode('audio-only')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                      newMemberMode === 'audio-only'
                        ? 'bg-cyan-600 border-cyan-300 text-white shadow-md'
                        : 'bg-[#071320] border-[#183a61] text-stone-300'
                    }`}
                  >
                    <Radio className="w-4 h-4 text-amber-400" />
                    <span>Audio Only</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="w-1/2 bg-[#071320] hover:bg-stone-800 text-stone-300 font-bold py-2.5 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="w-1/2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-stone-950 font-black py-2.5 rounded-xl text-xs shadow-lg transition-all active:scale-95"
                >
                  Connect Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: QUICK ADD PRODUCT TO CART MODAL */}
      {/* ========================================================= */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-[99999] bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1f36] border-2 border-cyan-500/40 rounded-3xl p-5 sm:p-6 max-w-lg w-full text-white shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowQuickAddModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setShowQuickAddModal(false)}
                className="flex items-center gap-1.5 text-cyan-200 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
                title="Back"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <div className="p-2 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl shrink-0">
                <Plus className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                  Add Item for {selectedMemberForAdd ? selectedMemberForAdd.name : 'Family Member'}
                </h3>
                <p className="text-[11px] text-blue-200/70 truncate">Select staples to add directly to the Live Cart</p>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {SAMPLE_PRODUCTS.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-[#071320] rounded-2xl p-3 border border-[#183a61] flex items-center justify-between gap-3 hover:border-cyan-400 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getProductImagePath(prod.image)}
                      alt={prod.name}
                      onError={(e) => handleProductImageError(e, prod.name, prod.category)}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-12 h-12 rounded-xl object-cover bg-stone-900 border border-stone-700"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-white">{prod.name}</h4>
                      <p className="text-[11px] text-amber-300 font-semibold mt-0.5">
                        {formatCurrency(prod.priceUSD)} • {prod.unit}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleQuickAddItem(prod, selectedMemberForAdd || members[0])}
                    className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-md transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Select</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: LAUNCH POLL MODAL */}
      {/* ========================================================= */}
      {showPollModal && (
        <div className="fixed inset-0 z-[100000] bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b1f36] border-2 border-amber-500/40 rounded-3xl p-6 max-w-sm w-full text-white shadow-2xl relative space-y-4">
            <h3 className="font-black text-lg text-white">Create Quick Poll</h3>
            <input
              type="text"
              placeholder="Question (e.g. Which product do you prefer?)"
              className="w-full bg-[#071320] border border-[#183a61] rounded-xl p-3 text-sm text-white"
              value={newPollQuestion}
              onChange={(e) => setNewPollQuestion(e.target.value)}
            />
            <input
              type="text"
              placeholder="Options (comma separated, e.g. A,B)"
              className="w-full bg-[#071320] border border-[#183a61] rounded-xl p-3 text-sm text-white"
              value={newPollOptions}
              onChange={(e) => setNewPollOptions(e.target.value)}
            />
            <button
              onClick={() => {
                const options = newPollOptions.split(',').map(o => ({ label: o.trim(), votes: 0 }));
                setActivePoll({ id: Date.now().toString(), question: newPollQuestion, options });
                setShowPollModal(false);
              }}
              className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-black py-3 rounded-xl text-sm"
            >
              Launch Poll
            </button>
            <button onClick={() => setShowPollModal(false)} className="w-full text-stone-400 text-xs">Cancel</button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* POLL OVERLAY FOR VIEWERS */}
      {/* ========================================================= */}
      {activePoll && (
        <div className="absolute top-20 right-4 z-[99990] bg-[#0b1f36]/90 border border-amber-500/40 rounded-3xl p-4 w-64 text-white shadow-2xl backdrop-blur-md space-y-3">
          <h4 className="font-black text-sm">{activePoll.question}</h4>
          {activePoll.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => {
                setActivePoll({
                  ...activePoll,
                  options: activePoll.options.map((o, idx) => idx === i ? { ...o, votes: o.votes + 1 } : o)
                });
              }}
              className="w-full bg-[#071320] hover:bg-[#183a61] border border-[#183a61] p-2 rounded-xl text-xs flex justify-between"
            >
              <span>{opt.label}</span>
              <span className="font-black text-emerald-400">{opt.votes} votes</span>
            </button>
          ))}
          <button onClick={() => setActivePoll(null)} className="text-stone-400 text-[10px] w-full">Close Poll</button>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: CHECKOUT SUCCESS MODAL */}
      {/* ========================================================= */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[99999] bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1f36] border-2 border-emerald-500/40 rounded-3xl p-6 max-w-md w-full text-white shadow-2xl relative text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>

            <h3 className="font-black text-xl text-white">Order Confirmed & Dispatched!</h3>
            <p className="text-xs text-blue-200">
              Cross-border order for Moyo Family has been split across selected payment providers and dispatched to Harare & Bulawayo depots!
            </p>

            <div className="bg-[#071320] rounded-2xl p-3 text-xs text-left space-y-1.5 border border-[#183a61]">
              <div className="flex justify-between">
                <span className="text-stone-400">Total USD:</span>
                <span className="font-bold text-emerald-400">{formatCurrency(totalUSD)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Total ZAR Equivalent:</span>
                <span className="font-bold text-amber-300">{totalZAR.toFixed(2)} ZAR</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowCheckoutModal(false);
                onClearCart();
                onEndCall();
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black py-3 rounded-xl text-xs shadow-lg transition-transform active:scale-95"
            >
              Return to Family Cart
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: REAL-TIME ANALYTICS & PEAK INTEREST DASHBOARD */}
      {/* ========================================================= */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 z-[99999] bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="bg-[#0b1f36] border-2 border-cyan-500/40 rounded-3xl p-5 sm:p-6 max-w-2xl w-full text-white shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#183a61] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-400/30">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Live Session Analytics & Engagement</h3>
                  <p className="text-xs text-cyan-200">Real-time viewer concurrency, engagement metrics, & peak product interest timestamps</p>
                </div>
              </div>

              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="text-stone-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/15 cursor-pointer"
                title="Close Dashboard"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#071320] border border-[#183a61] p-3.5 rounded-2xl space-y-1">
                <span className="text-[10px] text-cyan-300 font-bold block uppercase">Peak Concurrency</span>
                <span className="text-xl font-black text-white">3,410 viewers</span>
                <span className="text-[10px] text-emerald-400 font-bold block">↑ +24% vs last session</span>
              </div>

              <div className="bg-[#071320] border border-[#183a61] p-3.5 rounded-2xl space-y-1">
                <span className="text-[10px] text-amber-300 font-bold block uppercase">Cart Additions</span>
                <span className="text-xl font-black text-amber-300">248 items</span>
                <span className="text-[10px] text-emerald-400 font-bold block">⚡ 94.2% conversion</span>
              </div>

              <div className="bg-[#071320] border border-[#183a61] p-3.5 rounded-2xl space-y-1">
                <span className="text-[10px] text-emerald-300 font-bold block uppercase">Engagement Rate</span>
                <span className="text-xl font-black text-emerald-400">96.8%</span>
                <span className="text-[10px] text-cyan-300 font-bold block">❤️ 18.4K total likes</span>
              </div>

              <div className="bg-[#071320] border border-[#183a61] p-3.5 rounded-2xl space-y-1">
                <span className="text-[10px] text-purple-300 font-bold block uppercase">Avg Watch Time</span>
                <span className="text-xl font-black text-purple-300">14m 22s</span>
                <span className="text-[10px] text-cyan-300 font-bold block">High retention</span>
              </div>
            </div>

            {/* Live Graph of Viewer Engagement */}
            <div className="bg-[#071320] border border-[#183a61] p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Live Viewer Engagement Graph (Concurrency over Time)</span>
                </h4>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded font-bold">
                  LIVE STREAMING
                </span>
              </div>

              {/* Simulated SVG Graph */}
              <div className="h-36 w-full flex items-end gap-2 pt-6 px-2 relative border-b border-l border-stone-700">
                {[40, 55, 65, 80, 95, 75, 88, 100, 85, 92].map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group/bar">
                    <span className="text-[8px] text-cyan-300 opacity-0 group-hover/bar:opacity-100 transition-opacity font-bold">
                      {val * 34}
                    </span>
                    <div 
                      className="w-full bg-gradient-to-t from-cyan-600 via-teal-500 to-emerald-400 rounded-t-lg transition-all duration-500 hover:brightness-125 shadow-lg"
                      style={{ height: `${val}%` }}
                    />
                    <span className="text-[9px] text-stone-400">{idx * 2}m</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Peak Product Interest Timestamps */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs sm:text-sm text-white">Peak Product Interest Timestamps</h4>
              <div className="space-y-2 text-xs">
                {[
                  { time: '02:15', product: 'White Star Super Maize Meal (10kg)', interest: '96% Interest Spike', tag: '🔥 TOP PICK' },
                  { time: '08:40', product: 'Mazoe Orange Crush Syrup (2L)', interest: '91% Cart Additions', tag: '🌟 VIRAL' },
                  { time: '14:20', product: 'Dettol Herbal Hygiene Soap 4-pack', interest: '88% Quick Adds', tag: '⚡ HIGH DEMAND' },
                  { time: '18:10', product: 'Tastic Parboiled Rice (10kg)', interest: '94% Peak Concurrency', tag: '🛒 BESTSELLER' }
                ].map((peak, i) => (
                  <div key={i} className="bg-[#071320] border border-[#183a61] p-3 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="bg-cyan-500/20 text-cyan-300 font-mono font-black text-xs px-2.5 py-1 rounded-xl border border-cyan-400/30">
                        {peak.time}
                      </span>
                      <div>
                        <span className="font-black text-white block">{peak.product}</span>
                        <span className="text-[10px] text-emerald-400 font-bold">{peak.interest}</span>
                      </div>
                    </div>

                    <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap">
                      {peak.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowAnalyticsModal(false)}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-black py-3 rounded-xl text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              Close Analytics Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
