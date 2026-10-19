# 🛒 PnPExpress — Africa's Cross-Border Collaborative Grocery & Remittance Engine

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF.svg)](https://vitejs.dev/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-3.6%20Flash-4285F4.svg)](https://ai.google.dev/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-black.svg)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg)](https://tailwindcss.com/)

**PnPExpress** is a production-grade, real-time collaborative grocery shopping and diaspora remittance engine built for families across **South Africa (SA), the United Kingdom (UK), the United States (US), and Zimbabwe (ZIM)**. 

It connects diaspora sponsors directly with recipients back home through a synchronized family cart, live interactive video shopping concierges, AI-powered multilingual voice ordering (in Shona, Ndebele, Zulu, and English), automated multi-rail payment fallback orchestration, and end-to-end dispatch tracking with official Reserve Bank of Zimbabwe (RBZ) compliant commercial tax invoices.

---

## 🌟 Key Features

### 1. 🔀 Multi-Rail Payment Orchestrator & Auto-Fallback
- **Cascading Payment Routing**: Automatically routes cross-border card transactions through intelligent fallback tiers:
  - **Tier 1 (Primary)**: **ContiPay** (UK/EU/US Card BINs, direct Stanbic Nostro settlement, `< 400ms`).
  - **Tier 2 (Regional Fallback)**: **Pesapal** (Australasia, SADC, and East African BINs via CABS Nostro).
  - **Tier 3 (Global Fallback)**: **Coinbase USDC** (Decentralized stablecoin off-ramp via CBZ Bank Bureau de Change).
- **RBZ Form CD1 & ECTS Inflow Compliance**: Generates verifiable forex declaration codes and official Nostro treasury allocation references on every transaction.
- **Interactive Orchestration Dashboard**: Live telemetry modal visualizing failover simulations, latency metrics, and settlement audit logs.

### 2. 👨‍👩‍👧‍👦 Real-Time Collaborative Family Cart
- **Socket.io Live Synchronization**: Family members across London, Johannesburg, and Harare can simultaneously add, edit, or tag grocery items.
- **Member Attribution & Multi-Currency Split Engine**: 
  - Dynamic tracking in **USD ($)**, **GBP (£)**, **ZAR (R)**, and **ZWG (ZiG)**.
  - Split options: **By Submitter (Individual allocations)**, **Equal Split**, or **Custom Ratios**.
- **Per-Item Destination & Delivery Instructions**: Assign specific depot pickups or doorstep deliveries to different items within the same family basket.

### 3. 🎥 Live Video Call Shopping Concierge
- **In-Store Personal Shopper**: Connect directly with depot concierges at TM Pick n Pay Avondale or Bradfield via interactive video stream.
- **Live Barcode Scanning**: Scan shelf items in real time to instantly inject live discounts and promotional bundles into the family cart.
- **Real-Time Split Breakdown**: Live in-call ticker showing each connected family member's current financial contribution.

### 4. 🤖 Multilingual Gemini 3.6 Flash Voice AI
- **Native African Language Intent Parsing**: Transcribes and extracts complex grocery orders across **chiShona**, **siNdebele**, **isiZulu**, and code-switched English.
- **Colloquial Term Mapping**: Automatically recognizes localized items (e.g. *Hupfu hweSona*, *Mupunga weTastic*, *Mafuta eKubikisa*, *Chikari cheMazoe*, *Mwenje weZuva*).
- **Smart Basket AI & Recipe Assistant**: Generates balanced, load-shedding resilient staple packs based on budget, family size, and local power conditions.

### 5. 📦 Live Order Tracking & Commercial Invoices
- **Granular Dispatch Stages**: Track orders from payment authorization and depot cold-chain packaging to express van dispatch and doorstep OTP handover.
- **1-Click Re-Order**: Easily reorder previous family grocery baskets with a single click.
- **Printable Tax Invoices**: Download official, print-ready commercial export receipts with full VAT breakdowns and RBZ declaration codes.

### 6. 💬 Low-Data WhatsApp Simulator
- **Bandwidth-Optimized Ordering**: Webhook-ready WhatsApp simulator enabling recipients in low-connectivity areas to place orders or query basket totals via text and voice notes.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Motion (Framer) |
| **Backend** | Node.js, Express, Socket.io, Multer, `tsx`, `esbuild` |
| **AI / LLM** | `@google/genai` (Gemini 3.6 Flash with structured JSON schemas) |
| **Payments** | Multi-rail orchestrator (ContiPay, Pesapal, Coinbase USDC, EcoCash, Mukuru) |
| **Data & Persistence** | In-memory synchronized store with RESTful endpoints & Socket event broadcasting |

---

## 📡 API Reference

### 🛒 Products & Catalog
- `GET /api/products` — Filter products by category, store (`TM_PNP`, `OK_ZIM`, `SPAR_ZIM`, `SA_WHOLESALE`), search keyword, and pagination.
- `GET /api/products/categories` — Fetch all product categories with native language labels.
- `GET /api/products/stores` — Retrieve participating partner supermarket chains and depot networks.
- `GET /api/products/:id` — Retrieve detailed product information and related recommendations.

### 🧺 Family Cart & Split Calculator
- `GET /api/cart` — Fetch active synchronized cart items, connected members, and multi-currency totals.
- `POST /api/cart/add` — Add an item with member attribution, channel tag (`web`, `whatsapp`, `voice_ai`), and custom notes.
- `POST /api/cart/update` — Update item quantity or note.
- `POST /api/cart/remove` — Remove an item from the family cart.
- `POST /api/cart/clear` — Reset the active cart.
- `POST /api/cart/split-calculator` — Calculate real-time split shares across family members.

### 💳 Payment Orchestration & Fallback
- `POST /api/checkout/orchestrate` — Execute cross-border payment orchestration with automated fallback across ContiPay &rarr; Pesapal &rarr; Coinbase USDC.
- `GET /api/payment-orchestrator/logs` — View real-time audit logs, latencies, and RBZ compliance references.

### 🚚 Orders & Commercial Invoices
- `GET /api/orders` — List past and active orders with live dispatch statuses.
- `GET /api/orders/:id` — Retrieve detailed tracking history and assigned courier data.
- `POST /api/orders/reorder` — Re-inject all items from a previous order into the current cart.
- `POST /api/orders/:id/advance-status` — Advance order fulfillment lifecycle.
- `GET /api/invoices` — List commercial tax invoices.
- `GET /api/invoices/:id/html` — Render printable official commercial tax invoice.

### 🎙️ Gemini AI & WhatsApp
- `POST /api/voice-ai` — Multilingual voice and text intent parsing with auto-cart mutation.
- `POST /api/smart-basket/recommendations` — AI grocery bundle generation based on budget and family size.
- `POST /api/ai/recipe-suggest` — Traditional recipe ingredient extractor.
- `POST /api/whatsapp/webhook` — Process inbound simulated WhatsApp text or voice note.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Clone the Repository
```bash
git clone https://github.com/gugunyathi/pnpexpress.git
cd pnpexpress
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Add your Gemini API key:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 📁 Repository Structure

```
├── server.ts                       # Express backend server with Vite middleware & Socket.io
├── server/
│   └── db.ts                       # In-memory database, depots, sample orders & invoices
├── src/
│   ├── App.tsx                     # Main React application shell & tab routing
│   ├── components/                 # Modular UI Components
│   │   ├── Navbar.tsx              # Brand header, currency selector, and profile quick actions
│   │   ├── MultiStoreCatalog.tsx   # Supermarket catalog, category filters & search
│   │   ├── FamilyCart.tsx          # Real-time collaborative cart & split shares
│   │   ├── CheckoutModal.tsx       # Cross-border checkout & payment rail selection
│   │   ├── OrdersAndInvoicesView.tsx # Order tracking, timeline & printable invoices
│   │   ├── LiveCallShoppingView.tsx # In-store video concierge & barcode scanning
│   │   ├── VoiceAIAssistant.tsx    # Multilingual African voice AI assistant
│   │   ├── WhatsAppSimulator.tsx   # Low-data WhatsApp bot simulator
│   │   ├── SmartBasketModal.tsx    # AI bundle builder
│   │   ├── PaymentOrchestratorDashboardModal.tsx # Live rail telemetry & logs
│   │   ├── DiscoverView.tsx        # Promotional deals & diaspora essentials
│   │   ├── ProfileView.tsx         # User profile, saved cards & Nostro wallets
│   │   └── MyShopView.tsx          # Store locator & depot map
│   ├── data/
│   │   └── products.ts             # African grocery catalog data
│   ├── types.ts                    # TypeScript types & payment interfaces
│   └── utils/
│       ├── api.ts                  # Typed client API layer
│       ├── currency.ts             # FX conversions & formatting utilities
│       └── socket.ts               # Singleton Socket.io client instance
├── .env.example                    # Environment variable template
├── metadata.json                   # Applet configuration & metadata
├── package.json                    # Project scripts & dependencies
└── tsconfig.json                   # TypeScript configuration
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
