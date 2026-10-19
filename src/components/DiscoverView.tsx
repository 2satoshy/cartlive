import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Flame, 
  Tag, 
  ShoppingCart, 
  Zap, 
  Gift, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  Sun, 
  Star,
  Search,
  Filter,
  ArrowUpDown,
  X,
  Package
} from 'lucide-react';
import { Product, Currency, Member } from '../types';
import { formatPrice } from '../utils/currency';

interface DiscoverViewProps {
  products: Product[];
  members: Member[];
  currency: Currency;
  onAddToCart: (product: Product, memberId: string, quantity?: number) => void;
  onOpenVoiceAI: () => void;
  onOpenWhatsAppSim: () => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  products,
  members,
  currency,
  onAddToCart,
  onOpenVoiceAI,
  onOpenWhatsAppSim,
}) => {
  const [addedBundleId, setAddedBundleId] = useState<string | null>(null);

  // Search and filter states for Discover deals
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [priceFilter, setPriceFilter] = useState<'ALL' | 'UNDER_40' | '40_70' | 'OVER_70'>('ALL');
  const [sortBy, setSortBy] = useState<'RECOMMENDED' | 'PRICE_LOW' | 'PRICE_HIGH' | 'DISCOUNT'>('RECOMMENDED');

  const formatPriceVal = (usd: number) => {
    return formatPrice(usd, currency);
  };

  const bundles = [
    {
      id: 'bundle-family-pack',
      title: 'Moyo Family Monthly Care Pack',
      tagline: 'Complete household staples bundle for Harare & Bulawayo',
      category: 'Staples',
      discount: '15% OFF BUNDLE',
      discountPercent: 15,
      priceUSD: 48.50,
      priceZAR: 921.50,
      priceZWG: 1358.00,
      oldPriceUSD: 57.00,
      badge: 'Bestseller',
      bgGradient: 'from-[#1a115e] via-[#241a7d] to-[#100a3d]',
      items: [
        'National Foods Pearl White Meal 10kg',
        'ZimGold Refined Cooking Oil 2L (x2)',
        'Huletts Pure White Sugar 2kg',
        'Mazoe Crush Orange Cordial 2L',
        'Royco Usavi Sauce Beef 75g (x5)',
      ],
      productIds: ['p1', 'p2', 'p3', 'p4'],
    },
    {
      id: 'bundle-braai-weekend',
      title: 'Weekend Shisa Nyama & Braai Box',
      tagline: 'Premium Grade A meats, boerewors & charcoal',
      category: 'Meat & Braai',
      discount: 'FREE SPICE PACK',
      discountPercent: 15,
      priceUSD: 34.00,
      priceZAR: 646.00,
      priceZWG: 952.00,
      oldPriceUSD: 40.00,
      badge: 'Weekend Special',
      bgGradient: 'from-[#7c2d12] via-[#9a3412] to-[#451a03]',
      items: [
        'Beef Stewing Steak Extra Lean 1kg',
        'Super Grade Pork Chops 1kg',
        'Texas Meats Traditional Boerewors 800g',
        'Mazoe Orange 2L & Chibuku Shake 1L',
      ],
      productIds: ['p5', 'p4'],
    },
    {
      id: 'bundle-solar-relief',
      title: 'Harare & Bulawayo Load Shedding Combo',
      tagline: 'Solar lighting, rechargeable emergency lamp & long-life tea',
      category: 'Solar & Power',
      discount: 'SA DEPOT SPECIAL',
      discountPercent: 14,
      priceUSD: 85.00,
      priceZAR: 1615.00,
      priceZWG: 2380.00,
      oldPriceUSD: 99.00,
      badge: 'Essential Solar',
      bgGradient: 'from-[#065f46] via-[#047857] to-[#022c22]',
      items: [
        'Lumin8 50W Solar Home Kit + 3 LED Bulbs',
        'Tanganda Tea Bags 100s Pack',
        'Nestle Everyday Milk Powder 400g',
        'Probrands Peanut Butter 500g',
      ],
      productIds: ['p7', 'p8'],
    },
    {
      id: 'bundle-gogo-breakfast',
      title: 'Gogo’s Morning Breakfast Basket',
      tagline: 'Nourishing porridge, tea bags, milk powder & spreads',
      category: 'Breakfast',
      discount: '12% OFF',
      discountPercent: 12,
      priceUSD: 24.50,
      priceZAR: 465.50,
      priceZWG: 686.00,
      oldPriceUSD: 28.00,
      badge: 'Breakfast Special',
      bgGradient: 'from-[#4c1d95] via-[#5b21b6] to-[#2e1065]',
      items: [
        'Tanganda Special Blend Tea 100s',
        'Nestle Everyday Milk Powder 400g',
        'Cerevita Instant Corn Cereal 500g',
        'Probrands Creamy Peanut Butter 500g',
      ],
      productIds: ['p8', 'p1'],
    },
    {
      id: 'bundle-mazoe-party',
      title: 'Zim Heritage Drinks & Refreshments Pack',
      tagline: 'Original Mazoe Crush, Soft Drinks & Instant Energy Drinks',
      category: 'Beverages',
      discount: 'BULK DISCOUNT',
      discountPercent: 18,
      priceUSD: 29.90,
      priceZAR: 568.10,
      priceZWG: 837.20,
      oldPriceUSD: 36.50,
      badge: 'Beverages',
      bgGradient: 'from-[#0369a1] via-[#0284c7] to-[#0c4a6e]',
      items: [
        'Mazoe Crush Orange Cordial 2L (x2)',
        'Mazoe Peach & Cream Cordial 2L',
        'Cascade Drink Orange 500ml (x6)',
        'Tanganda Tea Bags 50s',
      ],
      productIds: ['p4'],
    },
  ];

  // Active filters count
  const activeFiltersCount = 
    (selectedCategory !== 'ALL' ? 1 : 0) +
    (priceFilter !== 'ALL' ? 1 : 0) +
    (searchQuery.trim() !== '' ? 1 : 0);

  const handleClearFilters = () => {
    setSelectedCategory('ALL');
    setPriceFilter('ALL');
    setSortBy('RECOMMENDED');
    setSearchQuery('');
  };

  // Filtered and sorted bundles
  const filteredBundles = useMemo(() => {
    let result = bundles.filter((b) => {
      const matchSearch =
        searchQuery === '' ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.badge.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.items.some((item) => item.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        selectedCategory === 'ALL' || b.badge === selectedCategory || b.category === selectedCategory;

      let matchPrice = true;
      if (priceFilter === 'UNDER_40') matchPrice = b.priceUSD < 40;
      else if (priceFilter === '40_70') matchPrice = b.priceUSD >= 40 && b.priceUSD <= 70;
      else if (priceFilter === 'OVER_70') matchPrice = b.priceUSD > 70;

      return matchSearch && matchCategory && matchPrice;
    });

    if (sortBy === 'PRICE_LOW') {
      result.sort((a, b) => a.priceUSD - b.priceUSD);
    } else if (sortBy === 'PRICE_HIGH') {
      result.sort((a, b) => b.priceUSD - a.priceUSD);
    } else if (sortBy === 'DISCOUNT') {
      result.sort((a, b) => b.discountPercent - a.discountPercent);
    }

    return result;
  }, [bundles, searchQuery, selectedCategory, priceFilter, sortBy]);

  const handleAddBundle = (bundle: typeof bundles[0]) => {
    // Add first 2 matching products from catalog
    bundle.productIds.forEach((pId) => {
      const prod = products.find((p) => p.id === pId) || products[0];
      if (prod) {
        onAddToCart(prod.id, members[0]?.id || 'm1', 'Added from Discover Hamper', 1);
      }
    });
    setAddedBundleId(bundle.id);
    setTimeout(() => setAddedBundleId(null), 2500);
  };

  const trendingVoicePrompts = [
    { lang: 'Shona', prompt: 'Wedzera hupfu hwe National Foods 10kg ne mafuta 2L mu cart', label: 'Maize & Oil Request' },
    { lang: 'Ndebele', prompt: 'Faka amasi, impuphu ye 10kg le shukela ku family cart', label: 'Staples & Milk Request' },
    { lang: 'English', prompt: 'Add 2 packs of Mazoe Orange and beef chops for Gogo', label: 'Family Special' },
  ];

  return (
    <div className="space-y-6 pb-20 sm:pb-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#1a115e] via-[#241a7d] to-[#100a3d] text-white rounded-2xl p-5 sm:p-7 shadow-md border border-[#2a1d82] relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="bg-[#ff4f38] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Discover & Deals
            </span>
            <span className="bg-[#ffb81c] text-[#1a115e] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Curated Family Packs
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
            Popular Diaspora Bundles & Weekly Deals
          </h2>

          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Save up to 20% on pre-packaged grocery hampers directly dispatched from OK Zim, Pick n Pay & SA Export Depots to Harare, Bulawayo, Mutare & Gweru.
          </p>

          <div className="pt-2 flex flex-wrap gap-2">
            <button
              onClick={onOpenVoiceAI}
              className="bg-[#ffb81c] hover:bg-[#ffc63b] text-[#1a115e] px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 text-[#1a115e]" />
              <span>Ask Voice AI for Bundles</span>
            </button>
            <button
              onClick={onOpenWhatsAppSim}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow active:scale-95 transition-all"
            >
              <Zap className="w-4 h-4 text-white" />
              <span>WhatsApp Voice Bundles</span>
            </button>
          </div>
        </div>

        <div className="absolute right-[-20px] bottom-[-20px] opacity-15 text-white pointer-events-none hidden md:block">
          <Gift className="w-56 h-56" />
        </div>
      </div>

      {/* Search and Filter Box for Deals & Bundles */}
      <div className="bg-white rounded-2xl shadow-xs border border-stone-200 p-3.5 sm:p-5 space-y-3.5">
        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals, hampers, braai boxes, solar kits, tea..."
              className="w-full pl-9 pr-8 py-2.5 bg-[#f2f4f7] text-stone-900 text-sm rounded-xl border border-transparent focus:border-[#298bf5] focus:bg-white focus:outline-none transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => setSearchQuery(searchQuery)}
            className="bg-[#298bf5] hover:bg-[#1f7cd9] text-white p-2.5 rounded-xl flex items-center justify-center shadow-xs flex-shrink-0 transition-all active:scale-95"
            title="Search Bundles"
          >
            <Sparkles className="w-4 h-4 text-[#ffb81c]" />
          </button>
        </div>

        {/* Filter Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
          {[
            { id: 'ALL', label: 'All Deals' },
            { id: 'Staples', label: 'Staples' },
            { id: 'Meat & Braai', label: 'Shisa Nyama & Braai' },
            { id: 'Solar & Power', label: 'Solar Power' },
            { id: 'Breakfast', label: 'Breakfast Basket' },
            { id: 'Beverages', label: 'Beverages & Mazoe' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#ff4f38] text-white shadow-xs'
                  : 'bg-[#f2f4f7] text-stone-700 hover:bg-stone-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Price & Sort Row */}
        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-stone-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#298bf5]" /> Price:
            </span>
            <div className="flex items-center gap-1">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'UNDER_40', label: 'Under $40' },
                { id: '40_70', label: '$40 - $70' },
                { id: 'OVER_70', label: '$70+' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPriceFilter(p.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    priceFilter === p.id
                      ? 'bg-[#1a115e] text-white shadow-2xs'
                      : 'bg-[#f2f4f7] text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 bg-[#f2f4f7] px-2.5 py-1 rounded-lg border border-stone-200">
              <ArrowUpDown className="w-3 h-3 text-stone-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-stone-700 text-[11px] focus:outline-none cursor-pointer"
              >
                <option value="RECOMMENDED">Recommended</option>
                <option value="PRICE_LOW">Price: Low to High</option>
                <option value="PRICE_HIGH">Price: High to Low</option>
                <option value="DISCOUNT">Highest Discount %</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 text-[11px] font-extrabold text-[#ff4f38] hover:text-[#d93b26] bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition-all"
              >
                <X className="w-3 h-3" />
                <span>Reset ({activeFiltersCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Featured Bundles Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#ff4f38]" />
            <h3 className="text-lg font-black text-stone-900 tracking-tight">
              Top Value Family Grocery Bundles
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-semibold">{filteredBundles.length} Bundles Available</span>
        </div>

        {filteredBundles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredBundles.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className={`bg-gradient-to-r ${b.bgGradient} p-4 text-white relative`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="bg-[#ffb81c] text-[#1a115e] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      {b.badge}
                    </span>
                    <span className="bg-[#ff4f38] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      {b.discount}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-base leading-tight text-white mb-1">
                    {b.title}
                  </h4>
                  <p className="text-xs text-stone-200/90 leading-snug">
                    {b.tagline}
                  </p>
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-stone-400 block mb-1.5 uppercase tracking-wider">
                      Bundle Includes:
                    </span>
                    <ul className="space-y-1">
                      {b.items.map((item, idx) => (
                        <li key={idx} className="text-xs text-stone-700 flex items-start gap-1.5 font-medium">
                          <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between mt-3">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-[#1a115e]">
                          {formatPriceVal(b.priceUSD)}
                        </span>
                        <span className="text-xs text-stone-400 line-through font-semibold">
                          {formatPriceVal(b.oldPriceUSD)}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-500 block font-mono">
                        Includes Depot Packing
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddBundle(b)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow transition-all active:scale-95 ${
                        addedBundleId === b.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#ff4f38] hover:bg-[#ff634a] text-white'
                      }`}
                    >
                      {addedBundleId === b.id ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Added Bundle!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          <span>Add Bundle</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-2">
            <Package className="w-10 h-10 text-stone-300 mx-auto" />
            <h4 className="font-bold text-stone-800 text-base">No bundles match your search or filters</h4>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Try adjusting your search query or price range to find available hampers.
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-2 bg-[#1a115e] text-[#ffb81c] px-4 py-2 rounded-xl text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Popular Voice Commands in Shona & Ndebele */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#298bf5]" />
          <div>
            <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
              Trending Voice AI Commands in Local Languages
            </h3>
            <p className="text-xs text-stone-500">
              Tap any command to test multilingual voice ordering instantly
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {trendingVoicePrompts.map((vp, i) => (
            <div
              key={i}
              onClick={onOpenVoiceAI}
              className="p-3 bg-[#f8fafc] hover:bg-blue-50/80 rounded-xl border border-stone-200 hover:border-[#298bf5]/40 transition-all cursor-pointer text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1a115e] text-[11px]">{vp.lang}</span>
                <span className="text-[10px] bg-blue-100 text-[#298bf5] font-bold px-1.5 py-0.2 rounded">
                  {vp.label}
                </span>
              </div>
              <p className="font-medium text-stone-800 text-[11px] italic">
                "{vp.prompt}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
