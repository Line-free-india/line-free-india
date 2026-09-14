/**
 * DiscoveryPortal Component
 * 
 * Horizontal scrollable category navigation section with premium styling.
 * Features glass morphism, smooth scrolling, and "VIEW ALL" link.
 */

import { motion } from 'framer-motion';
import { BusinessCategoryInfo } from '../store/AppContext';
import CategoryPill from './CategoryPill';
import { fadeInVariants } from '../utils/animations';
import { getGlassClasses } from '../utils/glassMorphism';

interface DiscoveryPortalProps {
  categories: BusinessCategoryInfo[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
}

export default function DiscoveryPortal({ 
  categories, 
  selectedCategory, 
  onCategorySelect 
}: DiscoveryPortalProps) {
  return (
    <motion.div
      variants={fadeInVariants}
      initial="initial"
      animate="animate"
      className="mb-6"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-black text-text flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            <span>DISCOVERY PORTAL</span>
          </h2>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-text-dim mt-1">
            Explore Premium Services
          </p>
        </div>
      </div>

      {/* Category Pills Scroller */}
      <div className="relative">
        {/* Gradient Fade Edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-bg to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-bg to-transparent z-10 pointer-events-none" />
        
        {/* Scrollable Container */}
        <div 
          className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1 scroll-smooth"
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Trending / All Category */}
          <motion.button
            onClick={() => onCategorySelect('all')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest 
              whitespace-nowrap transition-all border flex items-center gap-2
              ${selectedCategory === 'all'
                ? 'bg-gradient-to-r from-primary to-accent border-transparent text-white shadow-lg shadow-primary/30'
                : `${getGlassClasses('card')} text-text-dim hover:border-white/10`
              }
            `}
            aria-label="Show all categories"
            aria-pressed={selectedCategory === 'all'}
          >
            <span className="text-base">🎯</span>
            <span>Trending</span>
          </motion.button>

          {/* Category Pills */}
          {categories.map((category) => (
            <CategoryPill
              key={category.id}
              category={category}
              isActive={selectedCategory === category.id}
              onClick={() => onCategorySelect(category.id)}
            />
          ))}

          {/* VIEW ALL Link */}
          <motion.button
            onClick={() => onCategorySelect('all')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest 
              whitespace-nowrap transition-all border flex items-center gap-2
              ${getGlassClasses('elevated')} text-primary hover:border-primary/30
            `}
            aria-label="View all categories"
          >
            <span className="text-base">→</span>
            <span>View All</span>
          </motion.button>
        </div>
      </div>

      {/* Active Category Indicator */}
      {selectedCategory !== 'all' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 text-xs text-text-dim"
        >
          <span>Showing:</span>
          <span className="font-bold text-primary">
            {categories.find(c => c.id === selectedCategory)?.label || 'All'}
          </span>
          <button
            onClick={() => onCategorySelect('all')}
            className="ml-2 text-xs font-bold text-text-dim hover:text-primary transition-colors"
          >
            Clear ✕
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
