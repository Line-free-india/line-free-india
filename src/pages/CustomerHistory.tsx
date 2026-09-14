import { useState, useEffect } from 'react';
import { useApp, TokenEntry } from '../store/AppContext';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import ResponsiveContainer from '../components/ResponsiveContainer';
import BackButton from '../components/BackButton';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomerHistory() {
  const { user, getCustomerFullHistory } = useApp();
  const nav = useNavigate();
  const [history, setHistory] = useState<TokenEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'done' | 'cancelled'>('all');

  useEffect(() => {
    if (!user) return;
    getCustomerFullHistory(user.uid).then(h => { setHistory(h); setLoading(false); });
  }, [user]);

  const filtered = filter === 'all' ? history : history.filter(t => t.status === filter);
  const totalSpent = history.filter(t => t.status === 'done').reduce((s, t) => s + t.totalPrice, 0);
  const totalVisits = history.filter(t => t.status === 'done').length;

  const statusColor = (status: string) => ({
    done: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    waiting: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    serving: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    cancelled: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  }[status] || '');

  const statusLabel = (status: string) => ({
    done: 'Fulfilled', waiting: 'Queued', serving: 'In Prog', cancelled: 'Aborted'
  }[status] || status);

  return (
    <ResponsiveContainer variant="customer">
      <div className="min-h-screen font-sans pb-40 relative overflow-hidden">
        {/* Time-Vault Background */}
        <div className="fixed inset-0 pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03),_transparent_80%)] pointer-events-none" />

        <div className="relative z-10 px-5 app-header-safe pb-8">
        <div className="flex justify-between items-center mb-8">
           <div className="bg-white/5 border border-white/10 p-2 rounded-2xl backdrop-blur-md">
             <BackButton to="/customer/profile" />
           </div>
           <div className="text-right">
              <p className="text-xs text-zinc-500 font-black uppercase tracking-[0.3em] font-mono leading-none">Time Vault</p>
              <p className="text-[7px] text-zinc-600 font-mono tracking-widest uppercase mt-1">Immutable Ledger</p>
           </div>
        </div>

        {/* Hero Section */}
        <div className="mb-10 text-center relative">
           <div className="inline-block relative">
             <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500 tracking-tighter mix-blend-screen drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">Archives</h1>
           </div>
        </div>

        {/* Global Stats - 100k Phase Styling */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-6 rounded-[2rem] bg-zinc-900/60 border border-white/10 backdrop-blur-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 text-7xl opacity-[0.03] group-hover:scale-110 transition-transform">🏛️</div>
            <p className="text-xs text-zinc-400 uppercase font-black tracking-[0.3em] mb-2">Total Visits</p>
            <p className="text-3xl font-black text-white">{totalVisits}</p>
          </div>
          <div className="p-6 rounded-[2rem] bg-zinc-900/60 border border-white/10 backdrop-blur-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 text-7xl opacity-[0.03] group-hover:scale-110 transition-transform">💎</div>
            <p className="text-xs text-zinc-400 uppercase font-black tracking-[0.3em] mb-2 flex items-center gap-2">Lifetime Amt</p>
            <p className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-600">₹{totalSpent.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Interactive Neural Filters */}
        <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar pb-2 px-1 snap-x">
          {(['all', 'done', 'cancelled'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} 
              className={`snap-center flex-shrink-0 px-6 py-4 rounded-3xl text-xs font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all shadow-md ${filter === f ? 'bg-white text-black scale-100 shadow-[0_10px_20px_rgba(255,255,255,0.2)]' : 'bg-white/5 border border-white/10 text-zinc-500 scale-95 hover:bg-white/10'}`}>
              {f === 'all' ? 'All Records' : f === 'done' ? 'Fulfilled' : 'Aborted'} <span className={`ml-2 px-2 py-0.5 rounded-full ${filter===f?'bg-black/20':'bg-white/10'}`}>
                {f === 'all' ? history.length : history.filter(t => t.status === f).length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 rounded-[2rem] bg-white/5 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-md">
            <div className="text-6xl mb-6 opacity-30 grayscale mix-blend-screen">📂</div>
            <p className="text-sm font-black text-zinc-400 tracking-wider">Empty Ledger</p>
            <button onClick={() => nav('/customer/search')} className="mt-6 px-8 py-3 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.2em] active:scale-95 shadow-[0_10px_30px_rgba(255,255,255,0.2)]">Establish Connection</button>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filtered.map((token, i) => (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.05 }} key={token.id || i} 
                   className="p-5 rounded-[2rem] bg-black/40 border border-white/10 backdrop-blur-xl hover:border-white/30 transition-colors group">
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="max-w-[70%]">
                      <p className="font-black text-lg text-white leading-tight">{token.salonName}</p>
                      <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mt-1">Token #{token.tokenNumber} <span className="text-zinc-700 px-1">•</span> {token.date}</p>
                    </div>
                    <span className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${statusColor(token.status)}`}>
                      {statusLabel(token.status)}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {token.selectedServices.map((s, j) => (
                      <span key={j} className="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-xl font-bold text-zinc-300 shadow-sm">{s.name}</span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <p className="text-zinc-600 font-mono text-xs uppercase tracking-widest">TTL: {token.totalTime}m</p>
                    <p className={`font-black text-xl tracking-tighter ${token.status === 'done' ? 'text-white' : 'text-zinc-600 line-through'}`}>
                      ₹{token.totalPrice.toFixed(2)}
                    </p>
                  </div>
                  
                  {/* Rating Logic */}
                  {token.status === 'done' && token.rating && (
                    <div className="flex items-center gap-1 mt-4 bg-white/5 p-2 rounded-xl inline-flex border border-white/5">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`text-sm ${s <= token.rating! ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]' : 'text-zinc-800'}`}>★</span>
                      ))}
                    </div>
                  )}

                  {/* Infinite Re-Engagement Loop */}
                  <button onClick={() => { nav(`/customer/salon/${token.salonId}`); }}
                    className="mt-5 w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all group-hover:bg-white/10 hover:shadow-lg">
                    Re-Initialize Session ↗
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        </div>
        <BottomNav />
      </div>
    </ResponsiveContainer>
  );
}
