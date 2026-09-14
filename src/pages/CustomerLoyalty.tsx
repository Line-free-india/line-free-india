import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp, getCategoryInfo } from '../store/AppContext';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { triggerHaptic } from '../utils/haptics';
import ResponsiveContainer from '../components/ResponsiveContainer';

const POINTS_PER_VISIT = 10;
const REWARD_LEVELS = [
  { pts: 50, reward: '5% Discount', icon: '🎁', tier: 'Bronze' },
  { pts: 100, reward: 'Free Add-on Service', icon: '✨', tier: 'Silver' },
  { pts: 250, reward: 'Priority Queue Skip', icon: '⚡', tier: 'Gold' },
  { pts: 500, reward: 'One Free Service', icon: '🏆', tier: 'Platinum' },
];

export default function CustomerLoyalty() {
  const { businessId } = useParams<{ businessId: string }>();
  const { user, allSalons } = useApp();
  const nav = useNavigate();

  const [points, setPoints] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);
  const [loading, setLoading] = useState(true);
  const business = allSalons.find(s => s.uid === businessId);
  const catInfo = getCategoryInfo(business?.businessType || 'other');

  const currentTier = points >= 250 ? 'Gold' : points >= 100 ? 'Silver' : points >= 50 ? 'Bronze' : 'Novice';
  const tierColor = currentTier === 'Gold' ? '#fbbf24' : currentTier === 'Silver' ? '#94a3b8' : currentTier === 'Bronze' ? '#cd7f32' : '#ffffff';

  const CAT_COLOR: Record<string, string> = {
    men_salon: '#00f0ff', beauty_parlour: '#ff6eb4', unisex_salon: '#a855f7', restaurant: '#f59e0b',
    cafe: '#d97706', clinic: '#0d9488', hospital: '#0ea5e9', gym: '#dc2626', spa: '#7c3aed',
    coaching: '#4338ca', pet_care: '#16a34a', law_firm: '#94a3b8', photography: '#c026d3',
    repair_shop: '#ea580c', laundry: '#0891b2', other: '#10b981',
  };
  const aurora = CAT_COLOR[business?.businessType || 'other'] || '#6366f1';

  useEffect(() => {
    if (!user || !businessId) return;
    const docRef = doc(db, 'loyalty', `${user.uid}_${businessId}`);
    getDoc(docRef).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setPoints(data.points || 0);
        setTotalVisits(data.totalVisits || 0);
      }
      setLoading(false);
    });
  }, [user, businessId]);

  const nextReward = REWARD_LEVELS.find(r => r.pts > points);
  const progressPct = nextReward ? Math.min(100, (points / nextReward.pts) * 100) : 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060810]">
        <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: `${aurora}40`, borderTopColor: aurora }} />
      </div>
    );
  }

  return (
    <ResponsiveContainer variant="customer">
    <div className="min-h-screen pb-32 relative overflow-hidden text-white font-sans">
      <div className="fixed inset-0 -z-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10" />
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <motion.div animate={{ x: ['-20%','20%'], y: ['-10%','10%'], scale: [1, 1.2, 1] }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] rounded-full blur-[100px] opacity-20"
          style={{ background: `radial-gradient(circle, ${aurora} 0%, transparent 70%)` }} />
      </div>

      <div className="p-6 relative z-10">
        <div className="flex justify-between items-center mb-10">
           <button onClick={() => nav(-1)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 active:scale-90 transition-all text-xl">←</button>
           <div className="text-right">
              <p className="text-xs text-zinc-500 font-black uppercase tracking-[0.3em] font-mono leading-none">Status Level</p>
              <p className="text-xl font-black italic tracking-tighter uppercase" style={{ color: tierColor }}>{currentTier} Member</p>
           </div>
        </div>

        {/* Status Card */}
        <div className="p-8 rounded-[3rem] text-center mb-8 border backdrop-blur-3xl relative overflow-hidden group shadow-2xl"
          style={{ background: `linear-gradient(135deg, ${aurora}15, rgba(0,0,0,0.8))`, borderColor: `${aurora}30` }}>
          <div className="absolute -right-6 -top-6 text-[8rem] opacity-5 rotate-12">{currentTier === 'Gold' ? '👑' : '⭐'}</div>
          <div className="relative z-10">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] mb-4 font-mono opacity-60">Loyalty Quota</h2>
            <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 4, repeat: Infinity }} className="text-8xl font-black mb-2 tracking-tighter" style={{ color: aurora }}>{points}</motion.div>
            <p className="text-zinc-400 font-bold mb-8">Points Accumulated</p>

            {nextReward && (
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-black uppercase tracking-wider mb-2">
                   <span className="text-zinc-500">Next Milestone</span>
                   <span style={{ color: aurora }}>{nextReward.icon} {nextReward.reward}</span>
                </div>
                <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                   <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 2, ease: 'circOut' }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${aurora}80, ${aurora})`, boxShadow: `0 0 15px ${aurora}50` }} />
                </div>
                <p className="text-xs text-zinc-500 font-black uppercase tracking-widest">{Math.round(nextReward.pts - points)} PTS to {nextReward.tier} tier</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-4 mb-10">
           <div className="p-5 rounded-[2rem] bg-zinc-900 border border-white/5 text-center">
              <p className="text-xs text-zinc-500 font-black uppercase tracking-widest mb-1">Total Visits</p>
              <p className="text-2xl font-black">{totalVisits}</p>
           </div>
           <div className="p-5 rounded-[2rem] bg-zinc-900 border border-white/5 text-center">
              <p className="text-xs text-zinc-500 font-black uppercase tracking-widest mb-1">Visits to Bonus</p>
              <p className="text-2xl font-black text-emerald-400">{5 - (totalVisits % 5)}</p>
           </div>
        </div>

        {/* Referral Tracker Section */}
        <div className="mb-10 rounded-[2.5rem] bg-slate-900/40 border border-white/10 p-6 backdrop-blur-xl relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
           <div className="flex justify-between items-center mb-6">
              <div>
                 <h3 className="font-black text-sm uppercase tracking-widest">Referral Engine</h3>
                 <p className="text-xs text-zinc-500 font-bold">Invite friends, earn 50 pts each</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-xl">🤝</div>
           </div>
           
           <div className="bg-black/60 rounded-3xl p-4 border border-white/5 mb-6">
              <div className="flex justify-between text-sm font-black mb-2 px-1">
                 <span>Code: LFI-{user?.uid.slice(0,6).toUpperCase() || 'REF000'}</span>
                 <button className="text-indigo-400 uppercase tracking-widest" onClick={() => triggerHaptic('medium')}>Copy</button>
              </div>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed px-1">Share this code with your network. Once they complete their first visit, you both receive a Gold-tier bonus token.</p>
           </div>

           <button onClick={() => triggerHaptic('success')} className="w-full py-4 rounded-[1.5rem] bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.3em] shadow-lg shadow-indigo-600/30 active:scale-95 transition-all">Invite Now</button>
        </div>

        {/* Reward Levels List */}
        <h2 className="text-xs font-black uppercase tracking-[0.4em] mb-4 text-zinc-500 px-2">Reward Protocol</h2>
        <div className="space-y-3 mb-8">
          {REWARD_LEVELS.map((r, i) => {
            const unlocked = points >= r.pts;
            return (
              <motion.div key={r.pts} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className={`flex items-center gap-4 p-5 rounded-3xl border transition-all ${unlocked ? 'bg-zinc-900 border-white/10 shadow-xl' : 'bg-transparent border-white/5 opacity-40'}`}>
                <div className="text-3xl filter drop-shadow-lg">{r.icon}</div>
                <div className="flex-1">
                  <p className="text-xs font-black uppercase tracking-widest leading-none mb-1" style={{ color: unlocked ? aurora : '#666' }}>{r.tier} Tier</p>
                  <h4 className="font-bold text-sm text-white">{r.reward}</h4>
                </div>
                {unlocked && <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs text-emerald-400">✓</div>}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
    </ResponsiveContainer>
  );
}
