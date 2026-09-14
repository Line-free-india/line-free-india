import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, BUSINESS_CATEGORIES } from '../store/AppContext';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminDashboard() {
  const { allSalons, signOutUser } = useApp();
  const nav = useNavigate();
  
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [todayTokens, setTodayTokens] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const custSnap = await getDocs(collection(db, 'customers'));
        setTotalCustomers(custSnap.size);

        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const todayTokensSnap = await getDocs(query(collection(db, 'tokens'), where('date', '==', todayStr)));
        setTodayTokens(todayTokensSnap.size);

        const allTokensSnap = await getDocs(collection(db, 'tokens'));
        setTotalTokens(allTokensSnap.size);

        // Compute estimated revenue from token data
        let rev = 0;
        allTokensSnap.forEach(d => {
          const data = d.data();
          if (data.totalPrice) rev += Number(data.totalPrice);
        });
        setTotalRevenue(rev);
      } catch (e) {
        console.warn("Failed to fetch admin stats", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const [statusMsg, setStatusMsg] = useState('');

  const suspendSalon = async (salonId: string, isSuspended: boolean) => {
    try {
      await updateDoc(doc(db, 'barbers', salonId), { isStopped: !isSuspended });
      setStatusMsg(`Business ${isSuspended ? 'unsuspended' : 'suspended'} successfully.`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (e) {
      console.error('Failed to update business status:', e);
      setStatusMsg('Failed to update business status.');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    nav('/', { replace: true });
  };

  // Category breakdown
  const categoryBreakdown = BUSINESS_CATEGORIES.map(cat => ({
    ...cat,
    count: allSalons.filter(s => s.businessType === cat.id).length,
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

  const activeSalons = allSalons.filter(s => s.isOpen && !s.isStopped);
  const maxCatCount = Math.max(1, ...categoryBreakdown.map(c => c.count));

  return (
    <div className="min-h-screen bg-bg text-text pb-12 animate-fadeIn font-sans">
      {/* Header */}
      <div className="p-6 bg-card border-b border-border shadow-sm flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-black gradient-text">☁️ LineFree Command</h1>
          <p className="text-xs text-text-dim font-medium uppercase tracking-widest mt-0.5">Platform Operations Hub</p>
        </div>
        <button onClick={handleLogout} className="px-4 py-2 bg-danger/10 text-danger text-sm font-bold rounded-xl active:scale-95 transition-transform border border-danger/20">
          Logout
        </button>
      </div>

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '🏪', label: 'Businesses', value: allSalons.length, color: 'primary' },
            { icon: '🟢', label: 'Active Now', value: activeSalons.length, color: 'success' },
            { icon: '👥', label: 'Users', value: loading ? '…' : totalCustomers, color: 'blue-400' },
            { icon: '🎫', label: 'Tokens Today', value: loading ? '…' : todayTokens, sub: `/ ${totalTokens} total`, color: 'accent' },
          ].map(kpi => (
            <div key={kpi.label} className="p-5 rounded-2xl bg-card border border-border flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
              <div className="absolute -inset-2 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-3xl mb-2 relative z-10">{kpi.icon}</span>
              <p className="text-3xl font-black relative z-10">{kpi.value}</p>
              {kpi.sub && <p className="text-xs text-text-dim relative z-10">{kpi.sub}</p>}
              <p className="text-xs text-text-dim font-bold uppercase tracking-wider relative z-10 mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Revenue Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 flex items-center justify-between">
          <div>
            <p className="text-xs text-text-dim font-bold uppercase tracking-widest">Estimated Platform Revenue</p>
            <p className="text-4xl font-black gradient-text mt-1">₹{loading ? '…' : totalRevenue.toLocaleString('en-IN')}</p>
            <p className="text-xs text-text-dim mt-1">From all processed token orders</p>
          </div>
          <span className="text-6xl opacity-30">💰</span>
        </div>

        {/* Category Breakdown */}
        <div className="elite-glass rounded-2xl overflow-hidden p-5 spatial-card">
          <h2 className="text-lg font-bold mb-4">📊 Business Category Breakdown</h2>
          {categoryBreakdown.length === 0 ? (
            <p className="text-text-dim text-sm py-4 text-center">No businesses registered yet.</p>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map(cat => (
                <div key={cat.id} className="flex items-center gap-3">
                  <span className="text-xl w-7 flex-shrink-0">{cat.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>{cat.label}</span>
                      <span className="text-primary">{cat.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-card-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
                        style={{ width: `${(cat.count / maxCatCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global Heatmap */}
        <div className="elite-glass rounded-2xl overflow-hidden p-5 spatial-card">
          <h2 className="text-lg font-bold mb-4">📍 Geographic Density Map</h2>
          <div className="w-full h-48 bg-card-2 rounded-xl relative overflow-hidden border border-border/50">
            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8Y2lyY2xlIGN4PSIyIiBjeT0iMiIgcj0iMSIgZmlsbD0iI2ZmZiI+PC9jaXJjbGU+Cjwvc3ZnPg==')] " />
            {allSalons.map(s => {
              if (!s.lat || !s.lng) return null;
              const x = Math.max(0, Math.min(100, ((s.lng - 68) / (97 - 68)) * 100));
              const y = Math.max(0, Math.min(100, 100 - ((s.lat - 8) / (37 - 8)) * 100));
              const cat = BUSINESS_CATEGORIES.find(c => c.id === s.businessType);
              return (
                <div key={s.uid} title={s.businessName} className="absolute w-5 h-5 -ml-2.5 -mt-2.5 flex items-center justify-center text-base cursor-pointer hover:scale-150 transition-transform" style={{ left: `${x}%`, top: `${y}%` }}>
                  {cat?.icon || '📍'}
                </div>
              );
            })}
            {allSalons.filter(s => s.lat).length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-text-dim text-sm">No location data yet</span>
              </div>
            )}
          </div>
          <p className="text-xs text-text-dim mt-2">Each emoji represents a registered business with GPS data.</p>
        </div>

        {/* Businesses Table */}
        <div className="elite-glass rounded-2xl overflow-hidden spatial-card">
          <div className="p-5 border-b border-border bg-card-2/50 flex justify-between items-center">
            <h2 className="text-lg font-bold">All Registered Businesses</h2>
            <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg">{allSalons.length}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-text-dim">
                  <th className="p-4 font-semibold uppercase text-xs tracking-wider">Type</th>
                  <th className="p-4 font-semibold uppercase text-xs tracking-wider">Info</th>
                  <th className="p-4 font-semibold uppercase text-xs tracking-wider">State</th>
                  <th className="p-4 font-semibold uppercase text-xs tracking-wider">Services</th>
                  <th className="p-4 font-semibold uppercase text-xs tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allSalons.map(s => {
                  const isSuspended = s.isStopped;
                  const cat = BUSINESS_CATEGORIES.find(c => c.id === s.businessType);
                  return (
                    <tr key={s.uid} className="hover:bg-card-2/50 transition-colors">
                      <td className="p-4 text-2xl">{cat?.icon || '🏪'}</td>
                      <td className="p-4">
                        <p className="font-bold">{s.businessName || s.salonName}</p>
                        <p className="text-text-dim text-xs">{s.name} • {cat?.label || 'Business'}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded inline-flex text-xs font-bold ${
                          isSuspended ? 'bg-danger/10 text-danger' :
                          s.isOpen ? 'bg-success/10 text-success' : 'bg-border text-text'
                        }`}>
                          {isSuspended ? 'SUSPENDED' : s.isOpen ? 'OPEN' : 'CLOSED'}
                        </span>
                      </td>
                      <td className="p-4 text-text-dim font-medium">{s.services?.length || 0}</td>
                      <td className="p-4">
                        <button 
                          onClick={() => suspendSalon(s.uid, isSuspended)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isSuspended ? 'bg-success text-white hover:bg-success/90' : 'bg-danger/10 text-danger hover:bg-danger/20'
                          }`}
                        >
                          {isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
