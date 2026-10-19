import React, { useState } from 'react';
import { ShoppingCart, Users, ChevronDown, Smartphone, Video } from 'lucide-react';
import { Currency, Member, CartItem } from '../types';
import { PnPLogo } from './PnPLogo';
import { ALL_CURRENCIES, CURRENCY_MAP } from '../utils/currency';

interface NavbarProps {
  cart: CartItem[];
  members: Member[];
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  lowDataMode: boolean;
  onToggleLowData: () => void;
  onOpenVoiceAI: () => void;
  onOpenWhatsAppSim: () => void;
  onOpenDocs: () => void;
  onOpenCart: () => void;
  onOpenLiveCall?: () => void;
  isLiveCallOngoing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  cart,
  members,
  currency,
  onCurrencyChange,
  lowDataMode,
  onToggleLowData,
  onOpenVoiceAI,
  onOpenWhatsAppSim,
  onOpenDocs,
  onOpenCart,
  onOpenLiveCall,
  isLiveCallOngoing
}) => {
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const onlineCount = members.filter(m => m.isOnline).length;
  const currentCurrencyInfo = CURRENCY_MAP[currency] || CURRENCY_MAP.GBP;

  return (
    <header className="sticky top-0 z-40 bg-[#C51D4A] text-white shadow-md border-b border-[#a8143d]">

      {/* Main Navbar in #C51D4A */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* PnP Brand with Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="bg-white px-2.5 py-1 rounded-lg shadow-sm flex items-center justify-center border border-stone-200">
            <PnPLogo height={32} showClickCollect={true} />
          </div>
        </div>

        {/* Currency Switcher, AI Tools & Cart */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Members Presence */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#a3153c] px-2.5 py-1 rounded-full border border-white/20">
            <Users className="w-3.5 h-3.5 text-[#FFB81C]" />
            <span className="text-xs text-white font-medium">{onlineCount} Active</span>
            <div className="flex -space-x-1.5 ml-1">
              {members.map(m => (
                <img
                  key={m.id}
                  src={m.avatar}
                  alt={m.name}
                  title={`${m.name} (${m.location})`}
                  className="w-5 h-5 rounded-full border border-white object-cover"
                />
              ))}
            </div>
          </div>

          {/* Live Video Shopping Call Shortcut Pill */}
          {onOpenLiveCall && (
            <button
              onClick={onOpenLiveCall}
              className="group relative flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 hover:from-emerald-500 hover:to-teal-600 text-white px-2.5 py-1.5 rounded-xl font-black text-xs shadow-md border border-emerald-300/60 transition-all active:scale-95 cursor-pointer"
              title="Live Shopping Video Call with Family"
            >
              <span className="relative flex items-center justify-center">
                <Video className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              </span>
              <span className="hidden sm:inline">Live Shop</span>
              <span className="bg-emerald-400 text-stone-950 text-[9px] font-black px-1 rounded-sm">
                LIVE
              </span>
            </button>
          )}

          {/* Live WhatsApp Order Button */}
          <a
            href="https://wa.me/27630718449"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white p-2 sm:px-2.5 sm:py-1.5 rounded-xl font-bold text-xs shadow-xs border border-emerald-300/50 transition-all active:scale-95 cursor-pointer"
            title="Live WhatsApp Order (+27 63 071 8449)"
            aria-label="Live WhatsApp Order"
          >
            <span className="relative flex items-center justify-center">
              <svg className="w-4 h-4 fill-current text-white group-hover:rotate-12 transition-transform" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-0.999 3.648 3.742-0.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.375-.883-.71-1.48-1.588-1.653-1.886-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.422s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-200 rounded-full animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-white rounded-full" />
            </span>
            <span className="hidden md:inline font-bold text-[11px] whitespace-nowrap">WhatsApp</span>
          </a>

          {/* WhatsApp Fallback Simulator Button */}
          {onOpenWhatsAppSim && (
            <button
              onClick={onOpenWhatsAppSim}
              className="group relative flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white p-2 sm:px-2.5 sm:py-1.5 rounded-xl font-bold text-xs shadow-xs border border-emerald-400/50 transition-all active:scale-95 cursor-pointer"
              title="WhatsApp Fallback Simulator (Order via Voice & Text Simulation)"
              aria-label="WhatsApp Fallback Simulator"
            >
              <span className="relative flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-emerald-200 group-hover:rotate-12 transition-transform" />
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
              </span>
              <span className="hidden md:inline font-bold text-[11px] whitespace-nowrap">WA Sim</span>
            </button>
          )}

          {/* Clickable Currency Selector Dropdown */}
          <div className="relative flex items-center bg-[#a3153c] hover:bg-[#921134] rounded-xl border border-white/20 shadow-sm transition-all">
            <div className="flex items-center gap-1 pl-2.5 pr-1 py-1 text-xs font-bold text-white pointer-events-none">
              <span className="text-sm">{currentCurrencyInfo.flag}</span>
              <span className="text-[#FFB81C] font-black">{currentCurrencyInfo.symbol}</span>
              <span className="hidden xs:inline text-stone-100">{currentCurrencyInfo.code}</span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-200 ml-0.5" />
            </div>

            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as Currency)}
              aria-label="Select Currency"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-stone-900 bg-white"
            >
              {ALL_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code} className="text-stone-900 font-medium py-1">
                  {c.flag} {c.code} ({c.symbol}) - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cart Trigger */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-1.5 bg-[#002D62] hover:bg-[#001D42] text-white px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-md border border-[#003B80] transition-all active:scale-95 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Cart</span>
            {totalItemCount > 0 && (
              <span className="bg-[#FFB81C] text-[#002D62] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                {totalItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};


