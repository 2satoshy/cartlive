import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Sparkles, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  Check, 
  Plus, 
  Trash2, 
  HelpCircle,
  Truck,
  Zap,
  Tag,
  ThumbsUp,
  ShoppingBasket,
  Maximize2,
  Store,
  Info,
  Layers,
  CheckCircle2,
  Video
} from 'lucide-react';
import { Product, Currency, Member } from '../types';
import { formatPrice } from '../utils/currency';
import { getProductImagePath, handleProductImageError } from '../utils/productImages';
import { SAMPLE_PRODUCTS } from '../data/products';

interface SmartBasketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (productId: string, memberId: string, note?: string) => void;
  onItemDroppedInBasket: () => void;
  currency: Currency;
  members: Member[];
  selectedMemberId: string;
  onOpenCart: () => void;
}

interface SmartBasketItem {
  id: string;
  product: Product;
  badge: string;
  saveText: string;
  oldPriceUSD: number;
  deliverySlot: string;
  categoryTag: string;
}

const SMART_PRODUCTS_DECK: SmartBasketItem[] = [
  {
    id: 'sb-1',
    product: SAMPLE_PRODUCTS[0], // Tastic Rice Parboiled Long Grain 5kg
    badge: 'REGULARS',
    saveText: 'SAVE $1.20',
    oldPriceUSD: 8.00,
    deliverySlot: '🚚 24h Harare Express',
    categoryTag: 'Family Staple',
  },
  {
    id: 'sb-2',
    product: {
      id: 'prod-eggs-30',
      name: 'Eggbert Large Eggs 30-Pack',
      nativeName: 'Mazai Makuru 30 / Amanda',
      brand: 'Eggbert Farm',
      category: 'Dairy & Fresh',
      storeId: 'TM_PNP',
      storeName: 'TM Pick n Pay (Harare & Bulawayo)',
      priceUSD: 4.50,
      priceZAR: 83.25,
      priceZWG: 120.60,
      unit: '30 egg tray',
      fulfillmentTag: 'Harare Express',
      inStock: true,
      featured: true,
      image: '/images/clover_milk.jpg',
    },
    badge: 'REGULARS',
    saveText: 'SAVE $1.20',
    oldPriceUSD: 5.70,
    deliverySlot: '🚚 7-8 AM Delivery',
    categoryTag: 'Fresh Produce',
  },
  {
    id: 'sb-3',
    product: {
      id: 'prod-vetkoek-6',
      name: 'Fresh Bakery Vetkoek 6 Pack',
      nativeName: 'Zvikwambo zvekubikisa',
      brand: 'PnP Bakery',
      category: 'Maize & Staples',
      storeId: 'TM_PNP',
      storeName: 'TM Pick n Pay',
      priceUSD: 1.80,
      priceZAR: 33.30,
      priceZWG: 48.24,
      unit: '6 pack',
      fulfillmentTag: 'Harare Express',
      inStock: true,
      featured: true,
      image: '/images/white_star_maize.jpg',
    },
    badge: 'DAILY BAKERY',
    saveText: 'SAVE $0.50',
    oldPriceUSD: 2.30,
    deliverySlot: '⚡ Same Day Pickup',
    categoryTag: 'Breakfast',
  },
  {
    id: 'sb-4',
    product: SAMPLE_PRODUCTS[2], // Fruit and Vegetable Box 10kg
    badge: 'FRESH HARVEST',
    saveText: 'SAVE ZAR 50',
    oldPriceUSD: 29.67,
    deliverySlot: '🚚 Bulawayo Click & Collect',
    categoryTag: 'Fresh Produce',
  },
  {
    id: 'sb-5',
    product: {
      id: 'prod-mazoe-2l',
      name: 'Mazoe Orange Cordial (2 Litres)',
      nativeName: 'Mazoe Orange / Jusi',
      brand: 'Schweppes ZIM',
      category: 'Beverages & Tea',
      storeId: 'TM_PNP',
      storeName: 'TM Pick n Pay',
      priceUSD: 3.20,
      priceZAR: 59.20,
      priceZWG: 85.76,
      unit: '2L bottle',
      fulfillmentTag: 'Nationwide Zim',
      inStock: true,
      featured: true,
      image: '/images/mazoe_orange_crush.jpg',
    },
    badge: 'ZIM HERITAGE',
    saveText: 'SAVE $0.70',
    oldPriceUSD: 3.90,
    deliverySlot: '⚡ 24h Express Dispatch',
    categoryTag: 'Beverages',
  },
  {
    id: 'sb-6',
    product: {
      id: 'prod-tanganda-100',
      name: 'Tanganda Special Blend Tea 100s',
      nativeName: 'Tii yeTanganda',
      brand: 'Tanganda Tea Co',
      category: 'Beverages & Tea',
      storeId: 'TM_PNP',
      storeName: 'TM Pick n Pay',
      priceUSD: 2.50,
      priceZAR: 46.25,
      priceZWG: 67.00,
      unit: '100 teabags',
      fulfillmentTag: 'Nationwide Zim',
      inStock: true,
      featured: true,
      image: '/images/tanganda_tea.jpg',
    },
    badge: 'TOP SELLER',
    saveText: 'SAVE $0.40',
    oldPriceUSD: 2.90,
    deliverySlot: '🚚 Same Day Dispatch',
    categoryTag: 'Tea & Warmth',
  },
];

