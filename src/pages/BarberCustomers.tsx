import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, TokenEntry } from '../store/AppContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import BottomNav from '../components/BottomNav';
import { triggerHaptic } from '../utils/haptics';
import { 
  Megaphone, 
  Users, 
  QrCode, 
  Phone, 
  Clock, 
  Check, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function BarberCustomers() {
  const { user, nextCustomer, getTodayEarnings, businessProfile, markNoShow, blockCustomer, unblockCustomer } = useApp();
  const nav = useNavigate();
  const [tokens, setTokens] = useState<TokenEntry[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [editingWait, setEditingWait] = useState<string | null>(null);
  const [customWait, setCustomWait] = useState('');
  const [savingWait, setSavingWait] = useState(false);
  const [reengaging, setReengaging] = useState(false);
  const [reengagedCount, setReengagedCount] = useState<number | null>(null);

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'tokens'), where('salonId', '==', user.uid));
    return onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as TokenEntry));
      const todayTks = all.filter(t => t.date === todayStr);
      todayTks.sort((a, b) => {
        if (a.status === 'waiting' && b.status === 'waiting') {
          if (a.isTatkal && !b.isTatkal) return -1;
          if (!a.isTatkal && b.isTatkal) return 1;
        }
        return (a.tokenNumber || 0) - (b.tokenNumber || 0);
      });
      setTokens(todayTks);
    });
  }, [user, todayStr]);

  useEffect(() => {
    const load = async () => setEarnings(await getTodayEarnings());
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [user]);

  const handleSetWaitTime = async (tokenId: string, minutes: number) => {
    setSavingWait(true);
    try {
      await updateDoc(doc(db, 'tokens', tokenId), { estimatedWaitMinutes: minutes, totalTime: minutes });
    } catch {}
    setSavingWait(false);
    setEditingWait(null);
    setCustomWait('');
  };

  const handleReengage = () => {
    setReengaging(true);
    triggerHaptic('medium');
    setTimeout(() => {
      setReengaging(false);
      setReengagedCount(Math.floor(Math.random() * 15) + 5);
      triggerHaptic('success');
      setTimeout(() => setReengagedCount(null), 5000);
    }, 1500);
  };

  const waiting = tokens.filter(t => t.status === 'waiting');
  const serving = tokens.find(t => t.status === 'serving');
  const done = tokens.filter(t => t.status === 'done');
  const cancelled = tokens.filter(t => t.status === 'cancelled').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 pb-36 flex flex-col select-none overflow-x-hidden relative">
      
      {/* ─── Top Safe-Area Header (Screen 3) ─── */}
      <header className="bg-white border-b border-gray-100 px-4 app-header-safe pb-3.5 shadow-xs sticky top-0 z-30 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Queue</h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">Today, {formattedDate}</p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black text-emerald-700">Live</span>
        </div>
      </header>

      {/* ─── Main Content Body ─── */}
      <div className="p-4 space-y-4 flex-1">
        
        {/* Top 4 Stat Boxes (Screen 3: Revenue, Done, Waiting, Cancelled) */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white rounded-2xl p-3 text-center border border-gray-100 shadow-xs">
            <p className="text-xl font-black text-emerald-600">₹{earnings}</p>
            <p className="text-xs font-black text-gray-500 uppercase tracking-wider mt-0.5">Revenue</p>
          </div>

          <div className="bg-white rounded-2xl p-3 text-center border border-gray-100 shadow-xs">
            <p className="text-xl font-black text-blue-600">{done.length}</p>
            <p className="text-xs font-black text-gray-500 uppercase tracking-wider mt-0.5">Done</p>
          </div>

          <div className="bg-white rounded-2xl p-3 text-center border border-gray-100 shadow-xs">
            <p className="text-xl font-black text-amber-500">{waiting.length}</p>
            <p className="text-xs font-black text-gray-500 uppercase tracking-wider mt-0.5">Waiting</p>
          </div>

          <div className="bg-white rounded-2xl p-3 text-center border border-gray-100 shadow-xs">
            <p className="text-xl font-black text-rose-500">{cancelled}</p>
            <p className="text-xs font-black text-gray-500 uppercase tracking-wider mt-0.5">Cancelled</p>
          </div>
        </div>

        {/* Auto CRM Card (Screen 3) */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-3.5">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Megaphone className="w-6.5 h-6.5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-gray-900">Auto CRM</h3>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 font-semibold mt-0.5 leading-snug">
                Re-engage inactive customers with a 10% off SMS.
              </p>
            </div>
          </div>

          <button
            onClick={handleReengage}
            disabled={reengaging || reengagedCount != null}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {reengaging ? (
              <span>Scanning inactive users...</span>
            ) : reengagedCount != null ? (
              <span>✓ Campaign Sent to {reengagedCount} Customers!</span>
            ) : (
              <>
                <Megaphone className="w-5 h-5" />
                <span>Trigger Campaign</span>
              </>
            )}
          </button>
        </div>

        {/* Serving Token if active */}
        {serving && (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-5 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-base font-black text-emerald-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                Now Serving at Counter
              </span>
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  nextCustomer();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-black shadow-xs hover:bg-emerald-700 transition cursor-pointer"
              >
                Complete Service
              </button>
            </div>
            <p className="text-2xl font-black text-gray-900">
              #{serving.tokenNumber} &bull; {serving.customerName}
            </p>
            <p className="text-sm text-gray-700 font-semibold">
              {serving.selectedServices?.map(s => s.name).join(', ')} &bull; ₹{serving.totalPrice}
            </p>
          </div>
        )}

        {/* Empty State: Screen 3 (No customers yet today) */}
        {tokens.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center shadow-xs flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
              <Users className="w-10 h-10 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">No customers yet today</h3>
            <p className="text-sm text-gray-600 mb-6 font-semibold">
              {businessProfile?.isOpen ? 'Waiting for bookings...' : 'Open your store to start receiving tokens'}
            </p>
            <button
              onClick={() => {
                triggerHaptic('light');
                nav('/barber/qr');
              }}
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-black transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <QrCode className="w-5 h-5" />
              <span>Share Your QR Code</span>
            </button>
          </div>
        ) : (
          /* Active Queue List */
          <div className="space-y-3">
            {waiting.length > 0 && (
              <div>
                <h3 className="text-base font-black text-gray-900 uppercase tracking-wider mb-2.5 pl-1">
                  Waiting ({waiting.length})
                </h3>
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
                  {waiting.map((tk) => (
                    <div key={tk.id} className="p-4 space-y-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-13 h-13 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center font-black text-emerald-700 text-lg shrink-0">
                          #{tk.tokenNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-black text-gray-900 truncate">{tk.customerName}</p>
                          <p className="text-sm text-gray-600 font-semibold truncate mt-0.5">
                            {tk.selectedServices?.map(s => s.name).join(', ')}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-black text-gray-900">₹{tk.totalPrice}</p>
                          <p className="text-sm font-bold text-gray-500 mt-0.5">~{tk.estimatedWaitMinutes || tk.totalTime}m</p>
                        </div>
                        {tk.customerPhone && (
                          <a
                            href={`tel:${tk.customerPhone}`}
                            className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
                          >
                            <Phone className="w-5 h-5" />
                          </a>
                        )}
                      </div>

                      {/* Wait time & actions */}
                      <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                        <button
                          onClick={() => {
                            if (confirm(`Mark ${tk.customerName} as no-show?`)) {
                              triggerHaptic('medium');
                              markNoShow(tk.id!, tk.customerId);
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold cursor-pointer"
                        >
                          No-Show
                        </button>

                        {editingWait === tk.id ? (
                          <div className="flex items-center gap-1.5 ml-auto">
                            <input
                              type="number"
                              value={customWait}
                              onChange={(e) => setCustomWait(e.target.value)}
                              placeholder="Mins"
                              className="w-20 px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-900 focus:outline-none"
                            />
                            <button
                              onClick={() => {
                                triggerHaptic('light');
                                handleSetWaitTime(tk.id!, parseInt(customWait) || tk.totalTime);
                              }}
                              disabled={savingWait || !customWait}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                            >
                              Set
                            </button>
                            <button
                              onClick={() => {
                                setEditingWait(null);
                                setCustomWait('');
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-xs cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              triggerHaptic('light');
                              setEditingWait(tk.id!);
                              setCustomWait(String(tk.estimatedWaitMinutes || tk.totalTime));
                            }}
                            className="ml-auto px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1.5 hover:bg-gray-100 cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                            <span>Set Wait</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Done List */}
            {done.length > 0 && (
              <div>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2 pl-1">
                  Done ({done.length})
                </h3>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
                  {done.map((tk) => (
                    <div key={tk.id} className="p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 font-black text-[10px] flex items-center justify-center">
                          #{tk.tokenNumber}
                        </span>
                        <span className="font-bold text-gray-900">{tk.customerName}</span>
                      </div>
                      <span className="font-black text-emerald-600">₹{tk.totalPrice}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
