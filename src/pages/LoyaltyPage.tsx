import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import BottomNav from '../components/BottomNav';
import BackButton from '../components/BackButton';

interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

interface LoyaltyData {
  uid: string;
  points: number;
  totalEarned: number;
  totalVisits: number;
  currentStreak: number;
  longestStreak: number;
  level: string;
  levelIndex: number;
  history: { date: string; points: number; desc: string; salonName: string }[];
  achievements: string[]; // unlocked achievement ids
  joinedAt: string;
}

const LEVELS = [
  { name: 'Member',      icon: '🌱', min: 0,    color: 'text-gray-400',    bg: 'from-gray-400/20 to-gray-500/5',    border: 'border-gray-400/30',    perks: ['Welcome to LineFree Super App!'] },
  { name: 'Pro',         icon: '⚡', min: 50,   color: 'text-blue-400',    bg: 'from-blue-400/20 to-blue-500/5',    border: 'border-blue-400/30',    perks: ['Pro Member badge', 'Priority in search results'] },
  { name: 'Bronze VIP',  icon: '🥉', min: 150,  color: 'text-amber-600',   bg: 'from-amber-500/20 to-amber-600/5',  border: 'border-amber-500/30',   perks: ['Bronze badge on profile', 'Early access to new partners'] },
  { name: 'Silver VIP',  icon: '🥈', min: 350,  color: 'text-gray-300',    bg: 'from-gray-300/20 to-gray-400/5',    border: 'border-gray-300/30',    perks: ['Silver badge', 'Featured customer', 'Partner recognition'] },
  { name: 'Gold VIP',    icon: '🥇', min: 700,  color: 'text-yellow-400',  bg: 'from-yellow-400/20 to-yellow-500/5',border: 'border-yellow-400/30',  perks: ['Gold badge', 'VIP tag visible to businesses', 'Special greetings'] },
  { name: 'Platinum',    icon: '💎', min: 1200, color: 'text-cyan-400',    bg: 'from-cyan-400/20 to-cyan-500/5',    border: 'border-cyan-400/30',    perks: ['Platinum badge', 'Top customer globally', 'Exclusive member support'] },
  { name: 'Diamond',     icon: '💠', min: 2000, color: 'text-blue-300',    bg: 'from-blue-300/20 to-blue-400/5',    border: 'border-blue-300/30',    perks: ['Diamond status', 'LineFree Hall of Fame', 'Special icon in chat'] },
  { name: 'Legend',      icon: '👑', min: 3500, color: 'text-purple-400',  bg: 'from-purple-400/20 to-purple-500/5',border: 'border-purple-400/30',  perks: ['Legend crown', 'Permanent top status', 'LineFree OG badge'] },
];

const ALL_ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  { id: 'first_visit',     icon: '🎉', title: 'First Booking',      desc: 'Complete your first partner visit' },
  { id: 'visit_5',         icon: '⭐', title: 'Regular Patron',     desc: 'Complete 5 bookings' },
  { id: 'visit_10',        icon: '🔟', title: 'Decade Club',        desc: 'Complete 10 bookings' },
  { id: 'visit_25',        icon: '🏅', title: 'Loyal Consumer',     desc: 'Complete 25 bookings' },
  { id: 'visit_50',        icon: '🏆', title: 'Half Century',       desc: 'Complete 50 bookings' },
  { id: 'visit_100',       icon: '💯', title: 'Century Club',       desc: 'Complete 100 bookings' },
  { id: 'streak_3',        icon: '🔥', title: 'On Fire',            desc: '3 bookings in a week' },
  { id: 'streak_7',        icon: '🌟', title: 'Week Warrior',       desc: '7 day booking streak' },
  { id: 'streak_30',       icon: '📅', title: 'Monthly Master',     desc: '30 day active streak' },
  { id: 'early_bird',      icon: '🌅', title: 'Early Bird',         desc: 'Reserve a service before 9 AM' },
  { id: 'night_owl',       icon: '🦉', title: 'Night Owl',          desc: 'Reserve a service after 7 PM' },
  { id: 'review_1',        icon: '✍️', title: 'First Review',       desc: 'Write your first business review' },
  { id: 'review_5',        icon: '📝', title: 'Critic',             desc: 'Write 5 verified reviews' },
  { id: 'explorer_3',      icon: '🗺️', title: 'Explorer',          desc: 'Visit 3 different business categories' },
  { id: 'explorer_5',      icon: '🧭', title: 'Adventurer',         desc: 'Visit 5 different partner stores' },
  { id: 'points_500',      icon: '💰', title: 'Coin Collector',     desc: 'Earn 500 total LineFree Coins' },
  { id: 'points_1000',     icon: '🏦', title: 'Coin Master',        desc: 'Earn 1000 total LineFree Coins' },
  { id: 'level_gold',      icon: '🥇', title: 'Going for Gold',     desc: 'Reach Gold VIP level' },
  { id: 'level_platinum',  icon: '💎', title: 'Platinum Player',    desc: 'Reach Platinum VIP level' },
  { id: 'level_legend',    icon: '👑', title: 'The Legend',         desc: 'Reach Legend VIP level' },
  { id: 'monday_visit',    icon: '📆', title: 'Monday Motivation',  desc: 'Book a service on Monday' },
  { id: 'weekend_visit',   icon: '🎊', title: 'Weekend Warrior',    desc: 'Book a service on the weekend' },
  { id: 'messenger',       icon: '💬', title: 'Communicator',       desc: 'Send your first message to a business' },
  { id: 'referral_1',      icon: '🤝', title: 'Referral King',      desc: 'Refer 1 friend to the Super App' },
];

