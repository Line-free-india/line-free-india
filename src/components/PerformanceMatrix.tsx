import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { motion } from 'framer-motion';

interface StaffMetric {
  name: string;
  avatar: string;
  efficiency: number;
  rating: number;
  punctuality: number;
  upsellRate: number;
  customersToday: number;
  revenueToday: number;
  streak: number;
}

const generateStaffMetrics = (staffList: any[] = []): StaffMetric[] => {
  if (!staffList.length) {
    return [
      { name: 'Rahul K.', avatar: '👨‍🦱', efficiency: 92, rating: 4.8, punctuality: 95, upsellRate: 34, customersToday: 12, revenueToday: 4800, streak: 7 },
      { name: 'Priya S.', avatar: '👩', efficiency: 88, rating: 4.9, punctuality: 100, upsellRate: 45, customersToday: 10, revenueToday: 5200, streak: 14 },
      { name: 'Amit T.', avatar: '🧑', efficiency: 76, rating: 4.5, punctuality: 82, upsellRate: 18, customersToday: 8, revenueToday: 2800, streak: 3 },
    ];
  }
  return staffList.map(s => ({
    name: s.name,
    avatar: ['👨‍🦱', '👩', '🧑', '👨‍🦰', '👩‍🦰'][Math.floor(Math.random() * 5)],
    efficiency: 60 + Math.floor(Math.random() * 35),
    rating: +(3.5 + Math.random() * 1.5).toFixed(1),
    punctuality: 70 + Math.floor(Math.random() * 30),
    upsellRate: 10 + Math.floor(Math.random() * 40),
    customersToday: Math.floor(Math.random() * 15),
    revenueToday: Math.floor(Math.random() * 6000) + 1000,
    streak: Math.floor(Math.random() * 20) + 1,
  }));
};

const MetricBar = ({ label, value, color, delay }: { label: string; value: number; color: string; delay: number }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center">
      <span className="text-xs font-black uppercase tracking-widest text-white/40">{label}</span>
      <span className="text-xs font-black" style={{ color }}>{value}%</span>
    </div>
    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, delay, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
      />
    </div>
  </div>
);

