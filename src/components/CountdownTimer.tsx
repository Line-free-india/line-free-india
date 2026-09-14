import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownProps {
  targetDate: Date | string;
  label?: string;
  onComplete?: () => void;
  accentColor?: string;
}

export default function CountdownTimer({ targetDate, label, onComplete, accentColor = '#6C63FF' }: CountdownProps) {
  const getRemaining = useCallback(() => {
    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      total: diff,
    };
  }, [targetDate]);

  const [time, setTime] = useState(getRemaining());

  useEffect(() => {
    const iv = setInterval(() => {
      const r = getRemaining();
      setTime(r);
      if (r.total <= 0) {
        clearInterval(iv);
        onComplete?.();
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [getRemaining, onComplete]);

  const blocks = [
    { val: time.days, label: 'Days' },
    { val: time.hours, label: 'Hrs' },
    { val: time.minutes, label: 'Min' },
    { val: time.seconds, label: 'Sec' },
  ];

  return (
    <div className="text-center">
      {label && <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: accentColor }}>{label}</p>}
      <div className="flex justify-center gap-2">
        {blocks.map((b, i) => (
          <div key={i} className="text-center">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl"
              style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={b.val}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 10, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ color: accentColor }}
                >
                  {String(b.val).padStart(2, '0')}
                </motion.span>
              </AnimatePresence>
            </div>
            <p className="text-xs text-text-dim font-bold mt-1 uppercase">{b.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
