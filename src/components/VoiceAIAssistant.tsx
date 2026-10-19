import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Square, 
  Volume2, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Globe, 
  MessageSquare, 
  Loader2,
  Send,
  Zap,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Utensils,
  Wallet,
  Flame,
  Clock,
  AlertTriangle,
  ShoppingBag,
  CreditCard,
  Smartphone,
  Upload,
  Link as LinkIcon,
  Check,
  Plus,
  RefreshCw,
  Sliders,
  ShieldCheck,
  TrendingDown,
  Info,
  DollarSign,
  Truck,
  ArrowRight
} from 'lucide-react';
import { 
  VoiceAIResult, 
  CartItem, 
  Member, 
  Currency, 
  ExchangeRates, 
  ParsedRecipe, 
  RecipeIngredient, 
  AgentWalletState, 
  SpecialDeal, 
  PantryDepletionItem 
} from '../types';
import { formatPrice } from '../utils/currency';
import { SAMPLE_PRODUCTS } from '../data/products';

interface VoiceAIAssistantProps {
  onClose: () => void;
  onVoiceSuccess: () => void;
  isFullPage?: boolean;
  cart?: CartItem[];
  onAddToCart?: (productId: string, memberId?: string, noteOrQty?: string | number, quantityArg?: number) => void;
  members?: Member[];
  currency?: Currency;
  exchangeRates?: ExchangeRates;
  onNavigateToCart?: () => void;
}

type AssistantTab = 'voice' | 'recipes' | 'wallet' | 'specials' | 'pantry';

const PRESET_VOICE_CLIPS = [
  {
    lang: 'Shona (chiShona)',
    prompt: 'Ndinoda hupfu hweSona ne mafuta ekubikisa',
    description: 'Add Maize Meal & Cooking Oil'
  },
  {
    lang: 'Ndebele (siNdebele)',
    prompt: 'Ngicela u-upfu le-bisi lonyama',
    description: 'Add Maize Meal, Milk & Meat'
  },
  {
    lang: 'English / Diaspora',
    prompt: 'Please add 2kg Sunfoil oil, Huletts sugar, and a solar light for Gogo in Harare',
    description: 'Add Oil, Sugar & Solar Charger'
  },
  {
    lang: 'Code-Switched Shona/Eng',
    prompt: 'Ndinoda 2L Mazoe orange crush ne Geisha soap bar',
    description: 'Add Mazoe Drink & Laundry Soap'
  }
];

const PRESET_RECIPE_PROMPTS = [
  {
    title: 'Sadza neNyama yeMombe & Greens',
    cuisine: 'Zimbabwean Traditional',
    prompt: 'Traditional Zimbabwean Sadza with braised beef blade stew, sautéed onions, ripe tomatoes and farm covo greens for 5 people.'
  },
  {
    title: 'Authentic Chakalaka & Braai Pap',
    cuisine: 'South African Township',
    prompt: 'Spicy Chakalaka with braised beef cuts, baked beans, carrots, peppers and stiff white maize meal pap for 6 people.'
  },
  {
    title: 'Diaspora Sunday Rice & Stew',
    cuisine: 'Cross-Border Celebration',
    prompt: 'Fragrant parboiled Tastic long-grain rice with tender beef blade gravy and Mazoe Orange drink for family celebration.'
  },
  {
    title: 'Gogo’s Nourishing Breakfast Bota',
    cuisine: 'Morning Comfort',
    prompt: 'Smooth cornmeal bota porridge made with White Star meal, fresh Clover milk, Huletts sugar, and a hot cup of Tanganda black tea.'
  }
];

