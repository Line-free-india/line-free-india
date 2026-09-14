import { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function BusinessHealthScore() {
  const { user, businessProfile, getSalonTokens } = useApp();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<any>(null);
  
  useEffect(() => {
    if (!user || !businessProfile) return;
    const fetchStats = async () => {
      setLoading(true);
      // Rough heuristic calculations for the scores
      const today = new Date().toISOString().split('T')[0];
      const tokens = await getSalonTokens(user.uid, today);
      
      const done = tokens.filter(t => t.status === 'done');
      const waitTimes = tokens.map(t => t.estimatedWaitMinutes).filter(w => w !== undefined);
      const avgWait = waitTimes.length ? waitTimes.reduce((a,b)=>a+b,0)/waitTimes.length : 15;
      
      const eff = Math.max(10, 100 - (avgWait > 20 ? (avgWait - 20) * 2 : 0));
      const revG = done.length > 5 ? 88 : 65; // Simulated revenue growth logic based on tokens
      const rat = businessProfile.rating ? Math.round((businessProfile.rating / 5) * 100) : 85;
      const ret = 76; // Customer Retention (Simulated for now)
      const util = done.length > 0 ? Math.min(100, done.length * 10) : 50; // Staff utilization

      const overall = Math.round((eff + revG + rat + ret + util) / 5);

      setScores({ eff, revG, rat, ret, util, overall });
      setLoading(false);
    };
    fetchStats();
  }, [user, businessProfile]);

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-background to-background">
      <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div>
            <h1 className="font-black text-lg text-indigo-400">Business Health Score 🏥</h1>
            <p className="text-[10px] text-indigo-200/50 font-bold uppercase tracking-widest">AI Performance Metrics</p>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-6">
        {loading || !scores ? (
          <div className="text-center p-10 font-bold text-indigo-400 animate-pulse">Calculating Score...</div>
        ) : (
          <>
            <div className="flex flex-col items-center p-8 rounded-3xl elite-glass spatial-card">
              <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
                  <motion.circle 
                    initial={{ strokeDasharray: "0 300" }}
                    animate={{ strokeDasharray: `${(scores.overall / 100) * 283} 283` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" 
                    className="text-indigo-500"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-black text-text">{scores.overall}</span>
                  <span className="text-[10px] uppercase font-bold text-text-dim">Overall Score</span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-3xl p-5 border border-border shadow-lg">
              <h3 className="text-xs font-black text-text-dim uppercase tracking-widest mb-4">Metric Breakdown</h3>
              <div className="space-y-4">
                {[
                  { label: 'Queue Efficiency', score: scores.eff },
                  { label: 'Customer Retention', score: scores.ret },
                  { label: 'Revenue Growth', score: scores.revG },
                  { label: 'Staff Utilization', score: scores.util },
                  { label: 'Reviews & Ratings', score: scores.rat }
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-text">{m.label}</span>
                      <span className="text-indigo-400">{m.score}/100</span>
                    </div>
                    <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${m.score}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className={`h-full rounded-full ${m.score > 85 ? 'bg-emerald-500' : m.score > 60 ? 'bg-orange-500' : 'bg-red-500'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-3xl p-5">
              <h3 className="text-sm font-black text-indigo-400 mb-3 flex items-center gap-2">🤖 AI Suggestions</h3>
              <ul className="space-y-3">
                <li className="flex gap-2 text-xs text-indigo-100/80 font-bold">
                  <span className="shrink-0 mt-0.5">→</span>
                  Add 1 staff member between 6-8 PM based on peak rush data.
                </li>
                <li className="flex gap-2 text-xs text-indigo-100/80 font-bold">
                  <span className="shrink-0 mt-0.5">→</span>
                  Send re-engagement offers to inactive customers to improve retention.
                </li>
                {scores.eff < 80 && (
                  <li className="flex gap-2 text-xs text-orange-300 font-bold">
                    <span className="shrink-0 mt-0.5">→</span>
                    Queue times are high. Consider taking a short break or adding capacity.
                  </li>
                )}
                {scores.revG > 80 && (
                  <li className="flex gap-2 text-xs text-emerald-400 font-bold">
                    <span className="shrink-0 mt-0.5">→</span>
                    Revenue trending up this week ✅ Keep it up!
                  </li>
                )}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
