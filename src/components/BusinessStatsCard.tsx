import { motion } from 'framer-motion';

interface BusinessStatsCardProps {
  icon: string;
  label: string;
  value: string | number;
  change?: number; // percentage
  color: string;
}

export default function BusinessStatsCard({ icon, label, value, change, color }: BusinessStatsCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      className="p-6 rounded-2xl bg-card border border-border"
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-card-2 border border-border"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}
        >
          {icon}
        </div>
        <span className="text-xs text-text-dim font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-black text-text" style={{ color }}>{value}</div>
      {change !== undefined && (
        <div className={`text-xs font-bold mt-1 flex items-center gap-1 ${change >= 0 ? 'text-success' : 'text-danger'}`}>
          {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
          <span className="text-text-dim font-medium">vs last week</span>
        </div>
      )}
    </motion.div>
  );
}
