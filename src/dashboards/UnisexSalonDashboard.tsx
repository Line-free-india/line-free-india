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
  Sparkles,
  Zap,
  Star
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { useNavigate } from 'react-router-dom';

interface UnisexSalonDashboardProps {
  todayTokens: TokenEntry[];
  serving?: TokenEntry;
  waiting: TokenEntry[];
  done: TokenEntry[];
  cancelled: TokenEntry[];
}

export default function UnisexSalonDashboard({ todayTokens, serving, waiting, done, cancelled }: UnisexSalonDashboardProps) {
  const { businessProfile, toggleQueuePause, nextCustomer, updateTokenNotes } = useApp();
  const navigate = useNavigate();
  const [selectedToken, setSelectedToken] = useState<TokenEntry | null>(null);
  const [notes, setNotes] = useState('');
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);

  useTheme('unisex_salon');

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

  return (
    <div className="min-h-screen pb-40 relative w-full max-w-full overflow-x-hidden text-white font-[var(--font-space)]">
      {/* Premium animated gradient backdrop */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d0014] via-[#110033] to-[#0d0014]" />
        <motion.div
          animate={{ x: ['-30%','30%','-30%'], y: ['-20%','20%','-20%'], scale: [1,1.3,1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 left-0 w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-40"
          style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }}
        />
        <motion.div
           animate={{ x: ['30%','-30%','30%'], y: ['30%','-30%','30%'], scale: [1,1.5,1] }}
           transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
           className="absolute bottom-0 right-0 w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-30"
           style={{ background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)' }}
        />
      </div>

      <div className="p-6 relative z-10">
        <div className="flex justify-between items-center mb-4">
          <BackButton to="/barber/home" />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/barber/tv-dashboard')}
            className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-violet-300"
          >
            <Tv size={14} /> Lounge TV
          </motion.button>
        </div>

        <header className="flex justify-between items-center mt-6 mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">
              <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
                {businessProfile?.businessName?.split(' ')[0] || 'Studio'}
              </span>
              <span className="text-white"> {businessProfile?.businessName?.split(' ').slice(1).join(' ') || 'Vibe'}</span>
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-violet-300/40 text-xs font-black tracking-widest uppercase">◈ Studio Status:</span>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-widest ${isPaused ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-red-500' : 'bg-emerald-400 animate-pulse'}`} />
                {isPaused ? 'Closed' : 'Styling Now'}
              </div>
            </div>
          </div>
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="w-14 h-14 rounded-full border-2 border-violet-500/50 flex items-center justify-center text-2xl shadow-lg shadow-violet-900/50"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
          >
            ✂️
          </motion.div>
        </header>

        {/* Major Op Controls */}
        <div className="grid grid-cols-2 gap-4 mb-8">
           <motion.button
             whileTap={{ scale: 0.95 }}
             onClick={handlePause}
             className={`p-6 rounded-[32px] border flex flex-col gap-2 transition-all ${
               isPaused 
               ? 'bg-red-500/20 border-red-500/40 text-red-200' 
               : 'bg-violet-500/10 border-violet-500/20 text-violet-200 shadow-[0_0_30px_rgba(124,58,237,0.1)]'
             }`}
           >
              {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
              <div className="text-left mt-2">
                <p className="text-xs font-black uppercase tracking-widest opacity-40">Entry Gate</p>
                <p className="text-lg font-black">{isPaused ? 'Open Now' : 'Stop Entry'}</p>
              </div>
           </motion.button>

           <motion.button
             whileTap={{ scale: 0.95 }}
             onClick={handleNext}
             className="p-6 rounded-[32px] bg-gradient-to-br from-violet-600 to-pink-600 border border-white/20 text-white shadow-xl shadow-violet-900/40"
           >
              <Users size={24} />
              <div className="text-left mt-2">
                <p className="text-xs font-black uppercase tracking-widest opacity-40">Next Client</p>
                <p className="text-lg font-black">Call Queue</p>
              </div>
           </motion.button>
        </div>

        {/* Current Service */}
        <div className="mb-10">
           {serving ? (
             <motion.div 
               layoutId="serving-card-unisex"
               className="p-6 rounded-[32px] bg-white/[0.03] border border-white/10 relative overflow-hidden group hover:border-violet-500/30 transition-all"
             >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Sparkles size={80} />
                </div>
                <div className="flex justify-between items-center mb-6">
                   <div>
                     <span className="text-xs font-black text-violet-400 uppercase tracking-widest">Ongoing Style</span>
                     <h3 className="text-2xl font-black mt-1">Token #{serving.tokenNumber}</h3>
                   </div>
                   <div className="px-4 py-2 rounded-xl bg-violet-600 text-xs font-black uppercase tracking-widest shadow-lg shadow-violet-600/30">
                     In Progress
                   </div>
                </div>
                <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                   <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center text-xl">👤</div>
                   <div className="flex-1">
                      <p className="font-bold text-white">{serving.customerName}</p>
                      <p className="text-xs text-violet-300/40 font-black uppercase tracking-widest">{serving.selectedServices[0]?.name}</p>
                   </div>
                   <button onClick={() => handleOpenToken(serving)} className="p-2 bg-white/5 rounded-lg text-violet-300">
                     <MessageSquare size={16} />
                   </button>
                </div>
             </motion.div>
           ) : (
             <div className="p-10 rounded-[32px] border border-dashed border-white/10 flex flex-col items-center justify-center bg-white/[0.01]">
                <Zap size={32} className="text-white/10 mb-4" />
                <p className="text-white/20 font-black text-xs uppercase tracking-widest">No Active Styles</p>
             </div>
           )}
        </div>

        {/* Queue Board */}
        <div className="mb-12">
           <div className="flex justify-between items-center mb-6 px-1">
             <h2 className="text-sm font-black uppercase tracking-[0.2em] text-violet-400/60 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" /> 
                Upcoming Styles ({waiting.length})
             </h2>
             <button onClick={() => navigate('/barber/revenue-ops')} className="text-xs font-black uppercase tracking-widest text-pink-400/60">Revenue: ₹{done.reduce((s,t)=>s + t.totalPrice, 0)}</button>
           </div>

           <div className="space-y-4">
             {waiting.map((token) => (
                <motion.div
                  key={token.id}
                  onClick={() => handleOpenToken(token)}
                  whileTap={{ scale: 0.98 }}
                  className="p-5 bg-white/[0.02] border border-white/5 rounded-[24px] flex items-center justify-between group cursor-pointer hover:bg-violet-500/5 hover:border-violet-500/20 transition-all"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-violet-500/10 rounded-2xl border border-violet-500/10 flex items-center justify-center text-xl font-black text-violet-300 group-hover:bg-violet-500/20 transition-colors">
                      {token.tokenNumber}
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">{token.customerName}</p>
                      <p className="text-xs text-violet-300/40 font-black uppercase tracking-widest">{token.selectedServices[0]?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right mr-2">
                      <p className="text-sm font-black text-violet-400">{token.estimatedWaitMinutes}m</p>
                      <p className="text-xs text-white/10 font-black uppercase tracking-widest">Wait</p>
                    </div>
                    <ChevronRight size={18} className="text-white/10 group-hover:text-violet-400 transition-colors" />
                  </div>
                </motion.div>
             ))}

             {waiting.length === 0 && (
                <div className="py-16 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-[40px]">
                   <p className="text-white/10 font-black text-xs uppercase tracking-widest">Queue Clear</p>
                </div>
             )}
           </div>
        </div>

        <div className="text-xs font-black text-violet-300/40 uppercase tracking-widest mb-4 px-1">Studio Administration</div>
        <BusinessToolGrid />
      </div>

      {/* Client Style Modal */}
      <AnimatePresence>
        {selectedToken && (
           <div className="fixed inset-0 z-[100] flex flex-col justify-end lg:justify-center lg:items-center">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setSelectedToken(null)}
                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="relative bg-[#0d0014] border-t border-violet-500/30 lg:border border-violet-500/20 p-8 pt-10 rounded-t-[40px] lg:rounded-[40px] w-full max-w-xl shadow-[0_-20px_100px_rgba(124,58,237,0.15)]"
              >
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full lg:hidden" />
                  
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-black text-violet-400 uppercase tracking-widest">Style Portfolio</span>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-widest bg-violet-500/10 border border-violet-500/20 text-violet-200`}>
                          {selectedToken.status}
                        </span>
                      </div>
                      <h2 className="text-3xl font-black">Token #{selectedToken.tokenNumber}</h2>
                      <p className="text-white/20 font-black mt-1 uppercase tracking-widest text-xs">ID: {selectedToken.id?.slice(-8).toUpperCase()}</p>
                    </div>
                    <button onClick={() => setSelectedToken(null)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-violet-500/10 to-pink-500/5 border border-white/10 p-5 rounded-3xl flex items-center gap-5">
                       <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-3xl shadow-lg text-white">
                         👤
                       </div>
                       <div>
                         <p className="text-xl font-black uppercase text-white">{selectedToken.customerName}</p>
                         <p className="text-sm text-violet-300/40 font-medium">{selectedToken.customerPhone}</p>
                       </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Proposed Services</label>
                      <div className="grid gap-2">
                        {selectedToken.selectedServices.map((s, i) => (
                          <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                             <span className="font-black text-sm uppercase tracking-tight">{s.name}</span>
                             <div className="flex items-center gap-4 text-xs font-black text-violet-300">
                               <span>₹{s.price}</span>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                       <label className="text-xs font-black text-violet-400 uppercase tracking-[0.2em] flex items-center gap-2">
                         <MessageSquare size={14} /> Style Formulas & Notes
                       </label>
                       <textarea 
                         value={notes}
                         onChange={(e) => setNotes(e.target.value)}
                         placeholder="Color mix (6.3+9.1), hair texture notes, favorite cut style..."
                         className="w-full h-32 bg-black/40 border border-violet-500/20 rounded-2xl p-5 text-sm font-medium focus:border-violet-500/50 outline-none transition-all resize-none placeholder:text-white/10 text-white"
                       />
                       
                       <motion.button 
                         whileTap={{ scale: 0.95 }}
                         onClick={handleSaveNotes}
                         disabled={isUpdatingNotes}
                         className="w-full bg-gradient-to-r from-violet-600 to-pink-600 text-white py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 shadow-2x shadow-violet-600/20"
                       >
                          {isUpdatingNotes ? <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={18} /> Update Style File</>}
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