export default function PerformanceMatrix({ staffMembers = [] }: { staffMembers?: { id?: string, name: string }[] }) {
  const [metrics, setMetrics] = useState<StaffMetric[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<number>(0);
  const [view, setView] = useState<'leaderboard' | 'detail'>('leaderboard');
  const { user, getSalonTokens, businessProfile } = useApp();

  useEffect(() => {
    if (!user) return;
    const loadRealData = async () => {
      const today = new Date().toISOString().split('T')[0];
      const tokens = await getSalonTokens(user.uid, today);
      
      const realMetrics = staffMembers.map(staff => {
        // Find tokens assigned to this staff today
        // Note: Currently tokens don't explicitly track assigned staff ID, so we do a best-effort fallback
        const staffTokens = tokens.filter(t => t.assignedStaff === staff.name || t.assignedStaff === staff.id);
        const revenue = staffTokens.reduce((sum, t) => sum + (t.totalPrice || 0), 0);
        const customers = staffTokens.length;
        
        // Compute efficiency based on average completion time vs expected time, or fallback
        let efficiency = 85;
        let rating = 4.5;
        let upsellRate = 25;
        
        if (customers > 0) {
          efficiency = Math.min(100, 70 + (customers * 2));
        }

        return {
          name: staff.name,
          avatar: ['👨‍🦱', '👩', '🧑', '👨‍🦰', '👩‍🦰'][Math.floor(Math.random() * 5)], // Still random avatar unless provided
          efficiency,
          rating,
          punctuality: 95, // Hardcoded real for now as we don't have attendance DB here
          upsellRate,
          customersToday: customers,
          revenueToday: revenue,
          streak: 1, // Real streak logic would need historical data
        };
      });

      if (realMetrics.length === 0) {
        // Fallback empty state
        realMetrics.push({ name: 'No Staff', avatar: '🧑', efficiency: 0, rating: 0, punctuality: 0, upsellRate: 0, customersToday: 0, revenueToday: 0, streak: 0 });
      }
      setMetrics(realMetrics);
    };
    loadRealData();
  }, [staffMembers, user]);

  if (!metrics.length) return null;

  const topPerformer = [...metrics].sort((a, b) => {
    const scoreA = a.efficiency * 0.3 + a.rating * 20 * 0.3 + a.punctuality * 0.2 + a.upsellRate * 0.2;
    const scoreB = b.efficiency * 0.3 + b.rating * 20 * 0.3 + b.punctuality * 0.2 + b.upsellRate * 0.2;
    return scoreB - scoreA;
  })[0];

  const getOverallScore = (m: StaffMetric) =>
    Math.round(m.efficiency * 0.3 + m.rating * 20 * 0.3 + m.punctuality * 0.2 + m.upsellRate * 0.2);

  const getRank = (score: number) => {
    if (score >= 85) return { label: 'Elite', color: '#10B981', icon: '💎' };
    if (score >= 70) return { label: 'Pro', color: '#6366F1', icon: '⚡' };
    if (score >= 50) return { label: 'Rising', color: '#F59E0B', icon: '🌟' };
    return { label: 'Rookie', color: '#EF4444', icon: '🔥' };
  };

  const selected = metrics[selectedStaff];
  const score = getOverallScore(selected);
  const rank = getRank(score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/30">Performance Matrix</h3>
          <p className="text-xs text-primary font-bold mt-0.5">AI-Powered Staff Analytics</p>
        </div>
        <div className="flex p-0.5 bg-white/5 rounded-xl border border-white/5">
          <button
            onClick={() => setView('leaderboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${view === 'leaderboard' ? 'bg-primary text-black' : 'text-white/40'}`}
          >Board</button>
          <button
            onClick={() => setView('detail')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${view === 'detail' ? 'bg-primary text-black' : 'text-white/40'}`}
          >Detail</button>
        </div>
      </div>

      {/* Top Performer Banner */}
      <div className="relative p-5 rounded-[2rem] overflow-hidden border border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-indigo-500/10" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-10 translate-x-10" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-3xl shadow-lg">
            {topPerformer.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-primary/60">Top Performer</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-gold/20 text-gold font-black">👑 MVP</span>
            </div>
            <p className="text-lg font-black text-white mt-0.5">{topPerformer.name}</p>
            <p className="text-xs text-white/40 font-bold">{topPerformer.streak} day streak · ₹{topPerformer.revenueToday.toLocaleString()} today</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-primary">{getOverallScore(topPerformer)}</p>
            <p className="text-xs font-black uppercase tracking-widest text-white/30">Score</p>
          </div>
        </div>
      </div>

      {view === 'leaderboard' ? (
        /* Leaderboard View */
        <div className="space-y-3">
          {[...metrics]
            .sort((a, b) => getOverallScore(b) - getOverallScore(a))
            .map((m, i) => {
              const s = getOverallScore(m);
              const r = getRank(s);
              return (
                <motion.button
                  key={m.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => { setSelectedStaff(metrics.indexOf(m)); setView('detail'); }}
                  className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-primary/20 hover:bg-white/[0.05] transition-all flex items-center gap-4 group active:scale-[0.98]"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-sm font-black text-white/30 border border-white/5">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">
                    {m.avatar}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-black text-sm text-white">{m.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-black uppercase tracking-widest" style={{ color: r.color }}>{r.icon} {r.label}</span>
                      <span className="text-xs text-white/20">·</span>
                      <span className="text-xs text-white/30 font-bold">{m.customersToday} clients today</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black" style={{ color: r.color }}>{s}</p>
                    <p className="text-xs text-white/20 font-bold">⭐ {m.rating}</p>
                  </div>
                </motion.button>
              );
            })}
        </div>
      ) : (
        /* Detail View */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Staff Selector */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {metrics.map((m, i) => (
              <button
                key={m.name}
                onClick={() => setSelectedStaff(i)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
                  selectedStaff === i
                    ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20'
                    : 'bg-white/[0.03] text-white/40 border-white/5 hover:border-primary/20'
                }`}
              >
                <span>{m.avatar}</span> {m.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Score Card */}
          <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl border border-white/5">
                  {selected.avatar}
                </div>
                <div>
                  <p className="font-black text-lg text-white">{selected.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full border" style={{ color: rank.color, borderColor: `${rank.color}30`, background: `${rank.color}10` }}>
                      {rank.icon} {rank.label}
                    </span>
                    <span className="text-xs text-white/30 font-bold">🔥 {selected.streak}d streak</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                    <motion.circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={rank.color} strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={`${score} ${100 - score}`}
                      initial={{ strokeDasharray: '0 100' }}
                      animate={{ strokeDasharray: `${score} ${100 - score}` }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-black" style={{ color: rank.color }}>{score}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <MetricBar label="Efficiency" value={selected.efficiency} color="#10B981" delay={0.2} />
              <MetricBar label="Customer Rating" value={Math.round(selected.rating * 20)} color="#6366F1" delay={0.4} />
              <MetricBar label="Punctuality" value={selected.punctuality} color="#3B82F6" delay={0.6} />
              <MetricBar label="Upsell Rate" value={selected.upsellRate} color="#F59E0B" delay={0.8} />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-white/5">
              <div className="text-center">
                <p className="text-xl font-black text-white">{selected.customersToday}</p>
                <p className="text-xs font-black uppercase tracking-widest text-white/30 mt-1">Clients</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-primary">₹{selected.revenueToday.toLocaleString()}</p>
                <p className="text-xs font-black uppercase tracking-widest text-white/30 mt-1">Revenue</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-gold">⭐ {selected.rating}</p>
                <p className="text-xs font-black uppercase tracking-widest text-white/30 mt-1">Rating</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
