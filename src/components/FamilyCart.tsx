import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Users, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Calculator, 
  Smartphone, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  ShieldCheck, 
  MessageSquare,
  Globe,
  Share2,
  Phone,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Smile,
  Maximize2,
  Minimize2,
  ShoppingBag,
  Volume2,
  Zap,
  Store,
  UserPlus,
  Camera,
  Radio,
  RadioTower,
  VolumeX,
  SlidersHorizontal,
  Search,
  MapPin,
  Truck,
  Navigation,
  Building2,
  Compass,
  Edit3
} from 'lucide-react';
import { CartItem, Member, Currency, SplitMethod, ExchangeRates, Product, DeliveryAddress } from '../types';
import { formatPrice } from '../utils/currency';
import { getProductImagePath, handleProductImageError } from '../utils/productImages';
import { SAMPLE_PRODUCTS } from '../data/products';
import { DeliveryAddressModal } from './DeliveryAddressModal';
import { CheckoutModal } from './CheckoutModal';
import { PaymentOrchestratorDashboardModal } from './PaymentOrchestratorDashboardModal';

interface CallParticipant {
  id: string;
  name: string;
  avatar: string;
  location: string;
  mode: 'video' | 'audio-only';
  isMuted?: boolean;
  isSpeaking?: boolean;
  role?: string;
}

interface FamilyCartProps {
  cart: CartItem[];
  members: Member[];
  currency: Currency;
  exchangeRates: ExchangeRates;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onClearCart: () => void;
  onClose?: () => void;
  onOpenWhatsAppSim?: () => void;
  onAddToCart?: (productId: string, memberId: string, note?: string) => void;
  onStartLiveCall?: () => void;
  isLiveCallOngoing?: boolean;
  onEndLiveCall?: () => void;
}

