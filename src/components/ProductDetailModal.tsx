import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Tag, 
  Store, 
  ShieldCheck, 
  Truck, 
  ShoppingBag,
  Sparkles,
  Heart,
  Globe,
  Image as ImageIcon
} from 'lucide-react';
import { Product, Currency, Member } from '../types';
import { formatPrice } from '../utils/currency';
import { getProductImagePath, handleProductImageError } from '../utils/productImages';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  members: Member[];
  selectedMemberId?: string;
  onAddToCart: (productId: string, memberId: string, note?: string, quantity?: number) => void;
  onShowToast?: (msg: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  currency,
  members,
  selectedMemberId = 'mem-1',
  onAddToCart,
  onShowToast,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isAdded, setIsAdded] = useState<boolean>(false);
  const [activeImageTab, setActiveImageTab] = useState<'primary' | 'facebook' | 'base64'>('primary');

  if (!isOpen || !product) return null;

  const slug = product.slug || product.id;
  const dedicatedProductUrl = product.dedicatedLink || `https://www.pnpexpress.vercel.app/${slug}`;
  const directImageUrl = product.imageUrl || `https://www.pnpexpress.vercel.app/${slug}_image_01.jpg`;
  const facebookImageUrl = product.facebookImageUrl || `https://www.facebook.com/${slug}_image_001.jpg`;
  const imageSrc = getProductImagePath(product.image || product.imageUrl);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    if (onShowToast) {
      onShowToast(`📋 Copied ${label} to clipboard!`);
    }
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleAddToCart = () => {
    onAddToCart(product.id, selectedMemberId, `Added via dedicated link: ${slug}`, quantity);
    setIsAdded(true);
    if (onShowToast) {
      onShowToast(`🛒 Added ${quantity}x ${product.name} to Family Cart!`);
    }
    setTimeout(() => {
      setIsAdded(false);
    }, 1200);
  };

  const formattedPriceDisplay = currency === 'USD' 
    ? `USD ${product.priceUSD.toFixed(2)}`
    : formatPrice(product.priceUSD, currency);

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden my-auto">
        {/* Header Bar */}
        <div className="bg-[#C51D4A] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-[#FFB81C] text-[#002D62] text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
              Dedicated Product Link
            </span>
            <span className="text-xs font-mono font-bold text-rose-100 truncate max-w-[200px] sm:max-w-[320px]">
              /{slug}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Main Product Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-center">
            {/* Product Image Stage */}
            <div className="relative bg-stone-50 rounded-2xl p-4 border border-stone-200 flex items-center justify-center h-52 sm:h-64 overflow-hidden group">
              <img
                src={imageSrc}
                alt={product.name}
                onError={(e) => handleProductImageError(e, product.name, product.category)}
                className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute bottom-2 left-2 bg-[#002D62]/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> TM Supermarket Verified
              </span>
            </div>

            {/* Product Info & Pricing */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                  {product.category}
                </span>
                <span className="text-[10px] font-bold text-stone-500">
                  {product.brand}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-black text-stone-900 leading-tight">
                {product.name}
              </h2>

              {product.nativeName && (
                <div className="text-xs font-semibold text-[#0082C8] flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-[#D0021B]" />
                  <span>{product.nativeName}</span>
                </div>
              )}

              <div className="pt-2 border-t border-stone-100 flex items-baseline gap-3">
                <div className="text-xl sm:text-2xl font-black text-[#002D62]">
                  {formattedPriceDisplay}
                </div>
                <div className="text-xs text-stone-500">
                  ({product.unit})
                </div>
              </div>

              <div className="text-[11px] text-stone-600 space-y-1 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">ZiG Equivalent:</span>
                  <span className="font-bold text-stone-800">ZWG {product.priceZWG.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Rand Equivalent:</span>
                  <span className="font-bold text-stone-800">ZAR {product.priceZAR.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Fulfillment Tag:</span>
                  <span className="font-bold text-emerald-700">{product.fulfillmentTag}</span>
                </div>
              </div>

              {/* Quantity & Add to Cart Controls */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 h-10 border border-stone-300 rounded-xl bg-white text-center font-bold text-stone-800 text-sm focus:outline-none focus:border-[#C51D4A]"
                />
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 h-10 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#C51D4A] hover:bg-[#a8143a] text-white'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Added to Family Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add To Cart ({formattedPriceDisplay})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Dedicated URLs & Share Section */}
          <div className="bg-[#f8fafc] rounded-2xl p-3.5 sm:p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                <Globe className="w-4 h-4 text-[#002D62]" />
                <span>Dedicated Product Link & Asset URLs</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Public Live URLs
              </span>
            </div>

            {/* 1. Dedicated Product Page URL */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                <span>Dedicated Product Link:</span>
                <span className="text-[10px] text-slate-400 font-normal">Direct product landing page</span>
              </label>
              <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-300">
                <input
                  type="text"
                  readOnly
                  value={dedicatedProductUrl}
                  className="flex-1 text-xs font-mono text-slate-800 bg-transparent px-2 focus:outline-none select-all"
                />
                <button
                  onClick={() => handleCopy(dedicatedProductUrl, 'Product Link')}
                  className="bg-[#002D62] hover:bg-[#001D42] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copiedField === 'Product Link' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'Product Link' ? 'Copied' : 'Copy'}</span>
                </button>
                <a
                  href={`/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Open Dedicated Product URL"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* 2. Direct Product Image URL */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                <span>Direct Image URL (CDN / Static):</span>
                <span className="text-[10px] text-slate-400 font-normal">High-definition packshot</span>
              </label>
              <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-300">
                <input
                  type="text"
                  readOnly
                  value={directImageUrl}
                  className="flex-1 text-xs font-mono text-slate-800 bg-transparent px-2 focus:outline-none select-all"
                />
                <button
                  onClick={() => handleCopy(directImageUrl, 'Image URL')}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copiedField === 'Image URL' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'Image URL' ? 'Copied' : 'Copy'}</span>
                </button>
                <a
                  href={`/images/${slug}_image_01.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  title="View Direct Image"
                >
                  <ImageIcon className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* 3. Facebook / Social Catalog Image URL */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                <span>Facebook / Social Catalog Image URL:</span>
                <span className="text-[10px] text-slate-400 font-normal">Social media catalogue sync</span>
              </label>
              <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-300">
                <input
                  type="text"
                  readOnly
                  value={facebookImageUrl}
                  className="flex-1 text-xs font-mono text-slate-800 bg-transparent px-2 focus:outline-none select-all"
                />
                <button
                  onClick={() => handleCopy(facebookImageUrl, 'Facebook Image URL')}
                  className="bg-[#1877F2] hover:bg-[#0c63d4] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copiedField === 'Facebook Image URL' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'Facebook Image URL' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500">Quick Share:</span>
              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Check out ${product.name} on TM Pick n Pay Express: ${dedicatedProductUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 shadow-xs transition-all active:scale-95"
                >
                  <span>Share on WhatsApp</span>
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(dedicatedProductUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1877F2] hover:bg-[#0c63d4] text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 shadow-xs transition-all active:scale-95"
                >
                  <span>Share on Facebook</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
