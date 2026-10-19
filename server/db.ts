import { SAMPLE_PRODUCTS, INITIAL_MEMBERS, INITIAL_EXCHANGE_RATES } from '../src/data/products';
import { Product, CartItem, Member, DeliveryAddress, StoreId } from '../src/types';

export interface PastOrderItem {
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

export interface PastOrder {
  id: string;
  invoiceNumber: string;
  date: string;
  timestamp: string;
  status: 'DELIVERED' | 'OUT_FOR_DELIVERY' | 'READY_FOR_COLLECTION' | 'PROCESSING';
  statusLabel: string;
  statusColor: string;
  storePartner: string;
  fulfillmentType: 'DOOR_DELIVERY' | 'CLICK_AND_COLLECT';
  fulfillmentLocation: string;
  recipientName: string;
  recipientPhone: string;
  collectionCode?: string;
  paymentMethod: {
    type: 'VISA_CARD' | 'ECOCASH' | 'MUKURU' | 'INNBUCKS' | 'PNP_WALLET' | 'CONTIPAY' | 'PESAPAL' | 'COINBASE_USDC';
    label: string;
    details: string;
    authRef: string;
  };
  subtotalUSD: number;
  deliveryFeeUSD: number;
  vatTaxUSD: number;
  totalUSD: number;
  items: PastOrderItem[];
  trackingSteps: Array<{
    title: string;
    description: string;
    time: string;
    completed: boolean;
    current?: boolean;
  }>;
}

export interface CommercialInvoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  date: string;
  timestamp: string;
  customerName: string;
  customerLocation: string;
  recipientName: string;
  recipientAddress: string;
  storePartner: string;
  paymentRail: string;
  settlementAccount: string;
  forexReportingCode: string;
  subtotalUSD: number;
  deliveryFeeUSD: number;
  vatTaxUSD: number;
  totalUSD: number;
  currencyEquivalents: {
    GBP: number;
    ZAR: number;
    ZWG: number;
    EUR: number;
    AUD: number;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPriceUSD: number;
    totalUSD: number;
  }>;
}

export interface DepotLocation {
  id: string;
  name: string;
  chain: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  hours: string;
  hasColdStorage: boolean;
  hasLockers: boolean;
  coordinates: { lat: number; lng: number };
}

export const INITIAL_DEPOTS: DepotLocation[] = [
  {
    id: 'depot-avondale',
    name: 'TM Pick n Pay Avondale Supermarket',
    chain: 'TM Pick n Pay',
    address: 'Avondale Shopping Centre, King George Rd',
    city: 'Harare',
    province: 'Harare Metropolitan',
    phone: '+263 (242) 335 121',
    hours: 'Mon-Sun: 07:00 - 20:00',
    hasColdStorage: true,
    hasLockers: true,
    coordinates: { lat: -17.7932, lng: 31.0371 }
  },
  {
    id: 'depot-borrowdale',
    name: 'TM Pick n Pay Sam Levy’s Village',
    chain: 'TM Pick n Pay',
    address: 'Piers Rd, Sam Levy Village, Borrowdale',
    city: 'Harare',
    province: 'Harare Metropolitan',
    phone: '+263 (242) 882 450',
    hours: 'Mon-Sun: 07:30 - 20:30',
    hasColdStorage: true,
    hasLockers: true,
    coordinates: { lat: -17.7538, lng: 31.0853 }
  },
  {
    id: 'depot-byo-bradfield',
    name: 'TM Pick n Pay Bradfield Hyper',
    chain: 'TM Pick n Pay',
    address: 'Hillside Rd & 23rd Ave, Bradfield',
    city: 'Bulawayo',
    province: 'Bulawayo',
    phone: '+263 (292) 280 441',
    hours: 'Mon-Sun: 07:00 - 19:30',
    hasColdStorage: true,
    hasLockers: true,
    coordinates: { lat: -20.1784, lng: 28.5912 }
  },
  {
    id: 'depot-byo-fife',
    name: 'OK Mart Bulawayo Hyper',
    chain: 'OK Zimbabwe',
    address: 'Fife St & 12th Ave',
    city: 'Bulawayo',
    province: 'Bulawayo',
    phone: '+263 (292) 883 001',
    hours: 'Mon-Sun: 07:00 - 19:00',
    hasColdStorage: true,
    hasLockers: false,
    coordinates: { lat: -20.1582, lng: 28.5835 }
  },
  {
    id: 'depot-mutare-main',
    name: 'TM Pick n Pay Mutare Meikles Park',
    chain: 'TM Pick n Pay',
    address: 'Herbert Chitepo St & 2nd Ave',
    city: 'Mutare',
    province: 'Manicaland',
    phone: '+263 (20) 641 22',
    hours: 'Mon-Sun: 07:30 - 19:00',
    hasColdStorage: true,
    hasLockers: true,
    coordinates: { lat: -18.9728, lng: 32.6695 }
  },
  {
    id: 'depot-gweru-cbd',
    name: 'TM Pick n Pay Gweru Main',
    chain: 'TM Pick n Pay',
    address: 'Robert Mugabe Way, Gweru CBD',
    city: 'Gweru',
    province: 'Midlands',
    phone: '+263 (54) 222 550',
    hours: 'Mon-Sun: 07:30 - 19:00',
    hasColdStorage: true,
    hasLockers: true,
    coordinates: { lat: -19.4587, lng: 29.8152 }
  },
  {
    id: 'depot-vicfalls',
    name: 'SPAR Victoria Falls Express',
    chain: 'SPAR Zimbabwe',
    address: 'Sawanga Mall, Livingstone Way',
    city: 'Victoria Falls',
    province: 'Matabeleland North',
    phone: '+263 (83) 284 3301',
    hours: 'Mon-Sun: 07:00 - 21:00',
    hasColdStorage: true,
    hasLockers: true,
    coordinates: { lat: -17.9312, lng: 25.8307 }
  }
];

