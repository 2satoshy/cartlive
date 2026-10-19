import { Product, Member, ExchangeRates } from '../types.js';
import { PRODUCT_BASE64_IMAGES } from './productImageBase64.js';

export const INITIAL_EXCHANGE_RATES: ExchangeRates = {
  USD_ZAR: 18.50, // 1 USD = 18.50 South African Rand
  USD_ZWG: 26.80, // 1 USD = 26.80 Zimbabwe Gold (ZiG / ZWG)
  USD_EUR: 0.92,
  USD_GBP: 0.79,
  USD_AUD: 1.54,
  lastUpdated: 'Live Interbank Rate'
};

export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Tastic Rice Parboiled Long Grain (5kg)',
    nativeName: 'Mupunga weTastic / Ilayisi',
    brand: 'Tastic SA',
    category: 'Maize & Staples',
    storeId: 'TM_PNP',
    storeName: 'TM Pick n Pay Msasa Hyper (Harare)',
    priceUSD: 6.80,
    priceZAR: 125.80,
    priceZWG: 182.24,
    unit: '5kg bag',
    fulfillmentTag: 'Harare Express',
    inStock: true,
    featured: true,
    slug: 'tastic_rice',
    productUrl: 'https://www.pnpexpress.vercel.app/tastic_rice',
    dedicatedLink: 'https://www.pnpexpress.vercel.app/tastic_rice',
    imageUrl: 'https://www.pnpexpress.vercel.app/tastic_rice_image_01.jpg',
    imageUrls: [
      'https://www.pnpexpress.vercel.app/tastic_rice_image_01.jpg',
      'https://www.pnpexpress.vercel.app/images/tastic_rice.jpg',
      'https://www.facebook.com/tastic_rice_image_001.jpg'
    ],
    facebookImageUrl: 'https://www.facebook.com/tastic_rice_image_001.jpg',
    image: PRODUCT_BASE64_IMAGES['tastic_rice']
  },
  {
    id: 'prod-2',
    name: 'White Star Super Maize Meal (5kg)',
    nativeName: 'Hupfu hweSona / Impuphu',
    brand: 'White Star SA',
    category: 'Maize & Staples',
    storeId: 'TM_PNP',
    storeName: 'Pick n Pay SA Export Hub (Joburg ➔ Zim)',
    priceUSD: 4.50,
    priceZAR: 83.25,
    priceZWG: 120.60,
    unit: '5kg bag',
    fulfillmentTag: 'SA Export to Zim',
    inStock: true,
    featured: true,
    slug: 'white_star_maize',
    productUrl: 'https://www.pnpexpress.vercel.app/white_star_maize',
    dedicatedLink: 'https://www.pnpexpress.vercel.app/white_star_maize',
    imageUrl: 'https://www.pnpexpress.vercel.app/white_star_maize_image_01.jpg',
    imageUrls: [
      'https://www.pnpexpress.vercel.app/white_star_maize_image_01.jpg',
      'https://www.pnpexpress.vercel.app/images/white_star_maize.jpg',
      'https://www.facebook.com/white_star_maize_image_001.jpg'
    ],
    facebookImageUrl: 'https://www.facebook.com/white_star_maize_image_001.jpg',
    image: PRODUCT_BASE64_IMAGES['white_star_maize']
  },
  {
    id: 'prod-3',
    name: 'Fruit and Vegetable Box (10kg)',
    nativeName: 'Mubato weMiriwo neMichero / Imbhokisi Yeveshi',
    brand: 'Fresh Produce ZIM',
    category: 'Dairy & Fresh',
    storeId: 'TM_PNP',
    storeName: 'TM Pick n Pay Borrowdale (Harare)',
    priceUSD: 26.97,
    priceZAR: 499.00,
    priceZWG: 722.88,
    unit: '10kg crate box',
    fulfillmentTag: 'Bulawayo Click & Collect',
    inStock: true,
    featured: true,
    slug: 'fruit_veg_box',
    productUrl: 'https://www.pnpexpress.vercel.app/fruit_veg_box',
    dedicatedLink: 'https://www.pnpexpress.vercel.app/fruit_veg_box',
    imageUrl: 'https://www.pnpexpress.vercel.app/fruit_veg_box_image_01.jpg',
    imageUrls: [
      'https://www.pnpexpress.vercel.app/fruit_veg_box_image_01.jpg',
      'https://www.pnpexpress.vercel.app/images/fruit_veg_box.jpg',
      'https://www.facebook.com/fruit_veg_box_image_001.jpg'
    ],
    facebookImageUrl: 'https://www.facebook.com/fruit_veg_box_image_001.jpg',
    image: PRODUCT_BASE64_IMAGES['fruit_veg_box']
  },
  {
    id: 'prod-4',
    name: 'Sunfoil Pure Sunflower Oil (5 Litres)',
    nativeName: 'Mafuta eSurawari / Sunflower Oil',
    brand: 'Sunfoil SA',
    category: 'Cooking & Oils',
    storeId: 'TM_PNP',
    storeName: 'Pick n Pay SA Export Hub (Joburg ➔ Zim)',
    priceUSD: 8.20,
    priceZAR: 151.70,
    priceZWG: 219.76,
    unit: '5L bottle',
    fulfillmentTag: 'SA Export to Zim',
    inStock: true,
    slug: 'sunfoil_oil',
    productUrl: 'https://www.pnpexpress.vercel.app/sunfoil_oil',
    dedicatedLink: 'https://www.pnpexpress.vercel.app/sunfoil_oil',
    imageUrl: 'https://www.pnpexpress.vercel.app/sunfoil_oil_image_01.jpg',
    imageUrls: [
      'https://www.pnpexpress.vercel.app/sunfoil_oil_image_01.jpg',
      'https://www.pnpexpress.vercel.app/images/sunfoil_oil.jpg',
      'https://www.facebook.com/sunfoil_oil_image_001.jpg'
    ],
    facebookImageUrl: 'https://www.facebook.com/sunfoil_oil_image_001.jpg',
    image: PRODUCT_BASE64_IMAGES['sunfoil_oil_5l'] || PRODUCT_BASE64_IMAGES['sunfoil_oil']
  },
  {
    id: 'prod-5',
    name: 'Huletts SunSweet White Sugar (5kg)',
    nativeName: 'Chigaku / Unshukela',
    brand: 'Huletts ZIM',
    category: 'Maize & Staples',
    storeId: 'TM_PNP',
    storeName: 'TM Pick n Pay Avondale (Harare)',
    priceUSD: 5.90,
    priceZAR: 109.15,
    priceZWG: 158.12,
    unit: '5kg bag',
    fulfillmentTag: 'Harare Express',
    inStock: true,
    featured: true,
    slug: 'huletts_sugar',
    productUrl: 'https://www.pnpexpress.vercel.app/huletts_sugar',
    dedicatedLink: 'https://www.pnpexpress.vercel.app/huletts_sugar',
    imageUrl: 'https://www.pnpexpress.vercel.app/huletts_sugar_image_01.jpg',
    imageUrls: [
      'https://www.pnpexpress.vercel.app/huletts_sugar_image_01.jpg',
      'https://www.pnpexpress.vercel.app/images/huletts_sugar.jpg',
      'https://www.facebook.com/huletts_sugar_image_001.jpg'
    ],
    facebookImageUrl: 'https://www.facebook.com/huletts_sugar_image_001.jpg',
    image: PRODUCT_BASE64_IMAGES['huletts_sugar']
  },
  {
    id: 'prod-6',
    name: 'Mazoe Orange Crush Syrup (2 Litres)',
    nativeName: 'Mazoe eMuno ZIM / Cordial',
    brand: 'Schweppes ZIM',
    category: 'Beverages & Tea',
    storeId: 'TM_PNP',
    storeName: 'TM Pick n Pay Joina City (Harare CBD)',
    priceUSD: 4.20,
    priceZAR: 77.70,
    priceZWG: 112.56,
    unit: '2L bottle',
    fulfillmentTag: 'Nationwide Zim',
    inStock: true,
    featured: true,
    slug: 'mazoe_orange_crush',
    productUrl: 'https://www.pnpexpress.vercel.app/mazoe_orange_crush',
    dedicatedLink: 'https://www.pnpexpress.vercel.app/mazoe_orange_crush',
    imageUrl: 'https://www.pnpexpress.vercel.app/mazoe_orange_crush_image_01.jpg',
    imageUrls: [
      'https://www.pnpexpress.vercel.app/mazoe_orange_crush_image_01.jpg',
      'https://www.pnpexpress.vercel.app/images/mazoe_orange_crush.jpg',
      'https://www.facebook.com/mazoe_orange_crush_image_001.jpg'
    ],
    facebookImageUrl: 'https://www.facebook.com/mazoe_orange_crush_image_001.jpg',
    image: PRODUCT_BASE64_IMAGES['mazoe_orange_crush']
  },
  {
    id: 'prod-7',
    name: 'Tanganda Black Tea Bags (100s)',
    nativeName: 'Bani reTii / Chai',
    brand: 'Tanganda Tea',
    category: 'Beverages & Tea',
    storeId: 'TM_PNP',
    storeName: 'Pick n Pay Mutare Main',
    priceUSD: 2.10,
    priceZAR: 38.85,
    priceZWG: 56.28,
    unit: '100 tea bags',
    fulfillmentTag: 'Mutare Depot',
    inStock: true,
    slug: 'tanganda_tea',
    productUrl: 'https://www.pnpexpress.vercel.app/tanganda_tea',
    dedicatedLink: 'https://www.pnpexpress.vercel.app/tanganda_tea',
    imageUrl: 'https://www.pnpexpress.vercel.app/tanganda_tea_image_01.jpg',
    imageUrls: [
      'https://www.pnpexpress.vercel.app/tanganda_tea_image_01.jpg',
      'https://www.pnpexpress.vercel.app/images/tanganda_tea.jpg',
      'https://www.facebook.com/tanganda_tea_image_001.jpg'
    ],
    facebookImageUrl: 'https://www.facebook.com/tanganda_tea_image_001.jpg',
    image: PRODUCT_BASE64_IMAGES['tanganda_tea']
  },
  {
    id: 'prod-8',
    name: 'Liteng Power Solar Lighting System & Phone Charger',
    nativeName: 'Mwenje weZuva / Solar Power',
    brand: 'Liteng Solar',
    category: 'Solar & Power',
    storeId: 'TM_PNP',
    storeName: 'Pick n Pay SA Export Hub (Joburg ➔ Zim)',
    priceUSD: 24.50,
    priceZAR: 453.25,
    priceZWG: 656.60,
    unit: 'Full Kit (3 Bulbs + Battery)',
    fulfillmentTag: 'SA Export to Zim',
    inStock: true,
    featured: true,
    slug: 'solar_lighting_system',
    productUrl: 'https://www.pnpexpress.vercel.app/solar_lighting_system',
    dedicatedLink: 'https://www.pnpexpress.vercel.app/solar_lighting_system',
    imageUrl: 'https://www.pnpexpress.vercel.app/solar_lighting_system_image_01.jpg',
    imageUrls: [
      'https://www.pnpexpress.vercel.app/solar_lighting_system_image_01.jpg',
      'https://www.pnpexpress.vercel.app/images/solar_lighting_system.jpg',
      'https://www.facebook.com/solar_lighting_system_image_001.jpg'
    ],
    facebookImageUrl: 'https://www.facebook.com/solar_lighting_system_image_001.jpg',
    image: PRODUCT_BASE64_IMAGES['solar_lighting_system']
  },
  {
    id: 'prod-9',
    name: 'Clover Full Cream Milk UHT (6x1L Carton)',
    nativeName: 'Mukaka weClover / Ubisi',
    brand: 'Clover SA',
    category: 'Dairy & Fresh',
    storeId: 'TM_PNP',
    storeName: 'TM Pick n Pay Hyper Bulawayo',
    priceUSD: 8.90,
    priceZAR: 164.65,
    priceZWG: 238.52,
    unit: '6x1L carton',
    fulfillmentTag: 'Bulawayo Click & Collect',
    inStock: true,
    slug: 'clover_milk',
    productUrl: 'https://www.pnpexpress.vercel.app/clover_milk',
    dedicatedLink: 'https://www.pnpexpress.vercel.app/clover_milk',
    imageUrl: 'https://www.pnpexpress.vercel.app/clover_milk_image_01.jpg',
    imageUrls: [
      'https://www.pnpexpress.vercel.app/clover_milk_image_01.jpg',
      'https://www.pnpexpress.vercel.app/images/clover_milk.jpg',
      'https://www.facebook.com/clover_milk_image_001.jpg'
    ],
    facebookImageUrl: 'https://www.facebook.com/clover_milk_image_001.jpg',
    image: PRODUCT_BASE64_IMAGES['clover_milk']
  },
  {
    id: 'prod-10',
    name: 'Sunlight Mild & Gentle Laundry Soap Bar (500g)',
    nativeName: 'Sipo yekuwacha / Isipho',
    brand: 'Sunlight SA',
    category: 'Household & Soap',
    storeId: 'TM_PNP',
    storeName: 'TM Pick n Pay Kamfinsa (Harare)',
    priceUSD: 1.80,
    priceZAR: 33.30,
    priceZWG: 48.24,
    unit: '500g bar',
    fulfillmentTag: 'Harare Express',
    inStock: true,
    slug: 'sunlight_soap',
    productUrl: 'https://www.pnpexpress.vercel.app/sunlight_soap',
    dedicatedLink: 'https://www.pnpexpress.vercel.app/sunlight_soap',
    imageUrl: 'https://www.pnpexpress.vercel.app/sunlight_soap_image_01.jpg',
    imageUrls: [
      'https://www.pnpexpress.vercel.app/sunlight_soap_image_01.jpg',
      'https://www.pnpexpress.vercel.app/images/sunlight_soap.jpg',
      'https://www.facebook.com/sunlight_soap_image_001.jpg'
    ],
    facebookImageUrl: 'https://www.facebook.com/sunlight_soap_image_001.jpg',
    image: PRODUCT_BASE64_IMAGES['sunlight_soap']
  },
  {
    id: 'prod-11',
    name: 'Fresh Butchery Beef Blade Roast (2kg)',
    nativeName: 'Nyama yeMombe / Inyama yeNkomo',
    brand: 'Highveld Beef ZIM',
    category: 'Meats & Proteins',
    storeId: 'TM_PNP',
    storeName: 'Pick n Pay Gweru Megawatt',
    priceUSD: 11.50,
    priceZAR: 212.75,
    priceZWG: 308.20,
    unit: '2kg fresh cut',
    fulfillmentTag: 'Harare Express',
    inStock: true,
    slug: 'fresh_beef',
    productUrl: 'https://www.pnpexpress.vercel.app/fresh_beef',
    dedicatedLink: 'https://www.pnpexpress.vercel.app/fresh_beef',
    imageUrl: 'https://www.pnpexpress.vercel.app/fresh_beef_image_01.jpg',
    imageUrls: [
      'https://www.pnpexpress.vercel.app/fresh_beef_image_01.jpg',
      'https://www.pnpexpress.vercel.app/images/fresh_beef.jpg',
      'https://www.facebook.com/fresh_beef_image_001.jpg'
    ],
    facebookImageUrl: 'https://www.facebook.com/fresh_beef_image_001.jpg',
    image: PRODUCT_BASE64_IMAGES['fresh_beef']
  },
  {
    id: 'prod-12',
    name: 'Pampers Ultra Skin Comfort Pants Size 3 (56 Pack)',
    nativeName: 'Nappy dzeMwana / Isipani',
    brand: 'Pampers SA',
    category: 'Baby & Care',
    storeId: 'TM_PNP',
    storeName: 'Pick n Pay SA Export Hub (Joburg ➔ Zim)',
    priceUSD: 13.90,
    priceZAR: 257.15,
    priceZWG: 372.52,
    unit: '56 diapers pack',
    fulfillmentTag: 'SA Export to Zim',
    inStock: true,
    slug: 'pampers_pants',
    productUrl: 'https://www.pnpexpress.vercel.app/pampers_pants',
    dedicatedLink: 'https://www.pnpexpress.vercel.app/pampers_pants',
    imageUrl: 'https://www.pnpexpress.vercel.app/pampers_pants_image_01.jpg',
    imageUrls: [
      'https://www.pnpexpress.vercel.app/pampers_pants_image_01.jpg',
      'https://www.pnpexpress.vercel.app/images/pampers_pants.jpg',
      'https://www.facebook.com/pampers_pants_image_001.jpg'
    ],
    facebookImageUrl: 'https://www.facebook.com/pampers_pants_image_001.jpg',
    image: PRODUCT_BASE64_IMAGES['pampers_pants']
  }
];

