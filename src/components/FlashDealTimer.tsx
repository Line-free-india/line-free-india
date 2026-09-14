import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function FlashDealTimer() {
  const [timeLeft, setTimeLeft] = useState({ hrs: 2, mins: 45, secs: 12 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: prev.mins - 1, secs: 59 };
        if (prev.hrs > 0) return { ...prev, hrs: prev.hrs - 1, mins: 59, secs: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-[1px]"
      style={{
        borderRadius: '22px',
        background: 'linear-gradient(135deg, rgba(0,240,255,0.3), rgba(139,92,246,0.3))',
        boxShadow: '0 10px 40px rgba(0,240,255,0.1)'
      }}
    >
      <div 
        className="p-5 flex items-center justify-between relative overflow-hidden"
        style={{ 
          borderRadius: '21px',
          background: '#0C0C0E'
        }}
      >
        {/* Ambient Background */}
        <div className="absolute top-0 left-0 w-28 h-28 rounded-full -translate-x-1/2 -translate-y-1/2" style={{ background: 'rgba(0,240,255,0.06)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-0 right-0 w-28 h-28 rounded-full translate-x-1/2 translate-y-1/2" style={{ background: 'rgba(139,92,246,0.06)', filter: 'blur(40px)' }} />

        <div className="relative z-10 flex items-center gap-4">
          <div 
            className="w-12 h-12 flex items-center justify-center text-2xl"
            style={{
              borderRadius: '16px',
              background: 'rgba(0,240,255,0.05)',
              border: '1px solid rgba(0,240,255,0.1)'
            }}
          >
            <span style={{ filter: 'drop-shadow(0 0 8px rgba(0,240,255,0.4))' }}>🔥</span>
          </div>
          <div>
            <h3 className="text-white font-black text-sm uppercase tracking-wider">Flash Deal</h3>
            <p className="text-xs font-bold uppercase tracking-[2px]" style={{ color: '#00F0FF' }}>35% OFF Next Token</p>
          </div>
        </div>

        <div className="relative z-10 flex gap-2">
          {[
            { val: timeLeft.hrs, label: 'H' },
            { val: timeLeft.mins, label: 'M' },
            { val: timeLeft.secs, label: 'S' }
          ].map((t, i) => (
            <div key={i} className="flex flex-col items-center">
              <div 
                className="w-10 h-10 flex items-center justify-center text-sm font-black font-mono"
                style={{
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#00F0FF',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                {String(t.val).padStart(2, '0')}
              </div>
              <span className="text-[7px] font-black mt-1 uppercase tracking-[2px]" style={{ color: '#3F3F46' }}>{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
