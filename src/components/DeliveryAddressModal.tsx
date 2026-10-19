import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Store, 
  Navigation, 
  Search, 
  Check, 
  X, 
  Building2, 
  Compass, 
  Truck, 
  CheckCircle2, 
  AlertCircle,
  Phone,
  Info
} from 'lucide-react';
import { Member, DeliveryAddress, DeliveryType, StoreId } from '../types';

interface DeliveryAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  onSaveAddress: (memberId: string, address: DeliveryAddress) => void;
}

// Store Pickup Locations Registry across Zimbabwe & SA (Exclusively TM Pick n Pay)
export const AVAILABLE_PICKUP_STORES: Array<{
  id: StoreId;
  name: string;
  city: string;
  address: string;
  badge: string;
  hours: string;
  lat: number;
  lng: number;
}> = [
  {
    id: 'TM_PNP',
    name: 'TM Pick n Pay Msasa Hyper (Harare)',
    city: 'Harare, Zimbabwe',
    address: 'Mutare Road & Harrow Rd, Msasa Industrial, Harare',
    badge: 'Express Pickup in 1 Hour',
    hours: 'Mon-Sun 7:00 AM - 8:00 PM',
    lat: -17.8345,
    lng: 31.1158
  },
  {
    id: 'TM_PNP',
    name: 'Pick n Pay Borrowdale (Sam Levy’s Village)',
    city: 'Harare, Zimbabwe',
    address: 'Borrowdale Road, Sam Levy\'s Village, Harare',
    badge: 'Premium Express Locker',
    hours: 'Mon-Sun 7:30 AM - 8:30 PM',
    lat: -17.7583,
    lng: 31.0881
  },
  {
    id: 'TM_PNP',
    name: 'TM Pick n Pay (Bulawayo Hyper)',
    city: 'Bulawayo, Zimbabwe',
    address: '9th Avenue & Fife Street, Bulawayo CBD',
    badge: 'Same-Day Click & Collect',
    hours: 'Mon-Sat 7:30 AM - 7:30 PM | Sun 8:30 AM - 3:00 PM',
    lat: -20.1569,
    lng: 28.5833
  },
  {
    id: 'TM_PNP',
    name: 'Pick n Pay Bradfield (Bulawayo)',
    city: 'Bulawayo, Zimbabwe',
    address: 'Zemco Complex, Hillside Rd, Bradfield, Bulawayo',
    badge: 'Rapid Counter Pickup',
    hours: 'Mon-Sun 8:00 AM - 7:00 PM',
    lat: -20.1772,
    lng: 28.5995
  },
  {
    id: 'TM_PNP',
    name: 'Pick n Pay Gweru Megawatt (Midlands)',
    city: 'Gweru, Zimbabwe',
    address: 'Megawatt Complex, Robert Mugabe Way, Gweru CBD',
    badge: 'Fast Counter Pickup',
    hours: 'Mon-Sat 7:30 AM - 6:30 PM',
    lat: -19.4583,
    lng: 29.8167
  },
  {
    id: 'TM_PNP',
    name: 'Pick n Pay Mutare Main (Manicaland)',
    city: 'Mutare, Zimbabwe',
    address: '104 Herbert Chitepo Street, Mutare CBD',
    badge: 'Same-Day Click & Collect',
    hours: 'Mon-Sat 7:30 AM - 6:30 PM',
    lat: -18.9728,
    lng: 32.6695
  },
  {
    id: 'TM_PNP',
    name: 'Pick n Pay SA Export Depot (Joburg ➔ Zim)',
    city: 'Johannesburg, South Africa',
    address: 'City Deep Logistics Corridor, Heidelberg Rd, Johannesburg',
    badge: 'Cross-Border Export Depot',
    hours: 'Mon-Fri 7:00 AM - 5:00 PM',
    lat: -26.2201,
    lng: 28.0825
  },
];

// Pre-configured popular address presets for fast offline / one-click selection
const PRESET_LOCATIONS = [
  { label: 'Harare CBD', line: 'Samora Machel Ave', city: 'Harare', country: 'Zimbabwe', lat: -17.8292, lng: 31.0522 },
  { label: 'Avondale, Harare', line: 'King George Road', city: 'Harare', country: 'Zimbabwe', lat: -17.7850, lng: 31.0380 },
  { label: 'Eastlea, Harare', line: 'Enterprise Road', city: 'Harare', country: 'Zimbabwe', lat: -17.8200, lng: 31.0800 },
  { label: 'Chitungwiza Unit A', line: 'Seke Road & Makoni Centre', city: 'Chitungwiza', country: 'Zimbabwe', lat: -18.0123, lng: 31.0754 },
  { label: 'Bulawayo Suburbs', line: 'Fife Street & 12th Ave', city: 'Bulawayo', country: 'Zimbabwe', lat: -20.1569, lng: 28.5833 },
  { label: 'Mutare Sakubva', line: 'Herbert Chitepo St', city: 'Mutare', country: 'Zimbabwe', lat: -18.9728, lng: 32.6694 },
  { label: 'Sandton, Joburg', line: '42 Sandton Drive', city: 'Johannesburg', country: 'South Africa', lat: -26.1076, lng: 28.0567 },
  { label: 'London Westminster', line: '14 Oxford Street', city: 'London', country: 'United Kingdom', lat: 51.5154, lng: -0.1410 }
];

