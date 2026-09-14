import { motion } from 'framer-motion';

interface AvatarGroupProps {
  avatars: { url?: string; name: string }[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function AvatarGroup({ avatars, max = 4, size = 'md' }: AvatarGroupProps) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-xs', lg: 'w-12 h-12 text-xs' };
  const shown = avatars.slice(0, max);
  const extra = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {shown.map((a, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, x: -10 }}
          animate={{ scale: 1, x: 0 }}
          transition={{ delay: i * 0.08, type: 'spring' }}
          className={`${sizes[size]} rounded-full ring-2 ring-bg overflow-hidden`}
        >
          {a.url ? (
            <img src={a.url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary/30 flex items-center justify-center font-bold text-primary">
              {a.name[0]?.toUpperCase()}
            </div>
          )}
        </motion.div>
      ))}
      {extra > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: max * 0.08, type: 'spring' }}
          className={`${sizes[size]} rounded-full ring-2 ring-bg bg-card-2 flex items-center justify-center font-black text-text-dim`}
        >
          +{extra}
        </motion.div>
      )}
    </div>
  );
}
