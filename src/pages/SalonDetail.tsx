import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp, BusinessProfile, ServiceItem, ReviewEntry, getCategoryInfo } from '../store/AppContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Helmet } from 'react-helmet-async';
import { triggerHaptic } from '../utils/haptics';
import { getBusinessImageWithFallback } from '../utils/categoryImages';
import { calculateSmartETA } from '../services/queueService';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  Navigation, 
  Phone, 
  Bookmark, 
  Star, 
  Clock, 
  Check, 
  X, 
  Users, 
  Sparkles, 
  RefreshCw, 
  AlertCircle,
  ChevronRight,
  Info,
  Calendar,
  Zap,
  Tag
} from 'lucide-react';

export default function SalonDetail() {
  const { id } = useParams<{ id: string }>();
  const { 
    getBusinessById, 
    getSalonTokens, 
    user, 
    customerProfile, 
    addReview, 
    getSalonReviews, 
    allSalons, 
    toggleFavorite, 
    isFavorite, 
    t 
  } = useApp();
  const nav = useNavigate();

  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ServiceItem[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLiveQueueModal, setShowLiveQueueModal] = useState(false);
  const [getting, setGetting] = useState(false);
  const [getError, setGetError] = useState('');
  const [tokenResult, setTokenResult] = useState<{ tokenNumber: number; waitTime: number; tokenId: string } | null>(null);
  
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [activeTab, setActiveTab] = useState<'services' | 'about' | 'reviews'>('services');
  const [advanceDate, setAdvanceDate] = useState('');
  const [isTatkal, setIsTatkal] = useState(false);
  const [groupSize, setGroupSize] = useState(1);
  const [assignedStaffId, setAssignedStaffId] = useState<string | undefined>();

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; type: 'percentage' | 'flat'; value: number } | null>(null);
  const [activeTokenCount, setActiveTokenCount] = useState<number>(0);
  const [currentWaitTime, setCurrentWaitTime] = useState<number>(0);
  const [liveQueueTokens, setLiveQueueTokens] = useState<any[]>([]);

  const catInfo = getCategoryInfo(business?.businessType || 'salon');
  const term = catInfo.terminology;
  const TATKAL_FEE = 50;

  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  useEffect(() => {
    if (id) {
      const realtime = allSalons.find(s => s.uid === id);
      if (realtime) { 
        setBusiness(realtime as BusinessProfile); 
        setLoading(false); 
      } else {
        getBusinessById(id).then(s => { 
          setBusiness(s as BusinessProfile); 
          setLoading(false); 
        });
      }
    }
  }, [id, allSalons]);

  useEffect(() => {
    if (id) getSalonReviews(id).then(setReviews);
  }, [id]);

  useEffect(() => {
    if (id && business) {
      const q = query(
        collection(db, 'tokens'), 
        where('salonId', '==', id), 
        where('date', '==', advanceDate || today)
      );
      const unsub = onSnapshot(q, snap => {
        const activeDocs = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .filter(s => s.status === 'waiting' || s.status === 'serving')
          .sort((a, b) => a.tokenNumber - b.tokenNumber);

        setLiveQueueTokens(activeDocs);
        setActiveTokenCount(activeDocs.length);
        
        const mWait = activeDocs.reduce((acc, doc) => acc + (doc.totalTime || 0) * (doc.groupSize || 1), 0);
        setCurrentWaitTime(mWait + (business.queueDelayMinutes || 0));
      });
      return () => unsub();
    } else {
      setActiveTokenCount(0);
      setCurrentWaitTime(0);
      setLiveQueueTokens([]);
    }
  }, [id, business, advanceDate, today]);

  const toggleService = (s: ServiceItem) => {
    triggerHaptic('light');
    setSelected(prev => prev.find(x => x.id === s.id) ? prev.filter(x => x.id !== s.id) : [...prev, s]);
  };

  const totalTime = selected.reduce((a, s) => a + s.avgTime, 0) * groupSize;
  const rawPrice = selected.reduce((a, s) => a + s.price * groupSize, 0);
  
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === 'percentage') {
      discountAmount = Math.round((rawPrice * appliedPromo.value) / 100);
    } else {
      discountAmount = appliedPromo.value;
    }
  }
  const maxDiscount = Math.min(discountAmount, rawPrice);
  const totalPrice = (rawPrice - maxDiscount) + (isTatkal ? TATKAL_FEE : 0);

  const handleApplyPromo = () => {
    triggerHaptic('light');
    if (!business?.promoCodes || !promoCodeInput.trim()) return;
    const promo = business.promoCodes.find(p => p.code === promoCodeInput.trim().toUpperCase() && p.active);
    if (promo) {
      setAppliedPromo(promo);
      setPromoCodeInput('');
    } else {
      setAppliedPromo(null);
      alert('Invalid or expired promo code');
    }
  };

  const handleGetToken = async () => {
    if (!business) return;
    if (!user) {
      setGetError('Please login to continue');
      return;
    }
    
    const customerName = customerProfile?.name || user.displayName || user.email?.split('@')[0] || 'Customer';
    const customerPhone = customerProfile?.phone || user.phoneNumber || '';

    setGetting(true);
    setGetError('');

    try {
      const bookingDate = advanceDate || today;
      const isAdvance = advanceDate !== '' && advanceDate !== today;

      const existingTokens = await getSalonTokens(business.uid, bookingDate);
      const activeTokens = existingTokens.filter(t => t.status === 'waiting' || t.status === 'serving');
      let waitMinutes = 0;
      if (!isAdvance) {
        const staffList = business.staffMembers || (business as any).staffList || [];
        const activeStaff = Math.max(1, staffList.filter((s: any) => s.isAvailable !== false && s.active !== false).length || 1);
        try {
          const eta = calculateSmartETA({
            activeStaffCount: activeStaff,
            currentQueue: activeTokens,
            requestedServiceDuration: totalTime,
            queueDelay: business.queueDelayMinutes || 0
          });
          waitMinutes = eta.estimatedWaitMinutes;
        } catch {
          waitMinutes = activeTokens.reduce((s, t) => s + (t.totalTime * (t.groupSize || 1)), 0);
        }
      }

      const nextTokenNum = existingTokens.length + 1;
      const tokenId = `${business.uid}_${bookingDate}_${nextTokenNum}_${Date.now()}`;

      const tokenData = {
        id: tokenId,
        salonId: business.uid,
        salonName: business.businessName,
        customerId: user.uid,
        customerName,
        customerPhone,
        date: bookingDate,
        tokenNumber: nextTokenNum,
        selectedServices: selected.map(s => ({ id: s.id, name: s.name, price: s.price, avgTime: s.avgTime })),
        totalPrice,
        totalTime,
        status: 'waiting' as const,
        estimatedWait: waitMinutes,
        createdAt: Date.now(),
        isTatkal: !!isTatkal,
        groupSize,
        staffId: assignedStaffId || null,
        isAdvance
      };

      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'tokens', tokenId), tokenData);

      triggerHaptic('success');
      setTokenResult({ tokenNumber: nextTokenNum, waitTime: waitMinutes, tokenId });
      setShowConfirm(false);
    } catch (err: any) {
      console.error(err);
      setGetError(err?.message || 'Failed to join queue');
    } finally {
      setGetting(false);
    }
  };

  const handleWhatsAppShare = () => {
    triggerHaptic('light');
    const text = `Check out ${business?.businessName} on Line Free India!\nQueue: ${activeTokenCount} waiting (~${currentWaitTime} mins)\nBook here: ${window.location.href}`;
    if (navigator.share) {
      navigator.share({ title: business?.businessName, text, url: window.location.href }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const handleSubmitReview = async () => {
    if (!business || !user) return;
    setSubmittingReview(true);
    try {
      await addReview({
        salonId: business.uid,
        customerId: user.uid,
        customerName: customerProfile?.name || 'Customer',
        rating: reviewRating,
        comment: reviewComment,
        createdAt: Date.now(),
        verifiedVisit: true
      });
      setShowReview(false);
      setReviewComment('');
      getSalonReviews(business.uid).then(setReviews);
      triggerHaptic('success');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 flex flex-col items-center justify-center text-center">
        <p className="text-4xl mb-3">🏢</p>
        <h2 className="text-lg font-black text-gray-900">Business Not Found</h2>
        <p className="text-xs text-gray-500 mt-1 mb-4">This center is either closed or no longer available.</p>
        <button
          onClick={() => nav('/customer/search')}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
        >
          Back to Explore
        </button>
      </div>
    );
  }

  // Booking confirmed screen
  if (tokenResult) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-5 flex flex-col items-center justify-center animate-fadeIn">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-gray-100 p-6 text-center shadow-lg">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <Check className="w-8 h-8 stroke-[2.5]" />
          </div>

          <h2 className="text-xl font-black text-gray-900 mb-0.5">Token Confirmed!</h2>
          <p className="text-xs text-gray-500 mb-5 font-medium">{business.businessName}</p>

          <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 mb-5">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Your Token Number</p>
            <p className="text-5xl font-black text-emerald-600 my-2">#{tokenResult.tokenNumber}</p>
            <div className="w-full h-px bg-emerald-100 my-3" />
            <p className="text-xs font-semibold text-gray-500">
              Estimated Wait: <strong className="text-gray-900 font-black">~{tokenResult.waitTime} min</strong>
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => nav('/customer/tokens')}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
            >
              View in My Tokens
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-4 h-4" /> Share on WhatsApp
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isClosed = !business.isOpen;
  const initialLetter = business.businessName ? business.businessName.charAt(0).toUpperCase() : 'S';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 pb-36 select-none relative overflow-x-hidden">
      <Helmet>
        <title>{business.businessName} · Line Free India</title>
      </Helmet>

      {/* Hero Photo Banner with Top Safe Area & Floating Controls (Screen 6) */}
      <div className="relative w-full h-72 bg-gray-200">
        <img
          src={getBusinessImageWithFallback(business.photoURL, business.bannerImageURL, business.businessType)}
          alt={business.businessName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/50" />

        {/* Floating Top Controls with safe-area top padding */}
        <div className="absolute top-0 inset-x-0 app-header-safe px-4 flex items-center justify-between z-10">
          <button
            onClick={() => { triggerHaptic('light'); nav(-1); }}
            className="w-11 h-11 rounded-full bg-white/95 backdrop-blur-md shadow-md flex items-center justify-center text-gray-800 hover:bg-white transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => { triggerHaptic('medium'); toggleFavorite(business.uid); }}
              className="w-11 h-11 rounded-full bg-white/95 backdrop-blur-md shadow-md flex items-center justify-center transition cursor-pointer"
            >
              <Heart className={`w-5 h-5 ${isFavorite(business.uid) ? 'fill-rose-500 text-rose-500' : 'text-gray-700'}`} />
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="w-11 h-11 rounded-full bg-white/95 backdrop-blur-md shadow-md flex items-center justify-center text-gray-700 hover:bg-white transition cursor-pointer"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Overlapping Info Card (Screen 6) */}
      <div className="px-4 -mt-10 relative z-20 space-y-4">
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-start gap-4">
            {/* Squircle logo */}
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-2xl shadow-xs shrink-0">
              {business.photoURL ? (
                <img src={business.photoURL} alt="" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <span>{initialLetter}</span>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            {/* Title & Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-gray-900 leading-tight truncate">
                {business.businessName}
              </h1>
              <p className="text-sm text-gray-500 font-medium truncate mt-0.5">
                {catInfo.label} &bull; {business.location || 'Local Area'}
              </p>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 text-sm font-black text-gray-900">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{business.rating ? business.rating.toFixed(1) : '4.8'}</span>
                  <span className="text-gray-400 font-medium text-xs">({business.totalReviews || 124})</span>
                </div>
                {business.isOpen ? (
                  <span className="ml-2 text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Open Now
                  </span>
                ) : (
                  <span className="ml-2 text-xs font-bold px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100">
                    Closed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 4 Action Buttons (Screen 6: Directions, Call, Share, Save) */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-100">
            <a
              href={business.lat && business.lng ? `https://maps.google.com/?q=${business.lat},${business.lng}` : `https://maps.google.com/?q=${encodeURIComponent(business.location || business.businessName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition"
            >
              <Navigation className="w-5 h-5 text-emerald-600 mb-1" />
              <span className="text-xs font-bold">Directions</span>
            </a>

            <a
              href={business.phone ? `tel:${business.phone}` : '#'}
              className={`flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition ${!business.phone ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Phone className="w-5 h-5 text-blue-600 mb-1" />
              <span className="text-xs font-bold">Call</span>
            </a>

            <button
              onClick={handleWhatsAppShare}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
            >
              <Share2 className="w-5 h-5 text-emerald-600 mb-1" />
              <span className="text-xs font-bold">Share</span>
            </button>

            <button
              onClick={() => { triggerHaptic('medium'); toggleFavorite(business.uid); }}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
            >
              <Bookmark className={`w-5 h-5 mb-1 ${isFavorite(business.uid) ? 'fill-emerald-600 text-emerald-600' : 'text-gray-600'}`} />
              <span className="text-xs font-bold">{isFavorite(business.uid) ? 'Saved' : 'Save'}</span>
            </button>
          </div>

          {/* Queue Strip (Screen 6: No Waiting Line • ~0 min) */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${activeTokenCount === 0 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-sm font-black text-emerald-900">
                {activeTokenCount === 0 ? 'No Waiting Line' : `${activeTokenCount} Waiting in Line`}
              </span>
              <span className="text-emerald-300">&bull;</span>
              <span className="text-sm font-semibold text-emerald-700">
                ~{currentWaitTime} min
              </span>
            </div>

            <button
              onClick={() => setShowLiveQueueModal(true)}
              className="text-xs font-bold text-emerald-700 underline cursor-pointer"
            >
              Details
            </button>
          </div>
        </div>

        {/* Section: About (Screen 6) */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-2.5">About</h3>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            {business.about || business.bio || 'Premium grooming and personal care services. Enjoy instant queuing with zero waiting line.'}
          </p>
        </div>

        {/* Section: Services (Screen 6) */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-gray-900">Services</h3>
            {selected.length > 0 && (
              <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                {selected.length} selected &bull; ₹{totalPrice}
              </span>
            )}
          </div>

          {business.services && business.services.length > 0 ? (
            <div className="space-y-3">
              {business.services.map((s) => {
                const isSelected = !!selected.find((x) => x.id === s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleService(s)}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/30'
                        : 'bg-gray-50/70 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <h4 className="text-base font-black text-gray-900">{s.name}</h4>
                      <p className="text-xs text-gray-500 font-semibold mt-0.5">
                        ⏱ {s.avgTime} min
                      </p>
                      <p className="text-base font-black text-emerald-700 mt-1">₹{s.price}</p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleService(s);
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {isSelected ? '✓ Added' : '+ Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-3 text-center">No individual services listed.</p>
          )}
        </div>
      </div>

      {/* Sticky Dual Bottom Action Bar (Screen 6: View Live Queue + Join Queue) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 p-4 pb-6 shadow-lg flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setShowLiveQueueModal(true);
          }}
          className="flex-1 py-4 px-3 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Clock className="w-5 h-5 text-gray-600" />
          <span>View Live Queue</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            if (selected.length === 0 && business.services && business.services.length > 0) {
              setSelected([business.services[0]]);
            }
            setShowConfirm(true);
          }}
          disabled={isClosed}
          className="flex-1 py-4 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-black shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Join Queue</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* ─── Live Queue Status Waiting Room Modal (Screen 7) ─── */}
      <AnimatePresence>
        {showLiveQueueModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="w-full max-h-[85vh] sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-base font-black text-gray-900">Live Queue Status</h2>
                <button
                  onClick={() => setShowLiveQueueModal(false)}
                  className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
                
                {/* Current Status Card (Screen 7) */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-600">Current Status:</span>
                    <span className="font-black text-emerald-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {business.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-600">Total in Queue:</span>
                    <span className="font-black text-gray-900">{activeTokenCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-600">Est. Wait:</span>
                    <span className="font-black text-emerald-700">~ {currentWaitTime} min</span>
                  </div>
                </div>

                {/* Join Queue Button in Modal */}
                <button
                  onClick={() => {
                    setShowLiveQueueModal(false);
                    if (selected.length === 0 && business.services && business.services.length > 0) {
                      setSelected([business.services[0]]);
                    }
                    setShowConfirm(true);
                  }}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                >
                  Join Queue
                </button>

                {/* Live Queue list */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">Live Queue</h3>
                    <button
                      onClick={() => triggerHaptic('light')}
                      className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 hover:underline"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>

                  {liveQueueTokens.length === 0 ? (
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center text-xs font-medium text-gray-500">
                      No one in queue right now. You'll be first!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {liveQueueTokens.map((t, idx) => (
                        <div
                          key={t.id}
                          className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-[10px]">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-gray-800">
                              {t.customerName?.split(' ')[0] || 'Customer'}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-500 font-semibold">
                            Token #{t.tokenNumber}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* How It Works Guide (Screen 7) */}
                <div className="pt-2 border-t border-gray-100 space-y-3">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">How it works?</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 font-black text-xs flex items-center justify-center shrink-0">
                        1
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Join from anywhere</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Get a live token without standing in line or waiting at the store.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 font-black text-xs flex items-center justify-center shrink-0">
                        2
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Track real-time</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Watch your position update live as customers ahead of you are served.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 font-black text-xs flex items-center justify-center shrink-0">
                        3
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Arrive just in time</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Walk in right when it's your turn and get served immediately.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Confirmation & Checkout Modal ─── */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="w-full max-h-[85vh] sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-base font-black text-gray-900">Confirm Booking</h2>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
                {/* Selected Services */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Selected Services</h4>
                  {selected.map((s) => (
                    <div key={s.id} className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-gray-800">{s.name}</span>
                      <span className="text-gray-900 font-bold">₹{s.price}</span>
                    </div>
                  ))}

                  {/* Tatkal option */}
                  <label className="flex items-center justify-between pt-3 mt-2 border-t border-gray-200 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="text-xs font-bold text-gray-900">Tatkal Priority Access</p>
                        <p className="text-[10px] text-gray-500">Jump ahead in queue</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isTatkal}
                      onChange={(e) => setIsTatkal(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded-sm"
                    />
                  </label>

                  {/* Summary Totals */}
                  <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-sm font-black">
                    <span className="text-gray-800">Total Price</span>
                    <span className="text-emerald-700">₹{totalPrice}</span>
                  </div>
                </div>

                {getError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{getError}</span>
                  </div>
                )}
              </div>

              {/* Confirm CTA */}
              <div className="p-4 border-t border-gray-100 bg-white pb-[max(16px,env(safe-area-inset-bottom,16px))]">
                <button
                  onClick={handleGetToken}
                  disabled={getting}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {getting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Securing Token...</span>
                    </>
                  ) : (
                    <span>Confirm &amp; Join Queue (₹{totalPrice})</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
