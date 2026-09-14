/**
 * PremiumPartnersSection Component
 * 
 * Displays filtered business cards in a responsive grid layout.
 * Features empty states, loading states, and stagger animations.
 */

import { motion } from 'framer-motion';
import { BusinessProfile } from '../store/AppContext';
import BusinessCard from './BusinessCard';
import { cardContainerVariants } from '../utils/animations';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface PremiumPartnersSectionProps {
  businesses: BusinessProfile[];
  onBusinessClick: (businessId: string) => void;
  isFavorite: (businessId: string) => boolean;
  onFavoriteToggle: (businessId: string) => void;
  selectedCategory: string;
}

export default function PremiumPartnersSection({
  businesses,
  onBusinessClick,
  isFavorite,
  onFavoriteToggle,
  selectedCategory,
}: PremiumPartnersSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Empty state
  if (businesses.length === 0) {
    return (
      <div className="text-center py-12 bg-card/30 rounded-3xl border border-white/5">
        <span className="text-5xl block mb-4">🔍</span>
        <p className="text-text-dim mb-2">No businesses found</p>
        {selectedCategory !== 'all' && (
          <p className="text-xs text-text-dim">
            Try selecting a different category
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-black text-text flex items-center gap-2">
            <span className="text-2xl">👑</span>
            <span>PREMIUM PARTNERS</span>
          </h2>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-text-dim mt-1">
            {businesses.length} Elite Business{businesses.length !== 1 ? 'es' : ''}
          </p>
        </div>
      </div>

      {/* Business Cards Grid */}
      <motion.div
        variants={cardContainerVariants}
        initial={prefersReducedMotion ? false : "initial"}
        animate={prefersReducedMotion ? false : "animate"}
        className="
          grid grid-cols-1 
          sm:grid-cols-2 
          lg:grid-cols-3 
          gap-4
        "
      >
        {businesses.map((business) => (
          <BusinessCard
            key={business.uid}
            business={business}
            onCardClick={() => onBusinessClick(business.uid)}
            isFavorite={isFavorite(business.uid)}
            onFavoriteToggle={() => onFavoriteToggle(business.uid)}
            distance={(business as any).distance}
          />
        ))}
      </motion.div>
    </div>
  );
}
