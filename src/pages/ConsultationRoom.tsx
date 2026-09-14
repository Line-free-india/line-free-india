import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '../utils/haptics';

export default function ConsultationRoom() {
  const nav = useNavigate();
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Start local camera immediately
    const startCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(s);
        if (localVideoRef.current) localVideoRef.current.srcObject = s;
      } catch (e) {
        console.warn('Camera access denied', e);
      }
    };
    startCamera();

    // Simulate connecting to a Remote Peer (Doctor/Lawyer) after 3 seconds
    const timer = setTimeout(() => {
      setIsConnected(true);
      triggerHaptic('success');
    }, 3000);

    return () => {
      clearTimeout(timer);
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach(t => t.enabled = isMuted);
    }
    setIsMuted(!isMuted);
    triggerHaptic('light');
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(t => t.enabled = isVideoOff);
    }
    setIsVideoOff(!isVideoOff);
    triggerHaptic('light');
  };

  const hangUp = () => {
    triggerHaptic('light');
    if (stream) stream.getTracks().forEach(track => track.stop());
    nav(-1); // go back
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      triggerHaptic('medium');
      setAttachedFiles(prev => [...prev, ...files.map(f => f.name)]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-xl text-white" onClick={hangUp}>
          ✕
        </button>
        <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 text-xs font-bold tracking-wider flex items-center gap-2">
          {isConnected ? (
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-warning animate-spin" />
          )}
          {isConnected ? 'LIVE SECURE' : 'CONNECTING...'}
        </div>
        
        {attachedFiles.length > 0 && (
          <div className="px-3 py-1.5 rounded-full bg-primary/20 backdrop-blur-md border border-primary/40 flex items-center gap-1.5">
            <span className="text-xs">📎</span>
            <span className="text-xs font-bold text-white uppercase tracking-widest">{attachedFiles.length} Docs</span>
          </div>
        )}
      </div>

      {/* Main Remote Feed (Simulated Background) */}
      <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
        {isConnected ? (
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center transition-opacity duration-1000 opacity-80" />
        ) : (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-2xl bg-black/60">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-5xl animate-pulse-glow shadow-2xl backdrop-blur-md">
                👩‍⚕️
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-warning flex items-center justify-center border-2 border-black">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Waiting for Host</h2>
            <p className="text-white/60 text-sm">Establishing secure E2E connection...</p>
            <div className="mt-6 flex gap-1.5">
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
      </div>

      {/* Local Picture-in-Picture Feed */}
      <div className={`absolute top-24 right-5 w-28 h-40 bg-black rounded-2xl overflow-hidden border-2 shadow-2xl z-20 transition-all ${isVideoOff ? 'border-error/50 bg-gray-900' : 'border-white/20'}`}>
        {!isVideoOff && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        )}
        {isVideoOff && (
          <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-50">📷</div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-2xl px-6 py-4 rounded-[40px] border border-white/10 flex items-center gap-6 shadow-2xl z-30">
        <button 
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all ${isMuted ? 'bg-white text-black' : 'bg-white/10 text-white'}`}
        >
          {isMuted ? '🔇' : '🎤'}
        </button>

        <button 
          onClick={() => fileRef.current?.click()}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all bg-white/10 text-white hover:bg-white/20`}
        >
          📎
        </button>
        <input type="file" ref={fileRef} className="hidden" multiple onChange={handleFileUpload} />

        <button 
          onClick={hangUp}
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl bg-error hover:scale-95 transition-transform flex-shrink-0 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
        >
          📞
        </button>

        <button 
           onClick={toggleVideo}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all ${isVideoOff ? 'bg-white text-black' : 'bg-white/10 text-white'}`}
        >
          {isVideoOff ? '🚫' : '📹'}
        </button>
      </div>
    </div>
  );
}
