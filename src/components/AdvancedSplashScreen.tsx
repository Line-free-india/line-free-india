import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props { onComplete: () => void; }

export default function AdvancedSplashScreen({ onComplete }: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    let p = 0;
    const interval = setInterval(() => {
      p += 25;
      const clamped = Math.min(p, 100);
      setProgress(clamped);
      if (barRef.current) {
        barRef.current.style.width = `${clamped}%`;
      }
      if (p >= 100) {
        clearInterval(interval);
        setProgress(100);
        if (barRef.current) barRef.current.style.width = '100%';
        setTimeout(() => setExiting(true), 60);
        setTimeout(onComplete, 200);
      }
    }, 45);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Animated gradient mesh background */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `
              radial-gradient(ellipse at 20% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(56, 189, 248, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 80%, rgba(192, 132, 252, 0.1) 0%, transparent 50%),
              radial-gradient(ellipse at 60% 40%, rgba(6, 182, 212, 0.08) 0%, transparent 60%),
              linear-gradient(135deg, #030712 0%, #0B1120 40%, #0F172A 100%)
            `,
          }} />

          {/* Floating orbs */}
          <motion.div
            animate={{ y: [-10, 10, -10], x: [-5, 5, -5] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', top: '15%', left: '20%',
              width: 200, height: 200, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
          <motion.div
            animate={{ y: [8, -12, 8], x: [5, -5, 5] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', bottom: '20%', right: '15%',
              width: 160, height: 160, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            style={{
              width: 80, height: 80,
              borderRadius: 24,
              background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 28,
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4), 0 0 60px rgba(99, 102, 241, 0.15)',
              position: 'relative',
            }}
          >
            {/* Inner glow */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 24,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
              pointerEvents: 'none',
            }} />
            <span style={{
              fontSize: 40, fontWeight: 800, color: '#fff',
              letterSpacing: -3, fontFamily: "'Plus Jakarta Sans', sans-serif",
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>L</span>
          </motion.div>

          {/* Brand Name */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 28, fontWeight: 800, letterSpacing: -1,
              marginBottom: 8, position: 'relative',
              background: 'linear-gradient(135deg, #F8FAFC 0%, #CBD5E1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Line Free India
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 14, fontWeight: 500,
              color: 'rgba(148, 163, 184, 0.8)',
              marginBottom: 56,
              letterSpacing: 2,
              textTransform: 'uppercase',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Every Queue, Simplified
          </motion.p>

          {/* Progress bar container */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0.8 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            style={{
              width: 160, height: 4,
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: 100,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div ref={barRef} style={{
              height: '100%',
              width: '0%',
              background: 'linear-gradient(90deg, #3B82F6, #8B5CF6, #06B6D4)',
              borderRadius: 100,
              transition: 'width 0.1s ease-out',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.5)',
            }} />
          </motion.div>

          {/* Percentage */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{
              marginTop: 16,
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(148, 163, 184, 0.5)',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: 1,
            }}
          >
            {Math.round(progress)}%
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
