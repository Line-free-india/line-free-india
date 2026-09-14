import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { useNavigate } from 'react-router-dom';

export default function FranchiseDashboard() {
  const { user, allSalons, signOutUser } = useApp();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);

  // Mock franchise data: Just take the first 3 salons for demo
  const franchiseSalons = allSalons.slice(0, 3);
  const totalRevenue = franchiseSalons.reduce((sum, s) => sum + (s.totalEarnings || 0), 0);
  const totalCustomers = franchiseSalons.reduce((sum, s) => sum + (s.totalCustomersAllTime || 0), 0);

  useEffect(() => {
    if (allSalons.length > 0) setLoading(false);
    const tm = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(tm);
  }, [allSalons]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen pb-10 animate-fadeIn bg-background">
      <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-b-[40px] shadow-2xl mb-6 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-gold/20 rounded-full blur-3xl" />
        <div className="flex justify-between items-start mb-6">
          <div className="relative z-10">
            <h1 className="text-2xl font-black text-gold">Master Dashboard</h1>
            <div className="inline-block mt-1 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-widest">
              Demo Data
            </div>
            <p className="text-white/60 text-sm mt-1">{user?.displayName || 'Franchise Owner'}</p>
          </div>
          <button onClick={() => { signOutUser(); nav('/'); }} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm border border-white/20 z-10">🚪</button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-2 relative z-10">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <p className="text-white/60 text-xs uppercase font-bold tracking-wider mb-1">Total Branches</p>
            <p className="text-3xl font-black">{franchiseSalons.length}</p>
            <p className="text-white/50 text-xs mt-1">👥 {totalCustomers} customers</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <p className="text-white/60 text-xs uppercase font-bold tracking-wider mb-1">Network Revenue</p>
            <p className="text-2xl font-black text-gold">₹{totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="px-6">
        <h2 className="text-lg font-bold mb-4">Branch Performance</h2>
        {franchiseSalons.length === 0 ? (
          <div className="text-center py-10 opacity-50">No branches linked yet.</div>
        ) : (
          <div className="space-y-4">
            {franchiseSalons.map((salon, i) => (
              <div key={salon.uid || i} className="p-4 rounded-3xl elite-glass spatial-card border-white/5 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{salon.salonName}</h3>
                    <p className="text-text-dim text-xs mt-0.5">{salon.location || 'Unknown Location'}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${salon.isOpen ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    {salon.isOpen ? '🟢 Online' : '🔴 Offline'}
                  </div>
                </div>
                <div className="flex justify-between text-sm pt-3 border-t border-border/50">
                  <div>
                    <p className="text-text-dim text-xs uppercase tracking-wider">Today's Tokens</p>
                    <p className="font-bold text-lg">{salon.totalTokensToday || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-text-dim text-xs uppercase tracking-wider">Total Revenue</p>
                    <p className="font-black text-success text-lg">₹{(salon.totalEarnings || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
