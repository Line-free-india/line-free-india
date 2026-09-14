import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useApp, getCategoryInfo } from '../store/AppContext';
import type { TokenEntry } from '../store/AppContext';
import BottomNav from '../components/BottomNav';
import ResponsiveContainer from '../components/ResponsiveContainer';
import TokenCard from '../components/TokenCard';
import { triggerHaptic } from '../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ticket, 
  ClipboardList, 
  Lightbulb, 
  Heart, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Pause, 
  Play, 
  Send, 
  Eye,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

type LiveToken = TokenEntry & {
  livePos: number;
  liveWait: number;
  liveServing: number | null;
  peopleAhead: number;
  appAhead: number;
  walkinAhead: number;
};

export default function CustomerTokens() {
  const { user, getCustomerTokens, cancelToken, pauseToken, resumeToken, transferToken, allSalons } = useApp();
  const nav = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'past'>('active');
  const [baseTokens, setBaseTokens] = useState<TokenEntry[]>([]);
  const [liveData, setLiveData] = useState<Map<string, LiveToken>>(new Map());
  const [loading, setLoading] = useState(true);
  const salonUnsubs = useRef<Map<string, () => void>>(new Map());

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  const [showTransferModal, setShowTransferModal] = useState<{ isOpen: boolean; token: TokenEntry | null }>({ isOpen: false, token: null });
  const [transferPhone, setTransferPhone] = useState('');
  const [transferName, setTransferName] = useState('');
  const [showCardId, setShowCardId] = useState<string | null>(null);

  // Hold timers
  const [holdTimers, setHoldTimers] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getCustomerTokens(user.uid).then(tokens => {
      setBaseTokens(tokens.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    const active = baseTokens.filter(t => t.status === 'waiting' || t.status === 'serving');

    salonUnsubs.current.forEach((unsub, sid) => {
      if (!active.find(t => t.salonId === sid)) { unsub(); salonUnsubs.current.delete(sid); }
    });

    active.forEach(myToken => {
      if (salonUnsubs.current.has(myToken.salonId)) return;
      const q = query(collection(db, 'tokens'), where('salonId', '==', myToken.salonId), where('date', '==', myToken.date));
      const unsub = onSnapshot(q, snap => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as TokenEntry));

        setBaseTokens(prev => prev.map(t => {
          const updated = all.find(a => a.id === t.id);
          return updated ? { ...t, status: updated.status, isPaused: updated.isPaused, transferredTo: updated.transferredTo } : t;
        }));

        const serving = all.find(t => t.status === 'serving');
        const waitingBefore = all.filter(t => {
          if (t.status !== 'waiting') return false;
          if (t.id === myToken.id) return false;
          if (t.isTatkal && !myToken.isTatkal) return true;
          if (!t.isTatkal && myToken.isTatkal) return false;
          return t.tokenNumber < myToken.tokenNumber;
        });
        const pos = waitingBefore.length + 1;
        const wait = waitingBefore.reduce((s, t) => s + (t.totalTime * (t.groupSize || 1)), 0);
        const peopleAhead = waitingBefore.reduce((sum, t) => sum + (t.groupSize || 1), 0);
        const appAhead = waitingBefore.filter(t => t.customerId !== 'offline_walk_in').reduce((sum, t) => sum + (t.groupSize || 1), 0);
        const walkinAhead = waitingBefore.filter(t => t.customerId === 'offline_walk_in').reduce((sum, t) => sum + (t.groupSize || 1), 0);

        setLiveData(prev => {
          const next = new Map(prev);
          next.set(myToken.id!, { ...myToken, livePos: pos, liveWait: wait, liveServing: serving?.tokenNumber ?? null, peopleAhead, appAhead, walkinAhead });
          return next;
        });
      });
      salonUnsubs.current.set(myToken.salonId, unsub);
    });

    return () => {};
  }, [baseTokens, allSalons]);

  useEffect(() => () => { salonUnsubs.current.forEach(u => u()); }, []);

  // Timer effect for hold
  useEffect(() => {
    const interval = setInterval(() => {
      setBaseTokens(prev => {
        let changed = false;
        const newTokens = prev.map(t => {
          if (t.isPaused && t.status === 'waiting') {
            const pausedAt = (t as any).pausedAt || Date.now();
            const holdExpiry = pausedAt + 10 * 60 * 1000;
            const remaining = Math.max(0, Math.floor((holdExpiry - Date.now()) / 1000));
            setHoldTimers(ht => ({ ...ht, [t.id!]: remaining }));
            if (remaining === 0) {
              resumeToken(t.id!);
              changed = true;
              return { ...t, isPaused: false };
            }
          }
          return t;
        });
        return changed ? newTokens : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCancel = (token: TokenEntry) => {
    const tatkalWarning = token.isTatkal ? '\n\n⚠️ Note: The Tatkal Priority fee is non-refundable.' : '';
    setShowConfirmModal({
      isOpen: true,
      title: 'Cancel Booking',
      message: `Are you sure you want to cancel your booking at ${token.salonName}?${tatkalWarning}`,
      onConfirm: async () => {
        await cancelToken(token.id!);
        setBaseTokens(prev => prev.map(t => t.id === token.id ? { ...t, status: 'cancelled' } : t));
        setShowConfirmModal(null);
      }
    });
  };

  const handlePauseToggle = (token: TokenEntry) => {
    if (token.isPaused) {
      setShowConfirmModal({
        isOpen: true,
        title: 'Resume Queue',
        message: 'Resume your place in the queue?',
        onConfirm: async () => {
          await resumeToken(token.id!);
          setBaseTokens(prev => prev.map(t => t.id === token.id ? { ...t, isPaused: false } : t));
          setShowConfirmModal(null);
        }
      });
    } else {
      setShowConfirmModal({
        isOpen: true,
        title: 'Hold Spot',
        message: 'Hold your spot for up to 10 minutes? You will not lose your place but others may pass you temporarily.',
        onConfirm: async () => {
          await pauseToken(token.id!);
          setBaseTokens(prev => prev.map(t => t.id === token.id ? { ...t, isPaused: true, pausedAt: Date.now() } : t));
          setShowConfirmModal(null);
        }
      });
    }
  };

  const submitTransfer = async () => {
    const token = showTransferModal.token;
    if (!token || !transferPhone || !transferName) return;
    
    setShowTransferModal({ isOpen: false, token: null });
    setShowConfirmModal({
      isOpen: true,
      title: 'Confirm Transfer',
      message: `Are you sure you want to transfer Token #${token.tokenNumber} to ${transferName} (${transferPhone})?`,
      onConfirm: async () => {
        await transferToken(token.id!, transferPhone, transferName);
        setShowConfirmModal(null);
        setTransferName('');
        setTransferPhone('');
      }
    });
  };

  const active = baseTokens.filter(t => t.status === 'waiting' || t.status === 'serving');
  const past = baseTokens.filter(t => t.status === 'done' || t.status === 'cancelled');

  const formatWait = (min: number) => {
    if (min <= 0) return 'Any moment!';
    if (min >= 60) return `${Math.floor(min/60)}h ${min%60}m`;
    return `${min} min`;
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <ResponsiveContainer variant="customer">
      <div className="min-h-screen bg-[#F8FAFC] text-gray-900 pb-36 flex flex-col select-none overflow-x-hidden relative">
        
        {/* Top Safe-area Header (Screen 3 & Screen 4) */}
        <header className="bg-white border-b border-gray-100 px-4 app-header-safe pb-3.5 shadow-xs sticky top-0 z-30">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                {activeTab === 'upcoming' ? 'My Activity' : 'My Tokens'}
              </h1>
              <p className="text-sm text-gray-500 font-medium mt-0.5">
                Real-time queue tracking &amp; history
              </p>
            </div>

            {/* Live Indicator */}
            {active.length > 0 && (
              <span className="flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Active</span>
              </span>
            )}
          </div>

          {/* Segmented Control Tabs */}
          <div className="flex bg-gray-100 p-1.5 rounded-2xl">
            <button
              onClick={() => { triggerHaptic('selection'); setActiveTab('active'); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Active ({active.length})
            </button>
            <button
              onClick={() => { triggerHaptic('selection'); setActiveTab('upcoming'); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Upcoming (0)
            </button>
            <button
              onClick={() => { triggerHaptic('selection'); setActiveTab('past'); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'past'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Past ({past.length})
            </button>
          </div>
        </header>

        {/* ─── Main Content Body ─── */}
        <div className="flex-1 p-4 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-44 rounded-2xl bg-white border border-gray-100 animate-pulse p-4 shadow-xs" />
              ))}
            </div>
          ) : (
            <>
              {/* TAB 1: ACTIVE */}
              {activeTab === 'active' && (
                <>
                  {active.length === 0 ? (
                    // Screen 4 Empty State
                    <div className="space-y-4 pt-2">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl border border-gray-100 p-8 text-center shadow-xs flex flex-col items-center"
                      >
                        {/* Ticket Illustration */}
                        <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 text-emerald-600">
                          <Ticket className="w-10 h-10 stroke-[1.5]" />
                        </div>
                        <h2 className="text-base font-black text-gray-900 mb-1">No active tokens</h2>
                        <p className="text-xs text-gray-500 max-w-xs mb-6 font-medium leading-relaxed">
                          You don't have any active queue tokens right now. Find a business to get started.
                        </p>
                        <button
                          onClick={() => {
                            triggerHaptic('medium');
                            nav('/customer/search');
                          }}
                          className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                        >
                          Explore &amp; Join Queue
                        </button>
                      </motion.div>

                      {/* Screen 4 Bottom Tip: "Your time matters" */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-4 rounded-2xl bg-[#FFF1F2] border border-rose-100 flex items-start gap-3 shadow-xs"
                      >
                        <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
                          <Heart className="w-4 h-4 fill-white" />
                        </div>
                        <div>
                          <h3 className="text-xs font-black text-rose-900">Your time matters</h3>
                          <p className="text-xs text-rose-700/90 font-medium mt-0.5 leading-snug">
                            Track your position in real-time and get notified when it's your turn so you never wait standing.
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  ) : (
                    // Live Active Token Cards
                    <div className="space-y-4">
                      {active.map(token => {
                        const live = liveData.get(token.id!);
                        const isServing = token.status === 'serving';
                        const business = allSalons.find(s => s.uid === token.salonId);
                        const termInfo = getCategoryInfo(business?.businessType || 'salon');

                        return (
                          <motion.div
                            key={token.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-3xl bg-white border ${
                              isServing ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-gray-100'
                            } shadow-xs overflow-hidden`}
                          >
                            {/* Top Status Strip */}
                            <div className={`py-2.5 px-4 flex items-center justify-between ${
                              isServing ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800'
                            }`}>
                              <span className="text-sm font-bold flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${isServing ? 'bg-white animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
                                {isServing ? "It's YOUR Turn! Check-in Now" : 'Waiting in Queue'}
                              </span>
                              <span className="text-sm font-black tracking-wider uppercase">
                                Token #{token.tokenNumber}
                              </span>
                            </div>

                            <div className="p-4 space-y-4">
                              {/* Venue details */}
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="text-lg font-black text-gray-900 leading-tight">
                                    {token.salonName}
                                  </h3>
                                  <p className="text-sm text-gray-500 font-medium mt-0.5">
                                    {termInfo.label} &bull; {token.date}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-bold text-gray-400 block">Total</span>
                                  <span className="text-lg font-black text-gray-900">₹{token.totalPrice}</span>
                                </div>
                              </div>

                              {/* Live Metrics Box */}
                              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-around text-center">
                                <div>
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Position</p>
                                  <p className="text-2xl font-black text-emerald-600">
                                    #{live?.livePos ?? 1}
                                  </p>
                                </div>
                                <div className="w-px h-9 bg-gray-200" />
                                <div>
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ahead</p>
                                  <p className="text-2xl font-black text-gray-800">
                                    {live?.peopleAhead ?? 0}
                                  </p>
                                </div>
                                <div className="w-px h-9 bg-gray-200" />
                                <div>
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Est. Wait</p>
                                  <p className="text-2xl font-black text-gray-900">
                                    {formatWait(token.isPaused ? 0 : (live?.liveWait ?? 0))}
                                  </p>
                                </div>
                              </div>

                              {/* Pause / Transfer / Cancel Controls */}
                              <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                                <button
                                  onClick={() => handlePauseToggle(token)}
                                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                                    token.isPaused
                                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  {token.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                                  <span>{token.isPaused ? 'Resume' : 'Hold Spot'}</span>
                                </button>

                                <button
                                  onClick={() => setShowTransferModal({ isOpen: true, token })}
                                  className="flex-1 py-2.5 px-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                                >
                                  <Send className="w-4 h-4" />
                                  <span>Transfer</span>
                                </button>

                                <button
                                  onClick={() => setShowCardId(token.id!)}
                                  className="py-2.5 px-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>Ticket</span>
                                </button>

                                <button
                                  onClick={() => handleCancel(token)}
                                  className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                                  title="Cancel token"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: UPCOMING / TODAY ACTIVITY (Screen 3) */}
              {activeTab === 'upcoming' && (
                <div className="space-y-4 pt-2">
                  {/* Empty state (Screen 3) */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border border-gray-100 p-8 text-center shadow-xs flex flex-col items-center"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 text-emerald-600">
                      <ClipboardList className="w-10 h-10 stroke-[1.5]" />
                    </div>
                    <h2 className="text-base font-black text-gray-900 mb-1">No activity today</h2>
                    <p className="text-xs text-gray-500 max-w-xs mb-6 font-medium leading-relaxed">
                      You have not joined any queue or made a booking yet.
                    </p>
                    <button
                      onClick={() => {
                        triggerHaptic('medium');
                        nav('/customer/search');
                      }}
                      className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      Explore Businesses
                    </button>
                  </motion.div>

                  {/* Screen 3 Pro Tip card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 rounded-2xl bg-[#FEF9C3] border border-amber-200/80 flex items-start gap-3 shadow-xs"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-amber-950 shrink-0 mt-0.5 shadow-xs">
                      <Lightbulb className="w-4 h-4 fill-amber-950" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-amber-950">Pro Tip</h3>
                      <p className="text-xs text-amber-900/90 font-medium mt-0.5 leading-snug">
                        Join a queue before leaving home to cut down on waiting time at the store!
                      </p>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* TAB 3: PAST */}
              {activeTab === 'past' && (
                <div className="space-y-3">
                  {past.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center shadow-xs">
                      <p className="text-gray-400 text-3xl mb-2">📜</p>
                      <h3 className="font-bold text-gray-900 text-sm">No past history</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Completed and cancelled bookings will be logged here.
                      </p>
                    </div>
                  ) : (
                    past.map((token) => (
                      <div
                        key={token.id}
                        className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex items-center justify-between"
                      >
                        <div>
                          <h4 className="text-sm font-black text-gray-900">{token.salonName}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {token.date} &bull; Token #{token.tokenNumber}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {token.selectedServices?.map((s, i) => (
                              <span key={i} className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                                {s.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md mb-1 ${
                            token.status === 'done'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-600'
                          }`}>
                            {token.status === 'done' ? 'Completed' : 'Cancelled'}
                          </span>
                          <p className="text-xs font-bold text-gray-900">₹{token.totalPrice}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <BottomNav />
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-5 w-full max-w-sm border border-gray-100 shadow-xl"
            >
              <h3 className="text-base font-black text-gray-900 mb-1">{showConfirmModal.title}</h3>
              <p className="text-xs text-gray-600 mb-5 leading-relaxed">{showConfirmModal.message}</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowConfirmModal(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-xs font-bold text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={showConfirmModal.onConfirm}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transfer Modal */}
      <AnimatePresence>
        {showTransferModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-5 w-full max-w-sm border border-gray-100 shadow-xl"
            >
              <h3 className="text-base font-black text-gray-900 mb-1">Transfer Token</h3>
              <p className="text-xs text-gray-500 mb-4">Enter recipient's name and mobile number.</p>
              <input
                type="text"
                placeholder="Full Name"
                value={transferName}
                onChange={(e) => setTransferName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 mb-2.5 focus:outline-none focus:border-emerald-500"
              />
              <input
                type="tel"
                placeholder="10-digit Phone Number"
                value={transferPhone}
                onChange={(e) => setTransferPhone(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 mb-5 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowTransferModal({ isOpen: false, token: null })}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-xs font-bold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={submitTransfer}
                  disabled={!transferPhone || !transferName}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-40"
                >
                  Transfer Token
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ticket Modal */}
      <AnimatePresence>
        {showCardId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="relative w-full max-w-xs">
              {(() => {
                const token = active.find((t) => t.id === showCardId);
                if (!token) return null;
                const live = liveData.get(token.id!);
                const biz = allSalons.find((s) => s.uid === token.salonId);
                return (
                  <TokenCard
                    token={token}
                    livePos={live?.livePos}
                    liveWait={live?.liveWait}
                    businessType={biz?.businessType}
                  />
                );
              })()}
              <button
                onClick={() => setShowCardId(null)}
                className="w-full mt-3 py-2 rounded-xl bg-white text-gray-800 text-xs font-bold shadow-md text-center"
              >
                Close Ticket ✕
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </ResponsiveContainer>
  );
}
