import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tv, 
  Users, 
  Volume2, 
  VolumeX, 
  Clock, 
  Bell, 
  Play, 
  AlertCircle,
  ArrowLeft,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { announceToken as announceVoiceToken } from '../services/voiceService';

const TVDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, businessProfile, getSalonTokens } = useApp();
  const [tokens, setTokens] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const prevServingToken = useRef<number | null>(null);

  const fetchTokens = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const data = await getSalonTokens(user.uid, today);
    setTokens(data.sort((a,b) => a.tokenNumber - b.tokenNumber));
  };

  useEffect(() => {
    fetchTokens();
    const interval = setInterval(fetchTokens, 5000); // 5s polling for TV mode
    return () => clearInterval(interval);
  }, [user]);

  const serving = tokens.filter(t => t.status === 'serving').slice(0, 3);
  const waiting = tokens.filter(t => t.status === 'waiting').slice(0, 10);
  const currentTokenNumber = serving[0]?.tokenNumber || null;

  // Voice Announcement Logic with Chime
  useEffect(() => {
    if (currentTokenNumber && currentTokenNumber !== prevServingToken.current && !isMuted) {
      announceVoiceToken({
        tokenNumber: currentTokenNumber,
        customerName: serving[0]?.customerName,
        businessName: businessProfile?.businessName,
        lang: 'hi'
      });
      prevServingToken.current = currentTokenNumber;
    }
  }, [currentTokenNumber, isMuted]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const displayName = businessProfile?.businessName || 'Live Display';

  return (
    <div className="min-h-screen bg-[#050505] text-white px-4 sm:px-6 md:px-8 lg:px-10 app-header-safe pb-10 font-[sans-serif] w-full max-w-full overflow-x-hidden relative">
      {/* Dynamic Responsive Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 sm:mb-8 border-b border-white/10 pb-4 sm:pb-6">
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center gap-2 transition-all active:scale-95"
            title="Exit TV Mode"
          >
            <ArrowLeft size={20} />
            <span className="text-xs sm:text-sm font-bold">Exit</span>
          </button>

          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] flex-shrink-0">
            <Tv size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl md:text-5xl font-black tracking-tight line-clamp-1">
              {displayName}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-white/50 font-medium tracking-wider uppercase mt-0.5">
              Live Queue Status • लाइव टोकन
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4 ml-auto">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2.5 sm:p-3.5 rounded-2xl border transition-all active:scale-95 ${isMuted ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-white/10 bg-white/5 text-white'}`}
            title={isMuted ? 'Unmute voice' : 'Mute voice'}
          >
            {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 sm:p-3.5 rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all active:scale-95"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
          </button>

          <div className="text-right hidden sm:block">
            <p className="text-xl sm:text-2xl md:text-3xl font-mono font-bold">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-[10px] sm:text-xs text-primary font-bold tracking-widest uppercase">LIVE</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* LEFT / TOP: NOW SERVING (HERO AREA) */}
        <div className="col-span-1 lg:col-span-7 flex flex-col gap-4 sm:gap-6">
          <div className="bg-gradient-to-br from-green-600/20 to-green-900/10 rounded-3xl sm:rounded-[40px] border border-green-500/30 p-6 sm:p-10 relative overflow-hidden flex flex-col items-center justify-center min-h-[260px] sm:min-h-[380px] group shadow-[0_10px_40px_rgba(34,197,94,0.15)]">
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
               <motion.div 
                 animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
                 transition={{ repeat: Infinity, duration: 2 }}
                 className="flex items-center gap-2 bg-green-500 text-black px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-full font-black text-xs sm:text-sm uppercase tracking-wider"
               >
                 <Play fill="black" size={14} /> Serving
               </motion.div>
            </div>
            
            <h2 className="text-sm sm:text-lg md:text-xl text-green-400 font-black uppercase tracking-[4px] sm:tracking-[6px] mb-2 sm:mb-4">
              Now Serving
            </h2>

            <div className="relative my-2 sm:my-4">
              <motion.span 
                key={currentTokenNumber}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-7xl sm:text-9xl md:text-[160px] lg:text-[200px] font-black leading-none drop-shadow-[0_0_50px_rgba(34,197,94,0.4)] text-white"
              >
                {currentTokenNumber ? `#${currentTokenNumber}` : '--'}
              </motion.span>
            </div>

            <p className="text-base sm:text-xl md:text-2xl font-bold text-white/80 mt-2 text-center px-4">
              {serving[0]?.customerName || 'Waiting for next customer...'}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex items-center gap-3 sm:gap-5">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                <Users size={24} className="sm:w-8 sm:h-8" />
              </div>
              <div>
                <p className="text-2xl sm:text-4xl font-black">{waiting.length}</p>
                <p className="text-[11px] sm:text-xs text-white/50 uppercase font-bold tracking-wider">In Queue</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex items-center gap-3 sm:gap-5">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                <Clock size={24} className="sm:w-8 sm:h-8" />
              </div>
              <div>
                <p className="text-2xl sm:text-4xl font-black">{waiting[0]?.estimatedWaitMinutes ? `${waiting[0].estimatedWaitMinutes}m` : '--'}</p>
                <p className="text-[11px] sm:text-xs text-white/50 uppercase font-bold tracking-wider">Est. Next Wait</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT / BOTTOM: UP NEXT LIST */}
        <div className="col-span-1 lg:col-span-5 bg-white/5 border border-white/10 rounded-3xl sm:rounded-[40px] p-5 sm:p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Users size={20} />
            </div>
            <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider">Up Next (कतार)</h3>
          </div>

          <div className="flex-1 space-y-2.5 sm:space-y-3 max-h-96 sm:max-h-none overflow-y-auto pr-1">
            <AnimatePresence>
              {waiting.length > 0 ? (
                waiting.map((token, idx) => (
                  <motion.div
                    key={token.id || idx}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex justify-between items-center p-3.5 sm:p-4 bg-white/[0.04] border border-white/5 rounded-2xl hover:bg-white/[0.08] transition-all"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center text-base sm:text-xl font-black flex-shrink-0">
                        #{token.tokenNumber}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base font-bold truncate">{token.customerName}</p>
                        <p className="text-[11px] text-white/40 uppercase font-semibold tracking-wider truncate">
                          {token.selectedServices?.[0]?.name || 'Service'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-sm sm:text-base font-mono text-primary font-bold">~{token.estimatedWaitMinutes || 10}m</p>
                      <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Wait</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-12 flex flex-col items-center justify-center opacity-40 text-center">
                  <AlertCircle size={40} className="mb-2 text-white/50" />
                  <p className="text-base font-bold">No Waiting Tokens</p>
                  <p className="text-xs text-white/50 mt-1">New customer tokens will appear here</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-5 p-3.5 sm:p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Bell size={18} className="text-white" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-white/90 leading-snug">
              Customers can scan the shop QR code at the entrance to get their live token!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TVDashboard;