export const INITIAL_ORDERS: PastOrder[] = [
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
      }
    ],
    trackingSteps: [
      {
        title: 'Payment Authorized (FNB SA 3DS)',
        description: 'Cross-border transaction tokenized via ContiPay UK/SA gateway.',
        time: '24 Aug 2026, 14:32',
        completed: true
      },
      {
        title: 'Order Picked & Cold-Packed',
        description: 'TM Pick n Pay Avondale fulfillment team packed refrigerated box.',
        time: '24 Aug 2026, 15:10',
        completed: true
      },
      {
        title: 'Dispatched on Express Van',
        description: 'Assigned to Driver Blessing M. (Toyota Hiace Reg: AFZ-4921).',
        time: '24 Aug 2026, 15:45',
        completed: true
      },
      {
        title: 'Delivered & Signed',
        description: 'Handed directly to Gogo Moyo at gate. Digital OTP confirmed.',
        time: '24 Aug 2026, 16:22',
        completed: true,
        current: true
      }
    ]
  },
  {
    id: 'PNP-ZW-87401',
    invoiceNumber: 'INV-2026-0874',
    date: '16 Aug 2026',
    timestamp: '2026-08-16T09:15:00Z',
    status: 'READY_FOR_COLLECTION',
    statusLabel: 'Ready for Collection (PIN: 8492)',
    statusColor: 'amber',
    storePartner: 'TM Pick n Pay Bradfield, Bulawayo',
    fulfillmentType: 'CLICK_AND_COLLECT',
    fulfillmentLocation: 'Locker Bay 04, TM Pick n Pay Bradfield Hyper, Bulawayo',
    recipientName: 'Tinashe Moyo',
    recipientPhone: '+263 71 890 1234',
    collectionCode: 'PIN-8492-BYO',
    paymentMethod: {
      type: 'ECOCASH',
      label: 'EcoCash Diaspora Wallet',
      details: 'Remittance Direct Settlement (USD Nostro)',
      authRef: 'EC-ZW-904128'
    },
    subtotalUSD: 84.50,
    deliveryFeeUSD: 0.00,
    vatTaxUSD: 0.00,
    totalUSD: 84.50,
    items: [
      {
        id: 'SOLAR-KIT',
        name: 'Gizzu 300W Portable Power Station & Solar Bulb Kit',
        nativeName: 'Mwenje weZuva / Amagetsi',
        quantity: 1,
        unitPriceUSD: 58.00,
        totalUSD: 58.00,
        image: '/images/solar_lighting_system.jpg',
        store: 'TM Pick n Pay',
        weightOrVol: '1 Unit'
      },
      {
        id: 'BEEF-2KG',
        name: 'Fresh Choice Super Grade Beef Blade (2kg)',
        nativeName: 'Nyama yeMombe',
        quantity: 2,
        unitPriceUSD: 8.50,
        totalUSD: 17.00,
        image: '/images/fresh_beef.jpg',
        store: 'TM Pick n Pay Butchery',
        weightOrVol: '2kg x 2'
      },
      {
        id: 'TEA-100S',
        name: 'Tanganda Special Blend Tea Bags (100s)',
        nativeName: 'Tii yeTanganda',
        quantity: 3,
        unitPriceUSD: 3.16,
        totalUSD: 9.50,
        image: '/images/tanganda_tea.jpg',
        store: 'TM Pick n Pay',
        weightOrVol: '100 bags x 3'
      }
    ],
    trackingSteps: [
      {
        title: 'Payment Cleared via EcoCash Remittance',
        description: 'Funds credited into TM Pick n Pay Nostro treasury.',
        time: '16 Aug 2026, 09:15',
        completed: true
      },
      {
        title: 'Depot Fulfillment Staged',
        description: 'Bradfield depot shelf staging complete. Stored in climate-controlled locker.',
        time: '16 Aug 2026, 10:40',
        completed: true
      },
      {
        title: 'Ready at Collection Locker',
        description: 'Locker #4 assigned. SMS/WhatsApp PIN sent to Tinashe Moyo (+263 71 890 1234).',
        time: '16 Aug 2026, 11:05',
        completed: true,
        current: true
      },
      {
        title: 'Collected by Recipient',
        description: 'Awaiting PIN scan at kiosk.',
        time: 'Pending Collection',
        completed: false
      }
    ]
  },
  {
    id: 'PNP-ZW-85190',
    invoiceNumber: 'INV-2026-0851',
    date: '02 Aug 2026',
    timestamp: '2026-08-02T11:00:00Z',
    status: 'DELIVERED',
    statusLabel: 'Delivered to Uncle Farai',
    statusColor: 'emerald',
    storePartner: 'TM Pick n Pay Meikles Park, Mutare',
    fulfillmentType: 'DOOR_DELIVERY',
    fulfillmentLocation: '18 Aerodrome Road, Mutare',
    recipientName: 'Uncle Farai',
    recipientPhone: '+263 77 987 6543',
    paymentMethod: {
      type: 'MUKURU',
      label: 'Mukuru Card Direct',
      details: 'Instant Merchant Voucher Settlement',
      authRef: 'MKR-ZW-481902'
    },
    subtotalUSD: 41.20,
    deliveryFeeUSD: 3.50,
    vatTaxUSD: 0.00,
    totalUSD: 44.70,
    items: [
      {
        id: 'FRUIT-10KG',
        name: 'Fresh Farm Produce Fruit & Vegetable Hamper (10kg)',
        nativeName: 'Miriwo ne Michero yeMhuri',
        quantity: 1,
        unitPriceUSD: 24.50,
        totalUSD: 24.50,
        image: '/images/fruit_veg_box.jpg',
        store: 'TM Pick n Pay Fresh',
        weightOrVol: '10kg crate'
      },
      {
        id: 'MILK-6PK',
        name: 'Clover Full Cream Long Life UHT Milk (6 x 1L)',
        nativeName: 'Mukaka weClover',
        quantity: 1,
        unitPriceUSD: 9.20,
        totalUSD: 9.20,
        image: '/images/clover_milk.jpg',
        store: 'TM Pick n Pay',
        weightOrVol: '6 x 1L'
      },
      {
        id: 'SOAP-BAR',
        name: 'Sunlight Green Laundry Bar Soap (500g 4-pack)',
        nativeName: 'Sipo yeSunlight',
        quantity: 2,
        unitPriceUSD: 3.75,
        totalUSD: 7.50,
        image: '/images/sunlight_soap.jpg',
        store: 'TM Pick n Pay',
        weightOrVol: '500g x 4'
      }
    ],
    trackingSteps: [
      {
        title: 'Mukuru Merchant Pay Cleared',
        description: 'UK sponsor transfer confirmed without forex markup.',
        time: '02 Aug 2026, 11:00',
        completed: true
      },
      {
        title: 'Box Packaged & Tagged',
        description: 'Mutare depot cold chain verified.',
        time: '02 Aug 2026, 11:45',
        completed: true
      },
      {
        title: 'Out on Route',
        description: 'Driver Tendai K. dispatched.',
        time: '02 Aug 2026, 12:30',
        completed: true
      },
      {
        title: 'Delivered',
        description: 'Uncle Farai signed delivery manifest.',
        time: '02 Aug 2026, 13:14',
        completed: true,
        current: true
      }
    ]
  }
];

