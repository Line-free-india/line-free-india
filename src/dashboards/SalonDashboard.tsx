import React, { useState } from 'react';
import { useApp, TokenEntry } from '../store/AppContext';
import { useTheme } from '../hooks/useTheme';
import { useBreakTimer } from '../hooks/useBreakTimer';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '../components/BackButton';
import BusinessToolGrid from '../components/BusinessToolGrid';
import { 
  Play, 
  Pause, 
  ChevronRight, 
  MessageSquare, 
  CheckCircle2, 
  UserPlus, 
  Tv,
  MoreVertical,
  Calendar,
  X,
  Save,
  Clock,
  Users
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { useNavigate } from 'react-router-dom';

interface SalonDashboardProps {
  todayTokens: TokenEntry[];
  serving?: TokenEntry;
  waiting: TokenEntry[];
  done: TokenEntry[];
  cancelled: TokenEntry[];
}

export default function SalonDashboard({ todayTokens, serving, waiting, done, cancelled }: SalonDashboardProps) {
  const { businessProfile, toggleQueuePause, nextCustomer, updateTokenNotes, blockCustomer } = useApp();
  const navigate = useNavigate();
  const [selectedToken, setSelectedToken] = useState<TokenEntry | null>(null);
  const [notes, setNotes] = useState('');
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);
  
  const { breakTimeRemaining, formatBreakTime, handleStartBreak, handleEndBreak } = useBreakTimer();

  useTheme('men_salon');

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

  const handleBlockAction = async () => {
    if (!selectedToken?.customerId || selectedToken.customerId === 'offline_walk_in') {
      alert("Cannot block a walk-in guest without a registered account.");
      return;
    }
    if (window.confirm(`Are you sure you want to block ${selectedToken.customerName}? They will no longer be able to book with you.`)) {
      triggerHaptic('heavy');
      await blockCustomer(selectedToken.customerId);
      alert(`${selectedToken.customerName} has been blocked.`);
      setSelectedToken(null);
    }
  };

  const isPaused = businessProfile?.isPaused;

  return (
    <div className="min-h-screen pb-40 relative w-full max-w-full overflow-x-hidden text-white font-[var(--font-space)]">
      {/* Cyberpunk Neon Aurora Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#020209]" />
        <motion.div
          animate={{ x: ['-30%','30%','-30%'], y: ['-20%','20%','-20%'], scale: [1,1.3,1] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-40"
          style={{ background: 'radial-gradient(circle, #00f0ff 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ x: ['30%','-20%','30%'], y: ['20%','-20%','20%'], scale: [1,1.5,1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] rounded-full blur-[130px] opacity-25"
          style={{ background: 'radial-gradient(circle, #ff003c 0%, transparent 70%)' }}
        />
      </div>

      <div className="p-6 relative z-10">
        <div className="flex justify-between items-center">
          <BackButton to="/barber/home" />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/barber/tv-dashboard')}
            className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-[#00F0FF]"
          >
            <Tv size={16} /> TV Mode
          </motion.button>
        </div>
        
        <header className="flex justify-between items-end mt-4 mb-10">
          <div>
            <h1 className="text-4xl font-black text-[#00F0FF] uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(0,240,255,0.8)]">
              {businessProfile?.businessName || 'Command'}
            </h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-[#888899] text-xs font-bold tracking-widest uppercase">◈ System Status:</span>
              
              {/* Shop Status */}
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-widest ${
                !businessProfile?.isOpen 
                  ? 'bg-red-500/20 text-red-500 border border-red-500/30' 
                  : businessProfile?.isBreak 
                    ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                    : 'bg-green-500/20 text-green-500 border border-green-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  !businessProfile?.isOpen 
                    ? 'bg-red-500' 
                    : businessProfile?.isBreak 
                      ? 'bg-yellow-500 animate-pulse'
                      : 'bg-green-500 animate-pulse'
                }`} />
                {!businessProfile?.isOpen ? 'Closed' : businessProfile?.isBreak ? `Break ${breakTimeRemaining > 0 ? formatBreakTime(breakTimeRemaining) : ''}` : 'Open'}
              </div>

              {/* Token Status */}
              {businessProfile?.isOpen && (
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-widest ${
                  businessProfile?.isStopped 
                    ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30'
                    : 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${businessProfile?.isStopped ? 'bg-orange-500' : 'bg-blue-500'}`} />
                  Tokens: {businessProfile?.isStopped ? 'Paused' : 'Active'}
                </div>
              )}

              {/* Queue Pause Status */}
              {isPaused && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-widest bg-purple-500/20 text-purple-500 border border-purple-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Queue Paused
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-[#00F0FF]">{waiting.length}</div>
            <div className="text-[#00F0FF] text-xs uppercase font-bold tracking-widest">Queue</div>
          </div>
        </header>

        {/* Serving Hero State */}
        <div className="mb-8">
           {serving ? (
             <motion.div 
               layoutId="serving-card"
               className="p-6 rounded-[32px] bg-gradient-to-br from-[#00F0FF]/20 to-transparent border border-[#00F0FF]/30 shadow-[0_0_40px_rgba(0,240,255,0.1)]"
             >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-xs font-black text-[#00F0FF] uppercase tracking-[0.2em]">Now Fulfilling</span>
                    <h3 className="text-3xl font-black mt-1">Token #{serving.tokenNumber}</h3>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNext}
                    className="bg-[#00F0FF] text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#00F0FF]/20"
                  >
                    Next Customer
                  </motion.button>
                </div>
                <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl">👤</div>
                  <div>
                    <p className="font-bold text-white">{serving.customerName}</p>
                    <p className="text-xs text-white/40 font-black uppercase tracking-widest">Selected: {serving.selectedServices[0]?.name}</p>
                  </div>
                </div>
             </motion.div>
           ) : (
             <div className="p-8 rounded-[32px] border border-dashed border-white/10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20 mb-4 italic font-black text-2xl">?</div>
                <p className="text-white/40 font-black text-sm uppercase tracking-widest">No active customer</p>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  className="mt-6 bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 transition-all"
                >
                  Call Next #{waiting[0]?.tokenNumber || '--'}
                </motion.button>
             </div>
           )}
        </div>

        {/* Control Strip */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handlePause}
            className={`p-5 rounded-[28px] border flex items-center justify-between transition-all ${
              isPaused 
                ? 'bg-green-500/20 border-green-500/40 text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.1)]' 
                : 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.05)]'
            }`}
          >
            <div className="text-left">
              <p className="text-xs font-black uppercase tracking-widest opacity-60">System Toggle</p>
              <p className="text-lg font-black">{isPaused ? 'Token Resume' : 'Token Pause'}</p>

            </div>
            {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/barber/revenue-ops')}
            className="p-5 rounded-[28px] bg-white/5 border border-white/10 flex items-center justify-between group hover:border-[#00F0FF]/30 transition-all"
          >
            <div className="text-left">
              <p className="text-xs font-black uppercase tracking-widest opacity-60">Revenue Flow</p>
              <p className="text-lg font-black">₹{done.reduce((s,t) => s + t.totalPrice, 0).toLocaleString()}</p>
            </div>
            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>

        {/* Break Controls */}
        <div className="mb-10">
          <h3 className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-4 flex items-center gap-2">
            <Clock size={14} />
            Break Management
          </h3>
          {businessProfile?.isBreak ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleEndBreak}
              className="w-full p-5 rounded-[28px] bg-green-500/20 border border-green-500/40 text-green-500 flex items-center justify-between shadow-[0_0_30px_rgba(34,197,94,0.1)]"
            >
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-widest opacity-60">Break Active</p>
                <p className="text-lg font-black">
                  {breakTimeRemaining > 0 ? `Ends in ${formatBreakTime(breakTimeRemaining)}` : 'End Break Now'}
                </p>
              </div>
              <Play size={24} fill="currentColor" />
            </motion.button>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleStartBreak(15)}
                className="p-4 rounded-[20px] bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20 transition-all"
              >
                <p className="text-xs font-black uppercase tracking-widest">☕ 15min</p>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleStartBreak(30)}
                className="p-4 rounded-[20px] bg-orange-500/10 border border-orange-500/30 text-orange-500 hover:bg-orange-500/20 transition-all"
              >
                <p className="text-xs font-black uppercase tracking-widest">🍝 30min</p>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleStartBreak(60)}
                className="p-4 rounded-[20px] bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 transition-all"
              >
                <p className="text-xs font-black uppercase tracking-widest">🍱 60min</p>
              </motion.button>
            </div>
          )}
        </div>

        {/* Queue List */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-bold text-[#888899] uppercase tracking-widest flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" /> 
               Waiting Queue ({waiting.length})
            </h2>
            <button className="text-xs font-black text-[#00F0FF] uppercase tracking-widest bg-[#00F0FF]/10 px-3 py-1 rounded-lg">View All</button>
          </div>
          
          <div className="space-y-4">
            {waiting.slice(0, 5).map((token) => (
              <motion.div
                key={token.id}
                onClick={() => handleOpenToken(token)}
                whileTap={{ scale: 0.98 }}
                className="p-5 bg-white/[0.03] border border-white/5 rounded-[24px] flex items-center justify-between group cursor-pointer hover:bg-white/[0.06] transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-xl font-black text-[#00F0FF] border border-white/5">
                    {token.tokenNumber}
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">{token.customerName}</p>
                    <p className="text-xs text-white/40 font-medium uppercase tracking-widest mt-0.5">
                       {token.selectedServices[0]?.name} • {token.totalTime}m
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right mr-2">
                    <p className="text-sm font-black text-[#00F0FF]">~{token.estimatedWaitMinutes}m</p>
                    <p className="text-xs text-white/20 font-bold uppercase tracking-widest">Wait</p>
                  </div>
                  <MessageSquare size={18} className={token.internalNotes ? "text-primary" : "text-white/10"} />
                </div>
              </motion.div>
            ))}

            {waiting.length === 0 && (
              <div className="py-12 text-center bg-white/[0.02] border border-dashed border-white/5 rounded-[32px]">
                 <Users size={40} className="mx-auto text-white/10 mb-4" />
                 <p className="text-white/20 font-black text-xs uppercase tracking-widest">No customers in queue</p>
              </div>
            )}
          </div>
        </div>

        <h2 className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-6 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" /> 
          Operational Grid
        </h2>
        <BusinessToolGrid />
      </div>

      {/* Token Detail Modal (Case Notes) */}
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
                className="relative bg-[#0A0A0F] border-t border-white/10 lg:border border-white/10 p-8 pt-10 rounded-t-[40px] lg:rounded-[40px] w-full max-w-xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
              >
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full lg:hidden" />
                  
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-black text-primary uppercase tracking-widest">Token Detail</span>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-widest bg-white/5 border border-white/10 ${selectedToken.status === 'serving' ? 'text-green-500' : 'text-primary'}`}>
                          {selectedToken.status}
                        </span>
                      </div>
                      <h2 className="text-3xl font-black">Token #{selectedToken.tokenNumber}</h2>
                      <p className="text-[#888899] font-bold mt-1 uppercase tracking-widest text-xs">Reference: {selectedToken.id?.slice(-8)}</p>
                    </div>
                    <button onClick={() => setSelectedToken(null)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white/[0.03] border border-white/5 p-5 rounded-3xl flex items-center justify-between group">
                       <div className="flex items-center gap-5">
                         <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-3xl shadow-inner">
                           👤
                         </div>
                         <div>
                           <p className="text-xl font-black">{selectedToken.customerName}</p>
                           <p className="text-sm text-text-dim">{selectedToken.customerPhone}</p>
                         </div>
                       </div>
                       <motion.button
                         whileTap={{ scale: 0.9 }}
                         onClick={handleBlockAction}
                         className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5 group-hover:scale-110"
                         title="Block Customer"
                       >
                         <X size={20} strokeWidth={3} />
                       </motion.button>
                    </div>

                    {/* Services */}
                    <div className="space-y-3">
                      <label className="text-xs font-black text-text-dim uppercase tracking-widest ml-1">Services Fulfilling</label>
                      <div className="grid gap-2">
                        {selectedToken.selectedServices.map((s, i) => (
                          <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                             <span className="font-bold text-sm tracking-tight">{s.name}</span>
                             <div className="flex items-center gap-4 text-xs font-black">
                               <span className="text-primary">₹{s.price}</span>
                               <span className="text-text-dim opacity-50">{s.avgTime}m</span>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CASE NOTES (Section 3 Requirement) */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                       <div className="flex items-center justify-between px-1">
                          <label className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                            <MessageSquare size={14} /> Internal Case Notes
                          </label>
                          <span className="text-xs font-bold text-text-dim/50 italic">Visible only to business</span>
                       </div>
                       <div className="relative">
                          <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add specific instructions, customer preferences, or medical history for this visit..."
                            className="w-full h-32 bg-black border border-white/10 rounded-2xl p-5 text-sm font-medium focus:border-primary/50 outline-none transition-all resize-none placeholder:text-white/10"
                          />
                          <div className="absolute bottom-4 right-4 text-xs font-black text-white/20 uppercase tracking-widest">
                            Autosaving...
                          </div>
                       </div>
                       
                       <motion.button 
                         whileTap={{ scale: 0.95 }}
                         onClick={handleSaveNotes}
                         disabled={isUpdatingNotes}
                         className="w-full bg-primary text-white py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-primary/20"
                       >
                          {isUpdatingNotes ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={20} /> Update Case File</>}
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
