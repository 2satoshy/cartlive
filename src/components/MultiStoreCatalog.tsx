import React, { useState, useMemo } from 'react';
import { 
  Store, 
  Search, 
  MapPin, 
  Check, 
  Plus, 
  Sparkles, 
  ShoppingBag, 
  Tag,
  Zap,
  Flame,
  Award,
  Apple,
  Coffee,
  Sun,
  Package,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Filter,
  RotateCcw,
  Clock,
  History
} from 'lucide-react';
import { Product, StoreId, ProductCategory, Currency, Member } from '../types';
import { formatPrice } from '../utils/currency';
import { ProductCard } from './ProductCard';

interface MultiStoreCatalogProps {
  products: Product[];
  members: Member[];
  currency: Currency;
  lowDataMode: boolean;
  onAddToCart: (productId: string, memberId: string, note?: string, quantity?: number) => void;
  onViewProduct?: (product: Product) => void;
}

const STORES: { id: string; name: string; region: string }[] = [
  { id: 'ALL', name: 'All TM Pick n Pay Branches', region: 'SA & ZIM' },
  { id: 'HARARE', name: 'TM Pick n Pay Harare', region: 'Msasa, Borrowdale, Avondale' },
  { id: 'BULAWAYO', name: 'TM Pick n Pay Bulawayo', region: 'Hyper & Bradfield' },
  { id: 'MIDLANDS', name: 'Pick n Pay Midlands', region: 'Gweru Megawatt & Kwekwe' },
  { id: 'MANICALAND', name: 'Pick n Pay Manicaland', region: 'Mutare Main & Rusape' },
  { id: 'SA_EXPORT', name: 'Pick n Pay SA Export Hub', region: 'Joburg / Musina ➔ Zim' },
];

const CATEGORY_ITEMS: { id: ProductCategory | 'ALL'; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'ALL', label: 'All Items', icon: <Package className="w-4 h-4" />, color: 'bg-[#298bf5]/15 text-[#298bf5]' },
  { id: 'Maize & Staples', label: 'Maize & Staples', icon: <Flame className="w-4 h-4" />, color: 'bg-amber-100 text-amber-900' },
  { id: 'Cooking & Oils', label: 'Cooking Oils', icon: <Award className="w-4 h-4" />, color: 'bg-yellow-100 text-yellow-900' },
  { id: 'Solar & Power', label: 'Solar Power', icon: <Sun className="w-4 h-4" />, color: 'bg-orange-100 text-orange-900' },
  { id: 'Meats & Proteins', label: 'Meats & Beef', icon: <Apple className="w-4 h-4" />, color: 'bg-rose-100 text-rose-900' },
  { id: 'Dairy & Fresh', label: 'Dairy & Fresh', icon: <Sparkles className="w-4 h-4" />, color: 'bg-sky-100 text-sky-900' },
  { id: 'Beverages & Tea', label: 'Beverages & Mazoe', icon: <Coffee className="w-4 h-4" />, color: 'bg-emerald-100 text-emerald-900' },
  { id: 'Household & Soap', label: 'Household Soap', icon: <Tag className="w-4 h-4" />, color: 'bg-indigo-100 text-indigo-900' },
  { id: 'Baby & Care', label: 'Baby & Diapers', icon: <Package className="w-4 h-4" />, color: 'bg-pink-100 text-pink-900' },
];

// (Previously Bought Meta moved to MyShopView.tsx)

