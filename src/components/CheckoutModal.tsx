import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  Copy, 
  Check, 
  Share2, 
  Printer, 
  RefreshCw, 
  Building2, 
  Zap, 
  FileText, 
  Truck, 
  Info,
  Globe2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  CartItem, 
  Member, 
  Currency, 
  DeliveryAddress, 
  ExchangeRates, 
  OrchestrationResponse,
  PaymentRail
} from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  members: Member[];
  memberAddresses: Record<string, DeliveryAddress>;
  totalUSD: number;
  totalZAR: number;
  totalZWG: number;
  currency: Currency;
  exchangeRates: ExchangeRates;
  onCheckoutSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  members,
  memberAddresses,
  totalUSD,
  totalZAR,
  totalZWG,
  currency,
  exchangeRates,
  onCheckoutSuccess
}) => {
  // Form State
  const [cardholderName, setCardholderName] = useState('Tariro Moyo');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [billingCountry, setBillingCountry] = useState('Coinbase Commerce (Card-to-USDC)');
  const [postalCode, setPostalCode] = useState('SW1A 1AA');
  const [showCvvInfo, setShowCvvInfo] = useState(false);

  // Orchestration & Processing State
  const [status, setStatus] = useState<'IDLE' | 'ORCHESTRATING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [activeRailStep, setActiveRailStep] = useState<string>('Initializing PCI tokenization...');
  const [orchestrationResult, setOrchestrationResult] = useState<OrchestrationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showAuditTrace, setShowAuditTrace] = useState(false);

  // Reset or preset test data when opened
  useEffect(() => {
    if (isOpen) {
      setStatus('IDLE');
      setErrorMessage(null);
      setOrchestrationResult(null);
      if (!cardNumber) {
        // Default clean test card
        setCardNumber('4532 8912 3456 7890');
        setExpiry('12/28');
        setCvv('789');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Format Card Number (4-4-4-4)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const parts = [];
    for (let i = 0; i < raw.length; i += 4) {
      parts.push(raw.substring(i, i + 4));
    }
    setCardNumber(parts.join(' '));
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
    }
    setExpiry(val);
  };

  // Detect Card Brand
  const getCardBrand = () => {
    const clean = cardNumber.replace(/\D/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(clean)) return 'Mastercard';
    if (/^3[47]/.test(clean)) return 'Amex';
    return 'Card';
  };

  // Calculate equivalent in shopper's preferred currency
  const getCurrencyEquivalent = () => {
    if (currency === 'GBP') return `£${(totalUSD * 0.79).toFixed(2)} GBP`;
    if (currency === 'AUD') return `A$${(totalUSD * 1.54).toFixed(2)} AUD`;
    if (currency === 'NZD') return `NZ$${(totalUSD * 1.68).toFixed(2)} NZD`;
    if (currency === 'EUR') return `€${(totalUSD * 0.92).toFixed(2)} EUR`;
    if (currency === 'ZAR') return `R${totalZAR.toFixed(2)} ZAR`;
    return `$${totalUSD.toFixed(2)} USD`;
  };

  // Handle Form Submission
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardNumber || cardNumber.replace(/\D/g, '').length < 15) {
      setErrorMessage('Please enter a valid 16-digit credit or debit card number.');
      return;
    }

    if (!expiry || expiry.length < 5) {
      setErrorMessage('Please enter a valid card expiration date (MM/YY).');
      return;
    }

    if (!cvv || cvv.length < 3) {
      setErrorMessage('Please enter the 3 or 4-digit security code (CVV).');
      return;
    }

    setStatus('ORCHESTRATING');
    setErrorMessage(null);
    setActiveRailStep('Tokenizing card data via PCI Level 1 Vault...');

    // Multi-step visual progress simulation for transparent user feedback
    const isCoinbase = billingCountry.includes('Coinbase') || billingCountry.includes('USDC');
    const stepTimer1 = setTimeout(() => {
      if (isCoinbase) {
        setActiveRailStep('Routing via Coinbase Commerce (Card-to-USDC Nostro clearing)...');
      } else {
        setActiveRailStep('Attempting Primary Rail (ContiPay UK/EU/US Nostro)...');
      }
    }, 450);

    const stepTimer2 = setTimeout(() => {
      const isAustralasia = billingCountry.includes('Australia') || billingCountry.includes('New Zealand');
      if (isAustralasia || cardNumber.endsWith('9991')) {
        setActiveRailStep('Routing to Regional Rail (Pesapal Australasia / SADC)...');
      } else if (isCoinbase || cardNumber.endsWith('9992')) {
        setActiveRailStep('Clearing Card-to-USDC via Coinbase Bureau Off-Ramp...');
      }
    }, 1100);

    const stepTimer3 = setTimeout(() => {
      if (isCoinbase || cardNumber.endsWith('9992')) {
        setActiveRailStep('Settling Nostro Treasury Allocation via CBZ Bank Bureau...');
      }
    }, 1850);

    try {
      const cleanPan = cardNumber.replace(/\D/g, '');
      const [expMonth, expYear] = expiry.split('/');

      const payload = {
        card: {
          cardholderName,
          cardNumber: cleanPan,
          expiryMonth: expMonth,
          expiryYear: expYear,
          cvv,
          billingCountry,
          postalCode
        },
        payerMemberId: 'mem-1',
        payerMemberName: cardholderName,
        deliveryAddresses: memberAddresses
      };

      const res = await fetch('/api/checkout/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatus('ERROR');
        setErrorMessage(data.error || data.userMessage || 'Payment could not be authorized.');
        return;
      }

      if (data.mode === 'HOSTED_REDIRECT' && data.url) {
        window.location.href = data.url;
        return;
      }

      setOrchestrationResult(data);
      setStatus('SUCCESS');
      onCheckoutSuccess();
    } catch (err: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setStatus('ERROR');
      setErrorMessage(err.message || 'Network error occurred during payment orchestration.');
    }
  };

  const copyVoucherCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleShareWhatsApp = (order: OrchestrationResponse) => {
    const text = encodeURIComponent(
      `🛒 *TM Pick n Pay Grocery Voucher Dispatched!*\n\n` +
      `*Order ID:* ${order.orderId}\n` +
      `*Voucher Code:* ${order.voucherCode}\n` +
      `*Amount Paid:* $${order.totalUSD.toFixed(2)} USD\n` +
      `*Payment Rail:* ${order.finalRail}\n` +
      `*Settled at:* ${order.settlementAccount}\n\n` +
      `Your family grocery order is being fulfilled with priority cross-border dispatch.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl relative border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#0e2a47] via-[#143456] to-[#0e2a47] p-4 sm:p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-rose-600 text-stone-200 hover:text-white transition-all"
            title="Close Checkout"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Diaspora Payment Orchestration
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Sub-3s Multi-Rail
                </span>
              </div>
              <p className="text-xs text-blue-200">
                UK, USA, EU, AUS, NZ Unified Card Terminal · Direct RBZ Nostro Settlement
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: PCI-COMPLIANT CARD ENTRY FORM (IDLE)                              */}
        {/* ========================================================================= */}
        {status === 'IDLE' && (
          <form onSubmit={handleSubmitPayment} className="p-4 sm:p-6 space-y-4">
            
            {/* Order Total & Rate Summary Badge */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold block">
                  Total Order Amount
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-black text-[#0e2a47]">
                    ${totalUSD.toFixed(2)} USD
                  </span>
                  <span className="text-xs font-semibold text-stone-500">
                    ≈ {getCurrencyEquivalent()}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md inline-block mb-0.5">
                  Live Nostro Clearing
                </span>
                <span className="text-[11px] text-stone-500 block font-medium">
                  {cart.reduce((s, i) => s + i.quantity, 0)} Items for {members.length} Family Members
                </span>
              </div>
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-start gap-2 text-xs text-rose-800 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Payment Authorization Note:</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Cardholder Name */}
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Cardholder Full Name
              </label>
              <input
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="e.g. Tariro Moyo"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#0e2a47] focus:bg-white"
                required
              />
            </div>

            {/* Card Number Field with Brand Badge */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-700">
                  Card Number (Visa / Mastercard / Amex)
                </label>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-500">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>256-Bit TLS Vault</span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="4532 •••• •••• 7890"
                  maxLength={19}
                  className="w-full pl-3.5 pr-20 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-mono font-semibold text-stone-900 tracking-wider focus:outline-none focus:ring-2 focus:ring-[#0e2a47] focus:bg-white"
                  required
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white border border-stone-200 px-2 py-0.5 rounded-lg shadow-xs">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[10px] font-bold text-stone-700 uppercase">
                    {getCardBrand()}
                  </span>
                </div>
              </div>
            </div>

            {/* Expiry, CVV & Postal Code Row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Expires (MM/YY)
                </label>
                <input
                  type="text"
                  value={expiry}
                  onChange={handleExpiryChange}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-mono font-semibold text-stone-900 text-center focus:outline-none focus:ring-2 focus:ring-[#0e2a47] focus:bg-white"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700">
                    CVV / CVC
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCvvInfo(!showCvvInfo)}
                    className="text-stone-400 hover:text-stone-700"
                    title="3 digits on back of card"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                </div>
                <input
                  type="password"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="•••"
                  maxLength={4}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-mono font-semibold text-stone-900 text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-[#0e2a47] focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Postal / ZIP
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SW1A 1AA"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 text-center focus:outline-none focus:ring-2 focus:ring-[#0e2a47] focus:bg-white"
                  required
                />
              </div>
            </div>

            {/* Billing Country Dropdown */}
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Card Billing Country (Automated Gateway Routing)
              </label>
              <div className="relative">
                <select
                  value={billingCountry}
                  onChange={(e) => setBillingCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-stone-900 appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-[#0e2a47] focus:bg-white"
                >
                  <option value="Coinbase Commerce (Card-to-USDC)">🌐 Coinbase Commerce (Card-to-USDC)</option>
                  <option value="United Kingdom">🇬🇧 United Kingdom (ContiPay Primary Rail)</option>
                  <option value="United States">🇺🇸 United States (ContiPay Primary Rail)</option>
                  <option value="European Union">🇪🇺 European Union (ContiPay Primary Rail)</option>
                  <option value="Australia">🇦🇺 Australia (Pesapal Australasia Rail)</option>
                  <option value="New Zealand">🇳🇿 New Zealand (Pesapal Australasia Rail)</option>
                  <option value="South Africa">🇿🇦 South Africa (Pesapal / SADC Rail)</option>
                  <option value="South Africa">🇿🇦 South Africa (TM Pick n Pay Direct ZAR)</option>
                </select>
                <Globe2 className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[11px] text-stone-500 mt-1.5 leading-tight flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                <span><strong>Fast-Pass for existing Coinbase users:</strong> If you already have a Coinbase account, login/Passkey biometrics automatically auto-fills saved cards & limits for instant checkout settlement to merchant wallet on Base.</span>
              </p>
            </div>

            {/* Security Guarantee & Multi-Rail SLA Box */}
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 text-[11px] text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>PCI-DSS Level 1 & RBZ Compliant Remittance</span>
              </div>
              <p className="text-stone-600 leading-tight">
                Your payment is processed through our multi-rail fallback waterfall (Coinbase Commerce ➔ ContiPay ➔ Pesapal) guaranteeing &lt;3s authorization and direct Nostro settlement.
              </p>
            </div>

            {/* Quick Test Card Presets for Convenience */}
            <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-[10px] space-y-1">
              <span className="text-stone-500 font-bold uppercase tracking-wider block">
                🧪 Quick Test Scenarios:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCardNumber('4532 8912 3456 9992');
                    setBillingCountry('Coinbase Commerce (Card-to-USDC)');
                  }}
                  className="bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 px-2 py-0.5 rounded font-semibold"
                >
                  🌐 Coinbase Commerce (Card-to-USDC)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCardNumber('4532 8912 3456 7890');
                    setBillingCountry('United Kingdom');
                  }}
                  className="bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 px-2 py-0.5 rounded font-semibold"
                >
                  🇬🇧 UK / ContiPay Success
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCardNumber('4532 8912 3456 9991');
                    setBillingCountry('Australia');
                  }}
                  className="bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 px-2 py-0.5 rounded font-semibold"
                >
                  🇦🇺 AUS / Pesapal Fallback
                </button>
              </div>
            </div>

            {/* Single Unified "Pay Now" Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] hover:from-[#143427] hover:to-[#22543d] text-[#d4af37] font-black py-3.5 rounded-2xl text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Lock className="w-4 h-4 text-[#d4af37]" />
              <span>Pay Now · ${totalUSD.toFixed(2)} USD</span>
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: ACTIVE MULTI-RAIL ORCHESTRATION ANIMATION                         */}
        {/* ========================================================================= */}
        {status === 'ORCHESTRATING' && (
          <div className="p-6 sm:p-8 text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-stone-200" />
              <div className="absolute inset-0 rounded-full border-4 border-[#0e2a47] border-t-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full bg-[#0e2a47]/10 flex items-center justify-center">
                <Zap className="w-8 h-8 text-[#0e2a47] animate-pulse" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-lg font-black text-stone-900">
                Silent Payment Orchestration Active
              </h4>
              <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 inline-block px-3 py-1 rounded-full border border-emerald-200 animate-pulse">
                {activeRailStep}
              </p>
              <p className="text-[11px] text-stone-500 max-w-xs mx-auto pt-1">
                Cascading across ContiPay, Pesapal, and Coinbase smart-rails within sub-3s SLA.
              </p>
            </div>

            {/* Waterfall Sequence Visualizer */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2 text-left text-xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 border-b border-stone-200 pb-2">
                <span>Multi-Rail Routing Waterfall</span>
                <span>Latency Budget: &lt; 3,000ms</span>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-stone-800">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-bold">Rail 1: ContiPay UK/EU/US</span>
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">Stanbic Nostro</span>
                </div>

                <div className="flex items-center justify-between text-stone-800">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-bold">Rail 2: Pesapal Australasia</span>
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">CABS Nostro</span>
                </div>

                <div className="flex items-center justify-between text-stone-800">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-bold">Rail 3: Coinbase USDC Off-Ramp</span>
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">CBZ Bureau Nostro</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: SUCCESSFUL PAYMENT RECEIPT & VOUCHER DISPATCH                     */}
        {/* ========================================================================= */}
        {status === 'SUCCESS' && orchestrationResult && (
          <div className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-600 shadow-sm animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg sm:text-xl font-black text-stone-900">
                Payment Authorized & Settled!
              </h4>
              <p className="text-xs text-stone-600">
                {orchestrationResult.userMessage}
              </p>
            </div>

            {/* Voucher Code Box */}
            <div className="bg-gradient-to-r from-[#0e2a47] to-[#143456] text-white p-4 rounded-2xl shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-blue-200 mb-1">
                <span>TM Pick n Pay Grocery Voucher</span>
                <span className="bg-emerald-500/30 text-emerald-300 font-mono px-2 py-0.5 rounded text-[10px] border border-emerald-400/30">
                  {orchestrationResult.totalLatencyMs}ms Total Latency
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 my-2">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-stone-300 block">
                    Voucher Redemption Code
                  </span>
                  <span className="text-xl sm:text-2xl font-mono font-black text-[#ffb703] tracking-wider">
                    {orchestrationResult.voucherCode}
                  </span>
                </div>

                <button
                  onClick={() => copyVoucherCode(orchestrationResult.voucherCode)}
                  className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-300 border-t border-white/10 pt-2">
                <span>Order Ref: {orchestrationResult.orderId}</span>
                <span>Amount: ${orchestrationResult.totalUSD.toFixed(2)} USD</span>
              </div>
            </div>

            {/* Settlement & Clearance Metadata Card */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-stone-700 font-bold border-b border-stone-200 pb-2">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#0e2a47]" />
                  <span>Clearing & Nostro Settlement Details</span>
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">
                  {orchestrationResult.finalRail} RAIL
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Destination Account:</span>
                  <span className="font-bold text-stone-900 font-mono truncate max-w-[240px]">
                    {orchestrationResult.settlementAccount}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stone-500">RBZ Forex Compliance Ref:</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {orchestrationResult.forexReportingCode}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Transaction ID:</span>
                  <span className="font-bold text-stone-800 font-mono">
                    {orchestrationResult.transactionReference}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Locations Dispatch Summary */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-2 text-xs">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-700" />
                <span>Assigned Family Dispatch Summary:</span>
              </span>

              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {members.map((m) => {
                  const addr = memberAddresses[m.id] || m.deliveryAddress;
                  if (!addr) return null;
                  return (
                    <div key={m.id} className="bg-white p-2 rounded-lg border border-stone-200 flex items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <img src={m.avatar} alt={m.name} className="w-4 h-4 rounded-full object-cover" />
                        <span className="font-bold text-stone-900">{m.name}:</span>
                      </div>
                      <span className="text-stone-600 font-medium truncate max-w-[200px]">
                        {addr.type === 'STORE_PICKUP' ? `🏪 ${addr.storeName || 'Store Pickup'}` : `📍 ${addr.addressLine}, ${addr.city}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Collapsible Audit Trace */}
            <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setShowAuditTrace(!showAuditTrace)}
                className="w-full bg-stone-100 hover:bg-stone-200 px-3 py-2 flex items-center justify-between font-bold text-stone-700 transition-all"
              >
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>View Multi-Rail Routing Trace ({orchestrationResult.attempts.length} attempts)</span>
                </span>
                {showAuditTrace ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAuditTrace && (
                <div className="p-3 bg-stone-900 text-stone-200 font-mono text-[10px] space-y-1.5 max-h-36 overflow-y-auto">
                  {orchestrationResult.attempts.map((att, idx) => (
                    <div key={idx} className="flex items-start justify-between border-b border-stone-800 pb-1">
                      <div>
                        <span className="font-bold text-cyan-300">Attempt {idx + 1}: {att.rail}</span>
                        {att.error && <div className="text-rose-400 text-[9px]">{att.error}</div>}
                      </div>
                      <div className="text-right">
                        <span className={att.status === 'SUCCESS' ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                          {att.status}
                        </span>
                        <div className="text-stone-500">{att.latencyMs}ms</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleShareWhatsApp(orchestrationResult)}
                className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp Receipt</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  setStatus('IDLE');
                }}
                className="w-1/2 bg-[#0e2a47] hover:bg-[#143456] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Done & Return</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: ERROR / DECLINE SCREEN WITH 1-CLICK RETRY                         */}
        {/* ========================================================================= */}
        {status === 'ERROR' && (
          <div className="p-6 sm:p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center mx-auto text-rose-600 shadow-sm">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-lg font-black text-stone-900">
                Payment Could Not Be Authorized
              </h4>
              <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-medium max-w-sm mx-auto">
                {errorMessage || 'Card declined by card issuer or all gateway fallback rails timed out.'}
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-left text-xs text-stone-600 space-y-1">
              <span className="font-bold text-stone-800 block">Suggested Actions:</span>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>Verify your 16-digit card number, CVV code, and expiration date.</li>
                <li>Ensure international cross-border online transactions are enabled.</li>
                <li>Try an alternative Visa or Mastercard debit/credit card.</li>
              </ul>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatus('IDLE')}
                className="w-full bg-[#0e2a47] hover:bg-[#143456] text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again with Corrected Details</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
