import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import AnimatedBackground from '../components/AnimatedBackground';
import ConfettiCelebration from '../components/ConfettiCelebration';

/**
 * Feature #91: Achievement Badges & Progress Tracker
 * Unlock badges for milestones with animated celebrations
 */

interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlockedDate?: string;
}

const BADGES: Badge[] = [
  { id: 'first-visit', name: 'First Steps', emoji: '👣', description: 'Complete your first salon visit', unlocked: true, progress: 1, maxProgress: 1, tier: 'bronze', unlockedDate: '15 Mar 2026' },
  { id: 'regular', name: 'Regular', emoji: '🌟', description: 'Visit 5 times', unlocked: true, progress: 5, maxProgress: 5, tier: 'bronze', unlockedDate: '28 Mar 2026' },
  { id: 'loyal', name: 'Loyalty Legend', emoji: '💎', description: 'Visit 10 times', unlocked: false, progress: 7, maxProgress: 10, tier: 'silver' },
  { id: 'reviewer', name: 'Review Champion', emoji: '📝', description: 'Write 5 reviews', unlocked: true, progress: 5, maxProgress: 5, tier: 'silver', unlockedDate: '2 Apr 2026' },
  { id: 'socialite', name: 'Socialite', emoji: '👥', description: 'Refer 3 friends', unlocked: false, progress: 1, maxProgress: 3, tier: 'silver' },
  { id: 'streak-7', name: 'Week Warrior', emoji: '🔥', description: '7-day visit streak', unlocked: false, progress: 4, maxProgress: 7, tier: 'gold' },
  { id: 'explorer', name: 'Explorer', emoji: '🗺️', description: 'Try 5 different salons', unlocked: false, progress: 2, maxProgress: 5, tier: 'gold' },
  { id: 'vip', name: 'VIP Status', emoji: '👑', description: 'Reach VIP membership', unlocked: false, progress: 0, maxProgress: 1, tier: 'platinum' },
  { id: 'spender', name: 'Big Spender', emoji: '💰', description: 'Spend ₹10,000 total', unlocked: false, progress: 6500, maxProgress: 10000, tier: 'platinum' },
  { id: 'photogenic', name: 'Photogenic', emoji: '📸', description: 'Share 10 style photos', unlocked: false, progress: 3, maxProgress: 10, tier: 'gold' },
  { id: 'early-bird', name: 'Early Bird', emoji: '🐦', description: 'Book 3 morning slots', unlocked: true, progress: 3, maxProgress: 3, tier: 'bronze', unlockedDate: '5 Apr 2026' },
  { id: 'nightowl', name: 'Night Owl', emoji: '🦉', description: 'Book 3 evening slots', unlocked: false, progress: 1, maxProgress: 3, tier: 'bronze' },
];

const tierColors = {
  bronze: { bg: 'from-amber-700/20 to-orange-600/20', border: 'border-amber-600/30', text: 'text-amber-400' },
  silver: { bg: 'from-slate-400/20 to-gray-300/20', border: 'border-slate-400/30', text: 'text-slate-300' },
  gold: { bg: 'from-yellow-500/20 to-amber-400/20', border: 'border-yellow-500/30', text: 'text-yellow-400' },
  platinum: { bg: 'from-purple-500/20 to-indigo-400/20', border: 'border-purple-400/30', text: 'text-purple-300' },
};

export default function Achievements() {
  const navigate = useNavigate();
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [celebrateBadge, setCelebrateBadge] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const unlockedCount = BADGES.filter(b => b.unlocked).length;
  const totalCount = BADGES.length;

  const filtered = BADGES.filter(b => {
    if (filter === 'unlocked') return b.unlocked;
    if (filter === 'locked') return !b.unlocked;
    return true;
  });

  return (
    <div className="min-h-screen pb-24 gradient-mesh-customer">
      <AnimatedBackground variant="customer" />

      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="type-heading text-xl text-text">Achievements</h1>
          <p className="text-text-dim text-xs">{unlockedCount}/{totalCount} badges unlocked</p>
        </div>
      </div>

      {/* Overall progress */}
      <div className="px-4 mb-4">
        <div className="elite-glass spatial-card rounded-2xl p-4 border-white/5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-text-dim">Overall Progress</span>
            <span className="text-sm font-bold text-primary">{Math.round(unlockedCount / totalCount * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-card-2 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ backgroundSize: '200% 100%', animation: 'gradientShift 3s ease infinite' }}
            />
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="px-4 mb-4 flex gap-2">
        {(['all', 'unlocked', 'locked'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all btn-haptic ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-card-2 text-text-dim border border-border'
            }`}
          >
            {f === 'all' ? `All (${totalCount})` : f === 'unlocked' ? `Unlocked (${unlockedCount})` : `Locked (${totalCount - unlockedCount})`}
          </button>
        ))}
      </div>

      {/* Badge grid */}
      <div className="px-4 grid grid-cols-3 gap-3">
        {filtered.map((badge, i) => {
          const tier = tierColors[badge.tier];
          return (
            <motion.button
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 200 }}
              onClick={() => {
                setSelectedBadge(badge);
                if (badge.unlocked) setCelebrateBadge(true);
              }}
              className={`relative p-4 rounded-2xl border ${tier.border} bg-gradient-to-br ${tier.bg} flex flex-col items-center gap-2 btn-haptic ${
                !badge.unlocked ? 'opacity-50 grayscale' : ''
              }`}
            >
              <span className="text-3xl">{badge.emoji}</span>
              <span className="text-xs font-semibold text-text text-center leading-tight">{badge.name}</span>
              {!badge.unlocked && (
                <div className="w-full h-1 rounded-full bg-black/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white/40"
                    style={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }}
                  />
                </div>
              )}
              {badge.unlocked && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-success flex items-center justify-center">
                  <span className="text-xs">✓</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => { setSelectedBadge(null); setCelebrateBadge(false); }}
          >
            <ConfettiCelebration trigger={celebrateBadge && selectedBadge.unlocked} type="stars">
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="elite-glass spatial-card rounded-3xl p-6 w-full max-w-sm text-center space-y-4 border-white/5"
              >
                <motion.span
                  className="text-5xl block"
                  animate={selectedBadge.unlocked ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                  transition={{ duration: 0.6 }}
                >
                  {selectedBadge.emoji}
                </motion.span>
                <h3 className="type-heading text-lg text-text">{selectedBadge.name}</h3>
                <p className="text-text-dim text-sm">{selectedBadge.description}</p>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-text-dim">
                    <span>Progress</span>
                    <span>{selectedBadge.progress}/{selectedBadge.maxProgress}</span>
                  </div>
                  <div className="h-2 rounded-full bg-card-2 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                      initial={{ width: 0 }}
                      animate={{ width: `${(selectedBadge.progress / selectedBadge.maxProgress) * 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>

                {selectedBadge.unlocked && selectedBadge.unlockedDate && (
                  <p className="text-xs text-success">🎉 Unlocked on {selectedBadge.unlockedDate}</p>
                )}

                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${tierColors[selectedBadge.tier].text}`}
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  {selectedBadge.tier.toUpperCase()} TIER
                </div>
              </motion.div>
            </ConfettiCelebration>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
