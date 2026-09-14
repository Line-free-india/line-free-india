import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { triggerHaptic } from '../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';
import ResponsiveContainer from '../components/ResponsiveContainer';

const HAIRSTYLES = [
  { id: '1', name: 'Classic Fade', url: 'https://cdn-icons-png.flaticon.com/512/3063/3063125.png' },
  { id: '2', name: 'Pompadour', url: 'https://cdn-icons-png.flaticon.com/512/3063/3063131.png' },
  { id: '3', name: 'Buzz Cut', url: 'https://cdn-icons-png.flaticon.com/512/3063/3063155.png' },
  { id: '4', name: 'Slick Back', url: 'https://cdn-icons-png.flaticon.com/512/3063/3063143.png' },
];

export default function CustomerTryOn() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [activeStyle, setActiveStyle] = useState(HAIRSTYLES[0]);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } }
        });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (e: any) {
        setError('Camera access denied or unavailable. ' + e.message);
      }
    };
    startCamera();

    const t = setTimeout(() => setScanning(false), 3000);

    return () => {
      clearTimeout(t);
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  return (
    <ResponsiveContainer variant="customer">
    <div className="min-h-screen text-white relative flex flex-col overflow-hidden">
      {/* HUD Header */}
      <div className="absolute top-0 left-0 right-0 p-6 z-30 flex justify-between items-center bg-gradient-to-b from-black via-black/80 to-transparent pb-16">
        <div className="bg-black/50 p-2 rounded-2xl border border-white/20 backdrop-blur-md">
           <BackButton to="/customer/hairstyles" />
        </div>
        <div className="flex bg-cyan-950/40 border border-cyan-500/50 px-3 py-1.5 rounded-full items-center gap-2 backdrop-blur-xl">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,1)]" />
          <span className="text-xs font-black tracking-widest uppercase text-cyan-200">Neural Vision AR</span>
        </div>
      </div>

      {/* Hardware Feed Layer */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-center p-8 z-10 relative">
            <div className="text-6xl mb-6 opacity-30 mix-blend-screen">📸</div>
            <p className="text-xs font-mono text-rose-400 bg-rose-950/30 border border-rose-900 absolute -inset-4 p-8 rounded-3xl backdrop-blur-md shadow-2xl">{error}</p>
          </div>
        ) : (
          <>
            {/* Live Camera Feed */}
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1] filter contrast-125 saturate-150 brightness-90" />
            
            {/* Environmental Lighting Simulator */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.1),_transparent_80%)] mix-blend-overlay pointer-events-none z-10" />

            {/* Simulated Tracking HUD */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-10 pb-[20vh] z-20">
               {/* Face Outline Reticle */}
               <motion.div animate={{ borderColor: scanning ? 'rgba(34,211,238,0.8)' : 'rgba(16,185,129,0.3)' }}
                 className="w-[65vw] h-[45vh] border-2 border-dashed rounded-[120px] absolute transition-colors duration-1000 shadow-[0_0_50px_rgba(255,255,255,0.05)] relative flex items-center justify-center overflow-hidden">
                  
                  {/* Vertical Scan Line */}
                  <motion.div animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                     className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50 shadow-[0_0_20px_rgba(34,211,238,1)]" />
                  
                  {/* Tracking Nodes */}
                  <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-ping" />
                  <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-white rounded-full animate-ping delay-100" />
                  <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-white rounded-full animate-ping delay-200" />
               </motion.div>

               {/* Virtual Render Anchor */}
               <div className="relative w-72 h-72 translate-y-[-90px] transition-all duration-300">
                 <AnimatePresence mode="popLayout">
                   <motion.img key={activeStyle.id} initial={{ scale: 0.8, opacity: 0, filter: 'blur(10px)' }} animate={{ scale: 1.15, opacity: 0.85, filter: 'blur(0px)' }} exit={{ scale: 1.2, opacity: 0, filter: 'blur(10px)' }} transition={{ duration: 0.4 }}
                      src={activeStyle.url} className="w-full h-full object-contain filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] mix-blend-luminosity brightness-110" alt="" />
                 </AnimatePresence>
               </div>
            </div>
            
            {/* Status Text Bar */}
            <div className="absolute top-28 left-1/2 -translate-x-1/2 text-center z-30 w-full px-4">
              <motion.div animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}
                 className={`font-black text-xs inline-block px-4 py-2 rounded-full border tracking-[0.3em] uppercase backdrop-blur-xl shadow-2xl ${scanning ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300' : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'}`}>
                {scanning ? 'Acquiring Facial Coordinates...' : 'Biometric Lock Stable'}
              </motion.div>
            </div>
          </>
        )}
      </div>

      {/* Control Console */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-[#050505] to-transparent p-6 pb-12 z-30">
        <div className="flex justify-between items-end mb-8 pl-2">
          <div>
            <AnimatePresence mode="wait">
               <motion.h2 key={activeStyle.id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }}
                  className="text-4xl font-black tracking-tighter text-white drop-shadow-lg">{activeStyle.name}</motion.h2>
            </AnimatePresence>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">Render Model {activeStyle.id}.0</p>
          </div>
          <button className="w-16 h-16 rounded-[2rem] bg-white text-black flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(255,255,255,0.5)] active:scale-90 transition-all hover:rounded-2xl" onClick={() => triggerHaptic('heavy')}>
            📸
          </button>
        </div>

        {/* Carousel Slider */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 px-2 snap-x">
          {HAIRSTYLES.map(style => (
            <button key={style.id} onClick={() => { triggerHaptic('light'); setActiveStyle(style); setScanning(true); setTimeout(() => setScanning(false), 800); }}
              className={`snap-center flex-shrink-0 w-24 h-28 rounded-3xl flex flex-col items-center justify-center border transition-all duration-300 p-2 backdrop-blur-2xl ${activeStyle.id === style.id ? 'border-white/50 bg-white/20 scale-100 shadow-[0_10px_30px_rgba(255,255,255,0.2)]' : 'border-white/10 scale-90 opacity-40 bg-black/50 hover:opacity-100 mix-blend-luminosity'}`}
            >
              <img src={style.url} className={`w-14 h-14 object-contain mb-3 transition-transform ${activeStyle.id === style.id ? 'scale-110' : 'scale-90'}`} alt="" />
              <p className={`text-xs font-black uppercase tracking-wider text-center leading-tight ${activeStyle.id === style.id ? 'text-white' : 'text-zinc-500'}`}>{style.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
    </ResponsiveContainer>
  );
}