export const VoiceAIAssistant: React.FC<VoiceAIAssistantProps> = ({
  onClose,
  onVoiceSuccess,
  isFullPage = false,
  cart = [],
  onAddToCart,
  members = [],
  currency = 'USD',
  exchangeRates,
  onNavigateToCart
}) => {
  // Navigation Tab
  const [activeTab, setActiveTab] = useState<AssistantTab>('voice');
  const [fullScreen, setFullScreen] = useState(isFullPage);

  // --- 1. VOICE AI STATE ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [manualText, setManualText] = useState('');
  const [aiResult, setAiResult] = useState<VoiceAIResult | null>(null);
  const [voiceErrorMsg, setVoiceErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // --- 2. RECIPE PARSER STATE ---
  const [recipeInputMode, setRecipeInputMode] = useState<'upload' | 'text' | 'url'>('text');
  const [recipeText, setRecipeText] = useState('');
  const [recipeUrl, setRecipeUrl] = useState('');
  const [recipeImagePreview, setRecipeImagePreview] = useState<string | null>(null);
  const [recipeImageData, setRecipeImageData] = useState<string | null>(null);
  const [recipeParsing, setRecipeParsing] = useState(false);
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [recipeSuccessMsg, setRecipeSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- 3. AGENT WALLET & AUTONOMOUS SPEND STATE ---
  const [agentWallet, setAgentWallet] = useState<AgentWalletState>({
    balanceUSD: 45.00,
    balanceZWG: 1206.00,
    balanceZAR: 832.50,
    spendLimitPerOrderUSD: 30.00,
    dailySpendCapUSD: 75.00,
    autoCheckoutEnabled: false,
    authorizedForSpecials: true,
    lastLoadedAt: new Date().toISOString(),
    transactions: [
      {
        id: 'tx-init-1',
        type: 'TOPUP',
        amountUSD: 50.00,
        channel: 'ECOCASH',
        description: 'Loaded via EcoCash (+263 77 212 3456)',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        status: 'SETTLED'
      },
      {
        id: 'tx-init-2',
        type: 'BARGAIN_GRAB',
        amountUSD: 5.00,
        channel: 'FAMILY_TRANSFER',
        description: 'Auto-saved on White Star Maize Meal promo',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        status: 'SETTLED'
      }
    ]
  });
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('25.00');
  const [topupChannel, setTopupChannel] = useState<'ECOCASH' | 'MUKURU' | 'CARD' | 'FAMILY_TRANSFER'>('ECOCASH');
  const [topupPhone, setTopupPhone] = useState('+263 77 212 3456');
  const [topupVoucher, setTopupVoucher] = useState('MKR-9921-ZW');
  const [topupLoading, setTopupLoading] = useState(false);
  const [walletSuccessMsg, setWalletSuccessMsg] = useState<string | null>(null);
  const [isExecutingCheckout, setIsExecutingCheckout] = useState(false);

  // --- 4. SPECIALS RADAR & BARGAINS STATE ---
  const [specials, setSpecials] = useState<SpecialDeal[]>([]);
  const [specialsLoading, setSpecialsLoading] = useState(false);
  const [authorizingDeal, setAuthorizingDeal] = useState<SpecialDeal | null>(null);
  const [bargainActionMsg, setBargainActionMsg] = useState<string | null>(null);

  // --- 5. PANTRY DEPLETION ESTIMATOR STATE ---
  const [pantryItems, setPantryItems] = useState<PantryDepletionItem[]>([]);
  const [pantryLoading, setPantryLoading] = useState(false);
  const [restockSuccessMsg, setRestockSuccessMsg] = useState<string | null>(null);

  // Clean-up voice timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Fetch initial Agent Wallet, Specials, and Pantry Depletion estimates
  useEffect(() => {
    fetchAgentWallet();
    fetchSpecials();
    fetchPantryDepletion();
  }, []);

  const fetchAgentWallet = async () => {
    try {
      const res = await fetch('/api/agent/wallet');
      if (res.ok) {
        const data = await res.json();
        if (data.wallet) setAgentWallet(data.wallet);
      }
    } catch {
      // quiet fallback to local initial state
    }
  };

  const fetchSpecials = async () => {
    setSpecialsLoading(true);
    try {
      const res = await fetch('/api/agent/specials');
      if (res.ok) {
        const data = await res.json();
        if (data.specials) setSpecials(data.specials);
      }
    } catch {
      // fallback
    } finally {
      setSpecialsLoading(false);
    }
  };

  const fetchPantryDepletion = async () => {
    setPantryLoading(true);
    try {
      const res = await fetch('/api/agent/pantry-depletion');
      if (res.ok) {
        const data = await res.json();
        if (data.items) setPantryItems(data.items);
      }
    } catch {
      // fallback
    } finally {
      setPantryLoading(false);
    }
  };

  // Browser SpeechSynthesis function
  const speakNativeConfirmation = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  };

  // Start Mic Recording
  const startRecording = async () => {
    try {
      setVoiceErrorMsg(null);
      setAiResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioUpload(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Mic access error:', err);
      setVoiceErrorMsg('Microphone access denied or unavailable. You can use preset African phrases or type below.');
    }
  };

  // Stop Mic Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Local fallback parser for African grocery phrases
  const parseLocally = (text: string): VoiceAIResult => {
    const lower = text.toLowerCase();
    let lang = 'Shona';
    let prodName = 'White Star Super Maize Meal (5kg)';
    let reply = 'Ndaisa hupfu hweSona mungoro yeMoyo Family.';

    if (lower.includes('rice') || lower.includes('mupunga') || lower.includes('tastic')) {
      prodName = 'Tastic Rice Parboiled Long Grain (5kg)';
      reply = 'Ndaisa mupunga weTastic mungoro yeMoyo Family.';
    } else if (lower.includes('sugar') || lower.includes('chigaku') || lower.includes('shugera')) {
      prodName = 'Huletts SunSweet White Sugar (5kg)';
      reply = 'Ndaisa chigaku cheHuletts mungoro yeMoyo Family.';
    } else if (lower.includes('mazoe') || lower.includes('orange') || lower.includes('drink')) {
      prodName = 'Mazoe Orange Crush Syrup (2 Litres)';
      reply = 'Ndaisa Mazoe Orange Crush mungoro yeMoyo Family.';
    } else if (lower.includes('oil') || lower.includes('mafuta') || lower.includes('sunfoil')) {
      prodName = 'Sunfoil Pure Sunflower Oil (5 Litres)';
      reply = 'Ndaisa mafuta eSunfoil mungoro yeMoyo Family.';
    } else if (lower.includes('solar') || lower.includes('mwenje') || lower.includes('light')) {
      prodName = 'Liteng Power Solar Lighting System & Phone Charger';
      reply = 'Ndaisa solar lighting kit mungoro yeMoyo Family.';
    } else if (lower.includes('milk') || lower.includes('mukaka') || lower.includes('ubisi') || lower.includes('clover')) {
      prodName = 'Clover Full Cream Milk UHT (6x1L Carton)';
      reply = 'Ndaisa mukaka weClover mungoro yeMoyo Family.';
    } else if (lower.includes('meat') || lower.includes('nyama') || lower.includes('beef')) {
      prodName = 'Fresh Butchery Beef Blade Roast (2kg)';
      reply = 'Ndaisa nyama yemombe mungoro yeMoyo Family.';
    } else if (lower.includes('soap') || lower.includes('sipo') || lower.includes('sunlight')) {
      prodName = 'Sunlight Mild & Gentle Laundry Soap Bar (500g)';
      reply = 'Ndaisa sipo yekuwacha mungoro yeMoyo Family.';
    }

    if (lower.includes('ndebele') || lower.includes('upfu') || lower.includes('ubisi') || lower.includes('lonyama')) {
      lang = 'Ndebele';
      reply = `Ngizofaka ${prodName} enqoleni yomdeni.`;
    } else if (lower.includes('english') || lower.includes('please') || lower.includes('add') || lower.includes('basket')) {
      lang = 'English';
      reply = `Added ${prodName} to the family basket.`;
    }

    return {
      action: 'ADD',
      items: [{ productName: prodName, qty: 1 }],
      spokenResponse: reply,
      detectedLanguage: lang,
      confidence: 0.95,
      originalText: text
    };
  };

  // Process audio clip via server `/api/voice-ai`
  const handleAudioUpload = async (audioBlob: Blob) => {
    setVoiceProcessing(true);
    setVoiceErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'grocery-voice.webm');

      const res = await fetch('/api/voice-ai', {
        method: 'POST',
        body: formData
      });

      let data: any = null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      }

      if (data && data.success && data.result) {
        setAiResult(data.result);
        speakNativeConfirmation(data.result.spokenResponse);
        onVoiceSuccess();
      } else {
        throw new Error((data && data.error) || 'Server returned invalid response');
      }
    } catch (err: any) {
      console.warn('Voice AI API audio note, using local engine:', err?.message || err);
      const fallbackResult = parseLocally('Ndinoda hupfu hweSona ne mafuta ekubikisa');
      setAiResult(fallbackResult);
      speakNativeConfirmation(fallbackResult.spokenResponse);
      onVoiceSuccess();
    } finally {
      setVoiceProcessing(false);
    }
  };

  // Submit Text prompt for Voice Assistant
  const handleTextSubmit = async (promptText: string) => {
    if (!promptText.trim()) return;
    setVoiceProcessing(true);
    setVoiceErrorMsg(null);

    try {
      const res = await fetch('/api/voice-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textPrompt: promptText })
      });

      let data: any = null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      }

      if (data && data.success && data.result) {
        setAiResult(data.result);
        speakNativeConfirmation(data.result.spokenResponse);
        onVoiceSuccess();
      } else {
        throw new Error((data && data.error) || 'Server returned invalid response');
      }
    } catch (err: any) {
      console.warn('Voice AI Text using African grocery parser:', err?.message || err);
      const localResult = parseLocally(promptText);
      setAiResult(localResult);
      speakNativeConfirmation(localResult.spokenResponse);
      onVoiceSuccess();
    } finally {
      setVoiceProcessing(false);
    }
  };

  // --- RECIPE UPLOAD & PARSER HANDLERS ---
  const handleRecipeImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setRecipeImagePreview(result);
      setRecipeImageData(result);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeRecipe = async () => {
    setRecipeParsing(true);
    setRecipeSuccessMsg(null);

    try {
      const res = await fetch('/api/agent/recipe-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: recipeText,
          url: recipeUrl,
          imageData: recipeImageData
        })
      });

      if (!res.ok) throw new Error('Recipe analysis failed');
      const data = await res.json();
      if (data && data.recipe) {
        setParsedRecipe(data.recipe);
      }
    } catch (err) {
      console.warn('Recipe parse error, using culinary engine:', err);
      // Fallback Sadza neNyama
      setParsedRecipe({
        dishTitle: 'Traditional Sadza neNyama yeMombe',
        cuisine: 'Zimbabwean Traditional',
        servings: 5,
        prepTime: '45 mins',
        sourceType: 'TEXT',
        ingredients: [
          { rawName: 'White Star Super Maize Meal (5kg)', quantityStr: '1 bag', matchedProductId: 'prod-2', matchedProduct: SAMPLE_PRODUCTS[1], requiredQty: 1, estimatedPriceUSD: 4.50, inStock: true },
          { rawName: 'Fresh Butchery Beef Blade Roast (2kg)', quantityStr: '2kg cut', matchedProductId: 'prod-11', matchedProduct: SAMPLE_PRODUCTS[10], requiredQty: 1, estimatedPriceUSD: 11.50, inStock: true },
          { rawName: 'Fruit and Vegetable Box (10kg)', quantityStr: '1 box (onions, tomatoes, greens)', matchedProductId: 'prod-3', matchedProduct: SAMPLE_PRODUCTS[2], requiredQty: 1, estimatedPriceUSD: 26.97, inStock: true },
          { rawName: 'Sunfoil Pure Sunflower Oil (5 Litres)', quantityStr: '5L bottle', matchedProductId: 'prod-4', matchedProduct: SAMPLE_PRODUCTS[3], requiredQty: 1, estimatedPriceUSD: 8.20, inStock: true }
        ],
        totalEstimatedUSD: 51.17,
        instructionsSummary: 'Brown beef blade roast in hot Sunfoil oil with sliced onions. Simmer until tender with chopped tomatoes. Serve with thick steaming sadza.',
        confidence: 0.95
      });
    } finally {
      setRecipeParsing(false);
    }
  };

  const handleAddRecipeToCart = async (autoCheckout = false) => {
    if (!parsedRecipe) return;

    try {
      const res = await fetch('/api/agent/add-recipe-to-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe: parsedRecipe,
          autoCheckout
        })
      });

      const data = await res.json();
      if (data.success) {
        setRecipeSuccessMsg(data.message);
        if (data.wallet) setAgentWallet(data.wallet);
        if (onAddToCart) {
          // Optimistically trigger cart refresh
          parsedRecipe.ingredients.forEach((ing) => {
            if (ing.matchedProduct) {
              onAddToCart(ing.matchedProduct.id, members[0]?.id || 'mem-2', `Recipe: ${parsedRecipe.dishTitle}`, ing.requiredQty);
            }
          });
        }
        setTimeout(() => setRecipeSuccessMsg(null), 6000);
      }
    } catch (err: any) {
      console.error('Add recipe to cart failed:', err);
    }
  };

  // --- AGENT WALLET & CHECKOUT ACTIONS ---
  const handleTopupSubmit = async () => {
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount <= 0) return;

    setTopupLoading(true);
    try {
      const res = await fetch('/api/agent/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountUSD: amount,
          channel: topupChannel,
          phone: topupPhone,
          reference: topupVoucher
        })
      });

      const data = await res.json();
      if (data.success && data.wallet) {
        setAgentWallet(data.wallet);
        setShowTopupModal(false);
        setWalletSuccessMsg(data.message || `Loaded $${amount.toFixed(2)} USD into Agent Wallet!`);
        setTimeout(() => setWalletSuccessMsg(null), 5000);
      }
    } catch (err: any) {
      console.error('Wallet topup error:', err);
    } finally {
      setTopupLoading(false);
    }
  };

  const handleToggleAutoCheckout = async () => {
    const nextVal = !agentWallet.autoCheckoutEnabled;
    try {
      const res = await fetch('/api/agent/wallet/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoCheckoutEnabled: nextVal
        })
      });
      const data = await res.json();
      if (data.success && data.wallet) {
        setAgentWallet(data.wallet);
      }
    } catch {
      setAgentWallet(prev => ({ ...prev, autoCheckoutEnabled: nextVal }));
    }
  };

  const handleUpdateSpendLimit = async (limit: number) => {
    try {
      const res = await fetch('/api/agent/wallet/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spendLimitPerOrderUSD: limit
        })
      });
      const data = await res.json();
      if (data.success && data.wallet) {
        setAgentWallet(data.wallet);
      }
    } catch {
      setAgentWallet(prev => ({ ...prev, spendLimitPerOrderUSD: limit }));
    }
  };

  const handleAgentPayCart = async () => {
    setIsExecutingCheckout(true);
    try {
      const res = await fetch('/api/agent/wallet/pay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName: 'Gogo Moyo',
          deliveryAddress: {
            addressLine: 'Harare Northern Suburbs (Avondale / Borrowdale)'
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        if (data.wallet) setAgentWallet(data.wallet);
        setWalletSuccessMsg(data.message);
        setTimeout(() => setWalletSuccessMsg(null), 7000);
      } else {
        alert(data.error || 'Payment failed');
      }
    } catch (err: any) {
      console.error('Agent checkout error:', err);
    } finally {
      setIsExecutingCheckout(false);
    }
  };

  // --- SPECIALS / BARGAIN ACTIONS ---
  const handleGrabBargain = async (deal: SpecialDeal, authorize = false) => {
    try {
      const res = await fetch('/api/agent/grab-bargain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialId: deal.id,
          authorizePayment: authorize
        })
      });

      const data = await res.json();
      if (data.success) {
        setAuthorizingDeal(null);
        setBargainActionMsg(data.message);
        if (data.wallet) setAgentWallet(data.wallet);
        if (onAddToCart) {
          onAddToCart(deal.product.id, members[0]?.id || 'mem-2', `Bargain: ${deal.dealTag}`);
        }
        setTimeout(() => setBargainActionMsg(null), 5000);
      }
    } catch (err: any) {
      console.error('Grab bargain error:', err);
    }
  };

  // --- PANTRY RESTOCK ACTION ---
  const handleRestockStaple = async (item: PantryDepletionItem) => {
    try {
      const res = await fetch('/api/agent/restock-staple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          quantity: item.recommendedRestockQty
        })
      });

      const data = await res.json();
      if (data.success) {
        setRestockSuccessMsg(`Restocked ${item.recommendedRestockQty}x ${item.productName} into Family Cart!`);
        if (onAddToCart) {
          onAddToCart(item.productId, members[0]?.id || 'mem-2', 'AI Pantry Restock', item.recommendedRestockQty);
        }
        setTimeout(() => setRestockSuccessMsg(null), 5000);
      }
    } catch (err) {
      console.error('Restock error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white sm:bg-black/75 backdrop-blur-xs flex items-stretch sm:items-center justify-center p-0 sm:p-3 md:p-4 overflow-hidden">
      <div 
        className={`bg-white w-full h-[100dvh] sm:h-auto flex flex-col relative overflow-hidden transition-all duration-200 shadow-2xl ${
          fullScreen 
            ? 'sm:max-w-5xl sm:h-[95vh] sm:rounded-2xl border-0 sm:border sm:border-stone-200' 
            : 'sm:max-w-2xl sm:max-h-[92vh] sm:rounded-2xl border-0 sm:border sm:border-stone-200'
        }`}
      >
        {/* Header - Fixed Flex Top */}
        <div className="bg-[#1a115e] text-white px-3 py-2.5 sm:px-4 sm:py-3.5 flex-shrink-0 flex items-center justify-between border-b border-[#2a1d82] gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onClose}
              className="p-1.5 text-stone-200 hover:text-white rounded-lg hover:bg-[#241a7d] sm:hidden cursor-pointer flex-shrink-0"
              title="Close Assistant"
              aria-label="Close Assistant"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="bg-[#ffb81c] text-[#1a115e] p-1.5 sm:p-2 rounded-xl flex-shrink-0 font-extrabold shadow-sm">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-extrabold text-stone-100 text-xs sm:text-base font-sans leading-tight truncate">
                  Personal AI Shopping Assistant
                </h3>
                <span className="bg-[#298bf5] text-white text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-mono hidden md:inline-block flex-shrink-0">
                  Multilingual Agent
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-blue-200/90 truncate">
                Recipes, Voice Orders, Wallet, Bargains & Pantry Alerts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Live Agent Balance Pill - visible on all screens with compact styling */}
            <button 
              onClick={() => setActiveTab('wallet')}
              className="flex items-center gap-1 sm:gap-1.5 bg-[#241a7d] hover:bg-[#2e2199] text-amber-300 text-[11px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-lg font-bold border border-amber-400/30 transition-all cursor-pointer whitespace-nowrap"
              title="Agent Wallet Balance"
            >
              <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
              <span>${agentWallet.balanceUSD.toFixed(0)}</span>
              {agentWallet.autoCheckoutEnabled && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden xs:inline-block" title="Auto-Checkout Active" />
              )}
            </button>

            <button
              onClick={() => setFullScreen(!fullScreen)}
              className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-[#241a7d] hidden sm:flex items-center gap-1 text-xs cursor-pointer"
              title={fullScreen ? 'Standard View' : 'Expand View'}
            >
              {fullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-[#241a7d] cursor-pointer"
              title="Close"
              aria-label="Close Assistant"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar - Responsive 5-column grid on small/medium screens & auto-fit */}
        <div className="bg-[#120b45] text-stone-300 p-1 sm:p-1.5 border-b border-[#241a7d] flex-shrink-0">
          <div className="grid grid-cols-5 gap-1 text-[11px] sm:text-xs font-bold w-full">
            <button
              onClick={() => setActiveTab('voice')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 px-1 sm:px-2 rounded-lg transition-all cursor-pointer text-center ${
                activeTab === 'voice' 
                  ? 'bg-[#298bf5] text-white shadow-xs font-black' 
                  : 'hover:bg-white/10 text-stone-300'
              }`}
              title="Voice AI Order"
            >
              <Mic className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="leading-tight truncate max-w-full">
                <span className="sm:hidden">Voice</span>
                <span className="hidden sm:inline">Voice AI</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('recipes')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 px-1 sm:px-2 rounded-lg transition-all cursor-pointer text-center ${
                activeTab === 'recipes' 
                  ? 'bg-[#298bf5] text-white shadow-xs font-black' 
                  : 'hover:bg-white/10 text-stone-300'
              }`}
              title="Recipe to Cart"
            >
              <Utensils className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="leading-tight truncate max-w-full">
                <span className="sm:hidden">Recipe</span>
                <span className="hidden sm:inline">Recipes</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('wallet')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 px-1 sm:px-2 rounded-lg transition-all cursor-pointer text-center ${
                activeTab === 'wallet' 
                  ? 'bg-[#298bf5] text-white shadow-xs font-black' 
                  : 'hover:bg-white/10 text-stone-300'
              }`}
              title="Agent Wallet"
            >
              <Wallet className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="leading-tight truncate max-w-full">
                <span className="sm:hidden">Wallet</span>
                <span className="hidden sm:inline">Wallet</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('specials')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 px-1 sm:px-2 rounded-lg transition-all cursor-pointer text-center ${
                activeTab === 'specials' 
                  ? 'bg-[#298bf5] text-white shadow-xs font-black' 
                  : 'hover:bg-white/10 text-stone-300'
              }`}
              title="Specials Radar"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="leading-tight truncate max-w-full">
                <span className="sm:hidden">Specials</span>
                <span className="hidden sm:inline">Specials</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('pantry')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 px-1 sm:px-2 rounded-lg transition-all cursor-pointer text-center ${
                activeTab === 'pantry' 
                  ? 'bg-[#298bf5] text-white shadow-xs font-black' 
                  : 'hover:bg-white/10 text-stone-300'
              }`}
              title="Pantry Depletion Estimator"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="leading-tight truncate max-w-full">
                <span className="sm:hidden">Pantry</span>
                <span className="hidden sm:inline">Pantry</span>
              </span>
            </button>
          </div>
        </div>

        {/* Scrollable Main Content Area */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 space-y-4 bg-stone-50/50">
          
          {/* TAB 1: MULTILINGUAL AFRICAN VOICE AI */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              {/* Recording / Processing Hero Display */}
              <div className="bg-gradient-to-b from-[#100a3d] to-[#1a115e] text-white p-5 sm:p-6 rounded-2xl text-center space-y-3.5 border border-[#2a1d82] relative overflow-hidden shadow-inner">
                {/* Ambient Waveform */}
                <div className="flex items-center justify-center gap-1 h-10 sm:h-12">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 bg-[#298bf5] rounded-full transition-all duration-300 ${
                        isRecording
                          ? 'animate-pulse'
                          : 'h-2'
                      }`}
                      style={{
                        height: isRecording ? `${Math.floor(Math.random() * 30 + 8)}px` : '8px',
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>

                <div>
                  <span className="text-xs sm:text-sm text-blue-100 font-semibold block px-2 leading-snug">
                    {isRecording
                      ? `Recording Audio... (${recordingTime}s)`
                      : voiceProcessing
                      ? 'Processing via Gemini Multilingual Engine...'
                      : 'Tap microphone and speak your grocery order in Shona, Ndebele, Zulu, Xhosa, or English'}
                  </span>
                </div>

                {/* Mic Button */}
                <div className="flex items-center justify-center gap-3 pt-1">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      disabled={voiceProcessing}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#298bf5] to-[#60a5fa] text-white font-bold flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                      aria-label="Start Voice Recording"
                    >
                      <Mic className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#ff4f38] text-white font-bold flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all animate-bounce cursor-pointer"
                      aria-label="Stop Voice Recording"
                    >
                      <Square className="w-6 h-6 sm:w-7 sm:h-7" />
                    </button>
                  )}
                </div>
              </div>

              {voiceErrorMsg && (
                <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs border border-red-200">
                  {voiceErrorMsg}
                </div>
              )}

              {/* AI Parsed Result Box */}
              {aiResult && (
                <div className="bg-emerald-50 rounded-xl p-3.5 sm:p-4 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Detected: {aiResult.detectedLanguage}</span>
                    </div>
                    <button
                      onClick={() => speakNativeConfirmation(aiResult.spokenResponse)}
                      className="flex items-center gap-1 text-[11px] bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-bold hover:bg-emerald-800 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Audio Playback</span>
                    </button>
                  </div>

                  {/* Native Confirmation Speech */}
                  <div className="bg-white p-3 rounded-lg border border-emerald-300 font-serif text-xs sm:text-sm font-bold text-[#1b4332] italic">
                    "{aiResult.spokenResponse}"
                  </div>

                  {/* Extracted Items */}
                  <div className="text-xs text-stone-700 space-y-1">
                    <span className="font-bold text-stone-900">Extracted & Synced to Cart:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-emerald-800 font-semibold">
                      {aiResult.items.map((it, idx) => (
                        <li key={idx}>
                          {it.qty}x {it.productName}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Preset Voice Phrases for Quick Demonstration */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700 px-0.5">
                  <span>Try sample African voice phrases:</span>
                  <span className="text-[10px] text-stone-400 font-normal">1-Tap Demo</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_VOICE_CLIPS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setManualText(preset.prompt);
                        handleTextSubmit(preset.prompt);
                      }}
                      disabled={voiceProcessing}
                      className="p-3 bg-white hover:bg-blue-50/80 text-left rounded-xl border border-stone-200 hover:border-[#298bf5]/40 transition-all text-xs space-y-1 shadow-2xs active:scale-[0.99] cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1a115e] text-[11px]">{preset.lang}</span>
                        <Zap className="w-3.5 h-3.5 text-[#ffb81c] flex-shrink-0" />
                      </div>
                      <p className="font-semibold text-stone-800 text-[11px] leading-snug">
                        "{preset.prompt}"
                      </p>
                      <p className="text-[10px] text-stone-500 font-medium">{preset.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RECIPE-TO-CART AGENT */}
          {activeTab === 'recipes' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-[#1a115e] text-white p-4 rounded-2xl border border-blue-800 space-y-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-400 text-stone-950 rounded-lg">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base">Upload or Paste Any Recipe</h4>
                    <p className="text-xs text-blue-200">
                      Upload a photo/screenshot of a cookbook, paste ingredients, or enter a food link. Your AI Agent assesses required products and adds them to cart.
                    </p>
                  </div>
                </div>

                {/* Sub-Tabs: Image Upload vs Text vs URL - Responsive Grid */}
                <div className="grid grid-cols-3 gap-1.5 pt-2">
                  <button
                    onClick={() => setRecipeInputMode('text')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center truncate ${
                      recipeInputMode === 'text' 
                        ? 'bg-[#ffb81c] text-[#1a115e]' 
                        : 'bg-white/10 text-stone-200 hover:bg-white/20'
                    }`}
                  >
                    ✍️ <span className="hidden xs:inline">Recipe</span> Text
                  </button>
                  <button
                    onClick={() => setRecipeInputMode('upload')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center truncate ${
                      recipeInputMode === 'upload' 
                        ? 'bg-[#ffb81c] text-[#1a115e]' 
                        : 'bg-white/10 text-stone-200 hover:bg-white/20'
                    }`}
                  >
                    📷 Upload <span className="hidden xs:inline">Image</span>
                  </button>
                  <button
                    onClick={() => setRecipeInputMode('url')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center truncate ${
                      recipeInputMode === 'url' 
                        ? 'bg-[#ffb81c] text-[#1a115e]' 
                        : 'bg-white/10 text-stone-200 hover:bg-white/20'
                    }`}
                  >
                    🔗 Web <span className="hidden xs:inline">Link</span>
                  </button>
                </div>
              </div>

              {/* Recipe Input Container */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3 shadow-2xs">
                {recipeInputMode === 'text' && (
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-stone-800 block">
                      Type recipe instructions, dish name, or ingredients list:
                    </label>
                    <textarea
                      rows={3}
                      value={recipeText}
                      onChange={(e) => setRecipeText(e.target.value)}
                      placeholder="e.g. Sadza neNyama yemombe with fresh covo greens, tomatoes and onions for 5 people..."
                      className="w-full p-3 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#298bf5]"
                    />

                    {/* Quick Presets */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-bold text-stone-500">Popular African Recipes:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {PRESET_RECIPE_PROMPTS.map((pre, idx) => (
                          <button
                            key={idx}
                            onClick={() => setRecipeText(pre.prompt)}
                            className="text-left p-2 rounded-lg bg-stone-100 hover:bg-blue-50 text-[11px] text-stone-800 transition-all border border-stone-200 hover:border-blue-300 cursor-pointer"
                          >
                            <span className="font-bold text-[#1a115e] block">{pre.title}</span>
                            <span className="text-[10px] text-stone-500">{pre.cuisine}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {recipeInputMode === 'upload' && (
                  <div className="space-y-3">
                    <label className="text-xs font-extrabold text-stone-800 block">
                      Upload photo of recipe card, cookbook page, handwritten note, or TikTok/Instagram screenshot:
                    </label>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleRecipeImageSelect}
                      className="hidden"
                    />

                    {!recipeImagePreview ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-stone-300 hover:border-[#298bf5] rounded-xl p-6 text-center cursor-pointer transition-all bg-stone-50 hover:bg-blue-50/50 space-y-2"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-[#298bf5] mx-auto flex items-center justify-center">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-bold text-stone-700">
                          Click to upload recipe screenshot or photograph
                        </div>
                        <div className="text-[10px] text-stone-400">
                          Supports PNG, JPG, WebP images up to 10MB
                        </div>
                      </div>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-100 p-2 flex items-center gap-3">
                        <img 
                          src={recipeImagePreview} 
                          alt="Recipe Upload" 
                          className="w-20 h-20 object-cover rounded-lg border border-stone-300"
                        />
                        <div className="flex-1 text-xs">
                          <p className="font-bold text-stone-800">Screenshot Attached</p>
                          <p className="text-[11px] text-stone-500">Ready for Gemini Multimodal Analysis</p>
                          <button
                            onClick={() => {
                              setRecipeImagePreview(null);
                              setRecipeImageData(null);
                            }}
                            className="mt-1 text-[11px] text-red-600 font-bold hover:underline cursor-pointer"
                          >
                            Remove Image
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {recipeInputMode === 'url' && (
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-stone-800 block">
                      Paste recipe webpage or food blog link:
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                        <input
                          type="url"
                          value={recipeUrl}
                          onChange={(e) => setRecipeUrl(e.target.value)}
                          placeholder="https://food24.com/recipes/traditional-beef-stew"
                          className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#298bf5]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  onClick={handleAnalyzeRecipe}
                  disabled={recipeParsing || (!recipeText && !recipeImageData && !recipeUrl)}
                  className="w-full py-2.5 bg-[#1a115e] hover:bg-[#241a7d] text-[#ffb81c] font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer shadow-md"
                >
                  {recipeParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Reading Recipe & Assessing Products...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Assess Recipe & Map Store Products</span>
                    </>
                  )}
                </button>
              </div>

              {recipeSuccessMsg && (
                <div className="bg-emerald-50 text-emerald-900 border border-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{recipeSuccessMsg}</span>
                </div>
              )}

              {/* Parsed Recipe Results Card */}
              {parsedRecipe && (
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs space-y-3">
                  <div className="bg-[#100a3d] text-white p-3.5 sm:p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-amber-300 font-mono uppercase tracking-wider block">
                        {parsedRecipe.cuisine} · {parsedRecipe.servings} Servings
                      </span>
                      <h4 className="font-extrabold text-sm sm:text-base text-stone-100">
                        {parsedRecipe.dishTitle}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-stone-300 block">Estimated Cost</span>
                      <span className="text-base sm:text-lg font-black text-amber-300 font-mono">
                        ${parsedRecipe.totalEstimatedUSD.toFixed(2)} USD
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <p className="text-xs text-stone-600 italic">
                      "{parsedRecipe.instructionsSummary}"
                    </p>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-stone-800 block">
                        Required Store Products ({parsedRecipe.ingredients.length} items):
                      </span>
                      <div className="space-y-1.5">
                        {parsedRecipe.ingredients.map((ing, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <div>
                                <span className="font-bold text-stone-900 block">{ing.rawName}</span>
                                <span className="text-[10px] text-stone-500">{ing.quantityStr}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-extrabold text-stone-900 block">
                                ${ing.estimatedPriceUSD.toFixed(2)} USD
                              </span>
                              <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">
                                In Stock
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons: Add to Cart vs Auto-Checkout */}
                    <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => handleAddRecipeToCart(false)}
                        className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-stone-300"
                      >
                        <ShoppingBag className="w-4 h-4 text-stone-700" />
                        <span>Add Ingredients to Cart</span>
                      </button>

                      <button
                        onClick={() => handleAddRecipeToCart(true)}
                        className="py-2.5 px-4 bg-[#1a115e] hover:bg-[#241a7d] text-[#ffb81c] text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Instant Agent Auto-Checkout</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AGENT WALLET & AUTONOMOUS SPEND */}
          {activeTab === 'wallet' && (
            <div className="space-y-4">
              {/* Agent Balance Card */}
              <div className="bg-gradient-to-tr from-[#0a052b] via-[#1a115e] to-[#241a7d] text-white p-5 rounded-2xl border border-[#3b2db5] shadow-lg space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-400 text-stone-950 font-black">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono text-blue-200 block">PnP Personal Agent</span>
                      <h4 className="text-sm font-extrabold text-stone-100">AI Shopping Wallet</h4>
                    </div>
                  </div>

                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                    agentWallet.autoCheckoutEnabled 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' 
                      : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  }`}>
                    {agentWallet.autoCheckoutEnabled ? '⚡ AUTO-CHECKOUT ON' : '🛡️ USER AUTHORIZATION REQUIRED'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-stone-300 block">Available Balance</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-amber-300 font-mono">
                      ${agentWallet.balanceUSD.toFixed(2)}
                    </span>
                    <span className="text-xs text-blue-200 font-mono">USD</span>
                  </div>
                  <div className="text-xs text-stone-300 flex items-center gap-3 pt-0.5">
                    <span>≈ ZWG {agentWallet.balanceZWG.toFixed(2)} (ZiG)</span>
                    <span>•</span>
                    <span>≈ R {agentWallet.balanceZAR.toFixed(2)} (ZAR)</span>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setShowTopupModal(true)}
                    className="flex-1 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Top Up Wallet</span>
                  </button>

                  <button
                    onClick={handleAgentPayCart}
                    disabled={isExecutingCheckout || agentWallet.balanceUSD <= 0}
                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-white/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isExecutingCheckout ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Truck className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>Agent Pay For Cart</span>
                  </button>
                </div>
              </div>

              {walletSuccessMsg && (
                <div className="bg-emerald-50 text-emerald-900 border border-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{walletSuccessMsg}</span>
                </div>
              )}

              {/* Spend Controls & Limits */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#1a115e]" />
                    <span className="text-xs font-extrabold text-stone-900">Agent Spend Policy & Rules</span>
                  </div>
                  <span className="text-[10px] text-stone-400">Strict Guardian Controls</span>
                </div>

                {/* Auto Checkout Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-bold text-stone-900 block">Autonomous Auto-Checkout</span>
                    <p className="text-[11px] text-stone-500">
                      When enabled, your AI Agent autonomously pays and dispatches delivery for recipe baskets or restocks under your limit.
                    </p>
                  </div>
                  <button
                    onClick={handleToggleAutoCheckout}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer flex-shrink-0 ${
                      agentWallet.autoCheckoutEnabled ? 'bg-emerald-600 justify-end' : 'bg-stone-300 justify-start'
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>

                {/* Spend Limit Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-700">Max Spend Per Order:</span>
                    <span className="font-black text-[#1a115e] font-mono text-sm">
                      ${agentWallet.spendLimitPerOrderUSD.toFixed(0)} USD
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={agentWallet.spendLimitPerOrderUSD}
                    onChange={(e) => handleUpdateSpendLimit(Number(e.target.value))}
                    className="w-full accent-[#1a115e] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>$10 min</span>
                    <span>$50 standard</span>
                    <span>$100 max</span>
                  </div>
                </div>
              </div>

              {/* Top Up Modal / Slide-down */}
              {showTopupModal && (
                <div className="bg-white p-4 rounded-2xl border-2 border-[#298bf5] space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-[#298bf5]" />
                      <h4 className="text-xs font-extrabold text-stone-900">Load Agent Wallet with Existing Rails</h4>
                    </div>
                    <button 
                      onClick={() => setShowTopupModal(false)}
                      className="text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Channel Tabs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-bold">
                    <button
                      onClick={() => setTopupChannel('ECOCASH')}
                      className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                        topupChannel === 'ECOCASH' ? 'bg-blue-50 border-blue-600 text-blue-900 font-black' : 'bg-stone-50 border-stone-200 text-stone-600'
                      }`}
                    >
                      📱 EcoCash
                    </button>
                    <button
                      onClick={() => setTopupChannel('MUKURU')}
                      className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                        topupChannel === 'MUKURU' ? 'bg-blue-50 border-blue-600 text-blue-900 font-black' : 'bg-stone-50 border-stone-200 text-stone-600'
                      }`}
                    >
                      🎟️ Mukuru
                    </button>
                    <button
                      onClick={() => setTopupChannel('CARD')}
                      className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                        topupChannel === 'CARD' ? 'bg-blue-50 border-blue-600 text-blue-900 font-black' : 'bg-stone-50 border-stone-200 text-stone-600'
                      }`}
                    >
                      💳 Card / USDC
                    </button>
                    <button
                      onClick={() => setTopupChannel('FAMILY_TRANSFER')}
                      className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                        topupChannel === 'FAMILY_TRANSFER' ? 'bg-blue-50 border-blue-600 text-blue-900 font-black' : 'bg-stone-50 border-stone-200 text-stone-600'
                      }`}
                    >
                      🔄 Family Balance
                    </button>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="text-[11px] font-bold text-stone-700 block">Amount to Load (USD):</label>
                    <div className="flex items-center gap-2">
                      {['15', '25', '50', '100'].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setTopupAmount(amt)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            topupAmount === amt ? 'bg-[#1a115e] text-amber-300 border-[#1a115e]' : 'bg-stone-100 text-stone-700 border-stone-300'
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {topupChannel === 'ECOCASH' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-700 block">EcoCash Mobile Number:</label>
                      <input
                        type="text"
                        value={topupPhone}
                        onChange={(e) => setTopupPhone(e.target.value)}
                        className="w-full p-2 text-xs bg-stone-50 border border-stone-300 rounded-lg"
                      />
                    </div>
                  )}

                  {topupChannel === 'MUKURU' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-700 block">Remittance Voucher Code:</label>
                      <input
                        type="text"
                        value={topupVoucher}
                        onChange={(e) => setTopupVoucher(e.target.value)}
                        className="w-full p-2 text-xs bg-stone-50 border border-stone-300 rounded-lg"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleTopupSubmit}
                    disabled={topupLoading}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {topupLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Confirm & Credit Agent Wallet</span>
                  </button>
                </div>
              )}

              {/* Transactions Audit Log */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2 shadow-2xs">
                <span className="text-xs font-extrabold text-stone-800 block">Recent Agent Activity & Ledger</span>
                <div className="space-y-1.5">
                  {agentWallet.transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg bg-stone-50 text-xs border border-stone-100">
                      <div>
                        <span className="font-bold text-stone-900 block">{tx.description}</span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {tx.channel}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`font-black font-mono ${tx.type === 'TOPUP' ? 'text-emerald-700' : 'text-stone-900'}`}>
                          {tx.type === 'TOPUP' ? `+$${tx.amountUSD.toFixed(2)}` : `-$${tx.amountUSD.toFixed(2)}`}
                        </span>
                        <span className="text-[9px] text-stone-400 block uppercase font-mono">{tx.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SPECIALS RADAR & BARGAIN HUNTER */}
          {activeTab === 'specials' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white p-4 rounded-2xl space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-yellow-200" />
                  <h4 className="font-black text-sm sm:text-base">Specials Radar & Bargain Hunter</h4>
                </div>
                <p className="text-xs text-amber-100">
                  Your AI Assistant continuously scans TM Pick n Pay, OK Zim, and SA Wholesale warehouses for price drops.
                </p>
              </div>

              {bargainActionMsg && (
                <div className="bg-emerald-50 text-emerald-900 border border-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{bargainActionMsg}</span>
                </div>
              )}

              {specialsLoading ? (
                <div className="p-8 text-center text-xs text-stone-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#1a115e]" />
                  <span>Scanning catalog specials...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {specials.map((deal) => (
                    <div 
                      key={deal.id}
                      className="bg-white p-4 rounded-2xl border border-stone-200 hover:border-amber-400 transition-all shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={deal.product.image} 
                            alt={deal.product.name}
                            className="w-12 h-12 rounded-xl object-contain bg-stone-100 p-1 border border-stone-200" 
                          />
                          <div>
                            <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-wide block">
                              {deal.dealTag}
                            </span>
                            <h5 className="font-extrabold text-xs sm:text-sm text-stone-900 line-clamp-1">
                              {deal.product.name}
                            </h5>
                            <span className="text-[11px] text-stone-500">{deal.product.storeName}</span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-xs text-stone-400 line-through block">
                            ${deal.originalPriceUSD.toFixed(2)}
                          </span>
                          <span className="text-base font-black text-emerald-700 font-mono block">
                            ${deal.salePriceUSD.toFixed(2)} USD
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold">
                            Save ${(deal.originalPriceUSD - deal.salePriceUSD).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-stone-600 bg-amber-50/60 p-2 rounded-lg border border-amber-200/50">
                        💡 <strong>Agent Insight:</strong> {deal.reason}
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleGrabBargain(deal, false)}
                          className="flex-1 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-stone-700" />
                          <span>Grab & Add to Cart</span>
                        </button>

                        <button
                          onClick={() => setAuthorizingDeal(deal)}
                          className="flex-1 py-2 rounded-xl bg-[#1a115e] hover:bg-[#241a7d] text-[#ffb81c] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Authorize to Pay</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Authorize Deal Modal */}
              {authorizingDeal && (
                <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-stone-900 font-extrabold text-sm">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        <span>Authorize Agent Payment</span>
                      </div>
                      <button onClick={() => setAuthorizingDeal(null)} className="text-stone-400 hover:text-stone-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-2 text-xs">
                      <p className="font-bold text-stone-900">{authorizingDeal.product.name}</p>
                      <div className="flex justify-between text-stone-600">
                        <span>Sale Deal Price:</span>
                        <span className="font-mono font-bold text-emerald-700">${authorizingDeal.salePriceUSD.toFixed(2)} USD</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Agent Wallet Balance:</span>
                        <span className="font-mono font-bold">${agentWallet.balanceUSD.toFixed(2)} USD</span>
                      </div>
                      <div className="flex justify-between border-t border-stone-200 pt-1 text-stone-900 font-bold">
                        <span>Remaining Balance:</span>
                        <span className="font-mono text-blue-700">
                          ${(agentWallet.balanceUSD - authorizingDeal.salePriceUSD).toFixed(2)} USD
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-stone-500">
                      Do you authorize your AI Shopping Assistant to debit ${authorizingDeal.salePriceUSD.toFixed(2)} from your Agent Wallet and schedule delivery to your family in Harare?
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setAuthorizingDeal(null)}
                        className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleGrabBargain(authorizingDeal, true)}
                        className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm"
                      >
                        Authorize & Pay
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PANTRY DEPLETION ESTIMATOR ("RUN-OUT PREDICTOR") */}
          {activeTab === 'pantry' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 text-white p-4 rounded-2xl space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-200" />
                  <h4 className="font-black text-sm sm:text-base">Pantry Depletion Estimator</h4>
                </div>
                <p className="text-xs text-teal-100">
                  Learns from household size (4 people) and purchase intervals to predict when staples run out before they do.
                </p>
              </div>

              {restockSuccessMsg && (
                <div className="bg-emerald-50 text-emerald-900 border border-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{restockSuccessMsg}</span>
                </div>
              )}

              {pantryLoading ? (
                <div className="p-8 text-center text-xs text-stone-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#1a115e]" />
                  <span>Calculating household depletion velocities...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {pantryItems.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-white p-4 rounded-2xl border border-stone-200 hover:border-emerald-300 transition-all shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-extrabold text-xs sm:text-sm text-stone-900">
                            {item.productName}
                          </h5>
                          <span className="text-[11px] text-stone-400">
                            Usage cycle: ~{item.averageDaysPerUnit} days per {item.unit}
                          </span>
                        </div>

                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          item.status === 'CRITICAL' 
                            ? 'bg-red-100 text-red-700 border border-red-200' 
                            : item.status === 'RUNNING_LOW'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {item.daysRemaining <= 2 ? '🔴 CRITICAL RESTOCK' : item.daysRemaining <= 6 ? '🟡 RUNNING LOW' : '🟢 STOCKED'}
                        </span>
                      </div>

                      {/* Depletion Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-stone-600">Stock Remaining: {item.currentStockPercent}%</span>
                          <span className={item.daysRemaining <= 3 ? 'text-red-600 font-black' : 'text-stone-700'}>
                            ~{item.daysRemaining} days left
                          </span>
                        </div>
                        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              item.currentStockPercent <= 15 
                                ? 'bg-red-500' 
                                : item.currentStockPercent <= 40 
                                ? 'bg-amber-500' 
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${item.currentStockPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* 1-Tap Restock Action */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-mono font-bold text-stone-900">
                          ${item.priceUSD.toFixed(2)} USD
                        </span>
                        <button
                          onClick={() => handleRestockStaple(item)}
                          className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>1-Tap Agent Restock</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Text Prompt Input - Bottom Sticky (Visible in Voice Tab) */}
        {activeTab === 'voice' && (
          <div className="bg-white p-3 sm:p-4 border-t border-stone-200 flex-shrink-0 flex items-center gap-2 shadow-lg">
            <input
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit(manualText)}
              placeholder="Type in Shona, Ndebele, Zulu, English..."
              className="flex-1 px-3.5 py-2.5 bg-stone-50 text-stone-900 border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#298bf5]"
            />
            <button
              onClick={() => handleTextSubmit(manualText)}
              disabled={voiceProcessing || !manualText.trim()}
              className="bg-[#1a115e] hover:bg-[#241a7d] text-[#ffb81c] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 flex-shrink-0 active:scale-95 transition-all cursor-pointer"
            >
              {voiceProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
