import { motion } from 'framer-motion';

interface LiveQueueAnimProps {
  position: number;
  total: number;
  businessName?: string;
  accentColor?: string;
}

export default function LiveQueueAnim({ position, total, businessName, accentColor = '#6C63FF' }: LiveQueueAnimProps) {
  const pct = total > 0 ? ((total - position + 1) / total) * 100 : 0;
  const isNext = position <= 1;

  return (
    <div className="p-5 rounded-3xl aurora-glass relative overflow-hidden">
      {/* Animated progress ring */}
      <div className="flex items-center gap-5">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <motion.circle
              cx="40" cy="40" r="35"
              fill="none"
              stroke={accentColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={220}
              animate={{ strokeDashoffset: 220 - (220 * pct / 100) }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 6px ${accentColor}60)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              key={position}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-black"
              style={{ color: accentColor }}
            >
              #{position}
            </motion.span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-black text-base">
            {isNext ? '🎉 You\'re Next!' : `${position - 1} ahead of you`}
          </h3>
          {businessName && <p className="text-text-dim text-xs mt-0.5">{businessName}</p>}
          <div className="flex items-center gap-2 mt-2">
            {isNext ? (
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-xs font-black px-2 py-0.5 rounded-full"
                style={{ background: `${accentColor}20`, color: accentColor }}
              >
                GET READY! ⚡
              </motion.span>
            ) : (
              <span className="text-xs text-text-dim font-bold">~{(position - 1) * 8} min wait</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
