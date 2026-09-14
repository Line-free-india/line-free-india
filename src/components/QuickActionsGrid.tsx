/**
 * QuickActionsGrid Component
 * 
 * 4-column grid of quick action buttons for navigation.
 * Features glass morphism styling and smooth animations.
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { staggerContainerVariants, fadeInVariants } from '../utils/animations';
import { getGlassClasses } from '../utils/glassMorphism';

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  path: string;
  ariaLabel: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'search',
    icon: '🔍',
    label: 'Search',
    path: '/customer/search',
    ariaLabel: 'Search for businesses',
  },
  {
    id: 'activity',
    icon: '🎫',
    label: 'Activity',
    path: '/customer/tokens',
    ariaLabel: 'View your activity and bookings',
  },
  {
    id: 'explore',
    icon: '✨',
    label: 'Explore',
    path: '/customer/hairstyles',
    ariaLabel: 'Explore styles and trends',
  },
  {
    id: 'profile',
    icon: '👤',
    label: 'Profile',
    path: '/customer/profile',
    ariaLabel: 'View and edit your profile',
  },
];

export default function QuickActionsGrid() {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className="grid grid-cols-4 gap-3 mb-8"
    >
      {QUICK_ACTIONS.map((action) => (
        <motion.button
          key={action.id}
          onClick={() => navigate(action.path)}
          variants={fadeInVariants}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={`
            flex flex-col items-center gap-2 p-4 rounded-2xl
            ${getGlassClasses('card')}
            transition-all hover:border-primary/30
            min-h-[80px] justify-center
          `}
          aria-label={action.ariaLabel}
        >
          <span className="text-2xl">{action.icon}</span>
          <span className="text-xs font-bold text-text-dim">
            {action.label}
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
}
