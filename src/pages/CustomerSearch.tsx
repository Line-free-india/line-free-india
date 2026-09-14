import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, getCategoryInfo, BusinessCategory } from '../store/AppContext';
import BottomNav from '../components/BottomNav';
import ResponsiveContainer from '../components/ResponsiveContainer';
import SalonsMap from '../components/SalonsMap';
import { triggerHaptic } from '../utils/haptics';
import { lookupPincode, isValidPincode } from '../utils/pincodeDirectory';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Star, 
  Heart, 
  X, 
  ChevronDown,
  ChevronRight,
  List,
  Map as MapIcon,
  SlidersHorizontal,
  Clock,
  Scissors,
  Sparkles,
  Crown,
  Flower2,
  Grid
} from 'lucide-react';

const FILTER_CATEGORIES = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'salon', label: 'Salon', icon: Scissors },
  { id: 'beauty_parlour', label: 'Beauty', icon: Sparkles },
  { id: 'bridal_studio', label: 'Bridal', icon: Crown },
  { id: 'spa_wellness', label: 'Spa', icon: Flower2 },
  { id: 'others', label: 'Others', icon: Grid },
];

const RATING_OPTIONS = ['Any', '3.5+', '4.0+', '4.5+'];
const DISTANCE_OPTIONS = [
  { label: 'Any', value: null },
  { label: 'Within 1 km', value: 1 },
  { label: 'Within 3 km', value: 3 },
  { label: 'Within 5 km', value: 5 },
  { label: 'Within 10 km', value: 10 },
];
const SORT_OPTIONS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'nearby', label: 'Nearest First' },
  { id: 'rated', label: 'Highest Rated' },
  { id: 'wait', label: 'Shortest Wait' },
];