export const INITIAL_INVOICES: CommercialInvoice[] = [
  {
    id: 'INV-2026-0892',
    invoiceNumber: 'INV-2026-0892',
    orderId: 'PNP-ZW-89214',
    date: '24 Aug 2026',
    timestamp: '2026-08-24T14:32:00Z',
    customerName: 'Tariro Moyo',
    customerLocation: 'London, United Kingdom (Diaspora Payer)',
    recipientName: 'Gogo Moyo',
    recipientAddress: 'House 42, Bath Road, Avondale, Harare, Zimbabwe',
    storePartner: 'TM Pick n Pay Avondale, Harare',
    paymentRail: 'ContiPay UK / FNB SA 3DS Verified (Auth #993812)',
    settlementAccount: 'TM_PNP_USD_NOSTRO_STANBIC_01 (Stanbic Bank Zimbabwe)',
    forexReportingCode: 'RBZ-CD1-CTP-2026-89214',
    subtotalUSD: 52.40,
    deliveryFeeUSD: 4.50,
    vatTaxUSD: 0.00,
    totalUSD: 56.90,
    currencyEquivalents: {
      GBP: 44.95,
      ZAR: 1052.65,
      ZWG: 1524.92,
      EUR: 52.35,
      AUD: 87.62
    },
    items: [
      { id: 'WS-5KG', name: 'White Star Super Maize Meal (5kg)', quantity: 2, unitPriceUSD: 4.50, totalUSD: 9.00 },
      { id: 'TAS-5KG', name: 'Tastic Parboiled Long Grain White Rice (5kg)', quantity: 2, unitPriceUSD: 6.80, totalUSD: 13.60 },
      { id: 'SUN-5L', name: 'Sunfoil Pure Sunflower Cooking Oil (5L)', quantity: 1, unitPriceUSD: 10.90, totalUSD: 10.90 },
      { id: 'MAZ-2L', name: 'Mazoe Orange Crush Cordial Syrup (2L)', quantity: 2, unitPriceUSD: 4.20, totalUSD: 8.40 },
      { id: 'HUL-5KG', name: 'Huletts SunSweet Pure White Sugar (5kg)', quantity: 1, unitPriceUSD: 5.50, totalUSD: 5.50 }
    ]
  },
  {
    id: 'INV-2026-0874',
    invoiceNumber: 'INV-2026-0874',
    orderId: 'PNP-ZW-87401',
    date: '16 Aug 2026',
    timestamp: '2026-08-16T09:15:00Z',
    customerName: 'Tariro Moyo',
    customerLocation: 'London, United Kingdom (Diaspora Payer)',
    recipientName: 'Tinashe Moyo',
    recipientAddress: 'Locker Bay 04, TM Pick n Pay Bradfield Hyper, Bulawayo',
    storePartner: 'TM Pick n Pay Bradfield, Bulawayo',
    paymentRail: 'EcoCash Diaspora Remittance Gateway (Auth #904128)',
    settlementAccount: 'TM_PNP_USD_NOSTRO_CABS_02 (CABS Nostro Zimbabwe)',
    forexReportingCode: 'RBZ-ECTS-ECO-2026-87401',
    subtotalUSD: 84.50,
    deliveryFeeUSD: 0.00,
    vatTaxUSD: 0.00,
    totalUSD: 84.50,
    currencyEquivalents: {
      GBP: 66.75,
      ZAR: 1563.25,
      ZWG: 2264.60,
      EUR: 77.74,
      AUD: 130.13
    },
    items: [
      { id: 'SOLAR-KIT', name: 'Gizzu 300W Portable Power Station & Solar Bulb Kit', quantity: 1, unitPriceUSD: 58.00, totalUSD: 58.00 },
      { id: 'BEEF-2KG', name: 'Fresh Choice Super Grade Beef Blade (2kg)', quantity: 2, unitPriceUSD: 8.50, totalUSD: 17.00 },
      { id: 'TEA-100S', name: 'Tanganda Special Blend Tea Bags (100s)', quantity: 3, unitPriceUSD: 3.16, totalUSD: 9.50 }
    ]
  },
  {
    id: 'INV-2026-0851',
    invoiceNumber: 'INV-2026-0851',
    orderId: 'PNP-ZW-85190',
    date: '02 Aug 2026',
    timestamp: '2026-08-02T11:00:00Z',
    customerName: 'Tariro Moyo',
    customerLocation: 'London, United Kingdom (Diaspora Payer)',
    recipientName: 'Uncle Farai',
    recipientAddress: '18 Aerodrome Road, Mutare, Zimbabwe',
    storePartner: 'TM Pick n Pay Meikles Park, Mutare',
    paymentRail: 'Mukuru Card Direct (Auth #481902)',
    settlementAccount: 'TM_PNP_USD_NOSTRO_STANBIC_01 (Stanbic Bank Zimbabwe)',
    forexReportingCode: 'RBZ-CD1-MKR-2026-85190',
    subtotalUSD: 41.20,
    deliveryFeeUSD: 3.50,
    vatTaxUSD: 0.00,
    totalUSD: 44.70,
    currencyEquivalents: {
      GBP: 35.31,
      ZAR: 826.95,
      ZWG: 1197.96,
      EUR: 41.12,
      AUD: 68.83
    },
    items: [
      { id: 'FRUIT-10KG', name: 'Fresh Farm Produce Fruit & Vegetable Hamper (10kg)', quantity: 1, unitPriceUSD: 24.50, totalUSD: 24.50 },
      { id: 'MILK-6PK', name: 'Clover Full Cream Long Life UHT Milk (6 x 1L)', quantity: 1, unitPriceUSD: 9.20, totalUSD: 9.20 },
      { id: 'SOAP-BAR', name: 'Sunlight Green Laundry Bar Soap (500g 4-pack)', quantity: 2, unitPriceUSD: 3.75, totalUSD: 7.50 }
    ]
  }
];

