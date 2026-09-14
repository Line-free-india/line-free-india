import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tv, 
  Users, 
  Volume2, 
  VolumeX, 
  Clock, 
  Sparkles,
  Maximize2,
  Minimize2,
  Building2
} from 'lucide-react';
import { announceToken as announceVoiceToken } from '../services/voiceService';

export default function TVDisplay() {
  const { businessId } = useParams<{ businessId: string }>();
  const [businessData, setBusinessData] = useState<any>(null);
  const [tokens, setTokens] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [lang, setLang] = useState<'hi' | 'en'>('hi');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const prevServingToken = useRef<number | null>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Business Profile (public doc)
  useEffect(() => {
    if (!businessId) return;

    async function loadBusiness() {
      try {
        let snap = await getDoc(doc(db, 'barbers', businessId!));
        if (!snap.exists()) {
          snap = await getDoc(doc(db, 'salons', businessId!));
        }
        if (snap.exists()) {
          setBusinessData(snap.data());
        }
      } catch (err) {
        console.warn('Could not fetch business info:', err);
      }
    }

    loadBusiness();
  }, [businessId]);

  // Real-time Firestore Listener for Today's Tokens
  useEffect(() => {
    if (!businessId) return;

    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'tokens'),
      where('salonId', '==', businessId),
      where('date', '==', today)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveTokens: any[] = [];
      snapshot.forEach((d) => {
        liveTokens.push({ id: d.id, ...d.data() });
      });
      liveTokens.sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));
      setTokens(liveTokens);
    });

    return () => unsubscribe();
  }, [businessId]);

  const serving = tokens.filter((t) => t.status === 'serving');
  const waiting = tokens.filter((t) => t.status === 'waiting');
  const currentToken = serving[0] || null;

  // Auto Voice Announcement with Chime on Token Change
  useEffect(() => {
    if (currentToken && currentToken.tokenNumber !== prevServingToken.current && !isMuted) {
      announceVoiceToken({
        tokenNumber: currentToken.tokenNumber,
        customerName: currentToken.customerName,
        stationOrChair: currentToken.assignedStaffName ? `Counter / ${currentToken.assignedStaffName}` : undefined,
        businessName: businessData?.businessName || businessData?.name,
        lang
      });
      prevServingToken.current = currentToken.tokenNumber;
    }
  }, [currentToken?.tokenNumber, isMuted, lang, businessData]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060813] text-white p-6 sm:p-10 font-[sans-serif] flex flex-col justify-between select-none">
      {/* ─── Top Header ─── */}
      <header className="flex justify-between items-center border-b border-white/10 pb-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              {businessData?.businessName || businessData?.name || 'Live Queue Display'}
            </h1>
            <p className="text-sm font-medium text-cyan-400 mt-0.5 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              Real-time Queue Monitor &bull; Line Free India
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right mr-4 hidden md:block">
            <div className="text-3xl font-mono font-bold tracking-wider text-white">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-xs text-white/50 uppercase tracking-widest font-semibold">
              {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setLang((l) => (l === 'hi' ? 'en' : 'hi'))}
            className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition"
          >
            {lang === 'hi' ? '🇮🇳 हिन्दी' : '🇬🇧 English'}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setIsMuted((m) => !m)}
            className={`p-3 rounded-xl border transition ${
              isMuted ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
            }`}
            title={isMuted ? 'Unmute Audio Announcement' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ─── Main Display Grid ─── */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 flex-1 items-stretch">
        {/* Left 7 Columns: NOW SERVING */}
        <section className="lg:col-span-7 bg-gradient-to-b from-cyan-950/40 to-indigo-950/20 border-2 border-cyan-500/30 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <span className="px-4 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-sm tracking-widest uppercase border border-cyan-500/30 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Now Serving / वर्तमान टोकन
            </span>
            <span className="text-xs text-white/40 uppercase tracking-wider font-mono">Counter Active</span>
          </div>

          <div className="text-center my-10 space-y-4">
            {currentToken ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentToken.tokenNumber}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.1, opacity: 0 }}
                  transition={{ type: 'spring', damping: 15 }}
                >
                  <div className="text-9xl sm:text-[13rem] font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-200 to-cyan-400 leading-none drop-shadow-[0_10px_30px_rgba(6,182,212,0.3)]">
                    #{currentToken.tokenNumber}
                  </div>
                  <div className="text-2xl sm:text-4xl font-bold text-white mt-4">
                    {currentToken.customerName || 'Walk-in Customer'}
                  </div>
                  {currentToken.serviceNames && currentToken.serviceNames.length > 0 && (
                    <div className="text-base text-cyan-300/80 font-medium mt-1">
                      {currentToken.serviceNames.join(' &bull; ')}
                    </div>
                  )}
                  {currentToken.assignedStaffName && (
                    <div className="inline-block mt-4 px-5 py-2 rounded-2xl bg-white/10 border border-white/20 text-sm font-semibold text-white">
                      Desk / Staff: <span className="text-cyan-300 font-bold">{currentToken.assignedStaffName}</span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="py-20 text-white/30 text-2xl font-bold">
                No active tokens being served right now.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-white/50 border-t border-white/10 pt-4">
            <span>Please keep your token confirmation QR ready</span>
            <span>कृपया टोकन नंबर आने पर काउंटर पर उपस्थित हों</span>
          </div>
        </section>

        {/* Right 5 Columns: UP NEXT QUEUE */}
        <section className="lg:col-span-5 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Up Next / कतार में
              </h2>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold font-mono">
                {waiting.length} Waiting
              </span>
            </div>

            <div className="space-y-3">
              {waiting.length > 0 ? (
                waiting.slice(0, 6).map((t, index) => (
                  <motion.div
                    key={t.id || t.tokenNumber}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition ${
                      index === 0
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                        : 'bg-white/5 border-white/10 text-white/90'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-black font-mono">
                        #{t.tokenNumber}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-white">
                          {t.customerName || 'Customer'}
                        </div>
                        <div className="text-xs text-white/50">
                          {index === 0 ? 'Next in line' : `Position #${index + 1}`}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-white/10">
                        {t.totalPrice ? `₹${t.totalPrice}` : 'Booked'}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-16 text-center text-white/30 text-sm font-semibold">
                  Queue is clear. No waiting customers.
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs text-indigo-200/80 flex items-center justify-between mt-4">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Estimated Wait: ~{waiting.length * 15} mins
            </span>
            <span className="font-mono font-bold">Line Free India</span>
          </div>
        </section>
      </main>

      {/* ─── Bottom Ticker Bar ─── */}
      <footer className="border-t border-white/10 pt-4 flex justify-between items-center text-xs text-white/60">
        <div className="flex items-center gap-4">
          <span className="font-bold text-cyan-400">LINE FREE INDIA</span>
          <span>&bull;</span>
          <span>Book your token on mobile to skip physical queues</span>
        </div>
        <div className="font-mono text-white/40">
          Powered by LineFree.in OS
        </div>
      </footer>
    </div>
  );
}