export default function CustomerSearch() {
  const { allSalons, customerProfile, isFavorite, toggleFavorite, getUserLocation } = useApp();
  const nav = useNavigate();
  
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('Any');
  const [selectedDistance, setSelectedDistance] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('recommended');
  
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
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

  const pincodeDetails = useMemo(() => {
    const trimmed = query.trim();
    if (isValidPincode(trimmed)) {
      return lookupPincode(trimmed);
    }
    return null;
  }, [query]);

  const searchResults = useMemo(() => {
    let list = allSalons.map((s) => ({
      ...s,
      distanceKm: effectiveLoc && s.lat && s.lng ? getDistanceKm(effectiveLoc.lat, effectiveLoc.lng, s.lat, s.lng) : undefined,
    }));

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter((s) =>
        s.businessName?.toLowerCase().includes(q) ||
        s.location?.toLowerCase().includes(q) ||
        s.businessType?.toLowerCase().includes(q) ||
        s.services?.some((sv) => sv.name.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'all') {
      if (selectedCategory === 'others') {
        list = list.filter((s) => !['salon', 'beauty_parlour', 'bridal_studio', 'spa_wellness'].includes(s.businessType));
      } else {
        list = list.filter((s) => s.businessType === selectedCategory);
      }
    }

    if (selectedRating !== 'Any') {
      const minRating = parseFloat(selectedRating);
      list = list.filter((s) => (s.rating || 4.5) >= minRating);
    }

    if (selectedDistance !== null && effectiveLoc) {
      list = list.filter((s) => s.distanceKm != null && s.distanceKm <= selectedDistance);
    }

    // Sort
    if (sortBy === 'rated') {
      list.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
    } else if (sortBy === 'nearby' && effectiveLoc) {
      list.sort((a, b) => {
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    } else if (sortBy === 'wait') {
      list.sort((a, b) => {
        const waitA = Math.max(0, (a.totalTokensToday || 0) - (a.currentToken || 0));
        const waitB = Math.max(0, (b.totalTokensToday || 0) - (b.currentToken || 0));
        return waitA - waitB;
      });
    }

    return list;
  }, [allSalons, query, selectedCategory, selectedRating, selectedDistance, sortBy, userLoc]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedRating('Any');
    setSelectedDistance(null);
    setSortBy('recommended');
  };

  const hasActiveFilters = selectedCategory !== 'all' || selectedRating !== 'Any' || selectedDistance !== null || sortBy !== 'recommended';

  return (
    <ResponsiveContainer variant="customer">
      <div className="min-h-screen bg-[#F8FAFC] text-gray-900 pb-36 flex flex-col select-none overflow-x-hidden relative">
        
        {/* Top Safe-area Header (Screen 2) */}
        <header className="bg-white border-b border-gray-100 px-4 app-header-safe pb-3.5 shadow-xs">
          <div className="flex items-start justify-between mb-3.5">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Explore &amp; Discover</h1>
              <p className="text-sm text-gray-500 font-medium mt-0.5">
                Find services, stores, and more near you
              </p>
              {/* Location Selector */}
              <button 
                onClick={() => nav('/customer/profile')}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 mt-2 hover:text-emerald-800"
              >
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>{customerProfile?.location || (effectiveLoc ? 'Current Location' : 'Select Location')}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* View Mode Toggle: List / Map */}
            <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/70 shrink-0">
              <button
                onClick={() => { triggerHaptic('selection'); setViewMode('list'); }}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => { triggerHaptic('selection'); setViewMode('map'); }}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === 'map'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
                title="Map View"
              >
                <MapIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Input Bar + Filter Trigger */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, service, or area..."
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-base font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => { triggerHaptic('selection'); setShowFilterSheet(true); }}
              className={`p-3 rounded-2xl border transition-all relative flex items-center justify-center shrink-0 cursor-pointer ${
                hasActiveFilters
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-700 ring-2 ring-white" />
              )}
            </button>
          </div>

          {/* Pincode Info Badge if detected */}
          <AnimatePresence>
            {pincodeDetails && pincodeDetails.isValid && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2.5 overflow-hidden"
              >
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>PIN {pincodeDetails.pincode}: {pincodeDetails.region}, {pincodeDetails.state}</span>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-md">Verified</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category Pills (Screen 2: All, Salon, Beauty, Bridal, Spa, Others) */}
          <div className="flex gap-2.5 overflow-x-auto pt-3.5 pb-1 no-scrollbar items-center">
            {FILTER_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* ─── Main Content View ─── */}
        <div className="flex-1 p-4 space-y-4">
          {viewMode === 'map' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl overflow-hidden border border-gray-200 h-[65vh] shadow-sm bg-white"
            >
              <SalonsMap salons={searchResults} userLocation={userLoc} onSelectSalon={(s) => nav(`/customer/salon/${s.uid}`)} />
            </motion.div>
          ) : (
            <>
              {/* Section Header: Nearby Businesses + Sort Dropdown */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h2 className="text-lg font-black text-gray-900 tracking-tight">Nearby Businesses</h2>
                  <p className="text-xs text-gray-500 font-medium">
                    {searchResults.length} {searchResults.length === 1 ? 'place' : 'places'} available
                  </p>
                </div>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label="Sort businesses"
                    className="text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl px-3.5 py-2 pr-8 appearance-none focus:outline-none focus:border-emerald-500 shadow-xs cursor-pointer"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="nearby">Nearest First</option>
                    <option value="rated">Highest Rated</option>
                    <option value="wait">Shortest Wait</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Business Cards List */}
              {searchResults.length > 0 ? (
                <div className="space-y-3.5">
                  {searchResults.map((biz) => {
                    const waitingCount = Math.max(0, (biz.totalTokensToday || 0) - (biz.currentToken || 0));
                    const isFav = isFavorite(biz.uid);
                    const catInfo = getCategoryInfo(biz.businessType as BusinessCategory);
                    const initialLetter = biz.businessName ? biz.businessName.charAt(0).toUpperCase() : 'S';

                    return (
                      <motion.div
                        key={biz.uid}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => {
                          triggerHaptic('light');
                          nav(`/customer/salon/${biz.uid}`);
                        }}
                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:border-emerald-200 transition-all cursor-pointer flex flex-col gap-3.5"
                      >
                        <div className="flex items-start gap-3.5">
                          {/* Squircle Badge / Logo */}
                          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-xl shadow-xs shrink-0">
                            {biz.photoURL ? (
                              <img
                                src={biz.photoURL}
                                alt={biz.businessName}
                                className="w-full h-full object-cover rounded-2xl"
                              />
                            ) : (
                              <span>{initialLetter}</span>
                            )}
                            {/* Online green indicator */}
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-600/30" />
                          </div>

                          {/* Business Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h3 className="text-base font-black text-gray-900 truncate leading-snug">
                                {biz.businessName}
                              </h3>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerHaptic('medium');
                                  toggleFavorite(biz.uid);
                                }}
                                className="text-gray-300 hover:text-rose-500 p-1 -mr-1 -mt-1 transition"
                              >
                                <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                              </button>
                            </div>

                            <p className="text-sm text-gray-500 font-medium truncate mt-0.5">
                              {catInfo.label} &bull; {biz.location || 'Local Area'}
                            </p>

                            {/* Ratings & Distance */}
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                <span>{biz.rating ? biz.rating.toFixed(1) : '4.8'}</span>
                                <span className="text-gray-400 font-normal text-xs">(124)</span>
                              </div>
                              {biz.distanceKm != null && (
                                <>
                                  <span className="text-gray-300 text-xs">&bull;</span>
                                  <span className="text-xs font-semibold text-gray-500">
                                    {biz.distanceKm.toFixed(1)} km
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Queue Strip & Join Queue CTA */}
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${waitingCount === 0 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <span className="text-sm font-bold text-gray-800">
                              {waitingCount === 0 ? 'No Waiting Line' : `${waitingCount} in Queue`}
                            </span>
                            <span className="text-xs text-gray-400">&bull;</span>
                            <span className="text-sm text-gray-500 font-medium">
                              ~{waitingCount * 15} min
                            </span>
                          </div>

                          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-xl transition">
                            Join Queue <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-xl">
                    🔍
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">No businesses found</h3>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    We couldn't find any places matching your current filters or search term.
                  </p>
                  <button
                    onClick={resetFilters}
                    className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <BottomNav />
      </div>

      {/* ─── Search & Filters Modal Bottom Sheet (Screen 8) ─── */}
      <AnimatePresence>
        {showFilterSheet && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="w-full max-h-[85vh] sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-base font-black text-gray-900">Search &amp; Filters</h2>
                  <p className="text-xs text-gray-500 font-medium">Refine places around your location</p>
                </div>
                <button
                  onClick={() => setShowFilterSheet(false)}
                  className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Filter Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
                
                {/* 1. Categories */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {FILTER_CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => { triggerHaptic('selection'); setSelectedCategory(cat.id); }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Rating */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                    Minimum Rating
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {RATING_OPTIONS.map((rate) => {
                      const isSelected = selectedRating === rate;
                      return (
                        <button
                          key={rate}
                          onClick={() => { triggerHaptic('selection'); setSelectedRating(rate); }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {rate !== 'Any' && <Star className="w-3 h-3 fill-amber-300 text-amber-300" />}
                          <span>{rate === 'Any' ? 'Any Rating' : `${rate} Stars`}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Distance */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                    Maximum Distance
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DISTANCE_OPTIONS.map((d) => {
                      const isSelected = selectedDistance === d.value;
                      return (
                        <button
                          key={d.label}
                          onClick={() => { triggerHaptic('selection'); setSelectedDistance(d.value); }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Sort By */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                    Sort By
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SORT_OPTIONS.map((s) => {
                      const isSelected = sortBy === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => { triggerHaptic('selection'); setSortBy(s.id); }}
                          className={`p-2.5 rounded-xl text-xs font-semibold text-center transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Action Buttons (Clear All & Apply Filters) */}
              <div className="p-4 border-t border-gray-100 bg-white flex items-center gap-3 pb-[max(16px,env(safe-area-inset-bottom,16px))]">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    resetFilters();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50 transition"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    setShowFilterSheet(false);
                  }}
                  className="flex-2 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-xs transition"
                >
                  Apply Filters ({searchResults.length})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ResponsiveContainer>
  );
}