export const INITIAL_USER_PROFILE = {
  id: 'usr-tendai-01',
  name: 'Tariro Moyo',
  email: 'tariro.moyo@gmail.com',
  phone: '+44 7700 900123',
  country: 'United Kingdom',
  city: 'London',
  currencyPreference: 'GBP',
  lowDataPreference: false,
  notificationPreferences: {
    whatsappOrderUpdates: true,
    emailInvoices: true,
    promoAlerts: false,
    deliverySmsAlertsToRecipient: true
  },
  savedCards: [
    {
      id: 'card-1',
      brand: 'Visa',
      last4: '4892',
      expiry: '09/28',
      isDefault: true,
      cardholder: 'Tariro Moyo'
    },
    {
      id: 'card-2',
      brand: 'Mastercard',
      last4: '1044',
      expiry: '11/27',
      isDefault: false,
      cardholder: 'Tariro Moyo'
    }
  ]
};

export const INITIAL_USER_ADDRESSES: DeliveryAddress[] = [
  {
    type: 'DOOR_DELIVERY',
    addressLine: 'House 42, Bath Road',
    suburb: 'Avondale',
    city: 'Harare',
    country: 'Zimbabwe',
    instructions: 'Call Gogo on gate buzzer (+263 77 234 5678). Black sliding gate.',
    lat: -17.7932,
    lng: 31.0371
  },
  {
    type: 'STORE_PICKUP',
    addressLine: 'Locker Bay 04, TM Pick n Pay Bradfield Hyper',
    suburb: 'Bradfield',
    city: 'Bulawayo',
    country: 'Zimbabwe',
    instructions: 'Recipient: Tinashe Moyo (+263 71 890 1234). Present 4-digit SMS PIN.',
    storeId: 'TM_PNP',
    storeName: 'TM Pick n Pay Bradfield'
  },
  {
    type: 'DOOR_DELIVERY',
    addressLine: '18 Aerodrome Road',
    suburb: 'Morningside',
    city: 'Mutare',
    country: 'Zimbabwe',
    instructions: 'Near Mutare Boys High. Call Uncle Farai upon arrival.',
    lat: -18.9728,
    lng: 32.6695
  }
];