export const FamilyCart: React.FC<FamilyCartProps> = ({
  cart,
  members,
  currency,
  exchangeRates,
  onUpdateQuantity,
  onClearCart,
  onClose,
  onOpenWhatsAppSim,
  onAddToCart,
  onStartLiveCall,
  isLiveCallOngoing = false,
  onEndLiveCall
}) => {
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('BY_SUBMITTER');
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<string>('ecocash');
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [showOrchestratorHub, setShowOrchestratorHub] = useState<boolean>(false);
  const [checkoutComplete, setCheckoutComplete] = useState<boolean>(false);

  // Profile Popup Modal state
  const [selectedMemberModal, setSelectedMemberModal] = useState<Member | null>(null);
  const [showInviteToast, setShowInviteToast] = useState<boolean>(false);

  // --- LIVE GROUP VIDEO CALL STATE ---
  const [isVideoCallActive, setIsVideoCallActive] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isCameraOff, setIsCameraOff] = useState<boolean>(false);
  const [callTimer, setCallTimer] = useState<number>(248); // Start at 04:08 for lively feel
  const [activeSpeakerId, setActiveSpeakerId] = useState<string>('mem-2'); // Default Gogo Moyo
  const [callToast, setCallToast] = useState<string | null>(null);
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [showQuickAddModal, setShowQuickAddModal] = useState<boolean>(false);
  const [selectedMemberForAdd, setSelectedMemberForAdd] = useState<Member | null>(null);

  // --- IN-CART PRODUCT SEARCH & QUICK ADD STATE ---
  const [cartSearchQuery, setCartSearchQuery] = useState<string>('');
  const [cartSearchMemberId, setCartSearchMemberId] = useState<string>(members[1]?.id || members[0]?.id || 'mem-2');
  const [quickAddSuccessMsg, setQuickAddSuccessMsg] = useState<string | null>(null);

  // --- DELIVERY & STORE PICKUP ADDRESS STATE ---
  const [memberAddresses, setMemberAddresses] = useState<Record<string, DeliveryAddress>>(() => {
    const initial: Record<string, DeliveryAddress> = {};
    members.forEach((m) => {
      if (m.deliveryAddress) {
        initial[m.id] = m.deliveryAddress;
      }
    });
    return initial;
  });

  const [showAddressModal, setShowAddressModal] = useState<boolean>(false);
  const [addressMember, setAddressMember] = useState<Member | null>(null);

  const handleSaveMemberAddress = (memberId: string, address: DeliveryAddress) => {
    setMemberAddresses((prev) => ({
      ...prev,
      [memberId]: address
    }));
    const target = members.find((m) => m.id === memberId);
    if (target) {
      setCallToast(`Updated delivery address for ${target.name}!`);
      setTimeout(() => setCallToast(null), 3500);
    }
  };

  const matchingSearchProducts = useMemo(() => {
    if (!cartSearchQuery.trim()) return [];
    const query = cartSearchQuery.toLowerCase().trim();
    return SAMPLE_PRODUCTS.filter((p) => 
      p.name.toLowerCase().includes(query) ||
      (p.nativeName && p.nativeName.toLowerCase().includes(query)) ||
      p.brand.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  }, [cartSearchQuery]);

  // --- REAL CAMERA WEBRTC STATE ---
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // --- ADD MEMBER TO CALL MODAL STATE ---
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberLocation, setNewMemberLocation] = useState<string>('Harare, Zimbabwe');
  const [newMemberMode, setNewMemberMode] = useState<'video' | 'audio-only'>('video');

  // --- CALL PARTICIPANTS LIST STATE ---
  const [callParticipants, setCallParticipants] = useState<CallParticipant[]>(() => 
    members.map((m) => ({
      id: m.id,
      name: m.name,
      avatar: m.avatar,
      location: m.location,
      mode: m.id === 'mem-4' || m.id === 'mem-5' ? 'audio-only' : 'video',
      role: m.role
    }))
  );

  // Sync if prop members change
  useEffect(() => {
    if (members.length > callParticipants.length) {
      const newProps = members.filter((m) => !callParticipants.some((cp) => cp.id === m.id));
      if (newProps.length > 0) {
        setCallParticipants((prev) => [
          ...prev,
          ...newProps.map((m) => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            location: m.location,
            mode: 'video' as const,
            role: m.role
          }))
        ]);
      }
    }
  }, [members]);

  // Active Family Group Scroll Ref
  const memberScrollRef = useRef<HTMLDivElement>(null);

  const scrollMembers = (direction: 'left' | 'right') => {
    if (memberScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      memberScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Video call timer increment
  useEffect(() => {
    if (!isVideoCallActive) return;
    const interval = setInterval(() => {
      setCallTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isVideoCallActive]);

  const [speakingBadgeMap, setSpeakingBadgeMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (activeSpeakerId && isVideoCallActive) {
      setSpeakingBadgeMap((prev) => ({ ...prev, [activeSpeakerId]: true }));
      const timer = setTimeout(() => {
        setSpeakingBadgeMap((prev) => ({ ...prev, [activeSpeakerId]: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeSpeakerId, isVideoCallActive]);

  // Periodic active speaker rotation for realistic call dynamics
  useEffect(() => {
    if (!isVideoCallActive) return;
    const speakerInterval = setInterval(() => {
      if (callParticipants.length > 0) {
        const randomMember = callParticipants[Math.floor(Math.random() * callParticipants.length)];
        setActiveSpeakerId(randomMember.id);
      }
    }, 6000);
    return () => clearInterval(speakerInterval);
  }, [isVideoCallActive, callParticipants]);

  // Real Camera capture stream effect
  useEffect(() => {
    let streamInstance: MediaStream | null = null;

    async function initCamera() {
      if (isVideoCallActive && !isCameraOff) {
        try {
          setCameraError(null);
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
            audio: !isMicMuted
          });
          streamInstance = stream;
          setCameraStream(stream);
          setHasCameraPermission(true);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (err: any) {
          console.warn('Camera access error or permission denied:', err);
          setHasCameraPermission(false);
          setCameraError('Camera unavailable or permission denied. Showing avatar.');
        }
      } else {
        if (cameraStream) {
          cameraStream.getTracks().forEach((track) => track.stop());
          setCameraStream(null);
        }
      }
    }

    initCamera();

    return () => {
      if (streamInstance) {
        streamInstance.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isVideoCallActive, isCameraOff, isMicMuted]);

  // Attach video stream when element mounts
  useEffect(() => {
    if (localVideoRef.current && cameraStream) {
      localVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, localVideoRef.current]);

  // Timer formatter
  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Trigger floating reaction animation
  const sendReaction = (emoji: string) => {
    const newReaction = {
      id: Date.now() + Math.random(),
      emoji,
      x: Math.floor(Math.random() * 70) + 15
    };
    setFloatingReactions((prev) => [...prev, newReaction]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 2500);
  };

  // Trigger quick product add from video call
  const handleQuickAdd = (product: Product, targetMember?: Member | CallParticipant) => {
    const member = targetMember || selectedMemberForAdd || members[0];
    if (onAddToCart) {
      onAddToCart(product.id, member.id, 'Added via Live Video Shopping Call');
    }
    setCallToast(`🛒 ${member.name.split(' ')[0]} added ${product.name} to the cart!`);
    sendReaction('🛒');
    setShowQuickAddModal(false);
    setSelectedMemberForAdd(null);
    setTimeout(() => setCallToast(null), 4500);
  };

  // Handle adding a new participant to the live call
  const handleAddNewParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const avatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80'
    ];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    const newParticipant: CallParticipant = {
      id: `call-mem-${Date.now()}`,
      name: newMemberName.trim(),
      avatar: randomAvatar,
      location: newMemberLocation,
      mode: newMemberMode,
      role: 'Family Member'
    };

    setCallParticipants((prev) => [...prev, newParticipant]);
    setCallToast(`🎉 ${newParticipant.name} joined the Live Call (${newMemberMode === 'video' ? 'Video' : 'Audio Only'})!`);
    sendReaction('🎉');
    setShowAddMemberModal(false);
    setNewMemberName('');
    setTimeout(() => setCallToast(null), 4500);
  };

  // Toggle participant mode between video and audio-only
  const toggleParticipantMode = (id: string) => {
    setCallParticipants((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextMode = p.mode === 'video' ? 'audio-only' : 'video';
          setCallToast(`🎙️ ${p.name.split(' ')[0]} switched to ${nextMode === 'video' ? 'Live Video' : 'Audio Only'} mode.`);
          setTimeout(() => setCallToast(null), 3500);
          return { ...p, mode: nextMode };
        }
        return p;
      })
    );
  };

  // Totals calculations
  const totalUSD = cart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
  const totalZAR = totalUSD * exchangeRates.USD_ZAR;
  const totalZWG = totalUSD * exchangeRates.USD_ZWG;

  // Format helper
  const formatCurrency = (valUSD: number) => {
    return formatPrice(valUSD, currency);
  };

  // Group items by added member
  const memberSubtotals = members.map((member) => {
    const memberItems = cart.filter(
      (i) => i.addedByMemberId === member.id || i.addedByMemberName.toLowerCase().includes(member.name.toLowerCase().split(' ')[0])
    );
    const subUSD = memberItems.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
    return {
      member,
      subtotalUSD: subUSD,
      itemCount: memberItems.reduce((sum, item) => sum + item.quantity, 0)
    };
  });

  const activeContributorsCount = members.length;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutComplete(true);
  };

  return (
    <div
      className={`bg-stone-50 rounded-2xl border border-stone-200 shadow-xl overflow-hidden mx-auto my-2 transition-all duration-300 ${
        isVideoCallActive ? 'max-w-7xl' : 'max-w-4xl'
      }`}
    >
      {/* Top Header */}
      <div className="bg-[#0e2a47] text-white p-4 sm:p-5 border-b border-[#183b63] flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black tracking-wide text-[#ffb703]">
              Family Cart: Moyo Group
            </h2>
            {isVideoCallActive ? (
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-400/40 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Video Call ({formatCallTime(callTimer)})
              </span>
            ) : (
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-400/30">
                Cart Synced 🌐
              </span>
            )}
          </div>
          <p className="text-xs text-blue-200 mt-0.5">
            Global Collaborative Cross-Border Order ({cart.reduce((s, i) => s + i.quantity, 0)} Items)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Main Prominent "Start / Toggle Live Call" Header Button */}
          {isVideoCallActive ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                title="Add new participant to video call"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Invite User</span>
              </button>

              <button
                onClick={() => setIsVideoCallActive(false)}
                className="bg-emerald-950/90 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                title="Minimize Video Call View"
              >
                <Video className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">In Call</span>
                <span className="text-[10px] bg-emerald-800/60 px-1.5 py-0.2 rounded font-mono">
                  {formatCallTime(callTimer)}
                </span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsVideoCallActive(true);
                setCallToast('📹 Group Video Call Connected — Everyone can see cart updates in real-time!');
                if (onStartLiveCall) {
                  onStartLiveCall();
                }
              }}
              className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all animate-pulse"
            >
              <Video className="w-4 h-4 text-white" />
              <span>Start Live Group Call</span>
              <span className="bg-stone-950/40 text-emerald-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {callParticipants.length} Online
              </span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-[#183b63]"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Hero Banner for Live Call: Active/Ongoing vs Launch state */}
      {!isVideoCallActive && (
        isLiveCallOngoing ? (
          <div className="bg-gradient-to-r from-emerald-950 via-[#0a271c] to-[#0d3152] border-b border-emerald-500/40 px-4 py-3.5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/50 rounded-2xl flex-shrink-0">
                <Video className="w-6 h-6 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-xs sm:text-sm text-emerald-300">
                    Live Video Call in Progress
                  </h3>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-400/40 uppercase flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Others Still Connected
                  </span>
                </div>
                <p className="text-[11px] text-blue-200 mt-0.5">
                  Gogo Moyo, Uncle Farai & family members are still active on the call. You can re-join anytime!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => {
                  setIsVideoCallActive(true);
                  setCallToast('📹 Reconnected to Group Video Call!');
                  if (onStartLiveCall) {
                    onStartLiveCall();
                  }
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all whitespace-nowrap"
              >
                <Video className="w-4 h-4 text-stone-950" />
                <span>Re-Join Call</span>
              </button>

              <button
                onClick={() => {
                  if (onEndLiveCall) {
                    onEndLiveCall();
                  } else {
                    setIsVideoCallActive(false);
                  }
                }}
                className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all whitespace-nowrap"
                title="Terminate call for everyone"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>End for All</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-[#030d17] via-[#0b2545] to-[#134074] border-b border-cyan-500/30 px-4 py-3.5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl flex-shrink-0">
                <Video className="w-6 h-6 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-xs sm:text-sm text-white">Live Family Shopping Call</h3>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-400/30 uppercase">
                    {callParticipants.length} Family Members Ready
                  </span>
                </div>
                <p className="text-[11px] text-blue-200 mt-0.5">
                  Join live video with camera or audio-only to select items, discuss prices, and shop together across SA, ZIM & UK.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsVideoCallActive(true);
                setCallToast('📹 Group Video Call Connected — Everyone can see cart updates in real-time!');
                if (onStartLiveCall) {
                  onStartLiveCall();
                }
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-stone-950 font-black px-5 py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all whitespace-nowrap"
            >
              <Video className="w-4 h-4 text-stone-950" />
              <span>Launch Live Call</span>
            </button>
          </div>
        )
      )}

      {/* Active Members Presence Row - Story Circles */}
      <div className="bg-[#071726] text-blue-100 px-4 py-3 border-b border-[#143456] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#ffb703]" />
            <span className="font-bold text-white text-xs sm:text-sm tracking-wide">
              Active Family Group Presence:
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-400/30 uppercase tracking-wider">
              {callParticipants.length} Active
            </span>
            {isVideoCallActive && (
              <span className="bg-cyan-500/20 text-cyan-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-400/30 hidden xs:inline">
                📹 TikTok Grid Synced
              </span>
            )}
          </div>

          {/* Left & Right Scroll Arrows */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-all shadow-xs"
              title="Add new member to live call"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>

            <button
              onClick={() => scrollMembers('left')}
              className="p-1 rounded-full bg-[#143456] hover:bg-cyan-600 text-blue-200 hover:text-white transition-all shadow-xs border border-blue-400/20 active:scale-95"
              title="Scroll Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollMembers('right')}
              className="p-1 rounded-full bg-[#143456] hover:bg-cyan-600 text-blue-200 hover:text-white transition-all shadow-xs border border-blue-400/20 active:scale-95"
              title="Scroll Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Story Row */}
        <div className="relative group">
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[#071726] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-[#071726] to-transparent z-10 pointer-events-none" />

          <div
            ref={memberScrollRef}
            className="flex items-center gap-4 overflow-x-auto py-2 scroll-smooth scrollbar-thin scrollbar-thumb-cyan-700 scrollbar-track-transparent snap-x touch-pan-x select-none px-1"
          >
            {callParticipants.map((m) => {
              const memberCartItems = cart.filter(
                (i) =>
                  i.addedByMemberId === m.id ||
                  i.addedByMemberName.toLowerCase().includes(m.name.toLowerCase().split(' ')[0])
              );
              const itemsCount = memberCartItems.reduce((sum, item) => sum + item.quantity, 0);
              const isSpeaking = activeSpeakerId === m.id && isVideoCallActive;

              return (
                <button
                  key={m.id}
                  onClick={() => {
                    const foundMember = members.find((x) => x.id === m.id);
                    if (foundMember) setSelectedMemberModal(foundMember);
                  }}
                  className="group flex flex-col items-center flex-shrink-0 snap-start focus:outline-none transition-transform active:scale-95"
                  title={`Click for ${m.name}'s profile`}
                >
                  {/* Story Gradient Ring Circle */}
                  <div
                    className={`relative p-[2.5px] rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] group-hover:from-amber-400 group-hover:to-cyan-400 shadow-md transition-all ${
                      isSpeaking ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#071726] animate-pulse' : ''
                    }`}
                  >
                    <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full overflow-hidden border-2 border-[#071726] bg-stone-900 relative">
                      <img
                        src={m.avatar}
                        alt={m.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>

                    {/* Mode Badge Overlay */}
                    {m.mode === 'audio-only' ? (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full border border-[#071726] shadow-xs uppercase tracking-tighter flex items-center gap-0.5 whitespace-nowrap">
                        <Radio className="w-2 h-2 text-white animate-pulse" />
                        AUDIO
                      </div>
                    ) : isSpeaking ? (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-[#071726] shadow-xs uppercase tracking-tighter flex items-center gap-0.5 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        TALKING
                      </div>
                    ) : (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-600 via-rose-600 to-amber-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-[#071726] shadow-xs uppercase tracking-tighter flex items-center gap-0.5 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        LIVE
                      </div>
                    )}

                    {/* Item Count Badge */}
                    {itemsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#ffb703] text-stone-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#071726] shadow-md">
                        {itemsCount}
                      </span>
                    )}
                  </div>

                  {/* Name Label */}
                  <span className="text-[11px] font-bold text-stone-200 group-hover:text-white max-w-[68px] truncate text-center mt-1.5 tracking-tight">
                    {m.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-blue-300/70 font-medium max-w-[68px] truncate text-center -mt-0.5">
                    {m.location.split(',')[0]}
                  </span>
                </button>
              );
            })}

            {/* Add Family Member Circle Button */}
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="group flex flex-col items-center flex-shrink-0 snap-start focus:outline-none transition-transform active:scale-95"
              title="Add new member to live call"
            >
              <div className="relative p-[2.5px] rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-teal-400 shadow-md">
                <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full border-2 border-[#071726] bg-[#0c2a47] flex items-center justify-center group-hover:bg-[#143a61] transition-colors relative">
                  <UserPlus className="w-6 h-6 text-cyan-300" />
                  <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-white rounded-full p-0.5 border-2 border-[#071726] shadow-xs">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-cyan-300 group-hover:text-cyan-200 text-center mt-1.5">
                + Add User
              </span>
              <span className="text-[9px] text-cyan-400/70 font-medium text-center -mt-0.5">
                Join Call
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Body Area: Split Grid when Video Call Active (Cart on Left, TikTok Video Grid on Right) */}
      <div
        className={
          isVideoCallActive
            ? 'grid grid-cols-12 gap-2 sm:gap-5 p-2 sm:p-5 bg-stone-100/60'
            : 'p-4 sm:p-6 space-y-6'
        }
      >
        {/* LEFT COLUMN: Cart Items & Order Summary Engine */}
        <div className={isVideoCallActive ? 'col-span-6 lg:col-span-7 xl:col-span-7 space-y-3 sm:space-y-5' : 'space-y-6'}>
          {/* In-Cart Product Search Bar (Ideal for live calls & quick addition) */}
          <div className="bg-white rounded-2xl border-2 border-[#298bf5]/40 p-3.5 sm:p-4 shadow-sm space-y-3 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#298bf5]/10 text-[#298bf5] rounded-xl flex-shrink-0">
                  <Search className="w-4 h-4 text-[#298bf5]" />
                </div>
                <div>
                  <h3 className="font-black text-xs sm:text-sm text-[#1a115e] flex items-center gap-1.5">
                    <span>Search & Add Groceries Directly</span>
                    {isVideoCallActive && (
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-300 animate-pulse">
                        ⚡ Live Call Sync
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Find items easily and add to cart while talking on calls
                  </p>
                </div>
              </div>

              {/* Recipient Dropdown & Delivery Address Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-xl border border-stone-200 text-xs w-full sm:w-auto justify-between sm:justify-start">
                  <span className="text-[11px] font-bold text-stone-500 whitespace-nowrap">For:</span>
                  <select
                    value={cartSearchMemberId}
                    onChange={(e) => setCartSearchMemberId(e.target.value)}
                    className="bg-white font-extrabold text-[#1a115e] px-2 py-1 rounded-lg border border-stone-300 focus:outline-none text-xs cursor-pointer"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.location.split(',')[0]})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Address / Pickup Badge Button for currently selected recipient */}
                {(() => {
                  const currentRecipient = members.find(m => m.id === cartSearchMemberId) || members[0];
                  const currentAddr = memberAddresses[cartSearchMemberId] || currentRecipient?.deliveryAddress;

                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setAddressMember(currentRecipient);
                        setShowAddressModal(true);
                      }}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-2xs group flex-shrink-0 cursor-pointer"
                      title="Click to type in delivery address or select store pickup using free map autofind"
                    >
                      {currentAddr?.type === 'STORE_PICKUP' ? (
                        <>
                          <Store className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          <span className="truncate max-w-[150px] sm:max-w-[180px]">
                            Pickup: {currentAddr.storeName || 'Store Pickup'}
                          </span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          <span className="truncate max-w-[150px] sm:max-w-[180px]">
                            Deliver: {currentAddr?.addressLine || currentRecipient.location}
                          </span>
                        </>
                      )}
                      <span className="text-[10px] text-blue-600 underline font-extrabold group-hover:text-[#1a115e] whitespace-nowrap">
                        Edit / Map 🗺️
                      </span>
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* Input Field */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={cartSearchQuery}
                onChange={(e) => setCartSearchQuery(e.target.value)}
                placeholder="Search products e.g. Tastic Rice, Mazoe, Soap, Oil, Sugar..."
                className="w-full pl-9 pr-8 py-2 bg-stone-50 text-stone-900 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-[#298bf5] focus:bg-white focus:outline-none font-semibold transition-all"
              />
              {cartSearchQuery && (
                <button
                  onClick={() => setCartSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Suggestion Chips for 1-Click Addition */}
            {!cartSearchQuery && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Quick 1-Click Add while on call:</span>
                  <span className="text-[10px] text-[#298bf5] font-extrabold">Instant Cart Sync</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {SAMPLE_PRODUCTS.slice(0, 6).map((p) => {
                    const selectedMember = members.find(m => m.id === cartSearchMemberId);
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          if (onAddToCart) {
                            onAddToCart(p.id, cartSearchMemberId, 'Added via Cart Search');
                            setQuickAddSuccessMsg(`Added 1x ${p.name} for ${selectedMember?.name || 'Family member'}!`);
                            if (isVideoCallActive) {
                              setCallToast(`Added ${p.name} for ${selectedMember?.name}!`);
                            }
                            setTimeout(() => setQuickAddSuccessMsg(null), 3000);
                          }
                        }}
                        className="bg-stone-100 hover:bg-[#298bf5]/10 hover:border-[#298bf5]/40 text-stone-800 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-stone-200 flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95 group flex-shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#298bf5] group-hover:scale-125 transition-transform" />
                        <span>{p.name.split(' ')[0]} {p.name.split(' ')[1]}</span>
                        <span className="text-stone-500 font-normal">({formatPrice(p.priceUSD, currency)})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Success Toast */}
            {quickAddSuccessMsg && (
              <div className="bg-emerald-50 text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{quickAddSuccessMsg}</span>
              </div>
            )}

            {/* Search Results Dropdown Grid */}
            {cartSearchQuery.trim() !== '' && (
              <div className="max-h-64 overflow-y-auto space-y-2 pt-2 border-t border-stone-100 pr-1">
                {matchingSearchProducts.length === 0 ? (
                  <div className="text-center py-4 text-xs text-stone-500 font-medium">
                    No products found matching "{cartSearchQuery}". Try searching for <span className="font-bold text-stone-700">Rice</span>, <span className="font-bold text-stone-700">Sugar</span>, or <span className="font-bold text-stone-700">Mazoe</span>.
                  </div>
                ) : (
                  matchingSearchProducts.map((p) => {
                    const selectedMember = members.find(m => m.id === cartSearchMemberId);

                    return (
                      <div
                        key={p.id}
                        className="bg-stone-50 hover:bg-white p-2.5 rounded-xl border border-stone-200/80 hover:border-[#298bf5] flex items-center justify-between gap-3 transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={getProductImagePath(p.image)}
                            alt={p.name}
                            onError={(e) => handleProductImageError(e, p.name, p.category)}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            className="w-11 h-11 rounded-lg object-cover border border-stone-200 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-stone-900 text-xs truncate">{p.name}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-stone-500 mt-0.5">
                              <span className="font-black text-[#1a115e]">{formatPrice(p.priceUSD, currency)}</span>
                              <span>•</span>
                              <span>{p.unit}</span>
                              <span>•</span>
                              <span className="text-[#298bf5] font-semibold">{p.storeName.split(' ')[0]}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (onAddToCart) {
                              onAddToCart(p.id, cartSearchMemberId, 'Added via Cart Search');
                              setQuickAddSuccessMsg(`Added 1x ${p.name} for ${selectedMember?.name || 'Family member'}!`);
                              if (isVideoCallActive) {
                                setCallToast(`Added ${p.name} for ${selectedMember?.name}!`);
                              }
                              setTimeout(() => setQuickAddSuccessMsg(null), 3000);
                            }
                          }}
                          className="bg-[#1a115e] hover:bg-[#298bf5] text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all flex-shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* RECIPIENT DELIVERY ADDRESSES & STORE PICKUP REGISTRY PANEL */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-3.5 sm:p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#1a115e]/10 text-[#1a115e] rounded-xl flex-shrink-0">
                  <Truck className="w-4 h-4 text-[#1a115e]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                    <span>Recipient Delivery Addresses & Store Pickups</span>
                    <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                      OpenStreetMap Free Autofind 🗺️
                    </span>
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Specify door delivery address or click & collect store for each family member
                  </p>
                </div>
              </div>
            </div>

            {/* Members Destinations Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {members.map((m) => {
                const addr = memberAddresses[m.id] || m.deliveryAddress;

                return (
                  <div
                    key={m.id}
                    className="bg-stone-50 hover:bg-white p-3 rounded-2xl border border-stone-200 hover:border-blue-300 transition-all flex flex-col justify-between gap-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={m.avatar}
                          alt={m.name}
                          className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-xs"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-stone-900 text-xs">{m.name}</span>
                            <span className="text-[9px] bg-stone-200 text-stone-700 font-bold px-1.5 py-0.2 rounded">
                              {m.role.split('/')[0]}
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-500 font-medium">
                            {m.location}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setAddressMember(m);
                          setShowAddressModal(true);
                        }}
                        className="bg-white hover:bg-stone-100 text-[#1a115e] font-extrabold text-[10px] px-2 py-1 rounded-xl border border-stone-300 shadow-2xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                        title="Edit address or change store pickup"
                      >
                        <Edit3 className="w-3 h-3 text-blue-600" />
                        <span>Edit / Add</span>
                      </button>
                    </div>

                    {/* Address Detail Card */}
                    <div className="bg-white p-2 rounded-xl border border-stone-200/80 text-[11px] flex items-center gap-2">
                      {addr?.type === 'STORE_PICKUP' ? (
                        <>
                          <Store className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="font-extrabold text-amber-900 block truncate">
                              🏪 Store Pickup: {addr.storeName || 'Store Branch'}
                            </span>
                            <span className="text-[10px] text-stone-500 truncate block">
                              {addr.addressLine}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="font-extrabold text-stone-900 block truncate">
                              📍 Door Delivery: {addr?.addressLine || m.location}
                            </span>
                            <span className="text-[10px] text-stone-500 truncate block">
                              {addr?.suburb ? `${addr.suburb}, ` : ''}{addr?.city || 'Harare'}, {addr?.country || 'Zimbabwe'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-8 text-center space-y-3 shadow-xs">
              <Users className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="font-bold text-stone-700 text-base">Your Family Cart is Empty</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Add products from the catalog or use the Live Video Call panel on the right to populate items on behalf of family members.
              </p>
              {isVideoCallActive && (
                <button
                  onClick={() => {
                    if (SAMPLE_PRODUCTS.length > 0 && onAddToCart) {
                      onAddToCart(SAMPLE_PRODUCTS[0].id, members[0].id, 'Added via Video Call');
                      setCallToast(`Added ${SAMPLE_PRODUCTS[0].name} to Family Cart!`);
                      setTimeout(() => setCallToast(null), 3500);
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all active:scale-95 inline-flex items-center gap-1.5 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Sample 10kg Roller Meal</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500 font-bold px-1">
                <span className="flex items-center gap-1.5 text-stone-700 font-extrabold">
                  <span>SHARED CART ITEMS ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
                  {isVideoCallActive && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 animate-pulse">
                      Live Video Synced 🟢
                    </span>
                  )}
                </span>
                <button
                  onClick={onClearCart}
                  className="text-red-600 hover:text-red-700 flex items-center gap-1 text-[11px] font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {cart.map((item) => {
                  const itemTotalUSD = item.product.priceUSD * item.quantity;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-3 sm:p-4 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all hover:border-stone-300"
                    >
                      {/* Item Image & Details */}
                      <div className="flex items-center gap-3">
                        <img
                          src={getProductImagePath(item.product.image)}
                          alt={item.product.name}
                          onError={(e) => handleProductImageError(e, item.product.name, item.product.category)}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-stone-200 bg-stone-100 flex-shrink-0 shadow-2xs"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-stone-900 text-sm leading-tight">
                              {item.product.name}
                            </h4>
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                              {item.product.fulfillmentTag}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                            <span>Unit: {item.product.unit}</span>
                            <span>•</span>
                            <span className="font-semibold text-stone-700">
                              {formatCurrency(item.product.priceUSD)} each
                            </span>
                          </div>

                          {/* Member Attribution Badge & Delivery Address */}
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                item.channel === 'whatsapp'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {item.channel === 'whatsapp' ? (
                                <MessageSquare className="w-2.5 h-2.5 text-emerald-600" />
                              ) : (
                                <Users className="w-2.5 h-2.5 text-blue-600" />
                              )}
                              <span>Added by {item.addedByMemberName}</span>
                              {item.channel === 'whatsapp' && (
                                <span className="opacity-80">(via WhatsApp)</span>
                              )}
                            </span>

                            {(() => {
                              const itemMember = members.find(m => m.id === item.addedByMemberId || m.name.toLowerCase().includes(item.addedByMemberName.toLowerCase().split(' ')[0]));
                              const itemAddr = (itemMember && memberAddresses[itemMember.id]) || itemMember?.deliveryAddress;

                              if (!itemAddr) return null;

                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (itemMember) {
                                      setAddressMember(itemMember);
                                      setShowAddressModal(true);
                                    }
                                  }}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 transition-colors cursor-pointer"
                                  title="Click to edit delivery location or store pickup"
                                >
                                  {itemAddr.type === 'STORE_PICKUP' ? (
                                    <>
                                      <Store className="w-2.5 h-2.5 text-amber-600" />
                                      <span>Pickup: {itemAddr.storeName?.split(' ')[0] || 'Store'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <MapPin className="w-2.5 h-2.5 text-blue-600" />
                                      <span className="truncate max-w-[130px]">📍 {itemAddr.addressLine}</span>
                                    </>
                                  )}
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controls & Item Subtotal */}
                      <div className="flex items-center justify-between w-full sm:w-auto gap-4 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100">
                        <div className="flex items-center bg-stone-100 rounded-xl p-0.5 border border-stone-200">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-white rounded-lg text-stone-700 transition-colors active:scale-95"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 font-black text-xs text-stone-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-white rounded-lg text-stone-700 transition-colors active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-stone-400 block font-semibold">Subtotal</span>
                          <span className="font-black text-sm text-[#0e2a47]">
                            {formatCurrency(itemTotalUSD)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Real-Time Split Payments Engine */}
          {cart.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[#ffb703]" />
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                      Split Payments & Currency Engine
                    </h3>
                    <p className="text-xs text-stone-500">
                      Live Rates: 1 USD = {exchangeRates.USD_ZAR} ZAR | {exchangeRates.USD_ZWG} ZWG (ZiG)
                    </p>
                  </div>
                </div>

                {/* Split Mode Options */}
                <div className="flex bg-[#f2f4f7] p-1 rounded-xl border border-stone-200 text-xs">
                  <button
                    onClick={() => setSplitMethod('BY_SUBMITTER')}
                    className={`px-2.5 py-1 font-bold rounded-lg transition-all ${
                      splitMethod === 'BY_SUBMITTER'
                        ? 'bg-[#0e2a47] text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    By Submitter
                  </button>
                  <button
                    onClick={() => setSplitMethod('EQUAL')}
                    className={`px-2.5 py-1 font-bold rounded-md transition-all ${
                      splitMethod === 'EQUAL'
                        ? 'bg-[#0e2a47] text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Split Equally
                  </button>
                  <button
                    onClick={() => setSplitMethod('CUSTOM')}
                    className={`px-2.5 py-1 font-bold rounded-md transition-all ${
                      splitMethod === 'CUSTOM'
                        ? 'bg-[#0e2a47] text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    100% SA Sponsor
                  </button>
                </div>
              </div>

              {/* Split Shares Breakdown Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {memberSubtotals.map(({ member, subtotalUSD, itemCount }) => {
                  let assignedShareUSD = subtotalUSD;
                  if (splitMethod === 'EQUAL') {
                    assignedShareUSD = totalUSD / activeContributorsCount;
                  } else if (splitMethod === 'CUSTOM') {
                    assignedShareUSD = member.role.includes('Sponsor') ? totalUSD : 0;
                  }

                  return (
                    <div
                      key={member.id}
                      className="bg-[#f8fafc] rounded-xl p-3 border border-stone-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-8 h-8 rounded-full object-cover border border-stone-300"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-900 text-xs">{member.name}</span>
                            <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.2 rounded font-semibold">
                              {member.role}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-500">
                            {itemCount} items requested ({member.location})
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-stone-400 block font-semibold">
                          Assigned Share
                        </span>
                        <span className="font-black text-sm text-[#0e2a47]">
                          {formatCurrency(assignedShareUSD)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Checkout Bar */}
              <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-stone-500 font-bold block uppercase">
                    Total Collaborative Order
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#0e2a47]">
                      {formatCurrency(totalUSD)}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">
                      ({totalZAR.toFixed(2)} ZAR | {totalZWG.toFixed(2)} ZiG)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowOrchestratorHub(true)}
                    className="bg-stone-100 hover:bg-stone-200 border border-stone-300 text-[#0e2a47] font-extrabold px-3.5 py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    title="View Real-Time Multi-Rail Payment Orchestrator & Nostro Audit Logs"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden sm:inline">Orchestrator Hub</span>
                  </button>

                  <button
                    onClick={() => setShowCheckoutModal(true)}
                    disabled={cart.length === 0}
                    className="flex-1 sm:flex-none bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] hover:from-[#143427] hover:to-[#22543d] disabled:opacity-50 text-[#d4af37] font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <CreditCard className="w-4 h-4 text-[#d4af37]" />
                    <span>Proceed to Pay & Dispatch Order</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live Group Video Shopping Call Panel (TikTok / Instagram 2x3 Grid Layout) */}
        {isVideoCallActive && (
          <div className="col-span-6 lg:col-span-5 xl:col-span-5 space-y-3">
            {/* Live Video Canvas Card Container */}
            <div className="bg-[#030d17] border-2 border-cyan-500/40 rounded-2xl sm:rounded-3xl p-2 sm:p-4 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[420px] sm:min-h-[540px]">
              {/* Background ambient lighting glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Floating Reactions Layer */}
              <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                {floatingReactions.map((r) => (
                  <div
                    key={r.id}
                    className="absolute text-2xl sm:text-3xl animate-bounce transition-all duration-1000"
                    style={{
                      left: `${r.x}%`,
                      bottom: '20%',
                      animation: 'floatUp 2.2s ease-out forwards'
                    }}
                  >
                    {r.emoji}
                  </div>
                ))}
              </div>

              {/* Video Panel Top Bar */}
              <div className="relative z-20 flex flex-wrap items-center justify-between gap-1.5 border-b border-cyan-500/20 pb-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-black text-[10px] sm:text-xs tracking-wider uppercase text-cyan-200">
                    LIVE SHOPPING CALL
                  </span>
                  <span className="bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-full">
                    {formatCallTime(callTimer)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs"
                    title="Add user to call"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>+ Invite</span>
                  </button>

                  <span className="bg-emerald-500/20 text-emerald-300 text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-400/30">
                    HD 1080p
                  </span>
                </div>
              </div>

              {/* Live Toast Banner over Video */}
              {callToast && (
                <div className="relative z-20 bg-cyan-950/90 border border-cyan-400/40 text-cyan-200 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center justify-between mb-2 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2">
                  <span className="truncate pr-2">{callToast}</span>
                  <button onClick={() => setCallToast(null)} className="text-cyan-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* 2x3 TikTok Live Video Tile Grid */}
              <div className="relative z-10 grid grid-cols-2 gap-2 sm:gap-2.5 flex-1 my-1">
                {callParticipants.slice(0, 6).map((participant) => {
                  const isSpeaking = activeSpeakerId === participant.id;
                  const showSpeakingBadge = speakingBadgeMap[participant.id];
                  const isSelf = participant.id === 'mem-1';
                  const isAudioOnly = participant.mode === 'audio-only';

                  return (
                    <div key={participant.id} className="flex flex-col items-center min-w-0 w-full">
                      <div
                        onClick={() => {
                          const foundMember = members.find((x) => x.id === participant.id);
                          setSelectedMemberForAdd(foundMember || members[0]);
                        }}
                        className={`relative aspect-square w-full rounded-2xl overflow-hidden bg-stone-900 border-2 transition-all cursor-pointer group shadow-md ${
                          isSpeaking
                            ? 'border-emerald-400 shadow-emerald-500/30 ring-2 ring-emerald-400/40 animate-pulse'
                            : 'border-cyan-500/30 hover:border-cyan-400'
                        }`}
                        title={`Click tile to add product for ${participant.name}`}
                      >
                        {/* Real Local Camera Video Stream (for mem-1 if camera enabled) */}
                        {isSelf && !isCameraOff && hasCameraPermission ? (
                          <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : isAudioOnly ? (
                          /* Audio Only Mode Tile with Soundwave Equalizer */
                          <div className="absolute inset-0 bg-gradient-to-b from-[#0e2a47] via-[#091b2e] to-[#040f1a] flex flex-col items-center justify-center p-1 text-center">
                            <img
                              src={participant.avatar}
                              alt={participant.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-md"
                            />
                            <div className="flex items-center gap-1 mt-1">
                              <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1 h-5 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        ) : isSelf && isCameraOff ? (
                          /* Camera Off Fallback */
                          <div className="absolute inset-0 bg-stone-950 flex flex-col items-center justify-center text-stone-500 space-y-1">
                            <Camera className="w-7 h-7 text-stone-600" />
                            <span className="text-[9px] font-bold">Camera Off</span>
                          </div>
                        ) : (
                          /* Remote Participant Video Feed */
                          <img
                            src={participant.avatar}
                            alt={participant.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}

                        {/* Briefly show Speaking overlay badge for 3s when speaking starts */}
                        {showSpeakingBadge && (
                          <div className="absolute top-1.5 left-1.5 z-20 bg-emerald-600/90 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-md uppercase tracking-wider animate-in fade-in duration-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            Speaking
                          </div>
                        )}

                        {/* Subtle Quick Add Button on Tile Bottom Right */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const foundMember = members.find((x) => x.id === participant.id);
                            setSelectedMemberForAdd(foundMember || members[0]);
                            setShowQuickAddModal(true);
                          }}
                          className="absolute bottom-1.5 right-1.5 z-20 bg-emerald-500 hover:bg-emerald-400 text-stone-950 p-1 rounded-full shadow-md transition-transform group-hover:scale-110 active:scale-95 flex items-center justify-center"
                          title={`Add staple for ${participant.name}`}
                        >
                          <Plus className="w-3 h-3 font-black" />
                        </button>
                      </div>

                      {/* Participant Name placed BELOW the square video box */}
                      <span className="font-extrabold text-[10px] sm:text-xs text-stone-200 block text-center mt-1 truncate max-w-full tracking-tight">
                        {participant.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Video Reactions Bar */}
              <div className="relative z-20 flex items-center justify-between bg-cyan-950/60 p-1.5 rounded-2xl border border-cyan-500/20 my-1">
                <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider hidden xs:inline">
                  Live Reactions:
                </span>
                <div className="flex items-center justify-around w-full xs:w-auto gap-1">
                  {['❤️', '🛒', '👏', '🌾', '💡'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => sendReaction(emoji)}
                      className="p-1 sm:p-1.5 hover:bg-cyan-800/50 rounded-xl text-xs sm:text-base transition-transform active:scale-125"
                      title={`Send ${emoji} reaction`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Call Controls Bar (Mic, Camera, Add User, Add Item, WhatsApp, End Call) */}
              <div className="relative z-20 pt-2 border-t border-cyan-500/20 flex items-center justify-between gap-1 overflow-hidden">
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setIsMicMuted(!isMicMuted)}
                    className={`p-1.5 sm:p-2 rounded-xl font-bold text-xs flex items-center gap-1 transition-all active:scale-95 ${
                      isMicMuted
                        ? 'bg-rose-600/90 text-white shadow-lg'
                        : 'bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/30'
                    }`}
                    title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                  >
                    {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>

                  <button
                    onClick={() => setIsCameraOff(!isCameraOff)}
                    className={`p-1.5 sm:p-2 rounded-xl font-bold text-xs flex items-center gap-1 transition-all active:scale-95 ${
                      isCameraOff
                        ? 'bg-rose-600/90 text-white shadow-lg'
                        : 'bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/30'
                    }`}
                    title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
                  >
                    {isCameraOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>

                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="p-1.5 sm:p-2 rounded-xl bg-cyan-900/90 hover:bg-cyan-800 text-cyan-100 border border-cyan-500/40 text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shrink-0"
                    title="Add Family Member to Call"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-cyan-300" />
                    <span className="hidden sm:inline">Add User</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setShowQuickAddModal(true)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-black px-2 py-1.5 sm:px-3 rounded-xl text-[10px] sm:text-xs flex items-center gap-1 shadow-md active:scale-95 transition-all shrink-0"
                    title="Add Staple Product to Cart"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-stone-950" />
                    <span className="hidden sm:inline">Add Item</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onOpenWhatsAppSim) onOpenWhatsAppSim();
                    }}
                    className="p-1.5 sm:p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all shrink-0"
                    title="Open WhatsApp Voice Simulator"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  </button>

                  <button
                    onClick={() => setIsVideoCallActive(false)}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-2 py-1.5 sm:px-3 rounded-xl text-[10px] sm:text-xs flex items-center gap-1 shadow-md transition-all active:scale-95 shrink-0 whitespace-nowrap"
                    title="End Video Call"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">End</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADD MEMBER TO LIVE CALL MODAL */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md">
          <div className="bg-[#0e2a47] border border-cyan-500/40 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl text-white relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowAddMemberModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-stone-800 hover:bg-rose-600 text-stone-300 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-cyan-500/20 pb-3">
              <UserPlus className="w-6 h-6 text-cyan-400" />
              <div>
                <h3 className="text-lg font-black text-white">Invite User to Live Call</h3>
                <p className="text-xs text-blue-200">
                  Connect family members with live video camera or low-bandwidth audio mode.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddNewParticipant} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-cyan-300 block mb-1">
                  Family Member Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Auntie Mary, Tendai Moyo, Uncle Chipo"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#071726] border border-cyan-500/30 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cyan-300 block mb-1">
                  Location / City:
                </label>
                <select
                  value={newMemberLocation}
                  onChange={(e) => setNewMemberLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#071726] border border-cyan-500/30 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="Harare, Zimbabwe">Harare, Zimbabwe</option>
                  <option value="Bulawayo, Zimbabwe">Bulawayo, Zimbabwe</option>
                  <option value="Johannesburg, South Africa">Johannesburg, South Africa</option>
                  <option value="Cape Town, South Africa">Cape Town, South Africa</option>
                  <option value="London, United Kingdom">London, United Kingdom</option>
                  <option value="Gweru, Zimbabwe">Gweru, Zimbabwe</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-cyan-300 block mb-1">
                  Call Mode Preference:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewMemberMode('video')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      newMemberMode === 'video'
                        ? 'bg-emerald-600 text-white border-emerald-400 font-bold shadow-md'
                        : 'bg-[#071726] text-stone-300 border-cyan-500/20 hover:bg-[#0d2338]'
                    }`}
                  >
                    <Video className="w-4 h-4 text-emerald-300" />
                    <div>
                      <div className="text-xs font-bold">Live Camera</div>
                      <div className="text-[10px] opacity-80">Full HD Video</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewMemberMode('audio-only')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      newMemberMode === 'audio-only'
                        ? 'bg-amber-600 text-white border-amber-400 font-bold shadow-md'
                        : 'bg-[#071726] text-stone-300 border-cyan-500/20 hover:bg-[#0d2338]'
                    }`}
                  >
                    <Radio className="w-4 h-4 text-amber-300" />
                    <div>
                      <div className="text-xs font-bold">Audio Only</div>
                      <div className="text-[10px] opacity-80">Low-Data Saver</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="w-1/2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold py-2.5 rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-stone-950 font-black py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95"
                >
                  Join Call Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD STAPLE PRODUCT MODAL (Inside Video Call) */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md">
          <div className="bg-[#0e2a47] border border-cyan-500/40 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl text-white relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => {
                setShowQuickAddModal(false);
                setSelectedMemberForAdd(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-stone-800 hover:bg-rose-600 text-stone-300 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-black text-white">Add Product to Live Cart</h3>
            </div>

            {/* Target Member Picker */}
            <div className="bg-[#071726] p-3 rounded-2xl border border-cyan-500/20 mb-4">
              <span className="text-xs text-stone-400 font-bold block mb-1.5 uppercase">
                Adding on behalf of:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {callParticipants.map((m) => {
                  const isSelected = selectedMemberForAdd?.id === m.id || (!selectedMemberForAdd && m.id === callParticipants[0].id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        const foundMember = members.find((x) => x.id === m.id);
                        setSelectedMemberForAdd(foundMember || members[0]);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                          : 'bg-[#143456] text-stone-300 border-transparent hover:bg-[#1a416b]'
                      }`}
                    >
                      <img src={m.avatar} alt={m.name} className="w-4 h-4 rounded-full object-cover" />
                      <span>{m.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sample Products List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {SAMPLE_PRODUCTS.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-[#143456]/80 hover:bg-[#19406b] border border-cyan-500/20 p-2.5 rounded-xl flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={getProductImagePath(prod.image)} 
                      alt={prod.name} 
                      onError={(e) => handleProductImageError(e, prod.name, prod.category)}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-10 h-10 rounded-lg object-cover bg-white" 
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">{prod.name}</h4>
                      <span className="text-[10px] text-cyan-300 font-semibold">
                        {formatCurrency(prod.priceUSD)} • {prod.unit}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleQuickAdd(prod)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black px-3 py-1.5 rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Unified PCI-Compliant Diaspora Multi-Rail Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        cart={cart}
        members={members}
        memberAddresses={memberAddresses}
        totalUSD={totalUSD}
        totalZAR={totalZAR}
        totalZWG={totalZWG}
        currency={currency}
        exchangeRates={exchangeRates}
        onCheckoutSuccess={() => {
          onClearCart();
        }}
      />

      {/* Internal Payment Orchestrator & Nostro Audit Hub Modal */}
      <PaymentOrchestratorDashboardModal
        isOpen={showOrchestratorHub}
        onClose={() => setShowOrchestratorHub(false)}
      />

      {/* Member Profile Popup Modal */}
      {selectedMemberModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-[#0e2a47] via-[#091b2e] to-[#061421] border border-cyan-500/30 rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl text-white relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedMemberModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-stone-800/80 hover:bg-rose-600 text-stone-300 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Top Profile Avatar Banner */}
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="relative p-1 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] shadow-xl">
                <img
                  src={selectedMemberModal.avatar}
                  alt={selectedMemberModal.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-[#0e2a47]"
                />
                <span
                  className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-[#0e2a47] ${
                    selectedMemberModal.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'
                  }`}
                />
              </div>

              <div>
                <h3 className="text-xl font-black text-white tracking-wide">{selectedMemberModal.name}</h3>
                <span className="inline-block mt-1 bg-cyan-500/20 text-cyan-300 text-xs font-extrabold px-3 py-0.5 rounded-full border border-cyan-400/30">
                  {selectedMemberModal.role}
                </span>
              </div>
            </div>

            {/* Info Details Cards */}
            <div className="mt-5 space-y-2.5">
              <div className="bg-[#143456]/70 border border-blue-400/20 p-3 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-blue-200 font-medium">Location:</span>
                <span className="font-bold text-white flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  {selectedMemberModal.location}
                </span>
              </div>

              <div className="bg-[#143456]/70 border border-blue-400/20 p-3 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-blue-200 font-medium">Active Channel:</span>
                <span className="font-bold text-white flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  {selectedMemberModal.channel === 'whatsapp' ? 'WhatsApp Voice & Text 💬' : 'Web App Sync 🌐'}
                </span>
              </div>

              {selectedMemberModal.phone && (
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
                      Phone / WhatsApp Number
                    </span>
                    <span className="text-sm font-black text-white tracking-wide">
                      {selectedMemberModal.phone}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMemberModal(null);
                      if (onOpenWhatsAppSim) {
                        onOpenWhatsAppSim();
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1 whitespace-nowrap"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              )}

              {/* Cart Contribution Summary */}
              {(() => {
                const memberItems = cart.filter(
                  (i) =>
                    i.addedByMemberId === selectedMemberModal.id ||
                    i.addedByMemberName.toLowerCase().includes(selectedMemberModal.name.toLowerCase().split(' ')[0])
                );
                const subUSD = memberItems.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);

                return (
                  <div className="bg-stone-900/60 p-3 rounded-2xl border border-stone-700/50 text-xs flex items-center justify-between">
                    <span className="text-stone-300 font-medium">Items in this cart:</span>
                    <span className="font-extrabold text-[#ffb703]">
                      {memberItems.reduce((s, i) => s + i.quantity, 0)} items ({formatCurrency(subUSD)})
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={() => setSelectedMemberModal(null)}
                className="w-full bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold py-2.5 rounded-xl text-xs transition-all"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Address & Store Pickup Modal */}
      <DeliveryAddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        member={addressMember || members[0]}
        onSaveAddress={handleSaveMemberAddress}
      />
    </div>
  );
};
