import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpotlightSearchProps {
  items: { id: string; title: string; icon: string; subtitle?: string; path: string }[];
  onSelect: (path: string) => void;
  placeholder?: string;
}

export default function SpotlightSearch({ items, onSelect, placeholder = 'Search anything...' }: SpotlightSearchProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return items.filter(i => i.title.toLowerCase().includes(q) || i.subtitle?.toLowerCase().includes(q)).slice(0, 8);
  }, [query, items]);

  return (
    <div className="relative">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
        focused ? 'aurora-glass' : 'bg-card border border-border'
      }`}>
        <span className="text-text-dim text-sm">🔍</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none text-text placeholder:text-text-dim"
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-text-dim text-xs hover:text-text">✕</button>
        )}
      </div>
      <AnimatePresence>
        {focused && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full mt-2 left-0 right-0 z-50 rounded-2xl overflow-hidden aurora-glass"
          >
            {filtered.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => { onSelect(item.path); setQuery(''); setFocused(false); }}
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-primary/10 transition-colors border-b border-white/5 last:border-b-0"
              >
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{item.title}</div>
                  {item.subtitle && <div className="text-xs text-text-dim">{item.subtitle}</div>}
                </div>
                <span className="text-text-dim text-xs">→</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
