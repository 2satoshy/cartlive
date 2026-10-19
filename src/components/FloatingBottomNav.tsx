import React, { useState } from 'react';
import { 
  Home, 
  Compass, 
  Store, 
  User, 
  ShoppingCart, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Mic,
  ShoppingBag,
  Menu,
  Clock,
  Video
} from 'lucide-react';

export type NavTab = 'livecall' | 'home' | 'discover' | 'previouslyBought' | 'myshop' | 'profile' | 'cart';

interface FloatingBottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  cartCount: number;
  onOpenVoiceAI?: () => void;
  onOpenWhatsAppSim?: () => void;
  onOpenSmartBasket?: () => void;
  onStartLiveCall?: () => void;
  isBasketTilting?: boolean;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  activeTab,
  onSelectTab,
  cartCount,
  onOpenVoiceAI,
  onOpenWhatsAppSim,
  onOpenSmartBasket,
  onStartLiveCall,
  isBasketTilting,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { 
      id: 'livecall', 
      label: 'Live Shop', 
      icon: (
        <span className="relative flex items-center justify-center">
          <Video className="w-5 h-5 text-emerald-300" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
        </span>
      ) 
    },
    { id: 'home', label: 'Catalog', icon: <Store className="w-5 h-5" /> },
    { id: 'discover', label: 'Discover', icon: <Compass className="w-5 h-5" /> },
    { id: 'previouslyBought', label: 'Bought', icon: <Clock className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'cart', label: 'Cart', icon: <ShoppingCart className="w-5 h-5" />, badge: cartCount },
  ];

  return (
    <>
      {/* TikTok-Style Vertical Floating Action Icons (Bottom Right Stack) */}
      <div 
        className={`fixed right-3 sm:right-5 z-[999999] flex flex-col items-end gap-2.5 transition-all duration-300 pointer-events-auto ${
          isCollapsed ? 'bottom-20 sm:bottom-20' : 'bottom-[5.5rem] sm:bottom-[5.75rem]'
        }`}
      >
        {/* Floating Cart Button Icon (Positioned directly ABOVE Start Live Call Button) */}
        <button
          onClick={() => onSelectTab('cart')}
          className="group relative bg-gradient-to-tr from-[#002D62] via-[#004b9e] to-[#0284c7] hover:from-[#001D42] hover:to-[#0284c7] text-white p-3 rounded-full shadow-2xl border-2 border-emerald-400 flex items-center justify-center transition-all transform active:scale-90 hover:scale-110"
          title={`View Shopping Cart (${cartCount} items)`}
          aria-label={`View Shopping Cart (${cartCount} items)`}
        >
          {/* Cart Badge with count */}
          {cartCount > 0 ? (
            <span className="absolute -top-1.5 -right-1.5 bg-[#D0021B] text-white text-[10px] font-black min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
              {cartCount}
            </span>
          ) : (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-stone-900 animate-pulse" />
          )}
          <ShoppingCart className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />

          {/* Floating Tooltip Pill */}
          <span className="absolute right-14 bg-[#001D42]/95 text-emerald-300 text-[10px] font-extrabold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md border border-emerald-500/40">
            Cart ({cartCount})
          </span>
        </button>

        {/* Start Live Video Call Button (Below Floating Cart) */}
        {onStartLiveCall && (
          <button
            onClick={onStartLiveCall}
            className="group relative bg-gradient-to-tr from-[#941135] via-[#C51D4A] to-[#e02657] hover:from-[#7d0d2c] hover:to-[#c51d4a] text-white p-3 rounded-full shadow-2xl border-2 border-[#FFB81C] flex items-center justify-center transition-all transform active:scale-90 hover:scale-110"
            title="Start Live Video Call"
            aria-label="Start Live Video Call"
          >
            {/* Glowing ring animation */}
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-stone-900 animate-ping opacity-75" />
            <Video className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />

            {/* Floating Tooltip Pill */}
            <span className="absolute right-14 bg-[#7d0d2c]/95 text-[#FFB81C] text-[10px] font-extrabold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md border border-[#FFB81C]/40">
              Start Live Call
            </span>
          </button>
        )}

        {/* 1. Smart Basket Action Button (Top of Stack) */}
        {onOpenSmartBasket && (
          <button
            onClick={onOpenSmartBasket}
            className={`group relative bg-gradient-to-tr from-[#0284c7] via-[#0d9488] to-[#14b8a6] hover:from-[#0369a1] hover:to-[#0f766e] text-white p-3 rounded-full shadow-2xl border-2 border-cyan-300 flex items-center justify-center transition-all transform active:scale-90 hover:scale-110 ${
              isBasketTilting ? 'animate-wobble ring-4 ring-cyan-400/60' : ''
            }`}
            title="Smart Basket (Swipable Staples)"
            aria-label="Smart Basket"
          >
            {/* Glowing ring animation */}
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-300 rounded-full border-2 border-stone-900 animate-ping opacity-75" />
            <ShoppingBag className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />

            {/* Floating Tooltip Pill */}
            <span className="absolute right-14 bg-[#0a232e]/95 text-cyan-200 text-[10px] font-extrabold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md border border-cyan-500/40">
              Smart Basket
            </span>
          </button>
        )}

        {/* 3. Voice AI Assistant Button (Bottom of Stack) */}
        {onOpenVoiceAI && (
          <button
            onClick={onOpenVoiceAI}
            className="group relative bg-gradient-to-tr from-[#1a115e] via-[#241a7d] to-[#298bf5] hover:from-[#241a7d] hover:to-[#60a5fa] text-[#ffb81c] p-3 rounded-full shadow-2xl border-2 border-[#ffb81c] flex items-center justify-center transition-all transform active:scale-90 hover:scale-110"
            title="Voice AI Assistant (Shona/Ndebele/English)"
            aria-label="Voice AI Assistant"
          >
            {/* Glowing ring animation */}
            <span className="absolute inset-0 rounded-full border border-[#ffb81c]/50 animate-ping opacity-40" />
            <Sparkles className="w-5 h-5 text-[#ffb81c] group-hover:scale-110 transition-transform" />

            {/* Floating Tooltip Pill */}
            <span className="absolute right-14 bg-[#1a115e]/95 text-[#ffb81c] text-[10px] font-extrabold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md border border-[#2a1d82]">
              Voice AI Assistant
            </span>
          </button>
        )}
      </div>

      {/* Floating Bottom Navigation Bar (Fixed to Viewport Bottom Screen) */}
      {isCollapsed ? (
        /* Collapsed Circular Action Button matching the icon stack */
        <div className="fixed bottom-3 right-3 sm:right-5 z-[999999] pointer-events-auto">
          <button
            onClick={() => setIsCollapsed(false)}
            className="group relative bg-gradient-to-tr from-[#941135] via-[#C51D4A] to-[#e02657] hover:from-[#7d0d2c] hover:to-[#c51d4a] text-white p-3 rounded-full shadow-2xl border-2 border-[#FFB81C] flex items-center justify-center transition-all transform active:scale-90 hover:scale-110"
            title="Expand Navigation Menu"
            aria-label="Expand Navigation Menu"
          >
            {/* Cart Badge if items in cart */}
            {cartCount > 0 ? (
              <span className="absolute -top-1.5 -right-1.5 bg-[#002D62] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-white animate-bounce">
                {cartCount}
              </span>
            ) : (
              /* Glowing pulse indicator dot */
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#FFB81C] rounded-full border-2 border-white animate-pulse" />
            )}

            {/* Menu icon with subtle Sparkle badge */}
            <Menu className="w-5 h-5 text-white group-hover:rotate-180 transition-transform duration-300" />

            {/* Floating Tooltip Pill */}
            <span className="absolute right-14 bg-[#7d0d2c]/95 text-[#FFB81C] text-[10px] font-extrabold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md border border-[#FFB81C]/40">
              Nav Menu
            </span>
          </button>
        </div>
      ) : (
        /* Expanded Floating Bottom Nav Bar Across Screen */
        <div className="fixed bottom-2 left-2 right-2 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-lg z-[999999] pointer-events-auto transition-all duration-300">
          <div className="bg-[#C51D4A]/95 backdrop-blur-xl text-white rounded-2xl px-1.5 py-1.5 sm:px-2 sm:py-2 shadow-2xl border border-[#a8143a]/90 flex items-center justify-between relative">
            {/* Navigation Tabs */}
            <div className="flex items-center justify-around flex-1 gap-0.5 sm:gap-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`flex flex-col items-center justify-center py-1 px-1.5 sm:px-3 rounded-xl transition-all relative flex-1 ${
                      isActive
                        ? 'text-[#FFB81C] font-black scale-105 bg-black/20 shadow-inner'
                        : 'text-stone-100 hover:text-white hover:bg-white/10 font-medium'
                    }`}
                  >
                    <div className="relative">
                      {item.icon}
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute -top-1.5 -right-2 bg-[#002D62] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-[#C51D4A] shadow-xs">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[56px]">
                      {item.label}
                    </span>

                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFB81C] mt-0.5 shadow-2xs" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Collapse Toggle Button */}
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 sm:p-2 text-stone-100 hover:text-white bg-[#941135]/90 hover:bg-[#7d0d2c] rounded-xl transition-all ml-1 border border-[#8a0f31]/80 flex-shrink-0"
              title="Collapse Navigation"
              aria-label="Collapse Navigation"
            >
              <ChevronDown className="w-4 h-4 text-[#FFB81C]" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

