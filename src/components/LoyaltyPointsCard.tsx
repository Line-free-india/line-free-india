/**
 * LoyaltyPointsCard Component
 * 
 * Displays customer loyalty points with premium gradient styling
 * and glass morphism effects.
 */

import { motion } from 'framer-motion';
import { scaleInVariants } from '../utils/animations';

interface LoyaltyPointsCardProps {
  points: number;
  onCardClick: () => void;
}

export default function LoyaltyPointsCard({ points, onCardClick }: LoyaltyPointsCardProps) {
  // Only render if points > 0
  if (points <= 0) return null;

  return (
    <motion.button
      onClick={onCardClick}
      variants={scaleInVariants}
      initial="initial"
      animate="animate"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="
        w-full p-5 rounded-3xl 
        bg-gradient-to-br from-gold/20 to-primary/10 
        border border-gold/30 
        cursor-pointer transition-all
        shadow-lg hover:shadow-xl hover:shadow-gold/20
        backdrop-blur-xl
      "
      aria-label={`You have ${points} loyalty points. Tap to redeem rewards.`}
    >
      <div className="flex items-center justify-between">
        <div className="text-left">
          <p className="text-xs font-black uppercase tracking-widest text-gold/70 mb-1">
            Your Rewards
          </p>
          <p className="text-3xl font-black text-gold leading-none mb-2">
            {points.toLocaleString()} Points
          </p>
          <p className="text-xs text-text-dim font-medium">
            Tap to redeem rewards →
          </p>
        </div>
        <div className="text-5xl drop-shadow-lg">
          🏆
        </div>
      </div>

      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-gold/5 to-transparent rounded-3xl pointer-events-none" />
    </motion.button>
  );
}