export const DeliveryAddressModal: React.FC<DeliveryAddressModalProps> = ({
  isOpen,
  onClose,
  member,
  onSaveAddress,
}) => {
  const initialAddress = member.deliveryAddress || {
    type: 'DOOR_DELIVERY',
    addressLine: member.location,
    city: member.location.split(',')[0] || 'Harare',
    country: member.location.split(',')[1]?.trim() || 'Zimbabwe',
    instructions: ''
  };

  const [deliveryType, setDeliveryType] = useState<DeliveryType>(initialAddress.type || 'DOOR_DELIVERY');
  const [addressLine, setAddressLine] = useState<string>(initialAddress.addressLine || '');
  const [suburb, setSuburb] = useState<string>(initialAddress.suburb || '');
  const [city, setCity] = useState<string>(initialAddress.city || '');
  const [country, setCountry] = useState<string>(initialAddress.country || 'Zimbabwe');
  const [instructions, setInstructions] = useState<string>(initialAddress.instructions || '');
  const [lat, setLat] = useState<number | undefined>(initialAddress.lat || -17.8292);
  const [lng, setLng] = useState<number | undefined>(initialAddress.lng || 31.0522);
  const [selectedStoreId, setSelectedStoreId] = useState<StoreId>(initialAddress.storeId || 'TM_PNP');

  // Search & Free Map Autofind state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Sync if member changes
  useEffect(() => {
    if (member?.deliveryAddress) {
      setDeliveryType(member.deliveryAddress.type);
      setAddressLine(member.deliveryAddress.addressLine);
      setSuburb(member.deliveryAddress.suburb || '');
      setCity(member.deliveryAddress.city);
      setCountry(member.deliveryAddress.country);
      setInstructions(member.deliveryAddress.instructions || '');
      setLat(member.deliveryAddress.lat);
      setLng(member.deliveryAddress.lng);
      if (member.deliveryAddress.storeId) setSelectedStoreId(member.deliveryAddress.storeId);
    } else {
      setAddressLine(`${member.name}'s Residence, ${member.location}`);
      setCity(member.location.split(',')[0] || 'Harare');
    }
  }, [member]);

  // OpenStreetMap Nominatim Free Geocoding Search handler (with debouncing)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&addressdetails=1&limit=5`
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data || []);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.warn('Free OSM geocoding fallback active:', err);
        // Fallback filter local presets
        const filtered = PRESET_LOCATIONS.filter(
          p => p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
               p.city.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filtered.map(p => ({
          display_name: `${p.line}, ${p.city}, ${p.country}`,
          address: { road: p.line, city: p.city, country: p.country },
          lat: String(p.lat),
          lon: String(p.lng)
        })));
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelectSearchResult = (result: any) => {
    const displayName = result.display_name || '';
    const parts = displayName.split(',');
    const mainStreet = parts[0] || searchQuery;
    const detectedCity = result.address?.city || result.address?.town || result.address?.suburb || parts[1]?.trim() || city;
    const detectedCountry = result.address?.country || parts[parts.length - 1]?.trim() || country;

    setAddressLine(mainStreet);
    setSuburb(result.address?.suburb || parts[1]?.trim() || '');
    setCity(detectedCity);
    setCountry(detectedCountry);
    if (result.lat && result.lon) {
      setLat(parseFloat(result.lat));
      setLng(parseFloat(result.lon));
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSave = () => {
    let finalAddress: DeliveryAddress;

    if (deliveryType === 'STORE_PICKUP') {
      const storeObj = AVAILABLE_PICKUP_STORES.find(s => s.id === selectedStoreId) || AVAILABLE_PICKUP_STORES[0];
      finalAddress = {
        type: 'STORE_PICKUP',
        addressLine: storeObj.address,
        city: storeObj.city.split(',')[0],
        country: storeObj.city.split(',')[1]?.trim() || 'Zimbabwe',
        storeId: storeObj.id,
        storeName: storeObj.name,
        instructions: instructions || 'Present order verification barcode or WhatsApp code at pickup counter.',
        lat: storeObj.lat,
        lng: storeObj.lng
      };
    } else {
      finalAddress = {
        type: 'DOOR_DELIVERY',
        addressLine: addressLine || `${member.name}'s Address`,
        suburb,
        city: city || 'Harare',
        country: country || 'Zimbabwe',
        instructions: instructions || 'Deliver directly to recipient at front gate.',
        lat: lat || -17.8292,
        lng: lng || 31.0522
      };
    }

    onSaveAddress(member.id, finalAddress);
    onClose();
  };

  const selectedStore = AVAILABLE_PICKUP_STORES.find(s => s.id === selectedStoreId) || AVAILABLE_PICKUP_STORES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden my-auto">
        {/* Header Bar */}
        <div className="bg-[#1a115e] text-white p-4 sm:p-5 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <img
              src={member.avatar}
              alt={member.name}
              className="w-11 h-11 rounded-full object-cover border-2 border-[#ffb81c] shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-white">
                  Delivery Destination for {member.name}
                </h3>
                <span className="bg-[#ffb81c] text-[#1a115e] text-[10px] font-black px-2 py-0.5 rounded-full">
                  {member.role}
                </span>
              </div>
              <p className="text-xs text-stone-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#ffb81c]" />
                <span>Base Region: {member.location}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-stone-300 hover:text-white bg-white/10 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Fulfillment Mode Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
            <button
              type="button"
              onClick={() => setDeliveryType('DOOR_DELIVERY')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs transition-all ${
                deliveryType === 'DOOR_DELIVERY'
                  ? 'bg-[#1a115e] text-white shadow-md'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Truck className="w-4 h-4 text-[#ffb81c]" />
              <span>Door-to-Door Delivery</span>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryType('STORE_PICKUP')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs transition-all ${
                deliveryType === 'STORE_PICKUP'
                  ? 'bg-[#1a115e] text-white shadow-md'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Store className="w-4 h-4 text-[#ffb81c]" />
              <span>Store Click & Collect</span>
            </button>
          </div>

          {/* MODE A: DOOR-TO-DOOR DELIVERY WITH FREE MAP AUTO-FIND */}
          {deliveryType === 'DOOR_DELIVERY' ? (
            <div className="space-y-4">
              {/* Free Map Search Input */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-black text-stone-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-[#298bf5]" />
                    <span>Autofind Address using Free OpenStreetMap:</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-extrabold border border-emerald-200">
                    🟢 Free Live Maps Geocoding
                  </span>
                </label>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type address e.g. Samora Machel Ave Harare, Fife St Bulawayo..."
                    className="w-full pl-10 pr-9 py-2.5 bg-stone-50 border-2 border-stone-200 focus:border-[#298bf5] focus:bg-white rounded-2xl text-xs sm:text-sm font-semibold text-stone-900 outline-none transition-all shadow-2xs"
                  />
                  {isSearching && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#298bf5] animate-pulse">
                      Searching...
                    </span>
                  )}
                  {searchQuery && !isSearching && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 z-30 mt-1 bg-white border-2 border-[#298bf5] rounded-2xl shadow-xl max-h-52 overflow-y-auto p-1.5 space-y-1">
                    <div className="text-[10px] font-bold text-stone-400 px-2 py-1 uppercase tracking-wider">
                      Matching OpenStreetMap Locations:
                    </div>
                    {searchResults.map((res, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSearchResult(res)}
                        className="w-full text-left p-2.5 hover:bg-stone-50 rounded-xl transition-colors flex items-start gap-2 border-b border-stone-100 last:border-none"
                      >
                        <MapPin className="w-4 h-4 text-[#298bf5] flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="font-bold text-stone-900 text-xs truncate">
                            {res.display_name}
                          </p>
                          <span className="text-[10px] text-stone-500 font-medium block">
                            Lat: {res.lat ? parseFloat(res.lat).toFixed(4) : ''}, Lng: {res.lon ? parseFloat(res.lon).toFixed(4) : ''}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Popular Zimbabwe & SA Location Chips */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                    Quick Preset Destinations:
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {PRESET_LOCATIONS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAddressLine(preset.line);
                          setCity(preset.city);
                          setCountry(preset.country);
                          setLat(preset.lat);
                          setLng(preset.lng);
                        }}
                        className="bg-stone-100 hover:bg-[#298bf5]/10 hover:border-[#298bf5] text-stone-700 hover:text-[#1a115e] px-2.5 py-1 rounded-xl text-[11px] font-bold border border-stone-200 whitespace-nowrap transition-all"
                      >
                        📍 {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-extrabold text-stone-700 block mb-1">
                    Street Address / House No.
                  </label>
                  <input
                    type="text"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="e.g. 78 Samora Machel Ave"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:border-[#1a115e] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-stone-700 block mb-1">
                    Suburb / Township / Ward
                  </label>
                  <input
                    type="text"
                    value={suburb}
                    onChange={(e) => setSuburb(e.target.value)}
                    placeholder="e.g. Eastlea / Sakubva / Seke"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:border-[#1a115e] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-stone-700 block mb-1">
                    City / Town
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Harare / Bulawayo"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:border-[#1a115e] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-stone-700 block mb-1">
                    Country
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:border-[#1a115e] outline-none cursor-pointer"
                  >
                    <option value="Zimbabwe">Zimbabwe 🇿🇼</option>
                    <option value="South Africa">South Africa 🇿🇦</option>
                    <option value="United Kingdom">United Kingdom 🇬🇧</option>
                    <option value="Australia">Australia 🇦🇺</option>
                  </select>
                </div>
              </div>

              {/* Special Delivery Instructions */}
              <div>
                <label className="text-[11px] font-extrabold text-stone-700 block mb-1">
                  Delivery Landmark & Driver Notes:
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={2}
                  placeholder="e.g. Black gate, near borehole. Call recipient on WhatsApp before arrival."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-stone-900 focus:bg-white focus:border-[#1a115e] outline-none resize-none"
                />
              </div>

              {/* Interactive OpenStreetMap Pin Map Visual Card */}
              {lat && lng && (
                <div className="bg-stone-900 text-white rounded-2xl p-3 border border-stone-800 space-y-2 relative overflow-hidden shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#ffb81c] animate-spin" style={{ animationDuration: '10s' }} />
                      <span className="font-extrabold text-xs text-stone-200">
                        Map Pin Location Preview
                      </span>
                    </div>
                    <span className="bg-[#1a115e] text-[#ffb81c] text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-[#ffb81c]/30">
                      GPS: {lat.toFixed(4)}, {lng.toFixed(4)}
                    </span>
                  </div>

                  {/* OpenStreetMap Embedded Interactive Frame */}
                  <div className="h-32 w-full rounded-xl overflow-hidden border border-stone-700 relative bg-stone-950">
                    <iframe
                      title="OpenStreetMap Location Preview"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.015}%2C${lat - 0.015}%2C${lng + 0.015}%2C${lat + 0.015}&layer=mapnik&marker=${lat}%2C${lng}`}
                      className="w-full h-full opacity-90 hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute bottom-1.5 left-1.5 bg-stone-950/90 text-[#ffb81c] text-[9px] font-black px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1 border border-stone-700">
                      <MapPin className="w-3 h-3 text-[#ffb81c]" />
                      <span>{addressLine || 'Selected Location'}, {city}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* MODE B: STORE CLICK & COLLECT PICKUP */
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-stone-800 block mb-2">
                  Select Regional Store Branch for Click & Collect:
                </label>

                <div className="grid grid-cols-1 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {AVAILABLE_PICKUP_STORES.map((st) => {
                    const isSelected = selectedStoreId === st.id;

                    return (
                      <div
                        key={st.id}
                        onClick={() => setSelectedStoreId(st.id)}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-amber-50/80 border-[#1a115e] shadow-md ring-2 ring-[#ffb81c]/50'
                            : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl flex-shrink-0 ${
                            isSelected ? 'bg-[#1a115e] text-[#ffb81c]' : 'bg-stone-200 text-stone-600'
                          }`}>
                            <Store className="w-5 h-5" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm">
                                {st.name}
                              </h4>
                              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-300">
                                {st.badge}
                              </span>
                            </div>

                            <p className="text-xs text-stone-600 mt-0.5 font-medium">
                              {st.address}
                            </p>
                            <span className="text-[10px] text-stone-500 font-semibold block mt-1">
                              🕒 {st.hours}
                            </span>
                          </div>
                        </div>

                        <div className="flex-shrink-0 pt-1">
                          {isSelected ? (
                            <div className="w-6 h-6 rounded-full bg-[#1a115e] text-white flex items-center justify-center">
                              <Check className="w-4 h-4 text-[#ffb81c]" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-stone-300" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Instructions for Pickup */}
              <div>
                <label className="text-[11px] font-extrabold text-stone-700 block mb-1">
                  Recipient Pickup Contact & Instructions:
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={2}
                  placeholder={`e.g. ${member.name} will present ID & WhatsApp code at ${selectedStore.name} counter.`}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-stone-900 focus:bg-white focus:border-[#1a115e] outline-none resize-none"
                />
              </div>

              {/* Info Box */}
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs font-semibold">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Free Click & Collect Advantage</p>
                  <p className="text-[11px] text-amber-800/90 mt-0.5">
                    No delivery fees apply for store pickup. An instant SMS and WhatsApp voucher code will be dispatched to {member.name}'s phone ({member.phone || 'registered number'}) as soon as order is ready.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="bg-stone-50 p-4 border-t border-stone-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-300 font-extrabold text-xs text-stone-700 hover:bg-stone-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="bg-[#1a115e] hover:bg-[#298bf5] text-white font-extrabold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-[#ffb81c]" />
            <span>Save Delivery Destination for {member.name.split(' ')[0]}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
