import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useApp, TokenEntry, getCategoryInfo, BusinessCategory } from '../store/AppContext';
import BottomNav from '../components/BottomNav';
import { triggerHaptic } from '../utils/haptics';
import { announceToken } from '../services/voiceService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, 
  Bell, 
  ChevronDown, 
  Play, 
  Check, 
  Volume2, 
  Coffee, 
  Pause, 
  FileText, 
  Plus, 
  Scissors, 
  ChevronRight, 
  Radio, 
  AlertCircle,
  Users,
  CheckCircle2,
  X
} from 'lucide-react';

export default function BarberHome() {
  const {
    businessProfile,
    user,
    toggleSalonOpen,
    toggleSalonBreak,
    toggleSalonStop,
    unreadCount,
    nextCustomer,
    addWalkInCustomer,
    loading,
    lang,
  } = useApp();

  const nav = useNavigate();
  const [todayTokens, setTodayTokens] = useState<TokenEntry[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  
  // Break modal state
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakDuration, setBreakDuration] = useState(15);

  const catType = (businessProfile?.businessType as BusinessCategory) || 'mens_salon';
  const catInfo = getCategoryInfo(catType);

  const showToast = (msg: string) => {
    setToast(msg);
    triggerHaptic('light');
    setTimeout(() => setToast(null), 2500);
  };

  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'tokens'),
      where('salonId', '==', user.uid),
      where('date', '==', today)
    );
    const unsub = onSnapshot(q, (snap) => {
      const tks = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TokenEntry));
      tks.sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));
      setTodayTokens(tks);
      setEarnings(
        tks.filter((t) => t.status === 'done').reduce((a, c) => a + (c.totalPrice || 0), 0)
      );
    });
    return () => unsub();
  }, [user, today]);

  const handleStartBreak = async () => {
    if (!user) return;
    triggerHaptic('medium');
    await updateDoc(doc(db, 'barbers', user.uid), {
      isBreak: true,
      breakStartTime: Date.now(),
      breakEndTime: Date.now() + breakDuration * 60000,
    });
    showToast(`☕ Break started: ${breakDuration} min`);
    setShowBreakModal(false);
    setBreakDuration(15);
  };

  const bp = businessProfile;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!bp) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#F8FAFC] text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-3xl">
          🏪
        </div>
        <h2 className="text-xl font-bold text-gray-900">Configure Business Profile</h2>
        <p className="text-xs text-gray-500 max-w-xs">
          Set up your categories, services, and live queue settings to start issuing digital tokens.
        </p>
        <button
          onClick={() => nav('/barber/setup')}
          className="px-6 py-3 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs"
        >
          Get Started &rarr;
        </button>
      </div>
    );
  }

  const waitingCount = todayTokens.filter((t) => t.status === 'waiting').length;
  const servingToken = todayTokens.find((t) => t.status === 'serving');
  const doneCount = todayTokens.filter((t) => t.status === 'done').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 pb-36 flex flex-col select-none overflow-x-hidden relative">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold shadow-lg flex items-center gap-2"
          >
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Top Safe-Area Header ─── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 px-5 app-header-safe pb-4 shadow-xs sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 shadow-xs">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-black text-gray-900 tracking-tight leading-tight line-clamp-1">
                {bp.businessName || 'My Business'}
              </h1>
            </div>
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${bp.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              <span>{bp.isOpen ? 'Counter Active • Accepting Orders' : 'Store Closed'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              triggerHaptic('light');
              nav('/barber/notifications');
            }}
            className="relative p-3 rounded-2xl text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200/70 transition cursor-pointer active:scale-95"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>
        </div>
      </header>

      {/* ─── Main Content Body (Spacious & Clean) ─── */}
      <div className="px-5 py-6 space-y-6 max-w-xl mx-auto flex-1 w-full">
        
        {/* Card 1: Now Serving / वर्तमान टोकन */}
        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black text-gray-500 uppercase tracking-wider">
                Now Serving / वर्तमान टोकन
              </span>
            </div>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Counter Active
            </span>
          </div>

          {servingToken ? (
            <div className="text-center py-3 space-y-2">
              <p className="text-6xl font-black text-emerald-600 tracking-tight">
                #{servingToken.tokenNumber}
              </p>
              <p className="text-2xl font-black text-gray-900">
                {servingToken.customerName || 'Walk-in Customer'}
              </p>
              {servingToken.selectedServices && servingToken.selectedServices.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                  {servingToken.selectedServices.map((s) => (
                    <span key={s.name} className="px-3 py-1 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold">
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 px-4 bg-gray-50/70 rounded-2xl border border-gray-100/80">
              <p className="text-sm font-bold text-gray-600 leading-relaxed">
                No active customer at the counter. Tap below to call the next customer.
              </p>
            </div>
          )}

          {/* Call Next Button */}
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={async () => {
                triggerHaptic('medium');
                const nextWaiting = todayTokens.find((t) => t.status === 'waiting');
                await nextCustomer();
                showToast(servingToken ? 'Service Completed ✓' : 'Customer Called to Counter');
                if (nextWaiting) {
                  announceToken({
                    tokenNumber: nextWaiting.tokenNumber,
                    customerName: nextWaiting.customerName,
                    businessName: bp.businessName,
                    lang: (lang as 'en' | 'hi') || 'hi',
                  });
                }
              }}
              disabled={!servingToken && waitingCount === 0}
              className="flex-1 py-4.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white font-black text-base shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {servingToken ? (
                <>
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  <span>Complete Service</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Call Next ({waitingCount} waiting)</span>
                </>
              )}
            </button>

            {servingToken && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  announceToken({
                    tokenNumber: servingToken.tokenNumber,
                    customerName: servingToken.customerName,
                    businessName: bp.businessName,
                    lang: (lang as 'en' | 'hi') || 'hi',
                  });
                  showToast(`📢 Voice Call: Token #${servingToken.tokenNumber}`);
                }}
                className="p-4.5 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 transition cursor-pointer active:scale-95 shadow-xs"
                title="Re-announce voice call"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Card 2: 3 Metrics in a row */}
        <div className="grid grid-cols-3 gap-3.5">
          <div className="bg-white rounded-3xl p-4.5 text-center border border-gray-100 shadow-xs flex flex-col items-center justify-between min-h-[110px]">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-1">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-amber-500">{waitingCount}</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-0.5">In Queue</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4.5 text-center border border-gray-100 shadow-xs flex flex-col items-center justify-between min-h-[110px]">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600">{doneCount}</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-0.5">Served</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4.5 text-center border border-gray-100 shadow-xs flex flex-col items-center justify-between min-h-[110px]">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1 font-bold text-sm">
              ₹
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-blue-600">₹{earnings}</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-0.5">Revenue</p>
            </div>
          </div>
        </div>

        {/* Card 3: Live Queue Sheet (Single Clean Full-Width Card) */}
        <button
          onClick={() => {
            triggerHaptic('light');
            nav('/barber/customers');
          }}
          className="w-full bg-white rounded-3xl p-4.5 border border-gray-100 shadow-xs flex items-center justify-between hover:border-blue-200 transition cursor-pointer group active:scale-98"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-base font-black text-gray-900 group-hover:text-blue-600 transition">
                Live Queue Sheet & Tokens
              </p>
              <p className="text-xs font-bold text-gray-500 mt-0.5">
                {waitingCount} customers waiting • View live order
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              Manage →
            </span>
          </div>
        </button>

        {/* Card 4: 3 Dedicated Premium Control Buttons */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              Store Controls
            </h2>
            <span className="text-xs font-bold text-gray-400">Tap to Switch</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Button 1: Shop Open / Close */}
            <button
              onClick={async () => {
                triggerHaptic('medium');
                await toggleSalonOpen();
                showToast(bp.isOpen ? 'Shop Closed' : 'Shop Opened');
              }}
              className={`relative p-4 rounded-3xl border-2 text-center transition-all flex flex-col items-center justify-between gap-2.5 cursor-pointer shadow-xs active:scale-95 min-h-[115px] ${
                bp.isOpen
                  ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 border-emerald-400 text-white shadow-emerald-500/20 shadow-md'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="w-full flex items-center justify-between">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  bp.isOpen ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Store className="w-4.5 h-4.5" />
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${
                  bp.isOpen ? 'bg-white animate-pulse' : 'bg-gray-300'
                }`} />
              </div>
              <div className="text-left w-full">
                <p className={`text-xs font-black leading-tight ${bp.isOpen ? 'text-white' : 'text-gray-900'}`}>
                  {bp.isOpen ? 'Shop Open' : 'Shop Closed'}
                </p>
                <p className={`text-[10px] font-bold mt-0.5 ${bp.isOpen ? 'text-emerald-100' : 'text-gray-400'}`}>
                  {bp.isOpen ? '● Live' : '○ Closed'}
                </p>
              </div>
            </button>

            {/* Button 2: Break Time */}
            <button
              onClick={() => {
                triggerHaptic('light');
                if (bp.isBreak) {
                  toggleSalonBreak();
                  showToast('Break Ended');
                } else {
                  setShowBreakModal(true);
                }
              }}
              className={`relative p-4 rounded-3xl border-2 text-center transition-all flex flex-col items-center justify-between gap-2.5 cursor-pointer shadow-xs active:scale-95 min-h-[115px] ${
                bp.isBreak
                  ? 'bg-gradient-to-b from-amber-500 to-amber-600 border-amber-400 text-white shadow-amber-500/20 shadow-md'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="w-full flex items-center justify-between">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  bp.isBreak ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'
                }`}>
                  <Coffee className="w-4.5 h-4.5" />
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${
                  bp.isBreak ? 'bg-white animate-pulse' : 'bg-gray-300'
                }`} />
              </div>
              <div className="text-left w-full">
                <p className={`text-xs font-black leading-tight ${bp.isBreak ? 'text-white' : 'text-gray-900'}`}>
                  {bp.isBreak ? 'On Break' : 'Take Break'}
                </p>
                <p className={`text-[10px] font-bold mt-0.5 ${bp.isBreak ? 'text-amber-100' : 'text-gray-400'}`}>
                  {bp.isBreak ? '● Paused' : '15m / 30m'}
                </p>
              </div>
            </button>

            {/* Button 3: Pause Queue */}
            <button
              onClick={async () => {
                triggerHaptic('medium');
                await toggleSalonStop();
                showToast(bp.isStopped ? 'Queue Resumed' : 'Queue Paused');
              }}
              className={`relative p-4 rounded-3xl border-2 text-center transition-all flex flex-col items-center justify-between gap-2.5 cursor-pointer shadow-xs active:scale-95 min-h-[115px] ${
                bp.isStopped
                  ? 'bg-gradient-to-b from-rose-500 to-rose-600 border-rose-400 text-white shadow-rose-500/20 shadow-md'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="w-full flex items-center justify-between">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  bp.isStopped ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600'
                }`}>
                  <Pause className="w-4.5 h-4.5" />
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${
                  bp.isStopped ? 'bg-white animate-pulse' : 'bg-gray-300'
                }`} />
              </div>
              <div className="text-left w-full">
                <p className={`text-xs font-black leading-tight ${bp.isStopped ? 'text-white' : 'text-gray-900'}`}>
                  {bp.isStopped ? 'Queue Paused' : 'Pause Queue'}
                </p>
                <p className={`text-[10px] font-bold mt-0.5 ${bp.isStopped ? 'text-rose-100' : 'text-gray-400'}`}>
                  {bp.isStopped ? '● Halted' : 'Hold Line'}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Card 5: Big Premium Banner link for Salon/Barber Tools */}
        <button
          onClick={() => {
            triggerHaptic('light');
            nav('/business/tools');
          }}
          className="w-full bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/80 rounded-3xl p-5 border border-emerald-200/90 shadow-xs flex items-center justify-between hover:border-emerald-300 transition cursor-pointer text-left group active:scale-98"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20 group-hover:scale-105 transition">
              <Scissors className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-black text-gray-900 tracking-tight">
                  {catInfo.label} Tools
                </p>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  Full Suite
                </span>
              </div>
              <p className="text-xs text-gray-500 font-semibold mt-1">
                Service menu, booking calendar, team roster & promos
              </p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs group-hover:translate-x-1 transition">
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </div>
        </button>

      </div>

      {/* ─── Break Management Modal ─── */}
      <AnimatePresence>
        {showBreakModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-xl border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-gray-900 flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-500" />
                  Merchant Break
                </h3>
                <button
                  onClick={() => setShowBreakModal(false)}
                  className="text-gray-400 hover:text-gray-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Waiting customers will see that you are on a short break. You can resume anytime.
              </p>

              {/* Custom typed duration input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-700">Enter Break Duration (Minutes)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={breakDuration || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setBreakDuration(isNaN(val) ? 0 : Math.max(1, Math.min(180, val)));
                    }}
                    placeholder="e.g. 10, 20, 30"
                    className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border-2 border-gray-200 text-xl font-black text-gray-900 focus:bg-white focus:outline-none focus:border-amber-500 transition text-center"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">MINUTES</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[10, 15, 20, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setBreakDuration(mins)}
                    className={`py-2.5 rounded-xl text-xs font-black border transition cursor-pointer active:scale-95 ${
                      breakDuration === mins
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setBreakDuration(mins)}
                    className={`py-2.5 rounded-xl text-xs font-black border transition cursor-pointer active:scale-95 ${
                      breakDuration === mins
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {mins} Minutes
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleStartBreak}
                disabled={!breakDuration || breakDuration <= 0}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-base shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Coffee className="w-5 h-5 stroke-[2.5]" />
                <span>Start {breakDuration || 0} Min Break</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Bottom Navigation ─── */}
      <BottomNav />
    </div>
  );
}