export function getProductBySlugOrId(slugOrId: string): Product | undefined {
  if (!slugOrId) return undefined;
  const clean = slugOrId.toLowerCase().replace(/^\/+/, '').replace(/^product\//, '');
  return SAMPLE_PRODUCTS.find(p => p.id.toLowerCase() === clean || p.slug?.toLowerCase() === clean);
}

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem-1',
    name: 'Tinashe Moyo',
    location: 'Johannesburg, SA',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    role: 'Sponsor / Diaspora',
    channel: 'web',
    isOnline: true,
    color: '#10b981',
    phone: '+27 71 892 4410',
    deliveryAddress: {
      type: 'DOOR_DELIVERY',
      addressLine: '42 Sandton Drive, Morningside',
      suburb: 'Sandton',
      city: 'Johannesburg',
      country: 'South Africa',
      instructions: 'Ring Unit 14 intercom upon arrival',
      lat: -26.1076,
      lng: 28.0567
    }
  },
  {
    id: 'mem-2',
    name: 'Gogo Moyo',
    location: 'Harare, ZIM',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    role: 'Elder',
    channel: 'whatsapp',
    isOnline: true,
    color: '#f59e0b',
    phone: '+263 77 341 9082',
    deliveryAddress: {
      type: 'DOOR_DELIVERY',
      addressLine: '78 Samora Machel Avenue',
      suburb: 'Eastlea',
      city: 'Harare',
      country: 'Zimbabwe',
      instructions: 'House with black gate, near the borehole. Call Gogo first.',
      lat: -17.8292,
      lng: 31.0522
    }
  },
  {
    id: 'mem-3',
    name: 'Amai Chipo',
    location: 'Bulawayo, ZIM',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    role: 'Recipient',
    channel: 'web',
    isOnline: true,
    color: '#3b82f6',
    phone: '+263 71 602 1198',
    deliveryAddress: {
      type: 'STORE_PICKUP',
      addressLine: 'TM Pick n Pay Bulawayo Hyper, 9th Ave & Fife St',
      city: 'Bulawayo',
      country: 'Zimbabwe',
      storeId: 'TM_PNP',
      storeName: 'TM Pick n Pay (Bulawayo Hyper)',
      instructions: 'Click & Collect Counter - Present order code on WhatsApp'
    }
  },
  {
    id: 'mem-4',
    name: 'Uncle Farai',
    location: 'Mutare, ZIM',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    role: 'Contributor',
    channel: 'whatsapp',
    isOnline: true,
    color: '#8b5cf6',
    phone: '+263 78 514 8839',
    deliveryAddress: {
      type: 'STORE_PICKUP',
      addressLine: 'TM Pick n Pay Mutare Main, 104 Herbert Chitepo St',
      city: 'Mutare',
      country: 'Zimbabwe',
      storeId: 'TM_PNP',
      storeName: 'Pick n Pay Mutare Main (Herbert Chitepo St)',
      instructions: 'Collect at Pick n Pay Click & Collect dispatch desk'
    }
  },
  {
    id: 'mem-5',
    name: 'Rutendo Moyo',
    location: 'London, UK',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    role: 'Sponsor / Diaspora',
    channel: 'web',
    isOnline: true,
    color: '#ec4899',
    phone: '+44 7700 900321',
    deliveryAddress: {
      type: 'DOOR_DELIVERY',
      addressLine: '14 Oxford Street, Westminster',
      suburb: 'Soho',
      city: 'London',
      country: 'United Kingdom',
      lat: 51.5154,
      lng: -0.1410
    }
  },
  {
    id: 'mem-6',
    name: 'Sekuru James',
    location: 'Gweru, ZIM',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    role: 'Elder',
    channel: 'whatsapp',
    isOnline: false,
    color: '#14b8a6',
    phone: '+263 73 992 1045',
    deliveryAddress: {
      type: 'DOOR_DELIVERY',
      addressLine: '12 Main Street, Gweru Urban',
      suburb: 'Gweru Central',
      city: 'Gweru',
      country: 'Zimbabwe',
      lat: -19.4583,
      lng: 29.8167
    }
  },
];
