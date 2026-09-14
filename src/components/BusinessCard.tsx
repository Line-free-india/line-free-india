/**
 * BusinessCard Component
 * 
 * Premium card displaying business information with images, status badges,
 * pricing, ratings, and favorite functionality.
 */

import { motion } from 'framer-motion';
import { BusinessProfile, getCategoryInfo } from '../store/AppContext';
import LazyImage from './LazyImage';
import { getBusinessImage } from '../utils/imageHandling';
import { cardVariants, cardHoverVariants, favoriteVariants } from '../utils/animations';
import { getGlassClasses } from '../utils/glassMorphism';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface BusinessCardProps {
  business: BusinessProfile;
  onCardClick: () => void;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
  distance?: number;
}

export default function BusinessCard({
  business,
  onCardClick,
  isFavorite,
  onFavoriteToggle,
  distance,
}: BusinessCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const categoryInfo = getCategoryInfo(business.businessType);
  const imageResult = getBusinessImage(business);
  
  // Calculate minimum price from services
  const minPrice = business.services && business.services.length > 0
    ? Math.min(...business.services.map(s => s.price))
    : null;

  // Determine business status
  const isClosed = !business.isOpen;
  const isOnBreak = business.isBreak;
  const isTokensPaused = business.isStopped;
  const isLiveNow = business.isOpen && !business.isBreak && !business.isStopped;

  return (
    <motion.div
      variants={cardVariants}
      className="w-full"
      initial={prefersReducedMotion ? false : undefined}
      animate={prefersReducedMotion ? false : undefined}
    >
      <motion.button
        onClick={onCardClick}
        variants={cardHoverVariants}
        whileHover={prefersReducedMotion ? undefined : "hover"}
        whileTap={prefersReducedMotion ? undefined : "tap"}
        className={`
          w-full rounded-3xl overflow-hidden text-left
          ${getGlassClasses('card')} 
          hover:border-primary/40 transition-all
          shadow-xl hover:shadow-2xl hover:shadow-primary/20
          relative group
        `}
        aria-label={`View details for ${business.businessName}`}
      >
        {/* Image Section */}
        <div className="relative">
          <LazyImage
            imageResult={imageResult}
            category={business.businessType}
            alt={business.businessName}
            className="w-full"
            aspectRatio="16/9"
          />

          {/* Status Badge Overlay */}
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            {isLiveNow && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1.5 rounded-full bg-success/90 backdrop-blur-md border border-success/50 text-white text-xs font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>LIVE NOW</span>
              </motion.div>
            )}
            {isClosed && (
              <div className="px-3 py-1.5 rounded-full bg-danger/90 backdrop-blur-md border border-danger/50 text-white text-xs font-black uppercase tracking-widest shadow-lg">
                🔴 Closed
              </div>
            )}
            {isOnBreak && !isClosed && (
              <div className="px-3 py-1.5 rounded-full bg-warning/90 backdrop-blur-md border border-warning/50 text-white text-xs font-black uppercase tracking-widest shadow-lg">
                ☕ On Break
              </div>
            )}
            {isTokensPaused && !isClosed && !isOnBreak && (
              <div className="px-3 py-1.5 rounded-full bg-orange-500/90 backdrop-blur-md border border-orange-500/50 text-white text-xs font-black uppercase tracking-widest shadow-lg">
                ⏸ Tokens Paused
              </div>
            )}
          </div>

          {/* Favorite Button */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle();
            }}
            variants={favoriteVariants}
            animate={prefersReducedMotion ? undefined : (isFavorite ? 'active' : 'inactive')}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
            className={`
              absolute top-3 right-3 w-10 h-10 rounded-full
              ${getGlassClasses('strong')}
              flex items-center justify-center text-xl
              transition-all shadow-lg
              ${isFavorite ? 'text-red-500' : 'text-white/60 hover:text-white'}
            `}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={isFavorite}
          >
            {isFavorite ? '❤️' : '🤍'}
          </motion.button>

          {/* Gradient Overlay for better text readability */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Info Section */}
        <div className="p-5">
          {/* Business Name */}
          <h3 className="text-lg font-black text-text truncate mb-1 group-hover:text-primary transition-colors">
            {business.businessName}
          </h3>

          {/* Category Label */}
          <p className="text-xs font-black text-primary/70 uppercase tracking-widest mb-3">
            {categoryInfo.label}
          </p>

          {/* Location */}
          {business.location && (
            <div className="flex items-start gap-2 mb-3">
              <span className="text-text-dim text-xs mt-0.5">📍</span>
              <p className="text-xs text-text-dim line-clamp-2 flex-1">
                {business.location}
              </p>
            </div>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Rating */}
            {business.rating && (
              <div className="flex items-center gap-1 text-xs font-black text-gold">
                <span>⭐</span>
                <span>{business.rating}</span>
                {business.totalReviews && (
                  <span className="text-text-dim">({business.totalReviews})</span>
                )}
              </div>
            )}

            {/* Distance */}
            {distance !== undefined && (
              <div className="flex items-center gap-1 text-xs font-black text-text-dim">
                <span>📍</span>
                <span>{distance.toFixed(1)} km</span>
              </div>
            )}

            {/* Pricing */}
            {minPrice && (
              <div className="flex items-center gap-1 text-xs font-black text-primary">
                <span>FROM</span>
                <span className="text-sm">₹{minPrice}</span>
              </div>
            )}
          </div>

          {/* View Details Arrow */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-text-dim group-hover:text-primary transition-colors">
              View Details
            </span>
            <div className="w-8 h-8 rounded-xl bg-card-2 border border-white/5 flex items-center justify-center text-text-dim group-hover:text-primary group-hover:border-primary/30 transition-all">
              →
            </div>
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}
