import React, { useState } from 'react';
import { useApp, TokenEntry } from '../store/AppContext';
import { useTheme } from '../hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '../components/BackButton';
import BusinessToolGrid from '../components/BusinessToolGrid';
import { 
  Play, 
  Pause, 
  ChevronRight, 
  MessageSquare, 
  Tv,
  X,
  Save,
  Users,
  Dumbbell,
  Zap,
  TrendingUp,
  Flame
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { useNavigate } from 'react-router-dom';

interface GymDashboardProps {
  todayTokens: TokenEntry[];
  serving?: TokenEntry;
  waiting: TokenEntry[];
  done: TokenEntry[];
  cancelled: TokenEntry[];
}

export default function GymDashboard({ todayTokens, serving, waiting, done, cancelled }: GymDashboardProps) {
  const { businessProfile, toggleQueuePause, nextCustomer, updateTokenNotes } = useApp();
  const navigate = useNavigate();
  const [selectedToken, setSelectedToken] = useState<TokenEntry | null>(null);
  const [notes, setNotes] = useState('');
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);

  useTheme('gym');

  const handlePause = async () => {
    triggerHaptic('heavy');
    await toggleQueuePause(!businessProfile?.isPaused);
  };

  const handleNext = async () => {
    triggerHaptic('medium');
    await nextCustomer();
  };

  const handleOpenToken = (t: TokenEntry) => {
    setSelectedToken(t);
    setNotes(t.internalNotes || '');
  };

  const handleSaveNotes = async () => {
    if (!selectedToken?.id) return;
    setIsUpdatingNotes(true);
    await updateTokenNotes(selectedToken.id, notes);
    setIsUpdatingNotes(false);
    setSelectedToken(null);
  };

  const isPaused = businessProfile?.isPaused;
  const totalSlots = 50; // Dynamic based on business settings?
  const capacityPct = Math.min(100, Math.round(((serving ? 1 : 0) + waiting.length) / totalSlots * 100));

  return (
    <div className="min-h-screen pb-40 relative w-full max-w-full overflow-x-hidden font-[var(--font-space)] text-white">
      {/* Forge — Aggressive Red & Black Aurora */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#080408]" />
        <motion.div
          animate={{ x:['-20%','20%','-20%'], scale:[1,1.4,1] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[110px] opacity-60"
          style={{ background: 'radial-gradient(circle, #dc2626 0%, transparent 70%)' }}
        />
        <motion.div
           animate={{ x:['20%','-20%','20%'], scale:[1,1.5,1] }}
           transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
           className="absolute bottom-0 right-0 w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-40"
           style={{ background: 'radial-gradient(circle, #7c2d12 0%, transparent 70%)' }}
        />
      </div>

      <div className="p-6 relative z-10">
        <div className="flex justify-between items-center mb-4">
          <BackButton to="/barber/home" />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/barber/tv-dashboard')}
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-red-400"
          >
            <Tv size={14} /> Arena TV
          </motion.button>
        </div>

        <header className="flex justify-between items-end mt-4 mb-10">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter leading-none drop-shadow-[0_0_20px_rgba(220,38,38,0.7)]">
              {businessProfile?.businessName || 'THE FORGE'}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-red-400/40 text-xs font-black tracking-widest uppercase">◈ Sector Status:</span>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-widest ${isPaused ? 'bg-zinc-800 text-zinc-400 border border-white/5' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-zinc-500' : 'bg-red-500 animate-pulse'}`} />
                {isPaused ? 'Entry Locked' : 'Forge Active'}
              </div>
            </div>
          </div>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-2xl shadow-red-900/60"
            style={{ background: 'linear-gradient(135deg, #7f1d1d, #dc2626)' }}
          >
            💪
          </motion.div>
        </header>

        {/* Capacity Pulse Monitor */}
        <div className="mb-8 p-5 rounded-3xl relative overflow-hidden"
          style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.2)' }}
        >
          <div className="flex justify-between items-center mb-5">
            <div className="text-xs font-black text-red-400/60 uppercase tracking-widest">Live Capacity</div>
            <div className="flex items-center gap-2">
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                className="w-3 h-3 rounded-full bg-red-500"
              />
              <span className="text-red-400 font-black text-sm">{capacityPct}%</span>
            </div>
          </div>
          <div className="w-full h-4 rounded-full overflow-hidden mb-6"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${capacityPct}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #7f1d1d, #dc2626, #ef4444)' }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { zone: 'Weights', val: waiting.length + (serving ? 1 : 0), icon: <Dumbbell size={14} /> },
              { zone: 'Completed', val: done.length, icon: <Zap size={14} /> },
              { zone: 'Revenue', val: `₹${done.reduce((s,t)=>s + t.totalPrice, 0)}`, icon: <TrendingUp size={14} /> },
            ].map(z => (
              <div key={z.zone} className="rounded-2xl p-3 bg-white/[0.03] border border-white/5">
                <div className="text-red-500 mb-2">{z.icon}</div>
                <div className="text-sm font-black">{z.val}</div>
                <div className="text-xs uppercase font-bold text-red-400/40 tracking-widest">{z.zone}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Entry Control */}
        <div className="mb-10 grid grid-cols-2 gap-4">
           <motion.button 
             whileTap={{ scale: 0.95 }}
             onClick={handlePause}
             className={`p-6 rounded-[32px] border flex flex-col gap-2 transition-all ${
               isPaused 
               ? 'bg-zinc-800 border-white/10 text-zinc-400' 
               : 'bg-red-500/10 border-red-500/30 text-red-200'
             }`}
           >
              {isPaused ? <Play size={24} /> : <Pause size={24} />}
              <div className="text-left mt-2">
                <p className="text-xs font-black uppercase tracking-widest opacity-40">Entry Flow</p>
                <p className="text-lg font-black">{isPaused ? 'Resume' : 'Lock Entry'}</p>
              </div>
           </motion.button>

           <motion.button 
             whileTap={{ scale: 0.95 }}
             onClick={handleNext}
             className="p-6 rounded-[32px] bg-red-600 border border-red-400/30 text-white shadow-lg shadow-red-600/20"
           >
              <Users size={24} />
              <div className="text-left mt-2">
                <p className="text-xs font-black uppercase tracking-widest opacity-40">Next Member</p>
                <p className="text-lg font-black">Call Queue</p>
              </div>
           </motion.button>
        </div>

        {/* Member Queue */}
        <div className="mb-12">
           <div className="flex justify-between items-center mb-6 px-1">
             <h2 className="text-sm font-black uppercase tracking-[0.2em] text-red-500/60 flex items-center gap-2">
                <Flame size={14} /> Entry Queue ({waiting.length})
             </h2>
             <button onClick={() => navigate('/barber/revenue-ops')} className="text-xs font-black uppercase tracking-widest text-white/30 hover:text-red-400">View All Logs</button>
           </div>

           <div className="space-y-4">
             {serving && (
               <motion.div
                 layoutId="serving-gym"
                 onClick={() => handleOpenToken(serving)}
                 className="p-5 bg-red-500/20 border border-red-500/40 rounded-[24px] flex items-center justify-between"
               >
                 <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-xl font-black text-white">
                     #{serving.tokenNumber}
                   </div>
                   <div>
                     <p className="font-black text-white text-lg">SERVING: {serving.customerName}</p>
                     <p className="text-xs text-red-400 font-black uppercase tracking-widest">{serving.selectedServices[0]?.name}</p>
                   </div>
                 </div>
                 <ActivityIndicator />
               </motion.div>
             )}

             {waiting.map((token) => (
               <motion.div
                 key={token.id}
                 onClick={() => handleOpenToken(token)}
                 whileTap={{ scale: 0.98 }}
                 className="p-5 bg-white/[0.03] border border-white/5 rounded-[24px] flex items-center justify-between group cursor-pointer hover:border-red-500/20 transition-all"
               >
                 <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-xl font-black text-red-500 group-hover:bg-red-500/10 transition-colors">
                     {token.tokenNumber}
                   </div>
                   <div>
                     <p className="font-bold text-white text-lg">{token.customerName}</p>
                     <p className="text-xs text-white/20 font-black uppercase tracking-widest">{token.selectedServices[0]?.name}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-4">
                   <div className="text-right">
                     <p className="text-sm font-black text-red-400">{token.estimatedWaitMinutes}m</p>
                     <p className="text-xs text-white/10 font-black uppercase tracking-widest">Wait</p>
                   </div>
                   <MessageSquare size={16} className={token.internalNotes ? "text-red-500" : "text-white/5"} />
                 </div>
               </motion.div>
             ))}

             {waiting.length === 0 && !serving && (
                <div className="py-20 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-[40px]">
                   <Users size={32} className="mx-auto text-white/5 mb-4" />
                   <p className="text-white/20 font-black text-xs uppercase tracking-[0.2em]">All Members Processed</p>
                </div>
             )}
           </div>
        </div>

        <div className="text-xs font-black text-red-400/50 uppercase tracking-widest mb-4">Forge Operations</div>
        <BusinessToolGrid />
      </div>

      {/* Member Details Modal */}
      <AnimatePresence>
        {selectedToken && (
           <div className="fixed inset-0 z-[100] flex flex-col justify-end lg:justify-center lg:items-center">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setSelectedToken(null)}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="relative bg-[#0d040d] border-t border-red-500/30 lg:border border-red-500/20 p-8 pt-10 rounded-t-[40px] lg:rounded-[40px] w-full max-w-xl"
              >
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full lg:hidden" />
                  
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-black text-red-500 uppercase tracking-widest">Member Log</span>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 text-red-200`}>
                          {selectedToken.status}
                        </span>
                      </div>
                      <h2 className="text-3xl font-black uppercase tracking-tighter">Member #{selectedToken.tokenNumber}</h2>
                      <p className="text-white/20 font-black mt-1 uppercase tracking-widest text-xs">ID: {selectedToken.id?.slice(-8).toUpperCase()}</p>
                    </div>
                    <button onClick={() => setSelectedToken(null)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-3xl flex items-center gap-5">
                       <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-3xl shadow-lg">
                         👤
                       </div>
                       <div>
                         <p className="text-xl font-black uppercase">{selectedToken.customerName}</p>
                         <p className="text-sm text-white/40 font-medium">{selectedToken.customerPhone}</p>
                       </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Training Selection</label>
                      <div className="grid gap-2">
                        {selectedToken.selectedServices.map((s, i) => (
                          <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                             <span className="font-black text-sm uppercase tracking-tight">{s.name}</span>
                             <div className="flex items-center gap-4 text-xs font-black text-red-400">
                               <span>₹{s.price}</span>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                       <label className="text-xs font-black text-red-500 uppercase tracking-[0.2em] flex items-center gap-2">
                         <MessageSquare size={14} /> Member File (Stats & PRs)
                       </label>
                       <textarea 
                         value={notes}
                         onChange={(e) => setNotes(e.target.value)}
                         placeholder="Current PRs, workout focus, medical history or membership status..."
                         className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-medium focus:border-red-500/50 outline-none transition-all resize-none placeholder:text-white/10 text-white"
                       />
                       
                       <motion.button 
                         whileTap={{ scale: 0.95 }}
                         onClick={handleSaveNotes}
                         disabled={isUpdatingNotes}
                         className="w-full bg-red-600 text-white py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 shadow-2x-red shadow-red-600/20"
                       >
                          {isUpdatingNotes ? <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={18} /> Update Training Log</>}
                       </motion.button>
                    </div>
                  </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function ActivityIndicator() {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map(i => (
        <motion.div
          key={i}
          animate={{ scaleY: [1, 2, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
          className="w-1 h-3 bg-white/50 rounded-full"
        />
      ))}
    </div>
  );
}
