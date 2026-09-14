import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, BUSINESS_CATEGORIES, TokenEntry, BusinessCategory } from '../store/AppContext';
import BottomNav from '../components/BottomNav';
import ResponsiveContainer from '../components/ResponsiveContainer';
import NotificationBell from '../components/NotificationBell';
import { getBusinessImageWithFallback, getCategoryImage } from '../utils/categoryImages';
import { triggerHaptic } from '../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Sparkles, 
  Clock, 
  Star, 
  Heart, 
  ArrowRight, 
  ChevronRight,
  Building2
} from 'lucide-react';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

import { SlidersHorizontal, Check, X } from 'lucide-react';
import { getCategoryInfo } from '../store/AppContext';

const INDUSTRY_GROUPS = [
  { id: 'all', label: 'All Industries', icon: '✨' },
  { id: 'beauty', label: 'Beauty & Salon', icon: '💈' },
  { id: 'healthcare', label: 'Clinics & OPD', icon: '🏥' },
  { id: 'govt', label: 'Govt & Seva', icon: '🏛️' },
  { id: 'banking', label: 'Banking', icon: '🏦' },
  { id: 'dining', label: 'Dining & Food', icon: '🍽️' },
  { id: 'spiritual', label: 'Darshan', icon: '🛕' },
  { id: 'fitness', label: 'Fitness & Gym', icon: '💪' },
  { id: 'education', label: 'Education & Legal', icon: '📚' },
  { id: 'repairs', label: 'Repairs & Auto', icon: '🔧' },
  { id: 'pets', label: 'Pet Care', icon: '🐾' },
];

