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
  Stethoscope,
  Activity,
  UserCheck
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { useNavigate } from 'react-router-dom';

interface ClinicDashboardProps {
  todayTokens: TokenEntry[];
  serving?: TokenEntry;
  waiting: TokenEntry[];
  done: TokenEntry[];
  cancelled: TokenEntry[];
}

export default function ClinicDashboard({ todayTokens, serving, waiting, done, cancelled }: ClinicDashboardProps) {
  const { businessProfile, toggleQueuePause, nextCustomer, updateTokenNotes } = useApp();
  const navigate = useNavigate();
  const [selectedToken, setSelectedToken] = useState<TokenEntry | null>(null);
  const [notes, setNotes] = useState('');
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);

  useTheme('clinic');

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
    <div className="min-h-screen pb-40 relative w-full max-w-full overflow-x-hidden font-[var(--font-sans)] text-teal-50">
      {/* Medical Teal Aurora */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#001a1a] via-[#001f1c] to-[#001015]" />
        <motion.div
          animate={{ x:['-25%','25%','-25%'], y:['-20%','20%','-20%'], scale:[1,1.35,1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-45"
          style={{ background: 'radial-gradient(circle, #0d9488 0%, transparent 70%)' }}
        />
      </div>

      <div className="p-6 relative z-10">
        <div className="flex justify-between items-center">
          <BackButton to="/barber/home" />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/barber/tv-dashboard')}
            className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-teal-400"
          >
            <Tv size={14} /> Clinic TV
          </motion.button>
        </div>

        <header className="flex justify-between items-center mt-6 mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight drop-shadow-[0_0_20px_rgba(13,148,136,0.6)]">
              {businessProfile?.businessName || 'Medical Center'}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-teal-400/50 text-xs font-bold tracking-widest uppercase">◈ System Status:</span>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-widest ${isPaused ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-red-500' : 'bg-emerald-400 animate-pulse'}`} />
                {isPaused ? 'OPD Paused' : 'Consultations Live'}
              </div>
            </div>
          </div>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-2xl shadow-teal-900/60"
            style={{ background: 'linear-gradient(135deg, #0d9488, #0369a1)' }}>
            🩺
          </motion.div>
        </header>

        {/* Currently Consulting */}
        <div className="mb-8">
           {serving ? (
             <motion.div 
               layoutId="serving-card-clinic"
               className="p-6 rounded-[32px] bg-gradient-to-br from-teal-500/20 to-transparent border border-teal-500/30 shadow-[0_0_50px_rgba(13,148,136,0.15)] relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Activity size={120} />
                </div>
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div>
                    <span className="text-xs font-black text-teal-300 uppercase tracking-[0.2em]">Current Consultation</span>
                    <h3 className="text-3xl font-black mt-1">Token #{serving.tokenNumber}</h3>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNext}
                    className="bg-teal-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-500/20 border border-teal-400/30"
                  >
                    Next Patient
                  </motion.button>
                </div>
                <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center text-xl">👤</div>
                  <div>
                    <p className="font-bold text-teal-50">{serving.customerName}</p>
                    <p className="text-xs text-teal-300/40 font-black uppercase tracking-widest">{serving.selectedServices[0]?.name}</p>
                  </div>
                </div>
             </motion.div>
           ) : (
             <div className="p-8 rounded-[32px] border border-dashed border-teal-500/20 flex flex-col items-center justify-center text-center bg-teal-500/[0.02]">
                <Stethoscope size={32} className="text-teal-500/20 mb-4" />
                <p className="text-teal-300/30 font-black text-sm uppercase tracking-widest">No Active Consultation</p>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  className="mt-6 bg-teal-500/10 hover:bg-teal-500/20 text-teal-200 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border border-teal-500/30 transition-all"
                >
                  Call Patient #{waiting[0]?.tokenNumber || '--'}
                </motion.button>
             </div>
           )}
        </div>

        {/* Operational Flow */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handlePause}
            className={`p-5 rounded-[28px] border flex items-center justify-between transition-all ${
              isPaused 
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.1)]' 
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <div className="text-left">
              <p className="text-xs font-black uppercase tracking-widest opacity-40">Doctor Presence</p>
              <p className="text-lg font-black">{isPaused ? 'Resume OPD' : 'Pause OPD'}</p>
            </div>
            {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/barber/revenue-ops')}
            className="p-5 rounded-[28px] bg-white/5 border border-white/10 flex items-center justify-between group hover:border-teal-500/30 transition-all"
          >
            <div className="text-left">
              <p className="text-xs font-black uppercase tracking-widest opacity-40">Consultation Fees</p>
              <p className="text-lg font-black">₹{done.reduce((s,t) => s + t.totalPrice, 0).toLocaleString()}</p>
            </div>
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>

        {/* Patient Queue */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-teal-300/60 uppercase tracking-widest flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> 
               Waiting Room ({waiting.length})
            </h2>
            <button className="text-xs font-black text-teal-300 uppercase tracking-widest bg-teal-500/10 px-3 py-1 rounded-lg">Archive</button>
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
                  <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center text-xl font-black text-teal-300 border border-teal-500/10">
                    {token.tokenNumber}
                  </div>
                  <div>
                    <p className="font-bold text-teal-50 text-lg">{token.customerName}</p>
                    <p className="text-xs text-teal-300/40 font-medium uppercase tracking-widest">
                       {token.selectedServices[0]?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right mr-2">
                    <p className="text-sm font-black text-teal-300">{token.estimatedWaitMinutes}m</p>
                    <p className="text-xs text-teal-300/20 font-bold uppercase tracking-widest">Wait</p>
                  </div>
                  <MessageSquare size={16} className={token.internalNotes ? "text-teal-400" : "text-white/5"} />
                </div>
              </motion.div>
            ))}

            {waiting.length === 0 && (
              <div className="py-12 text-center bg-white/[0.02] border border-dashed border-white/5 rounded-[32px]">
                 <Users size={32} className="mx-auto text-white/5 mb-3" />
                 <p className="text-white/20 font-black text-xs uppercase tracking-widest">Queue Clear</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-xs font-bold text-teal-300/50 uppercase tracking-widest mb-4">Clinic Administration</div>
        <BusinessToolGrid />
      </div>

      {/* Patient Detail Modal (Consultation Notes) */}
      <AnimatePresence>
        {selectedToken && (
           <div className="fixed inset-0 z-[100] flex flex-col justify-end lg:justify-center lg:items-center">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setSelectedToken(null)}
                className="absolute inset-0 bg-black/95 backdrop-blur-xl"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="relative bg-[#001a1a] border-t border-teal-500/20 lg:border border-teal-500/20 p-8 pt-10 rounded-t-[40px] lg:rounded-[40px] w-full max-w-xl shadow-[0_-20px_100px_rgba(13,148,136,0.15)]"
              >
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full lg:hidden" />
                  
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-black text-teal-400 uppercase tracking-widest">Patient File</span>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-widest bg-teal-500/10 border border-teal-500/20 text-teal-200`}>
                          {selectedToken.status}
                        </span>
                      </div>
                      <h2 className="text-3xl font-black">Token #{selectedToken.tokenNumber}</h2>
                      <p className="text-teal-300/40 font-bold mt-1 uppercase tracking-widest text-xs">MRN: {selectedToken.id?.slice(-8).toUpperCase()}</p>
                    </div>
                    <button onClick={() => setSelectedToken(null)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-teal-500/[0.05] border border-teal-500/10 p-5 rounded-3xl flex items-center gap-5">
                       <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/30 to-sky-500/30 flex items-center justify-center text-3xl shadow-inner text-white">
                         👤
                       </div>
                       <div>
                         <p className="text-xl font-black">{selectedToken.customerName}</p>
                         <p className="text-sm text-teal-300/60 font-medium">{selectedToken.customerPhone}</p>
                       </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-teal-300/40 uppercase tracking-widest ml-1">Appointment Type</label>
                      <div className="grid gap-2">
                        {selectedToken.selectedServices.map((s, i) => (
                          <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                             <span className="font-bold text-sm tracking-tight">{s.name}</span>
                             <div className="flex items-center gap-4 text-xs font-black text-teal-300">
                               <span>₹{s.price}</span>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                       <label className="text-xs font-black text-teal-400 uppercase tracking-[0.2em] flex items-center gap-2">
                         <MessageSquare size={14} /> Consultation & Medical History
                       </label>
                       <textarea 
                         value={notes}
                         onChange={(e) => setNotes(e.target.value)}
                         placeholder="Symptoms, blood pressure, prescription notes, or history..."
                         className="w-full h-32 bg-black/40 border border-teal-500/20 rounded-2xl p-5 text-sm font-medium focus:border-teal-500/50 outline-none transition-all resize-none placeholder:text-teal-300/10 text-teal-50"
                       />
                       
                       <motion.button 
                         whileTap={{ scale: 0.95 }}
                         onClick={handleSaveNotes}
                         disabled={isUpdatingNotes}
                         className="w-full bg-gradient-to-r from-teal-600 to-sky-600 text-white py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-teal-500/30"
                       >
                          {isUpdatingNotes ? <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={18} /> Update Patient File</>}
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