export const SmartBasketModal: React.FC<SmartBasketModalProps> = ({
  isOpen,
  onClose,
  onAddToCart,
  onItemDroppedInBasket,
  currency,
  members,
  selectedMemberId,
  onOpenCart,
}) => {
  const [showTutorial, setShowTutorial] = useState(true);
  const [deck, setDeck] = useState<SmartBasketItem[]>(SMART_PRODUCTS_DECK);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [addedCount, setAddedCount] = useState(0);
  const [expandedItem, setExpandedItem] = useState<SmartBasketItem | null>(null);
  const [lastAction, setLastAction] = useState<{
    type: 'ADD' | 'REMOVE';
    item: SmartBasketItem;
    index: number;
  } | null>(null);

  // Drag state indicators
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Touch double tap tracking
  const lastTapRef = useRef<number>(0);

  const currentItem = deck[currentIndex];

  const handleNextCard = () => {
    if (currentIndex < deck.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Loop back or stay at end
      setCurrentIndex(0);
    }
  };

  const handlePrevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(deck.length - 1);
    }
  };

  const handleAddCurrentToBasket = () => {
    if (!currentItem) return;

    // Trigger cart add logic
    onAddToCart(currentItem.product.id, selectedMemberId, 'Added via Smart Basket');

    // Trigger basket wobble tilt
    onItemDroppedInBasket();

    // Visual feedback
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 800);

    setAddedCount((prev) => prev + 1);
    setLastAction({ type: 'ADD', item: currentItem, index: currentIndex });

    // Advance to next card
    handleNextCard();
  };

  const handleRemoveCurrentCard = () => {
    if (!currentItem) return;

    setLastAction({ type: 'REMOVE', item: currentItem, index: currentIndex });
    handleNextCard();
  };

  // Keyboard Navigation Listener (Arrow keys: Left, Right, Up, Down, Escape)
  useEffect(() => {
    if (!isOpen || expandedItem || showTutorial) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevCard();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextCard();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleRemoveCurrentCard();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleAddCurrentToBasket();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, expandedItem, showTutorial, currentIndex, deck]);

  // Handle Double Tap / Double Click on Card
  const handleCardDoubleTapOrClick = (e: React.SyntheticEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (currentItem) {
        setExpandedItem(currentItem);
      }
    }
    lastTapRef.current = now;
  };

  const handleUndo = () => {
    if (!lastAction) return;

    if (lastAction.type === 'ADD') {
      setAddedCount((prev) => Math.max(0, prev - 1));
    }
    setCurrentIndex(lastAction.index);
    setLastAction(null);
  };

  if (!isOpen) return null;

  const recipientMember = members.find((m) => m.id === selectedMemberId) || members[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-stone-900/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-gradient-to-b from-[#0c2a38] via-[#0f3d4f] to-[#0a1e29] border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[92vh]"
        >
          {/* Header Bar */}
          <div className="p-3.5 sm:p-4 bg-[#0a232e]/90 border-b border-cyan-500/20 flex items-center justify-between relative z-20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-teal-100 to-emerald-300">
                  SMART BASKET
                </h3>
                <p className="text-[10px] text-cyan-200/70 font-medium">
                  Quick AI Staples for <span className="text-cyan-300 font-bold">{recipientMember?.name}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenCart();
                }}
                className="p-1.5 rounded-full bg-emerald-950/80 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-900 transition-all text-xs flex items-center gap-1.5 px-2.5 font-extrabold shadow-md active:scale-95"
                title="Launch Live Group Video Call"
              >
                <Video className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden xs:inline">Group Call</span>
              </button>

              <button
                onClick={() => setShowTutorial(true)}
                className="p-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/80 transition-all text-xs flex items-center gap-1 px-2.5 font-bold"
                title="How does this work?"
              >
                <HelpCircle className="w-3.5 h-3.5 text-cyan-300" />
                <span className="hidden xs:inline">Tutorial</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-stone-800/80 hover:bg-rose-600 text-stone-300 hover:text-white transition-all"
                aria-label="Close Smart Basket"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Key shortcut & Double Tap banner */}
          <div className="bg-[#05151f] px-3.5 py-1.5 border-b border-cyan-500/10 flex items-center justify-between text-[10px] text-cyan-200/80 font-mono">
            <span>⌨️ Arrows: ← → Browse | ↑ Skip | ↓ Add</span>
            <span className="text-cyan-400 font-bold">Double Tap: 🔍 Details</span>
          </div>

          {/* Main Card View / Tutorial Backdrop */}
          <div className="relative flex-1 p-4 sm:p-6 flex flex-col items-center justify-center min-h-[380px] sm:min-h-[420px] overflow-hidden">
            {/* Background glowing aura */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Gesture Tutorial Overlay */}
            {showTutorial && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-[#061822]/95 backdrop-blur-md p-5 flex flex-col items-center justify-between text-center overflow-y-auto"
              >
                <div className="flex items-center gap-2 pt-1">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <h4 className="font-black text-cyan-100 tracking-wider text-lg uppercase">
                    SMART BASKET CONTROLS
                  </h4>
                </div>

                {/* Animated Hand Gesture Graphic Guide */}
                <div className="space-y-2 my-auto w-full max-w-xs py-1">
                  {/* Swipe Up Guide */}
                  <div className="flex flex-col items-center gap-0.5 bg-cyan-950/40 border border-cyan-500/20 p-2 rounded-2xl">
                    <div className="w-7 h-7 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300 animate-bounce">
                      <ArrowUp className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black tracking-wider text-rose-200 uppercase">
                      SWIPE UP (OR ↑ KEY) TO REMOVE
                    </span>
                  </div>

                  {/* Swipe Left/Right Guide */}
                  <div className="flex flex-col items-center gap-0.5 bg-cyan-950/40 border border-cyan-500/20 p-2 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <ChevronLeft className="w-4 h-4 text-cyan-300 animate-pulse" />
                      <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                        <span className="text-xs font-black">👈 👉</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-cyan-300 animate-pulse" />
                    </div>
                    <span className="text-[10px] font-black tracking-wider text-cyan-200 uppercase">
                      SWIPE LEFT/RIGHT (OR ← → KEYS) TO BROWSE
                    </span>
                  </div>

                  {/* Swipe Down Guide */}
                  <div className="flex flex-col items-center gap-0.5 bg-cyan-950/40 border border-amber-500/30 p-2 rounded-2xl">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 animate-bounce">
                      <ArrowDown className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black tracking-wider text-emerald-300 uppercase">
                      SWIPE DOWN (OR ↓ KEY) TO DROP TO BASKET
                    </span>
                  </div>

                  {/* Double Tap Expand Guide */}
                  <div className="flex flex-col items-center gap-0.5 bg-cyan-950/40 border border-cyan-400/30 p-2 rounded-2xl">
                    <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-black tracking-wider text-cyan-300 uppercase">
                      DOUBLE TAP / DOUBLE CLICK TO EXPAND DETAILS
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowTutorial(false)}
                  className="w-full bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-stone-900 font-black py-2.5 px-6 rounded-2xl shadow-lg shadow-teal-500/20 text-xs tracking-wide transition-all transform active:scale-95 uppercase"
                >
                  Got It, Start Browsing
                </button>
              </motion.div>
            )}

            {/* Added Toast Floating Overlay */}
            <AnimatePresence>
              {addedAnimation && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.8 }}
                  className="absolute top-4 z-40 bg-emerald-500 text-stone-950 font-black px-4 py-2 rounded-full shadow-xl flex items-center gap-2 border-2 border-white text-xs uppercase tracking-wider"
                >
                  <ShoppingBag className="w-4 h-4 text-stone-950" />
                  <span>Dropped into Smart Basket!</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Interactive Swipable Card Deck */}
            {currentItem && (
              <div className="relative w-full max-w-[310px] sm:max-w-[330px] h-[350px] sm:h-[370px] flex items-center justify-center">
                {/* Background stacked card effect */}
                <div className="absolute inset-0 bg-stone-800/40 rounded-3xl translate-y-3 scale-95 border border-stone-700/50 pointer-events-none" />
                <div className="absolute inset-0 bg-cyan-950/30 rounded-3xl translate-y-1.5 scale-[0.97] border border-cyan-800/40 pointer-events-none" />

                {/* Main Active Card */}
                <motion.div
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0.6}
                  onDrag={(_, info) => setDragOffset({ x: info.offset.x, y: info.offset.y })}
                  onDragEnd={(_, info) => {
                    const { x, y } = info.offset;
                    setDragOffset({ x: 0, y: 0 });

                    // Swipe DOWN -> Add to Basket
                    if (y > 75) {
                      handleAddCurrentToBasket();
                    }
                    // Swipe UP -> Remove Card
                    else if (y < -75) {
                      handleRemoveCurrentCard();
                    }
                    // Swipe RIGHT -> Prev Card
                    else if (x > 80) {
                      handlePrevCard();
                    }
                    // Swipe LEFT -> Next Card
                    else if (x < -80) {
                      handleNextCard();
                    }
                  }}
                  onDoubleClick={() => setExpandedItem(currentItem)}
                  onClick={handleCardDoubleTapOrClick}
                  animate={{
                    x: dragOffset.x,
                    y: dragOffset.y,
                    rotate: dragOffset.x * 0.05,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="relative w-full h-full bg-white text-stone-900 rounded-3xl shadow-2xl p-4 sm:p-5 flex flex-col justify-between border-4 border-[#ffb81c] cursor-grab active:cursor-grabbing overflow-hidden select-none touch-none"
                >
                  {/* Swipe Overlay Indicators */}
                  {dragOffset.y > 40 && (
                    <div className="absolute inset-0 z-30 bg-emerald-500/90 backdrop-blur-xs flex flex-col items-center justify-center text-white font-black p-4 text-center animate-fadeIn">
                      <ShoppingBag className="w-12 h-12 text-white mb-2 animate-bounce" />
                      <span className="text-xl uppercase tracking-wider">DROP TO ADD!</span>
                    </div>
                  )}

                  {dragOffset.y < -40 && (
                    <div className="absolute inset-0 z-30 bg-rose-600/90 backdrop-blur-xs flex flex-col items-center justify-center text-white font-black p-4 text-center animate-fadeIn">
                      <Trash2 className="w-12 h-12 text-white mb-2 animate-bounce" />
                      <span className="text-xl uppercase tracking-wider">SWIPE UP TO SKIP</span>
                    </div>
                  )}

                  {/* Top Badges Row */}
                  <div className="flex items-center justify-between gap-2 z-10">
                    <span className="bg-[#FFB81C] text-[#002D62] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-2xs flex items-center gap-1">
                      <RotateCcw className="w-3 h-3 text-[#002D62]" /> {currentItem.badge}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedItem(currentItem);
                      }}
                      className="bg-stone-900/80 hover:bg-stone-900 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-cyan-400/40 transition-all shadow-xs"
                      title="Double tap / click card or click here to view full details"
                    >
                      <Maximize2 className="w-3 h-3 text-cyan-400" />
                      <span>Expand Details</span>
                    </button>

                    <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                      {currentItem.saveText}
                    </span>
                  </div>

                  {/* Center Image */}
                  <div className="relative w-full h-36 sm:h-40 my-1 rounded-2xl overflow-hidden bg-stone-50 flex items-center justify-center border border-stone-100 group">
                    <img
                      src={getProductImagePath(currentItem.product.image)}
                      alt={currentItem.product.name}
                      onError={(e) => handleProductImageError(e, currentItem.product.name, currentItem.product.category)}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-2 left-2 bg-stone-900/85 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Truck className="w-3 h-3 text-cyan-400" />
                      <span>{currentItem.deliverySlot}</span>
                    </div>

                    <div className="absolute top-2 right-2 bg-stone-950/75 text-cyan-200 text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs border border-cyan-500/30 flex items-center gap-0.5">
                      <Maximize2 className="w-2.5 h-2.5 text-cyan-300" />
                      <span>Double-tap 🔍</span>
                    </div>
                  </div>

                  {/* Price & Title Details */}
                  <div className="space-y-1 z-10">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-[#002D62] tracking-tight">
                        {formatPrice(currentItem.product.priceUSD, currency)}
                      </span>
                      <span className="text-xs text-stone-400 line-through font-bold">
                        {formatPrice(currentItem.oldPriceUSD, currency)}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-stone-900 text-sm sm:text-base leading-snug line-clamp-1">
                      {currentItem.product.name}
                    </h4>
                    {currentItem.product.nativeName && (
                      <p className="text-[11px] text-stone-500 font-medium line-clamp-1">
                        {currentItem.product.nativeName}
                      </p>
                    )}
                  </div>

                  {/* Quick Desktop Buttons Bar */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCurrentCard();
                      }}
                      className="p-2 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-600 hover:text-rose-600 font-bold text-xs flex items-center gap-1 transition-all"
                      title="Skip / Swipe Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      <span>Skip</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrevCard();
                        }}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all"
                        title="Previous Product"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-bold text-stone-400 px-1">
                        {currentIndex + 1}/{deck.length}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNextCard();
                        }}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all"
                        title="Next Product"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddCurrentToBasket();
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1 shadow-md transition-all active:scale-95"
                      title="Add to Smart Basket / Swipe Down"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-white" />
                      <span>Add</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>

          {/* Bottom Footer Control Bar */}
          <div className="p-3.5 sm:p-4 bg-[#071924] border-t border-cyan-500/20 flex items-center justify-between gap-2 relative z-20">
            <button
              onClick={handleUndo}
              disabled={!lastAction}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                lastAction
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900'
                  : 'text-stone-600 bg-stone-900/40 border border-stone-800 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1">
                <ShoppingBasket className="w-3.5 h-3.5 text-emerald-400" />
                <span>{addedCount} Added</span>
              </span>

              <button
                onClick={() => {
                  onClose();
                  onOpenCart();
                }}
                className="bg-gradient-to-r from-[#FFB81C] to-amber-400 hover:from-amber-400 hover:to-amber-300 text-[#002D62] px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <span>View Cart</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Full Product Detail Modal Overlay (Opened on Double Tap / Double Click) */}
      {expandedItem && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-lg bg-gradient-to-b from-stone-900 via-[#0d2130] to-[#081724] border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]"
          >
            {/* Expanded Header */}
            <div className="p-4 bg-stone-900/90 border-b border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-[#FFB81C] text-[#002D62] text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                  {expandedItem.badge}
                </span>
                <span className="text-xs text-cyan-300 font-extrabold">Full Product Specifications</span>
              </div>

              <button
                onClick={() => setExpandedItem(null)}
                className="p-1.5 rounded-full bg-stone-800 hover:bg-rose-600 text-stone-300 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Expanded Content Scrollable Area */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {/* Product Large Image Lightbox */}
              <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden bg-white border-2 border-cyan-500/30 flex items-center justify-center group shadow-xl">
                <img
                  src={getProductImagePath(expandedItem.product.image)}
                  alt={expandedItem.product.name}
                  onError={(e) => handleProductImageError(e, expandedItem.product.name, expandedItem.product.category)}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="w-full h-full object-contain p-2"
                />
                <div className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                  {expandedItem.saveText}
                </div>
                <div className="absolute bottom-3 right-3 bg-stone-900/90 text-cyan-300 text-xs font-bold px-3 py-1 rounded-full border border-cyan-500/40 backdrop-blur-xs flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{expandedItem.deliverySlot}</span>
                </div>
              </div>

              {/* Title & Native Name */}
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {expandedItem.product.name}
                </h3>
                {expandedItem.product.nativeName && (
                  <p className="text-sm text-cyan-300 font-semibold mt-0.5">
                    {expandedItem.product.nativeName}
                  </p>
                )}
              </div>

              {/* Price Row */}
              <div className="bg-[#0b2436] p-4 rounded-2xl border border-cyan-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-400 block font-bold uppercase tracking-wider">
                    Special Smart Price
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#ffb81c]">
                      {formatPrice(expandedItem.product.priceUSD, currency)}
                    </span>
                    <span className="text-sm text-stone-400 line-through font-bold">
                      {formatPrice(expandedItem.oldPriceUSD, currency)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-stone-400 block font-bold uppercase tracking-wider">
                    Unit Pack Size
                  </span>
                  <span className="text-sm font-black text-cyan-200 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                    {expandedItem.product.unit || 'Standard Pack'}
                  </span>
                </div>
              </div>

              {/* Details Specifications Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#071927] p-3 rounded-xl border border-stone-800">
                  <span className="text-stone-400 text-[10px] font-bold block uppercase">Partner Supermarket</span>
                  <span className="font-extrabold text-white flex items-center gap-1 mt-0.5">
                    <Store className="w-3.5 h-3.5 text-amber-400" />
                    {expandedItem.product.storeName}
                  </span>
                </div>

                <div className="bg-[#071927] p-3 rounded-xl border border-stone-800">
                  <span className="text-stone-400 text-[10px] font-bold block uppercase">Product Category</span>
                  <span className="font-extrabold text-white flex items-center gap-1 mt-0.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    {expandedItem.product.category}
                  </span>
                </div>

                <div className="bg-[#071927] p-3 rounded-xl border border-stone-800">
                  <span className="text-stone-400 text-[10px] font-bold block uppercase">Brand Origin</span>
                  <span className="font-extrabold text-white mt-0.5 block">
                    {expandedItem.product.brand}
                  </span>
                </div>

                <div className="bg-[#071927] p-3 rounded-xl border border-stone-800">
                  <span className="text-stone-400 text-[10px] font-bold block uppercase">Stock Availability</span>
                  <span className="font-extrabold text-emerald-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    In Stock (Express)
                  </span>
                </div>
              </div>

              {/* Description & Family Staple Guarantee */}
              <div className="bg-stone-900/60 p-3.5 rounded-2xl border border-stone-800 text-xs space-y-1.5">
                <h4 className="font-bold text-cyan-200 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Diaspora Collaborative Staple Guarantee</span>
                </h4>
                <p className="text-stone-300 leading-relaxed text-[11px]">
                  This staple item is pre-verified by local Zimbabwean families for freshness and weight quality. When dropped into your Smart Basket, relatives connected via WhatsApp receive instant voice confirmation in Shona/Ndebele.
                </p>
              </div>
            </div>

            {/* Expanded Footer Button */}
            <div className="p-4 bg-stone-900/90 border-t border-cyan-500/20 flex items-center justify-between gap-3">
              <button
                onClick={() => setExpandedItem(null)}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs"
              >
                Back to Cards
              </button>

              <button
                onClick={() => {
                  handleAddCurrentToBasket();
                  setExpandedItem(null);
                }}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-black py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <ShoppingBag className="w-4 h-4 text-stone-950" />
                <span>Drop into Smart Basket</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
