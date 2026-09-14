import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Feature #92: Daily Spin-the-Wheel Rewards
 * CSS-animated prize wheel with physics-based deceleration
 */

interface Prize {
  label: string;
  emoji: string;
  color: string;
}

interface SpinWheelProps {
  prizes?: Prize[];
  onWin?: (prize: Prize) => void;
  className?: string;
}

const DEFAULT_PRIZES: Prize[] = [
  { label: '10% Off', emoji: '🎫', color: '#E11D48' },
  { label: 'Free Service', emoji: '💇', color: '#D946EF' },
  { label: '50 Points', emoji: '⭐', color: '#F59E0B' },
  { label: '₹100 Off', emoji: '💰', color: '#10B981' },
  { label: 'Try Again', emoji: '🔄', color: '#6B7280' },
  { label: '₹200 Off', emoji: '🎁', color: '#3B82F6' },
  { label: 'Free Addon', emoji: '✨', color: '#FB7185' },
  { label: 'JACKPOT!', emoji: '🏆', color: '#FDE047' },
];

export default function SpinWheel({
  prizes = DEFAULT_PRIZES,
  onWin,
  className = '',
}: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Prize | null>(null);
  const [showResult, setShowResult] = useState(false);

  const segmentAngle = 360 / prizes.length;

  const spin = useCallback(() => {
    if (isSpinning) return;
    setIsSpinning(true);
    setShowResult(false);
    setWinner(null);

    const winIndex = Math.floor(Math.random() * prizes.length);
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const targetAngle = fullSpins * 360 + (360 - winIndex * segmentAngle - segmentAngle / 2);

    setRotation(prev => prev + targetAngle);

    setTimeout(() => {
      setIsSpinning(false);
      setWinner(prizes[winIndex]);
      setShowResult(true);
      onWin?.(prizes[winIndex]);
    }, 4500);
  }, [isSpinning, prizes, segmentAngle, onWin]);

  return (
    <div className={`flex flex-col items-center gap-6 ${className}`}>
      {/* Wheel container */}
      <div className="relative" style={{ width: '280px', height: '280px' }}>
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
          <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-white drop-shadow-lg" />
        </div>

        {/* Wheel */}
        <motion.div
          className="w-full h-full rounded-full border-4 border-white/20 relative overflow-hidden"
          style={{
            background: 'conic-gradient(' + prizes.map((p, i) =>
              `${p.color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`
            ).join(', ') + ')',
            boxShadow: '0 0 30px rgba(225,29,72,0.2), inset 0 0 20px rgba(0,0,0,0.2)',
          }}
          animate={{ rotate: rotation }}
          transition={{
            duration: 4.5,
            ease: [0.17, 0.67, 0.12, 0.99],
          }}
        >
          {/* Prize labels */}
          {prizes.map((prize, i) => {
            const angle = i * segmentAngle + segmentAngle / 2;
            return (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 origin-center"
                style={{
                  transform: `rotate(${angle}deg) translateY(-85px)`,
                  width: '60px',
                  marginLeft: '-30px',
                }}
              >
                <div
                  className="text-center"
                  style={{ transform: `rotate(${-angle}deg)` }}
                >
                  <span className="text-lg block">{prize.emoji}</span>
                  <span className="text-xs font-bold text-white/90 leading-tight block">{prize.label}</span>
                </div>
              </div>
            );
          })}

          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center">
              <span className="text-lg">🎰</span>
            </div>
          </div>
        </motion.div>

        {/* Outer glow ring */}
        {isSpinning && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{
              border: '2px solid transparent',
              borderTopColor: 'rgba(225,29,72,0.5)',
              borderRightColor: 'rgba(217,70,239,0.5)',
            }}
          />
        )}
      </div>

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={isSpinning}
        className="btn-primary btn-haptic cta-pulse px-10 py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ maxWidth: '200px' }}
      >
        {isSpinning ? '🎡 Spinning...' : '🎰 SPIN!'}
      </button>

      {/* Result */}
      <AnimatePresence>
        {showResult && winner && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-ultra rounded-2xl p-5 text-center w-full max-w-xs"
          >
            <motion.span
              className="text-4xl block mb-2"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.5 }}
            >
              {winner.emoji}
            </motion.span>
            <p className="type-heading text-lg text-text">{winner.label}</p>
            <p className="text-text-dim text-xs mt-1">Congratulations! 🎉</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
