import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface NotificationBellProps {
  count: number;
  onClick: () => void;
}

export default function NotificationBell({ count, onClick }: NotificationBellProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      whileHover={{ rotate: [0, -15, 15, -10, 10, 0] }}
      transition={{ duration: 0.5 }}
      onClick={() => {
        triggerHaptic('light');
        onClick();
      }}
      className="relative w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover-glow cursor-pointer transition-colors hover:bg-card-hover"
    >
      <Bell className="w-5 h-5 text-text-dim" />
      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-danger flex items-center justify-center text-[10px] font-black text-white"
          style={{ boxShadow: '0 0 8px rgba(255,68,68,0.5)' }}
        >
          {count > 9 ? '9+' : count}
        </motion.span>
      )}
    </motion.button>
  );
}
