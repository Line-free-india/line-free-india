import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { triggerHaptic } from '../utils/haptics';

const HAIRSTYLES = [
  { id: '1', name: 'Classic Fade', url: 'https://cdn-icons-png.flaticon.com/512/3063/3063125.png' },
  { id: '2', name: 'Pompadour', url: 'https://cdn-icons-png.flaticon.com/512/3063/3063131.png' },
  { id: '3', name: 'Buzz Cut', url: 'https://cdn-icons-png.flaticon.com/512/3063/3063155.png' },
  { id: '4', name: 'Slick Back', url: 'https://cdn-icons-png.flaticon.com/512/3063/3063143.png' },
];

export default function HairstyleTryOn() {
  const nav = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [activeStyle, setActiveStyle] = useState(HAIRSTYLES[0]);
  const [error, setError] = useState('');

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

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <BackButton to="/customer/home" />
        <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-black tracking-widest uppercase">
          AI Canvas
        </div>
        <div className="w-10"></div>
      </div>

      {/* Video Stream */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-center p-8">
            <div className="text-6xl mb-4">📸</div>
            <p className="text-sm font-bold text-white/50">{error}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            />
            {/* AI Overlay Wrapper (Simulated Face Tracking) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-10 pb-[20vh]">
               {/* Alignment Guide */}
               <div className="w-64 h-80 border-2 border-white/30 border-dashed rounded-[100px] absolute transition-opacity duration-1000 opacity-30" />
               <div className="relative w-48 h-48 translate-y-[-40px]">
                 <img src={activeStyle.url} className="w-full h-full object-contain filter drop-shadow-2xl transition-all duration-500 scale-110" alt="" />
               </div>
            </div>
            
            <div className="absolute top-24 left-1/2 -translate-x-1/2 text-center z-10 w-full">
              <p className="text-white/80 font-bold text-sm bg-black/50 backdrop-blur-md inline-block px-4 py-1.5 rounded-full border border-white/20">Align your face in the oval</p>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-6 pb-12 z-20">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-black">{activeStyle.name}</h2>
            <p className="text-xs text-white/50 font-bold uppercase tracking-widest mt-1">Virtual Try-On</p>
          </div>
          <button className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-90 transition-transform" onClick={() => triggerHaptic('success')}>
            📸
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {HAIRSTYLES.map(style => (
            <button
              key={style.id}
              onClick={() => { triggerHaptic('light'); setActiveStyle(style); }}
              className={`flex-shrink-0 w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 transition-all p-2 bg-white/10 backdrop-blur-md ${activeStyle.id === style.id ? 'border-primary ring-4 ring-primary/30 scale-105' : 'border-white/20 scale-95 opacity-70'}`}
            >
              <img src={style.url} className="w-10 h-10 object-contain mb-1" alt="" />
              <p className="text-xs font-black uppercase text-center leading-tight">{style.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