function getLevelInfo(points: number) {
  let levelIdx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min) { levelIdx = i; break; }
  }
  return { level: LEVELS[levelIdx], levelIdx };
}

function getNextLevel(levelIdx: number) {
  return levelIdx < LEVELS.length - 1 ? LEVELS[levelIdx + 1] : null;
}

const POINTS_PER_VISIT = 15; // Increased base reward for Super App

export default function LoyaltyPage() {
  const { user, customerProfile, getCustomerFullHistory } = useApp();
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'levels' | 'history'>('overview');

  useEffect(() => { if (user) loadLoyalty(); }, [user]);

  const loadLoyalty = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const ref = doc(db, 'loyalty', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setLoyalty(snap.data() as LoyaltyData);
      } else {
        // Bootstrap from visit history
        const history = await getCustomerFullHistory(user.uid);
        const done = history.filter(t => t.status === 'done');
        const points = done.length * POINTS_PER_VISIT;
        const { level, levelIdx } = getLevelInfo(points);
        const unlockedAchievements: string[] = [];
        if (done.length >= 1)  unlockedAchievements.push('first_visit');
        if (done.length >= 5)  unlockedAchievements.push('visit_5');
        if (done.length >= 10) unlockedAchievements.push('visit_10');
        if (done.length >= 25) unlockedAchievements.push('visit_25');
        if (done.length >= 50) unlockedAchievements.push('visit_50');
        if (done.length >= 100)unlockedAchievements.push('visit_100');
        if (points >= 500)     unlockedAchievements.push('points_500');
        if (points >= 1000)    unlockedAchievements.push('points_1000');
        if (levelIdx >= 4)     unlockedAchievements.push('level_gold');
        if (levelIdx >= 5)     unlockedAchievements.push('level_platinum');
        if (levelIdx >= 7)     unlockedAchievements.push('level_legend');

        const newData: LoyaltyData = {
          uid: user.uid,
          points, totalEarned: points, totalVisits: done.length,
          currentStreak: 0, longestStreak: 0,
          level: level.name, levelIndex: levelIdx,
          history: done.slice(0, 30).map(t => ({
            date: t.date, points: POINTS_PER_VISIT, desc: 'Partner Booking', salonName: t.salonName || 'Business',
          })),
          achievements: unlockedAchievements,
          joinedAt: new Date().toISOString().slice(0, 10),
        };
        await setDoc(ref, newData);
        setLoyalty(newData);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (!loyalty) return (
    <div className="min-h-screen pb-40 animate-fadeIn bg-background">
      <div className="p-6">
        <BackButton to="/customer/profile" />
        <h1 className="text-3xl font-black mb-5 mt-2 gradient-text">Rewards 💰</h1>
        {loading ? <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 rounded-3xl bg-card animate-pulse shadow-sm" />)}</div> : <p className="text-text-dim text-center py-10 font-bold">Could not load loyalty data</p>}
      </div>
      <BottomNav />
    </div>
  );

  const { level, levelIdx } = getLevelInfo(loyalty.points);
  const nextLevel = getNextLevel(levelIdx);
  const progress = nextLevel ? Math.min(100, ((loyalty.points - level.min) / (nextLevel.min - level.min)) * 100) : 100;
  const ptsToNext = nextLevel ? nextLevel.min - loyalty.points : 0;

  const achievements: Achievement[] = ALL_ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: (loyalty.achievements || []).includes(a.id),
    unlockedAt: (loyalty.achievements || []).includes(a.id) ? 'Unlocked' : undefined,
  }));
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="min-h-screen pb-40 animate-fadeIn bg-background">
      <div className="p-6">
        <BackButton to="/customer/profile" />
        
        <div className="flex justify-between items-end mt-2 mb-6">
          <div>
            <h1 className="text-3xl font-black gradient-text">LineFree VIP 💠</h1>
            <p className="text-text-dim text-sm font-bold uppercase tracking-widest mt-1">
              {customerProfile?.name || 'Super App Member'}
            </p>
          </div>
          <div className="w-12 h-12 elite-glass border-white/5 shadow-inner rounded-2xl flex items-center justify-center text-2xl relative overflow-hidden spatial-card">
            {customerProfile?.photoURL ? <img src={customerProfile.photoURL} alt="" className="w-full h-full object-cover" /> : '👤'}
          </div>
        </div>

        {/* ── SUPER APP LEVEL CARD ── */}
        <div className={`p-6 rounded-3xl bg-gradient-to-br ${level.bg} border ${level.border} mb-6 relative overflow-hidden shadow-sm`}>
          <div className="absolute -right-6 -bottom-6 text-[120px] opacity-[0.07] transform rotate-12">{level.icon}</div>
          
          <div className="flex items-start justify-between mb-8 relative z-10">
            <div>
              <p className="text-xs uppercase font-black tracking-widest text-text-dim mb-1">VIP Tier</p>
              <div className="flex items-center gap-2">
                <span className="text-4xl filter drop-shadow-md">{level.icon}</span>
                <h2 className={`text-3xl font-black ${level.color} tracking-tight`}>{level.name}</h2>
              </div>
            </div>
            <div className="text-right bg-black/10 px-3 py-2 rounded-2xl border border-white/5 backdrop-blur-sm">
              <p className={`text-3xl font-black ${level.color}`}>{loyalty.points.toLocaleString('en-IN')}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-text-dim mt-0.5">LF Coins</p>
            </div>
          </div>

          <div className="relative z-10">
            {nextLevel ? (
              <>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-text-dim mb-2 px-1">
                  <span>{level.name} ({level.min})</span>
                  <span>{nextLevel.icon} {nextLevel.name} ({nextLevel.min})</span>
                </div>
                <div className="w-full h-3 rounded-full bg-black/30 overflow-hidden mb-2 shadow-inner border border-white/5">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${levelIdx >= 5 ? 'bg-gradient-to-r from-cyan-600 to-cyan-400' : levelIdx >= 4 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : levelIdx >= 2 ? 'bg-gradient-to-r from-amber-600 to-amber-500' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`} 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
                <p className={`text-sm font-black tracking-wide ${level.color}`}>{ptsToNext} Coins needed for {nextLevel.name} upgrade</p>
              </>
            ) : (
              <p className={`text-sm font-black uppercase tracking-widest ${level.color}`}>👑 Maximum Prestige Reached</p>
            )}
          </div>
        </div>

        {/* ── QUICK METRICS ── */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-card border border-border text-center shadow-sm relative overflow-hidden group">
            <div className="absolute -right-2 -bottom-2 text-4xl opacity-[0.03] group-hover:scale-125 transition-transform">🛍️</div>
            <p className="text-xl font-black gradient-text relative z-10">{loyalty.totalVisits}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-text-dim mt-0.5 relative z-10">Bookings</p>
          </div>
          <div className="p-3 rounded-2xl bg-card border border-border text-center shadow-sm relative overflow-hidden group">
            <div className="absolute -right-2 -bottom-2 text-4xl opacity-[0.03] group-hover:scale-125 transition-transform">💎</div>
            <p className="text-xl font-black text-gold relative z-10">{loyalty.totalEarned.toLocaleString('en-IN')}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-text-dim mt-0.5 relative z-10">Lifetime</p>
          </div>
          <div className="p-3 rounded-2xl bg-card border border-border text-center shadow-sm relative overflow-hidden group">
            <div className="absolute -right-2 -bottom-2 text-4xl opacity-[0.03] group-hover:scale-125 transition-transform">🔥</div>
            <p className="text-xl font-black text-danger relative z-10">{loyalty.currentStreak}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-text-dim mt-0.5 relative z-10">Streak</p>
          </div>
          <div className="p-3 rounded-2xl bg-card border border-border text-center shadow-sm relative overflow-hidden group">
             <div className="absolute -right-2 -bottom-2 text-4xl opacity-[0.03] group-hover:scale-125 transition-transform">🏅</div>
            <p className="text-xl font-black text-success relative z-10">{unlockedCount}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-text-dim mt-0.5 relative z-10">Badges</p>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex elite-glass border-white/5 p-1.5 rounded-2xl mb-6 shadow-sm overflow-x-auto no-scrollbar spatial-card">
          {(['overview', 'achievements', 'levels', 'history'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[80px] py-2 px-1 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab ? 'bg-primary text-white shadow-md scale-100' : 'text-text-dim hover:text-text scale-95'}`}>
              {tab === 'overview' ? '🏠 Overview' : tab === 'achievements' ? '🎖️ Badges' : tab === 'levels' ? '📊 Tiers' : '📋 History'}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Perks */}
            <div className="p-5 rounded-3xl bg-card border border-border shadow-sm">
              <h3 className="font-black text-base flex items-center gap-2 mb-4">{level.icon} {level.name} Benefits</h3>
              <div className="space-y-3">
                {level.perks.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-xs border border-success/30">✓</span>
                    <p className="text-sm font-medium text-text">{p}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* How to earn */}
            <div className="p-5 rounded-3xl bg-card border border-border shadow-sm">
              <h3 className="font-black text-base flex items-center gap-2 mb-4">⚡ Earning LF Coins</h3>
              <div className="space-y-2">
                {[
                  { icon: '🛍️', label: `+${POINTS_PER_VISIT} Coins`, desc: 'Per completed partner booking' },
                  { icon: '⭐', label: '+10 Coins', desc: 'Leave a verified review' },
                  { icon: '📱', label: '+50 Coins', desc: 'Invite a friend to the app' },
                  { icon: '🔥', label: '+25 Bonus', desc: '3 bookings in a 7-day span' },
                  { icon: '💬', label: '+5 Coins', desc: 'Interact with a business' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-card-2 border border-border/50 hover:bg-card-2/80 transition-colors">
                    <span className="text-2xl drop-shadow-md">{item.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-black gradient-text">{item.label}</p>
                      <p className="text-xs text-text-dim font-medium mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent unlocked achievements */}
            {achievements.filter(a => a.unlocked).length > 0 && (
              <div className="p-5 rounded-3xl bg-card border border-border shadow-sm">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="font-black text-base">🎖️ Latest Badges</h3>
                  <p className="text-xs text-text-dim font-bold uppercase tracking-widest">{unlockedCount}/{ALL_ACHIEVEMENTS.length} unlocked</p>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {achievements.filter(a => a.unlocked).slice(0, 8).map(a => (
                    <div key={a.id} className="p-3 rounded-2xl bg-gradient-to-br from-success/10 to-success/5 border border-success/30 text-center shadow-inner relative overflow-hidden group">
                      <div className="absolute inset-0 bg-success/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-3xl block mb-1.5 filter drop-shadow-md scale-100 group-hover:scale-110 transition-transform">{a.icon}</span>
                      <p className="text-xs font-black uppercase tracking-widest text-text leading-tight truncate px-1">{a.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ACHIEVEMENTS TAB ── */}
        {activeTab === 'achievements' && (
          <div className="animate-slideUp">
            <div className="flex justify-between items-center mb-5 px-1">
              <div>
                <h3 className="font-black text-lg">Badge Collection</h3>
                <p className="text-text-dim text-xs font-bold uppercase tracking-widest mt-0.5">{unlockedCount} of {ALL_ACHIEVEMENTS.length} Mastered</p>
              </div>
              <div className="w-24 h-2.5 rounded-full bg-card border border-border shadow-inner overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000" style={{ width: `${(unlockedCount / ALL_ACHIEVEMENTS.length) * 100}%` }} />
              </div>
            </div>
            <div className="space-y-3">
              {achievements.map((a, i) => (
                <div key={a.id} className={`flex items-center gap-4 p-4 rounded-3xl border transition-all duration-300 shadow-sm ${a.unlocked ? 'bg-gradient-to-r from-success/10 via-success/5 to-transparent border-success/30' : 'bg-card border-border opacity-60 hover:opacity-100 grayscale hover:grayscale-0'}`} style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border shadow-inner flex-shrink-0 ${a.unlocked ? 'bg-success/20 border-success/40 scale-100' : 'bg-card-2 border-border/50 scale-95'}`}>
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-black text-sm truncate pr-2 ${a.unlocked ? 'text-text' : 'text-text-dim'}`}>{a.title}</p>
                    <p className="text-text-dim text-xs font-medium mt-0.5 leading-snug pr-2">{a.desc}</p>
                  </div>
                  {a.unlocked
                    ? <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center font-black shadow-md shadow-success/20">✓</div>
                    : <div className="text-border text-2xl opacity-50">🔒</div>
                  }
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LEVELS TAB ── */}
        {activeTab === 'levels' && (
          <div className="space-y-4 animate-slideUp">
             <div className="mb-4 px-1">
                <h3 className="font-black text-lg">VIP Tiers</h3>
                <p className="text-text-dim text-xs font-bold uppercase tracking-widest mt-0.5">Climb the ranks for exclusive benefits</p>
              </div>
            {LEVELS.map((l, i) => {
              const isCurrent = i === levelIdx;
              const isPast = i < levelIdx;
              const isNext = i === levelIdx + 1;
              return (
                <div key={l.name} className={`p-5 rounded-3xl border transition-all shadow-sm ${isCurrent ? `bg-gradient-to-br ${l.bg} ${l.border} ring-2 ring-primary/20` : isPast ? 'bg-success/5 border-success/30 opacity-90' : 'bg-card border-border opacity-60'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner border ${isCurrent ? 'bg-white/10 border-white/20' : isPast ? 'bg-success/20 border-success/30' : 'bg-card-2 border-border'}`}>
                      {l.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className={`font-black text-xl tracking-tight ${l.color}`}>{l.name}</p>
                        {isCurrent && <span className="text-xs uppercase tracking-widest bg-primary text-white border border-primary/50 shadow-sm px-2.5 py-0.5 rounded-full font-black">Current Status</span>}
                        {isPast && <span className="text-xs uppercase tracking-widest bg-success text-white border border-success/50 px-2.5 py-0.5 rounded-full font-bold">✓ Unlocked</span>}
                        {isNext && <span className="text-xs uppercase tracking-widest bg-warning/20 text-warning border border-warning/30 px-2.5 py-0.5 rounded-full font-black animate-pulse">Next Target</span>}
                      </div>
                      <p className="text-text-dim text-xs font-semibold">{l.min.toLocaleString('en-IN')}+ LF Coins Required</p>
                    </div>
                    {isCurrent && <p className={`font-black text-2xl ${l.color}`}>{loyalty.points}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {l.perks.map((p, j) => (
                      <span key={j} className={`text-xs px-2.5 py-1 rounded-md border font-bold uppercase tracking-wide ${isCurrent || isPast ? 'bg-success/10 border-success/30 text-success' : 'bg-card-2 border-border/50 text-text-dim'}`}>
                        {isCurrent || isPast ? '✓' : '🔒'} {p}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div className="animate-slideUp">
            <div className="mb-4 px-1">
              <h3 className="font-black text-lg">Transaction Ledger</h3>
              <p className="text-text-dim text-xs font-bold uppercase tracking-widest mt-0.5">Your lifetime LF Coin history</p>
            </div>
            {(loyalty.history || []).length === 0 ? (
              <div className="text-center py-20 bg-card rounded-3xl border border-border shadow-inner">
                <span className="text-6xl block mb-4 opacity-50 animate-float">📊</span>
                <p className="font-black text-lg">No Ledger Activity</p>
                <p className="text-text-dim text-xs mt-1 font-medium max-w-[200px] mx-auto">Complete a booking at any partner business to earn coins.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(loyalty.history || []).map((h, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-3xl bg-card border border-border shadow-sm hover:border-primary/30 transition-colors">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 shadow-inner border ${h.points > 0 ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'}`}>
                      {h.points > 0 ? `+${h.points}` : h.points}
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <p className="font-black text-sm truncate text-text">{h.desc}</p>
                      <p className="text-text-dim text-xs font-bold uppercase tracking-widest mt-1 truncate pr-2">{h.salonName} • {h.date}</p>
                    </div>
                    <div className="text-right">
                       <p className={`font-black text-lg leading-none ${h.points > 0 ? 'text-success' : 'text-danger'}`}>
                        {h.points > 0 ? '+' : ''}{h.points}
                      </p>
                      <p className="text-xs font-black uppercase tracking-widest text-text-dim mt-1">Coins</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