export default function CustomerHome() {
  const {
    allSalons,
    customerProfile,
    user,
    isFavorite,
    toggleFavorite,
    getUserLocation,
    getCustomerTokens,
    unreadCount,
  } = useApp();

  const nav = useNavigate();
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTokens, setActiveTokens] = useState<TokenEntry[]>([]);
  const [quickFilter, setQuickFilter] = useState<'all' | 'nearby' | 'zero_wait' | 'open_now' | 'top_rated'>('all');
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  useEffect(() => {
    getUserLocation().then((loc) => { if (loc) setUserLoc(loc); });
  }, [getUserLocation]);

  const effectiveLoc = useMemo(() => {
    if (userLoc) return userLoc;
    if (customerProfile?.lat && customerProfile?.lng) {
      return { lat: customerProfile.lat, lng: customerProfile.lng };
    }
    try {
      const cached = localStorage.getItem('lf_user_coords');
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  }, [userLoc, customerProfile?.lat, customerProfile?.lng]);

  useEffect(() => {
    if (customerProfile?.uid || user?.uid) {
      const uid = customerProfile?.uid || user?.uid || '';
      getCustomerTokens(uid).then((tokens) => {
        setActiveTokens(tokens.filter((t) => t.status === 'waiting' || t.status === 'serving'));
      });
    }
  }, [customerProfile?.uid, user?.uid, getCustomerTokens]);

  const filteredBusinesses = useMemo(() => {
    let list = allSalons.map((b) => ({
      ...b,
      distanceKm: effectiveLoc && b.lat && b.lng ? getDistanceKm(effectiveLoc.lat, effectiveLoc.lng, b.lat, b.lng) : undefined,
    }));

    if (selectedCategory !== 'all') {
      list = list.filter((b) => {
        const type = (b.businessType || '').toLowerCase();
        const cat = (b.category || '').toLowerCase();
        if (selectedCategory === 'mens_salon' || selectedCategory === 'salon') {
          return type === 'mens_salon' || type === 'salon' || cat.includes('salon') || cat.includes('barber');
        }
        if (selectedCategory === 'beauty_parlour' || selectedCategory === 'beauty') {
          return type === 'beauty_parlour' || cat.includes('beauty') || cat.includes('parlour');
        }
        if (selectedCategory === 'bridal_studio' || selectedCategory === 'bridal') {
          return type === 'bridal_studio' || cat.includes('bridal');
        }
        if (selectedCategory === 'spa_wellness' || selectedCategory === 'spa') {
          return type === 'spa_wellness' || cat.includes('spa') || cat.includes('wellness');
        }
        const matchInfo = BUSINESS_CATEGORIES.find((c) => c.id === b.businessType);
        return b.businessType === selectedCategory || matchInfo?.industryGroup === selectedCategory;
      });
    }

    if (quickFilter === 'open_now') {
      list = list.filter((b) => b.isOpen && !b.isBreak && !b.isStopped);
    } else if (quickFilter === 'zero_wait') {
      list = list.filter((b) => {
        const waitingCount = Math.max(0, (b.totalTokensToday || 0) - (b.currentToken || 0));
        return waitingCount <= 1;
      });
    } else if (quickFilter === 'top_rated') {
      list = list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (quickFilter === 'nearby') {
      list = list.sort((a, b) => {
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    } else {
      list = list.sort((a, b) => {
        if (a.distanceKm != null && b.distanceKm != null) {
          return a.distanceKm - b.distanceKm;
        }
        if (a.distanceKm != null) return -1;
        if (b.distanceKm != null) return 1;
        return (b.rating || 0) - (a.rating || 0);
      });
    }

    return list;
  }, [allSalons, selectedCategory, quickFilter, effectiveLoc]);

  const latestActiveToken = activeTokens[0] || null;

  return (
    <ResponsiveContainer variant="customer">
      <div className="min-h-screen bg-bg text-text pb-44 sm:pb-48 animate-fadeIn flex flex-col select-none overflow-x-hidden overflow-y-auto relative">
        {/* Background gradient mesh */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse at 10% 0%, rgba(59, 130, 246, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse at 90% 20%, rgba(139, 92, 246, 0.06) 0%, transparent 50%),
            var(--color-bg)
          `,
          zIndex: 0, pointerEvents: 'none',
        }} />

        {/* ─── Top Header (Matching Mockup Screen 1) ─── */}
        <header className="sticky top-0 z-40 bg-white/98 backdrop-blur-xl border-b border-gray-100 px-4 app-header-safe pb-3.5 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 leading-tight">
                  {getGreeting()},
                </p>
                <h1 className="text-2xl font-black text-gray-900 leading-tight flex items-center gap-1.5 mt-0.5">
                  <span>
                    {typeof customerProfile?.name === 'string'
                      ? customerProfile.name.split(' ')[0]
                      : typeof user?.displayName === 'string'
                      ? user.displayName.split(' ')[0]
                      : 'Satyam'}
                  </span>
                  <span>👋</span>
                </h1>
                <p className="text-sm font-medium text-gray-500 mt-1">
                  Find & join live queues near you
                </p>
                <div 
                  onClick={() => { triggerHaptic('light'); nav('/customer/profile'); }}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-900 mt-1.5 cursor-pointer hover:text-emerald-600 transition"
                  title="Change Location"
                >
                  <span>📍 {
                    typeof customerProfile?.location === 'string' && customerProfile.location.trim().length > 0
                      ? customerProfile.location.split(',')[0].trim()
                      : (effectiveLoc ? 'Current Location' : 'Set Location')
                  }</span>
                  <span className="text-xs text-gray-500 font-bold">⌄</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => nav('/customer/notifications')}
                className="w-11 h-11 rounded-full bg-gray-50 border border-gray-100 text-gray-600 flex items-center justify-center relative cursor-pointer hover:bg-gray-100 transition shadow-xs"
                title="Notifications"
              >
                <NotificationBell count={unreadCount || 1} onClick={() => nav('/customer/notifications')} />
              </button>
              
              <button
                onClick={() => { triggerHaptic('light'); nav('/customer/profile'); }}
                className="w-11 h-11 rounded-full overflow-hidden border-2 border-emerald-500/40 shadow-xs flex items-center justify-center bg-gray-100 cursor-pointer transition hover:scale-105"
                title="Profile"
              >
                {customerProfile?.photoURL || user?.photoURL ? (
                  <img src={customerProfile?.photoURL || user?.photoURL || ''} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-emerald-600 text-white font-black flex items-center justify-center text-base">
                    {(customerProfile?.name || user?.displayName || 'S')[0].toUpperCase()}
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar with QR Scanner */}
          <div className="mt-3.5 flex items-center gap-2">
            <div
              onClick={() => { triggerHaptic('light'); nav('/customer/search'); }}
              className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200/90 hover:border-emerald-500/50 cursor-pointer transition shadow-2xs group"
            >
              <Search className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors shrink-0" />
              <span className="text-base font-medium text-gray-500 flex-1 truncate">
                Search services, shops, or PIN...
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); nav('/customer/tokens'); }}
                className="text-gray-500 hover:text-emerald-600 p-1"
                title="Scan QR Code"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7zM14 14h3v3h-3z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* ─── Scrollable Body ─── */}
        <div className="flex-1 px-4 pt-4 space-y-4">
          {/* ─── Modern Premium Hero Banner ─── */}
          <div className="rounded-3xl p-5 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white relative overflow-hidden shadow-lg border border-emerald-800/40">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/15 blur-3xl rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-[68%]">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-emerald-300 text-xs font-black">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Line Free Live Queue</span>
                </div>
                <h2 className="text-2xl font-black leading-tight tracking-tight text-white">
                  Skip The Waiting Line
                </h2>
                <p className="text-sm font-medium text-emerald-100/90 leading-snug">
                  Get digital tokens instantly. We notify you when your turn arrives.
                </p>
              </div>

              {/* Clean Live Badge */}
              <div className="shrink-0 flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[95px] shadow-sm">
                <span className="text-2xl mb-0.5">⚡</span>
                <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">Zero Wait</span>
                <span className="text-[11px] text-gray-200 font-bold mt-0.5">Live Tokens</span>
              </div>
            </div>
          </div>

          {/* ─── Dynamic Island: Active Live Queue Alert (If Token Exists) ─── */}
          <AnimatePresence>
            {latestActiveToken && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: -10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: -10 }}
                className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/90 relative overflow-hidden shadow-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                      {latestActiveToken.status === 'serving' ? 'Your Turn Now' : 'Live Queue Active'}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-emerald-700">
                    Est. ~{latestActiveToken.estimatedWaitMinutes || 12} mins
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-lg text-gray-900 truncate max-w-[210px]">{latestActiveToken.salonName}</h3>
                    <p className="text-sm text-gray-700 font-semibold">Token #{latestActiveToken.tokenNumber || 1} • In Queue</p>
                  </div>
                  <button
                    onClick={() => { triggerHaptic('medium'); nav('/customer/tokens'); }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-sm shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                  >
                    Track Live →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Circular Category Badges (In-Page Dynamic Filter) ─── */}
          <div className="flex items-center justify-between px-1">
            {[
              { id: 'all', label: 'All', icon: '✨', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { id: 'mens_salon', label: 'Salon', icon: '💈', bg: 'bg-purple-50 text-purple-600 border-purple-200' },
              { id: 'beauty_parlour', label: 'Beauty', icon: '💄', bg: 'bg-pink-50 text-pink-600 border-pink-200' },
              { id: 'bridal_studio', label: 'Bridal', icon: '👑', bg: 'bg-rose-50 text-rose-600 border-rose-200' },
              { id: 'spa_wellness', label: 'Spa', icon: '🌿', bg: 'bg-teal-50 text-teal-600 border-teal-200' },
              { id: 'more', label: 'More', icon: '•••', bg: 'bg-gray-50 text-gray-700 border-gray-200' },
            ].map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    if (cat.id === 'more') {
                      setShowFilterSheet(true);
                    } else {
                      setSelectedCategory((prev) => (prev === cat.id ? 'all' : cat.id));
                    }
                  }}
                  className="flex flex-col items-center gap-2 cursor-pointer group"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-xs border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-emerald-600 ring-4 ring-emerald-500/25 scale-105 bg-emerald-600 text-white'
                        : `${cat.bg} group-hover:scale-105`
                    }`}
                  >
                    <span>{cat.icon}</span>
                  </div>
                  <span
                    className={`text-sm font-black transition-colors ${
                      isSelected ? 'text-emerald-700 font-black' : 'text-gray-900 group-hover:text-emerald-600'
                    }`}
                  >
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ─── Quick Filter Chips (Nearby, Zero Wait, Open Now, Top Rated) ─── */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
            {[
              { id: 'all', label: 'All Places' },
              { id: 'nearby', label: '📍 Nearest First' },
              { id: 'zero_wait', label: '⚡ Zero Wait' },
              { id: 'open_now', label: '🟢 Open Now' },
              { id: 'top_rated', label: '⭐ Top Rated' },
            ].map((f) => {
              const active = quickFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setQuickFilter(f.id as any);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold shrink-0 transition-all cursor-pointer ${
                    active
                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* ─── Popular Near You Section (Matching Mockup Screen 1) ─── */}
          <div className="space-y-3.5 pt-1">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                Popular Near You
              </h2>
              <button 
                onClick={() => nav('/customer/search')} 
                className="text-base font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {filteredBusinesses.length > 0 ? (
              <div className="space-y-3.5">
                {filteredBusinesses.slice(0, 8).map((biz, idx) => {
                  const waitingCount = Math.max(0, (biz.totalTokensToday || 0) - (biz.currentToken || 0));
                  const isFav = isFavorite(biz.uid);
                  const isZeroWait = waitingCount <= 1;

                  // Brand Squircle Colors based on category
                  const squircleThemes = [
                    { bg: 'bg-blue-600 text-white', letter: 'A' },
                    { bg: 'bg-amber-100 text-blue-700 border border-amber-200', letter: '⚛️' },
                    { bg: 'bg-pink-600 text-white', letter: 'S' },
                    { bg: 'bg-purple-600 text-white', letter: 'S' },
                    { bg: 'bg-emerald-600 text-white', letter: 'G' },
                  ];
                  const theme = squircleThemes[idx % squircleThemes.length];

                  return (
                    <motion.div
                      key={biz.uid}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.3 }}
                      onClick={() => { triggerHaptic('light'); nav(`/customer/salon/${biz.uid}`); }}
                      className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center justify-between gap-3 hover:shadow-md transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Squircle Avatar with Live Dot */}
                        <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center font-black text-xl relative shadow-xs ${theme.bg}`}>
                          <span>{theme.letter}</span>
                          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white absolute -bottom-0.5 -right-0.5" />
                        </div>

                        {/* Info Column */}
                        <div className="min-w-0">
                          <h3 className="font-black text-lg text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
                            {biz.businessName || "Men's Salon"}
                          </h3>
                          <p className="text-sm text-gray-600 truncate mt-0.5 font-semibold">
                            {biz.location || 'Local Area'}
                            {biz.distanceKm != null ? ` • ${biz.distanceKm.toFixed(1)} km away` : ''}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-500">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              {biz.rating ? biz.rating.toFixed(1) : '4.8'}
                              <span className="text-gray-400 font-normal">({biz.reviewCount || 120}+)</span>
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>{isZeroWait ? 'No Wait' : `${waitingCount} in line`}</span>
                            <span className="text-gray-400 font-medium">• ~{waitingCount * 12 || 0} min</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Actions */}
                      <div className="flex flex-col items-end justify-between h-16 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); triggerHaptic('medium'); toggleFavorite(biz.uid); }}
                          className="text-gray-300 hover:text-rose-500 transition p-1 cursor-pointer"
                          title="Favorite"
                        >
                          <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); nav(`/customer/salon/${biz.uid}`); }}
                          className="text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-5 py-2.5 rounded-2xl transition shadow-xs cursor-pointer"
                        >
                          Join Queue
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center bg-white border border-gray-100 rounded-2xl p-6 shadow-xs">
                <p className="text-2xl mb-2">🔍</p>
                <h3 className="font-bold text-sm text-gray-900">No queues found</h3>
                <p className="text-xs text-gray-400 mt-1">Try resetting filters to discover nearby centers.</p>
              </div>
            )}
          </div>
        </div>

        <BottomNav />
      </div>

      {/* ─── Filter & Explore Bottom Sheet ─── */}
      <AnimatePresence>
        {showFilterSheet && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full h-[85vh] sm:h-auto sm:max-h-[85vh] sm:max-w-2xl bg-bg sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card sticky top-0 z-10">
                <h2 className="text-lg font-black flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                  Filter & Explore
                </h2>
                <button
                  onClick={() => setShowFilterSheet(false)}
                  className="p-2 rounded-full bg-background border border-border text-text hover:bg-card-hover transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar relative">
                
                {/* Sort By Options */}
                <div>
                  <h3 className="text-xs font-black text-text-dim uppercase tracking-widest mb-3">Sort By</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'all', label: 'Nearest First', icon: '📍' },
                      { id: 'zero_wait', label: 'Zero Wait', icon: '⚡' },
                      { id: 'open_now', label: 'Open Right Now', icon: '🟢' },
                      { id: 'top_rated', label: 'Top Rated', icon: '⭐' },
                    ].map((f) => {
                      const active = quickFilter === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => { triggerHaptic('selection'); setQuickFilter(f.id as any); }}
                          className={`p-3 rounded-2xl flex items-center gap-2 transition-all cursor-pointer ${
                            active
                              ? 'bg-primary text-white shadow-md ring-2 ring-primary/40'
                              : 'bg-card border border-border hover:border-primary/40 text-text'
                          }`}
                        >
                          <span className="text-base">{f.icon}</span>
                          <span className="text-xs font-bold">{f.label}</span>
                          {active && <Check className="w-4 h-4 ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Categories Explorer */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black text-text-dim uppercase tracking-widest">Explore Categories</h3>
                    <button
                      onClick={() => { triggerHaptic('selection'); setSelectedIndustry('all'); }}
                      className={`text-xs font-bold px-3 py-1 rounded-full ${selectedIndustry === 'all' ? 'bg-primary/20 text-primary' : 'bg-card text-text-dim hover:text-text'}`}
                    >
                      All Categories
                    </button>
                  </div>
                  
                  {INDUSTRY_GROUPS.map((grp) => {
                    if (grp.id === 'all') return null;
                    const catsInGroup = BUSINESS_CATEGORIES.filter(c => c.industryGroup === grp.id);
                    if (catsInGroup.length === 0) return null;

                    return (
                      <div key={grp.id} className="mb-6">
                        <h4 className="text-sm font-extrabold flex items-center gap-2 mb-3 text-text">
                          <span className="text-lg">{grp.icon}</span> {grp.label}
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {catsInGroup.map((cat) => {
                            const active = selectedIndustry === cat.id;
                            return (
                              <button
                                key={cat.id}
                                onClick={() => { triggerHaptic('selection'); setSelectedIndustry(cat.id); }}
                                className={`p-3 rounded-2xl flex flex-col items-start gap-2 transition-all cursor-pointer text-left border ${
                                  active
                                    ? 'bg-primary/10 border-primary text-primary shadow-sm'
                                    : 'bg-card border-border hover:border-primary/40 text-text'
                                }`}
                              >
                                <span className="text-2xl mb-1">{cat.icon}</span>
                                <span className="text-xs font-bold leading-tight">{cat.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Action */}
              <div className="p-4 border-t border-border bg-card sticky bottom-0 z-10 pb-[max(16px,env(safe-area-inset-bottom))]">
                <button
                  onClick={() => setShowFilterSheet(false)}
                  className="w-full premium-btn premium-btn-primary py-4 text-sm"
                >
                  Apply Filters
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </ResponsiveContainer>
  );
}
