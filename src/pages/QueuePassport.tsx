import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import BottomNav from '../components/BottomNav';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer as RechartsContainer } from 'recharts';

export default function QueuePassport() {
  const { user, customerProfile, getCustomerFullHistory, allSalons } = useApp();
  const nav = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  
  useEffect(() => {
    if (user?.uid) {
      getCustomerFullHistory(user.uid).then(res => setHistory(res || []));
    }
  }, [user]);

  const doneTokens = history.filter(t => t.status === 'done');
  const visits = doneTokens.length;
  const places = new Set(doneTokens.map(t => t.salonId)).size;
  const spent = doneTokens.reduce((sum, t) => sum + (t.totalPrice || 0), 0);
  
  // Chart Data
  const monthlyMap: Record<string, number> = {};
  doneTokens.forEach(t => {
    if (t.createdAt) {
      const d = new Date(t.createdAt);
      const m = d.toLocaleString('default', { month: 'short' });
      monthlyMap[m] = (monthlyMap[m] || 0) + 1;
    }
  });
  const chartData = Object.keys(monthlyMap).map(k => ({ name: k, visits: monthlyMap[k] }));
  
  // Fav places
  const favoriteSalons = allSalons.filter(s => customerProfile?.favoriteSalons?.includes(s.uid)).slice(0, 3);

  return (
    <ResponsiveContainer variant="customer">
      <div className="h-full overflow-y-auto pb-32 bg-bg custom-scrollbar">
        {/* Header */}
        <div className="pt-12 px-6 pb-6 bg-card border-b border-separator">
          <div className="flex items-center gap-4">
            {customerProfile?.photoURL ? (
              <img src={customerProfile.photoURL} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-primary" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                {(customerProfile?.name || 'U')[0]}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-text mb-1">{customerProfile?.name}</h1>
              <p className="text-text-dim text-sm">Member since {new Date(customerProfile?.createdAt || Date.now()).getFullYear()}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats Box */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card rounded-2xl p-6 border border-separator shadow-sm flex justify-between text-center">
            <div>
              <p className="text-3xl font-black text-text mb-1">{visits}</p>
              <p className="text-xs text-text-dim uppercase font-bold tracking-wider">Visits</p>
            </div>
            <div className="w-px bg-separator"></div>
            <div>
              <p className="text-3xl font-black text-text mb-1">{places}</p>
              <p className="text-xs text-text-dim uppercase font-bold tracking-wider">Places</p>
            </div>
            <div className="w-px bg-separator"></div>
            <div>
              <p className="text-3xl font-black text-primary mb-1">₹{spent}</p>
              <p className="text-xs text-text-dim uppercase font-bold tracking-wider">Spent</p>
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <h2 className="text-sm font-bold text-text mb-3 uppercase tracking-wider">⭐ Rating & Badges</h2>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="px-4 py-2 bg-card-2 border border-border rounded-lg text-sm font-bold">
                ⭐ 4.8 avg
              </div>
              <div className="px-4 py-2 bg-card-2 border border-border rounded-lg text-sm font-bold text-gold">
                🏆 {customerProfile?.loyaltyPoints || 1240} Points
              </div>
              <div className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold">Regular</div>
              <div className="px-3 py-1.5 bg-success/10 text-success border border-success/20 rounded-lg text-xs font-bold">Early Bird</div>
            </div>
          </motion.div>

          {/* Chart */}
          {chartData.length > 0 && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-card p-5 rounded-2xl border border-separator shadow-sm">
              <h2 className="text-sm font-bold text-text mb-4 uppercase tracking-wider">📈 Monthly Activity</h2>
              <div className="h-40">
                <RechartsContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--color-card-2)', border: 'none', borderRadius: 8, color: '#fff' }} />
                    <XAxis dataKey="name" stroke="var(--color-text-dim)" fontSize={12} tickLine={false} axisLine={false} />
                    <Bar dataKey="visits" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </RechartsContainer>
              </div>
            </motion.div>
          )}

          {/* Favorite Places */}
          {favoriteSalons.length > 0 && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
              <h2 className="text-sm font-bold text-text mb-3 uppercase tracking-wider">🏪 Favorite Places</h2>
              <div className="space-y-3">
                {favoriteSalons.map(biz => (
                  <div key={biz.uid} onClick={() => nav(`/customer/salon/${biz.uid}`)} className="flex items-center gap-4 p-3 bg-card border border-border rounded-xl cursor-pointer shadow-sm">
                    <img src={biz.photoURL || biz.bannerImageURL} className="w-12 h-12 rounded-lg object-cover bg-card-2" alt="" />
                    <div>
                      <p className="font-bold text-sm text-text">{biz.businessName}</p>
                      <p className="text-xs text-text-dim">{biz.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recent Activity Timeline */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <h2 className="text-sm font-bold text-text mb-3 uppercase tracking-wider">📜 Recent Activity</h2>
            <div className="relative pl-4 border-l-2 border-border space-y-6">
              {doneTokens.slice(0, 10).map(t => (
                <div key={t.id} className="relative">
                  <div className="absolute -left-[23px] top-1 w-3 h-3 bg-primary rounded-full ring-4 ring-bg" />
                  <p className="text-xs text-text-dim font-medium mb-1">{t.date}</p>
                  <div className="bg-card p-3 border border-border rounded-xl shadow-sm">
                    <p className="font-bold text-sm text-text mb-1">{t.salonName}</p>
                    <p className="text-xs text-text-dim">{t.selectedServices.map(s => s.name).join(', ')} • ₹{t.totalPrice}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      <BottomNav />
    </ResponsiveContainer>
  );
}