export const LIVE_CALL_INITIAL_STATE = {
  sessionId: 'call-sess-live-01',
  isActive: false,
  clerkName: 'Chipo Dube (Avondale Store Concierge)',
  clerkAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  storeName: 'TM Pick n Pay Avondale, Harare',
  aisle: 'Aisle 3: Grains, Breakfast & Staples',
  participantsCount: 3,
  lastScannedBarcode: null,
  activeSuggestions: [
    {
      id: 'prod-1',
      name: 'Tastic Rice Parboiled Long Grain (5kg)',
      priceUSD: 6.80,
      image: '/images/tastic_rice.jpg',
      aisleLocation: 'Shelf 3B (Promo Endcap)',
      discount: 'SAVE $1.20'
    },
    {
      id: 'prod-4',
      name: 'Sunfoil Pure Sunflower Oil (5 Litres)',
      priceUSD: 8.20,
      image: '/images/sunfoil_oil.jpg',
      aisleLocation: 'Shelf 4A (Bulk Stack)',
      discount: 'POPULAR'
    },
    {
      id: 'prod-6',
      name: 'Mazoe Orange Crush Syrup (2 Litres)',
      priceUSD: 4.20,
      image: '/images/mazoe_orange_crush.jpg',
      aisleLocation: 'Shelf 1C (Beverages)',
      discount: 'HOMETOWN FAVORITE'
    }
  ],
  activeMenu: {
    id: 'menu-init-01',
    title: 'PnP Avondale Deli & Grocery Weekend Specials',
    uploadedBy: 'Chipo Dube (Live Host & Store Concierge)',
    uploadedAt: new Date().toISOString(),
    sourceType: 'preset',
    itemCount: 6,
    products: [
      {
        id: 'menu-prod-1',
        name: 'Flame-Grilled Half Chicken & Hot Chips',
        nativeName: 'Huku Yakakanyiwa & Machips',
        description: 'Store deli rotisserie half chicken basted in lemon & herb, served with golden hot potato chips.',
        priceUSD: 5.50,
        category: 'Meats & Proteins',
        unit: 'Combo Meal',
        image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&auto=format&fit=crop&q=80',
        tag: 'HOT DELI FAVORITE',
        keywords: ['chicken', 'chips', 'huku', 'half chicken', 'grilled chicken', 'hot chips'],
        matchedCatalogProductId: 'prod-2'
      },
      {
        id: 'menu-prod-2',
        name: 'Sunfoil Pure Sunflower Cooking Oil 2L',
        nativeName: 'Mafuta eKubikisa eSunfoil',
        description: 'Triple-refined pure sunflower oil for family cooking and crisp frying.',
        priceUSD: 4.12,
        category: 'Cooking & Oils',
        unit: '2 Litre Bottle',
        image: '/images/sunfoil_oil.jpg',
        tag: 'SPECIAL OFFER',
        keywords: ['oil', 'cooking oil', 'sunfoil', 'mafuta', 'sunflower oil'],
        matchedCatalogProductId: 'prod-4'
      },
      {
        id: 'menu-prod-3',
        name: 'Mazoe Orange Crush Syrup 2L',
        nativeName: 'Mazoe Crush Yechibereko',
        description: 'Authentic Zimbabwean citrus squash concentrate, rich in vitamin C.',
        priceUSD: 3.45,
        category: 'Beverages & Tea',
        unit: '2 Litre Bottle',
        image: '/images/Mazoe Orange Crush 2l.jpg',
        tag: 'HERITAGE STAPLE',
        keywords: ['mazoe', 'orange crush', 'crush', 'juice', 'drink'],
        matchedCatalogProductId: 'prod-6'
      },
      {
        id: 'menu-prod-4',
        name: 'Eggbert Large Eggs 30-Pack Crate',
        nativeName: 'Mazai Makuru eFarm',
        description: 'Grade A fresh large farm chicken eggs, perfect for hearty family breakfasts.',
        priceUSD: 3.46,
        category: 'Meats & Proteins',
        unit: '30-Pack Crate',
        image: '/images/fresh_beef.jpg',
        tag: 'FRESH FARM INFLOW',
        keywords: ['eggs', 'egg', 'mazai', 'eggbert', 'crate of eggs'],
        matchedCatalogProductId: 'prod-2'
      },
      {
        id: 'menu-prod-5',
        name: 'TM Braai Master Beef Boerewors 1kg',
        nativeName: 'Nyama yeMombe Boerewors',
        description: 'Traditional spiced beef sausage packed with coriander and nutmeg, ideal for weekend braai.',
        priceUSD: 6.90,
        category: 'Meats & Proteins',
        unit: '1kg Vacuum Pack',
        image: '/images/beef blade roast 2kg.jpg',
        tag: 'WEEKEND BRAAI',
        keywords: ['braai', 'boerewors', 'wors', 'beef', 'sausage', 'nyama'],
        matchedCatalogProductId: 'prod-2'
      },
      {
        id: 'menu-prod-6',
        name: 'Clover Full Cream Fresh Milk 2L',
        nativeName: 'Mukaka Mutsva weClover',
        description: 'Pasteurized homogenized chilled full cream dairy milk from local valley farms.',
        priceUSD: 2.10,
        category: 'Dairy & Fresh',
        unit: '2 Litre Jug',
        image: '/images/clover_milk.jpg',
        tag: 'DAIRY FRESH',
        keywords: ['milk', 'clover', 'mukaka', 'dairy', 'fresh milk'],
        matchedCatalogProductId: 'prod-5'
      }
    ]
  }
};
