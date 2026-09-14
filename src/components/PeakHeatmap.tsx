import { useMemo, useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { motion } from 'framer-motion';
import { DayStat } from '../store/AppContext';

interface PeakHeatmapProps {
  stats: DayStat[];
  color?: string;
}

export default function PeakHeatmap({ stats, color = '#E11D48' }: PeakHeatmapProps) {
  // Aggregate hour data across all stats
  // For a real heatmap, we'd need hourly data. 
  // Assuming DayStat has hourly data or we simulate it for the demo.
  // Let's simulate hourly density based on typical business hours (9 AM - 9 PM)
  
  const hours = Array.from({ length: 13 }, (_, i) => i + 9); // 9 AM to 9 PM
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  
  const { user, getSalonTokens } = useApp();
  const [heatmapData, setHeatmapData] = useState<number[][]>(Array(7).fill(Array(13).fill(0)));

  useEffect(() => {
    if (!user) return;
    const loadRealData = async () => {
      const data = Array.from({ length: 7 }, () => Array(13).fill(0));
      const maxCount = 1; // avoid div by 0

      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        const tokens = await getSalonTokens(user.uid, dateStr);
        const dayIndex = d.getDay(); // 0 = Sun, 1 = Mon, etc.
        
        tokens.forEach(t => {
          if (!t.createdAt) return;
          const h = new Date(t.createdAt).getHours();
          const hourIndex = h - 9; // 9 AM to 9 PM
          if (hourIndex >= 0 && hourIndex < 13) {
            data[dayIndex][hourIndex]++;
          }
        });
      }

      // Normalize data to 0.0 - 1.0 based on maximum value observed
      let maxVal = 1;
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 13; c++) {
          if (data[r][c] > maxVal) maxVal = data[r][c];
        }
      }

      const normalized = data.map(row => row.map(val => val / maxVal));
      setHeatmapData(normalized);
    };
    loadRealData();
  }, [user]);


  const getOpacity = (val: number) => {
    if (val < 0.2) return 'bg-white/5';
    if (val < 0.4) return 'bg-primary/20';
    if (val < 0.6) return 'bg-primary/40';
    if (val < 0.8) return 'bg-primary/70';
    return 'bg-primary shadow-[0_0_15px_rgba(225,29,72,0.4)]';
  };

  return (
    <div className="p-6 rounded-[2.5rem] bg-card border border-border overflow-hidden relative group">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-black text-lg tracking-tight">Peak Demand Matrix</h3>
          <p className="text-xs text-text-dim uppercase font-bold tracking-widest">Heatmap Analysis • Next 7 Days</p>
        </div>
        <div className="flex gap-1">
          {[0.2, 0.5, 0.9].map((v, i) => <div key={i} className={`w-3 h-3 rounded-sm ${getOpacity(v)}`} />)}
        </div>
      </div>

      <div className="overflow-x-auto pb-2 scrollbar-hide">
        <div className="min-w-[400px]">
          {/* Header: Hours */}
          <div className="flex mb-2 ml-10">
            {hours.map(h => (
              <div key={h} className="flex-1 text-center text-xs font-black text-text-dim uppercase">
                {h > 12 ? `${h-12}P` : `${h}A`}
              </div>
            ))}
          </div>

          {/* Rows: Days */}
          <div className="space-y-2">
            {days.map((day, di) => (
              <div key={day} className="flex items-center gap-2">
                <div className="w-8 text-xs font-black text-text-dim uppercase text-right mr-2">{day}</div>
                {heatmapData[di].map((val, hi) => (
                  <motion.div
                    key={`${di}-${hi}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: (di * 13 + hi) * 0.005 }}
                    className={`flex-1 h-8 rounded-lg ${getOpacity(val)} transition-all hover:scale-110 hover:z-10 cursor-help relative group/cell`}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs font-black rounded opacity-0 group-hover/cell:opacity-100 whitespace-nowrap z-50">
                      {Math.round(val * 100)}% Occupancy
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/10">
          <p className="text-xs text-primary font-black uppercase tracking-widest leading-relaxed">
            💡 Strategy: High congestion detected Friday Evening. Recommend deploying 2 additional staff for optimal turnover.
          </p>
      </div>
    </div>
  );
}