export const MultiStoreCatalog: React.FC<MultiStoreCatalogProps> = ({
  products,
  members,
  currency,
  lowDataMode,
  onAddToCart,
  onViewProduct,
}) => {
  const [selectedStore, setSelectedStore] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState<'ALL' | 'UNDER_10' | '10_25' | 'OVER_25'>('ALL');
  const [sortBy, setSortBy] = useState<'RELEVANCE' | 'PRICE_LOW' | 'PRICE_HIGH' | 'NAME_AZ'>('RELEVANCE');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[1]?.id || members[0]?.id || 'mem-2'); // Gogo Moyo default
  const [addedAnimationId, setAddedAnimationId] = useState<string | null>(null);

  // Active filters count
  const activeFiltersCount = 
    (selectedStore !== 'ALL' ? 1 : 0) +
    (selectedCategory !== 'ALL' ? 1 : 0) +
    (priceFilter !== 'ALL' ? 1 : 0) +
    (searchQuery.trim() !== '' ? 1 : 0);

  const handleClearFilters = () => {
    setSelectedStore('ALL');
    setSelectedCategory('ALL');
    setPriceFilter('ALL');
    setSortBy('RELEVANCE');
    setSearchQuery('');
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      let matchStore = true;
      if (selectedStore === 'ALL') {
        matchStore = true;
      } else if (selectedStore === 'HARARE') {
        matchStore = product.fulfillmentTag === 'Harare Express' || product.storeName.includes('Harare') || product.storeName.includes('Borrowdale') || product.storeName.includes('Msasa') || product.storeName.includes('Avondale') || product.storeName.includes('Kamfinsa') || product.storeName.includes('Joina City');
      } else if (selectedStore === 'BULAWAYO') {
        matchStore = product.fulfillmentTag === 'Bulawayo Click & Collect' || product.storeName.includes('Bulawayo') || product.storeName.includes('Bradfield');
      } else if (selectedStore === 'MIDLANDS') {
        matchStore = product.storeName.includes('Gweru') || product.storeName.includes('Midlands') || product.fulfillmentTag === 'Nationwide Zim';
      } else if (selectedStore === 'MANICALAND') {
        matchStore = product.fulfillmentTag === 'Mutare Depot' || product.storeName.includes('Mutare');
      } else if (selectedStore === 'SA_EXPORT') {
        matchStore = product.fulfillmentTag === 'SA Export to Zim' || product.storeName.includes('SA Export') || product.storeName.includes('Joburg');
      } else {
        matchStore = product.storeId === selectedStore || product.storeName.toLowerCase().includes(selectedStore.toLowerCase());
      }
      const matchCat = selectedCategory === 'ALL' || product.category === selectedCategory;
      const matchSearch =
        searchQuery === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.nativeName && product.nativeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());

      let matchPrice = true;
      if (priceFilter === 'UNDER_10') matchPrice = product.priceUSD < 10;
      else if (priceFilter === '10_25') matchPrice = product.priceUSD >= 10 && product.priceUSD <= 25;
      else if (priceFilter === 'OVER_25') matchPrice = product.priceUSD > 25;

      return matchStore && matchCat && matchSearch && matchPrice;
    });

    if (sortBy === 'PRICE_LOW') {
      result.sort((a, b) => a.priceUSD - b.priceUSD);
    } else if (sortBy === 'PRICE_HIGH') {
      result.sort((a, b) => b.priceUSD - a.priceUSD);
    } else if (sortBy === 'NAME_AZ') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, selectedStore, selectedCategory, searchQuery, priceFilter, sortBy]);

  const getProductPriceString = (p: Product) => {
    return formatPrice(p.priceUSD, currency);
  };

  const handleAdd = (productId: string) => {
    onAddToCart(productId, selectedMemberId);
    setAddedAnimationId(productId);
    setTimeout(() => setAddedAnimationId(null), 1200);
  };

  return (
    <div className="space-y-4">
      {/* Search & Recipient Selector Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white rounded-2xl shadow-xs border border-stone-200 p-3 sm:p-4">
          {/* Search Box */}
          <div className="relative flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search maize meal (hupfu), oil (mafuta), Mazoe..."
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
              title="Smart ASAP Search"
            >
              <Sparkles className="w-4 h-4 text-[#ffb81c]" />
            </button>
          </div>

          {/* Recipient Selector */}
          <div className="flex items-center gap-2 bg-[#0082C8]/10 px-3 py-2 rounded-xl border border-[#0082C8]/30 text-xs">
            <span className="font-bold text-[#002D62] whitespace-nowrap">Adding for:</span>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="bg-white font-extrabold text-[#002D62] px-2.5 py-1 rounded-lg border border-[#0082C8]/40 focus:outline-none cursor-pointer text-xs"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.location})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white rounded-2xl shadow-xs border border-stone-200 p-3 sm:p-4 space-y-3">
          {/* Depot Line Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-stone-500 font-bold px-1">
              <div className="flex items-center gap-1.5 text-[#002D62]">
                <Store className="w-4 h-4 text-[#0082C8]" />
                <span>Pick n Pay Regional Supply Outlets:</span>
              </div>
              <span className="text-stone-500">{filteredProducts.length} Groceries Available</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {STORES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStore(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedStore === s.id
                      ? 'bg-[#002D62] text-white shadow-xs'
                      : 'bg-[#f2f4f7] text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {s.name} <span className="opacity-70 font-normal text-[10px]">({s.region})</span>
                </button>
              ))}
            </div>
          </div>
        
          {/* Category Round Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-stone-100">
            {CATEGORY_ITEMS.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#D0021B] text-white shadow-xs'
                    : 'bg-[#f2f4f7] text-stone-700 hover:bg-stone-200'
                }`}
              >
                <span className={`p-1 rounded-full ${cat.color} flex items-center justify-center`}>
                  {cat.icon}
                </span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Price Range & Sort Filter Bar */}
          <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Price Range filter pills */}
              <span className="font-bold text-stone-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-[#298bf5]" /> Price:
              </span>
              <div className="flex items-center gap-1">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'UNDER_10', label: 'Under $10' },
                  { id: '10_25', label: '$10 - $25' },
                  { id: 'OVER_25', label: '$25+' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPriceFilter(p.id as any)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      priceFilter === p.id
                        ? 'bg-[#002D62] text-white shadow-2xs'
                        : 'bg-[#f2f4f7] text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Sort Order Dropdown */}
              <div className="flex items-center gap-1 bg-[#f2f4f7] px-2.5 py-1 rounded-lg border border-stone-200">
                <ArrowUpDown className="w-3 h-3 text-stone-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-bold text-stone-700 text-[11px] focus:outline-none cursor-pointer"
                >
                  <option value="RELEVANCE">Featured</option>
                  <option value="PRICE_LOW">Price: Low to High</option>
                  <option value="PRICE_HIGH">Price: High to Low</option>
                  <option value="NAME_AZ">Name: A to Z</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 text-[11px] font-extrabold text-[#ff4f38] hover:text-[#d93b26] bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition-all"
                >
                  <X className="w-3 h-3" />
                  <span>Reset Filters ({activeFiltersCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      
      {/* Product Grid: 2 columns on Mobile, 3 or 4 columns on Tablet & Desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            currency={currency}
            selectedMemberId={selectedMemberId}
            lowDataMode={lowDataMode}
            onAddToCart={onAddToCart}
            onViewDetails={onViewProduct}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-2">
          <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
          <h4 className="font-bold text-stone-800 text-base">No items match your search</h4>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Try clearing your search query or selecting all supply outlets.
          </p>
          <button
            onClick={() => {
              setSelectedStore('ALL');
              setSelectedCategory('ALL');
              setSearchQuery('');
            }}
            className="mt-2 bg-[#002D62] text-[#FFB81C] px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

