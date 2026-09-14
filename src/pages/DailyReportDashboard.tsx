import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, getCategoryInfo } from '../store/AppContext';
import { triggerHaptic } from '../utils/haptics';
import { generateDailyReport } from '../utils/generateReport';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaChartBar, 
  FaArrowLeft, 
  FaCalendarAlt, 
  FaDownload, 
  FaShareAlt,
  FaArrowUp,
  FaArrowDown,
  FaUsers,
  FaCreditCard,
  FaBox
} from 'react-icons/fa';

export default function DailyReportDashboard() {
  const { businessProfile, loading } = useApp();
  const nav = useNavigate();
  const [dateStr] = useState(new Date().toLocaleDateString('en-IN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }));

  const catType = businessProfile?.businessType || 'men_salon';
  const catInfo = getCategoryInfo(catType);

  // Helper to filter by today
  const isToday = (date: any) => {
    try {
      if (!date) return false;
      const d = new Date(date);
      return d.toDateString() === new Date().toDateString();
    } catch { return false; }
  };

  const appts = businessProfile?.appointments || [];
  const todayAppts = appts.filter((a: any) => isToday(a.date || a.dateStr || a.createdAt));
  
  const totalRevToday = (businessProfile as any)?.retailSales?.filter((s: any) => isToday(s.dateStr))?.reduce((a: number, s: any) => a + (s.grandTotal || 0), 0) || 0;
  const totalExpToday = (businessProfile as any)?.expenses?.filter((e: any) => isToday(e.date))?.reduce((a: number, e: any) => a + (e.amount || 0), 0) || 0;
  const newCustomers = (businessProfile as any)?.crmCustomers?.filter((c: any) => isToday(c.firstVisit))?.length || 0;
  
  const netProfit = totalRevToday - totalExpToday;
  const healthScore = Math.min(100, Math.max(0, (netProfit > 0 ? 70 : 30) + (todayAppts.length * 5)));

  const stats = [
    { label: 'Revenue Today', value: `₹${totalRevToday}`, icon: <FaCreditCard />, trend: '+12%', color: 'from-emerald-500 to-teal-500' },
    { label: 'Total Expenses', value: `₹${totalExpToday}`, icon: <FaArrowDown />, trend: '-5%', color: 'from-rose-500 to-red-500' },
    { label: 'New Clients', value: newCustomers, icon: <FaUsers />, trend: '+3', color: 'from-blue-500 to-indigo-500' },
    { label: 'Active Tasks', value: todayAppts.length, icon: <FaCalendarAlt />, trend: 'Steady', color: 'from-amber-500 to-orange-500' },
  ];

  const handleDownload = async () => {
    triggerHaptic('medium');
    try {
      await generateDailyReport({
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        revenue: totalRevToday,
        expenses: totalExpToday,
        profit: netProfit,
        customers: todayAppts.length,
        businessName: businessProfile?.businessName || 'My Business',
        locality: businessProfile?.location || 'Unknown Location',
        efficiency: healthScore
      });
    } catch (err) {
      console.error(err);
      alert('Failed to generate report');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
       <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-bg text-text pb-20 animate-fadeIn">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      {/* Premium Header */}
      <div className="sticky top-0 z-30 glass-strong border-b border-border px-4 app-header-safe pb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { triggerHaptic('light'); nav(-1); }}
            className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-text-dim hover:text-text transition-all active:scale-95"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight">Daily Pulse 📊</h1>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-text-dim">{catInfo.label} Operations</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleDownload}
            className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-text-dim hover:text-primary transition-all active:scale-95"
          >
             <FaDownload />
          </button>
           <button onClick={() => triggerHaptic('medium')} className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-all">
             <FaShareAlt />
           </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Date Selection & Alert */}
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2 text-text-dim font-black uppercase tracking-widest text-xs bg-card/50 px-4 py-2 rounded-full border border-border">
              <FaCalendarAlt className="text-primary" />
              {dateStr}
           </div>
           <div className="flex items-center gap-1.5 text-xs font-black text-success uppercase tracking-widest bg-success/10 px-3 py-2 rounded-full border border-success/30">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Finalized
           </div>
        </div>

        {/* Core KPI Grid */}
        <div className="grid grid-cols-2 gap-4">
           {stats.map((stat, i) => (
             <motion.div
               key={stat.label}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className="neu-panel p-5 rounded-[2rem] relative overflow-hidden group"
             >
                <div className={`absolute -right-4 -top-4 w-16 h-16 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700`} />
                <div className="text-xl mb-4 text-text-dim">{stat.icon}</div>
                <p className="text-2xl font-black tracking-tight mb-1">{stat.value}</p>
                <div className="flex items-center justify-between">
                   <p className="text-xs font-black uppercase tracking-widest text-text-dim">{stat.label}</p>
                   <span className="text-xs font-bold text-success">{stat.trend}</span>
                </div>
             </motion.div>
           ))}
        </div>

        {/* Business Health Score */}
        <div className="p-6 rounded-[2.5rem] elite-glass spatial-card border-white/5 relative overflow-hidden">
           <div className="flex justify-between items-center mb-6">
              <div>
                 <h3 className="font-black text-sm uppercase tracking-widest">Efficiency Score</h3>
                 <p className="text-xs text-text-dim font-bold mt-1">Based on queue velocity & margins</p>
              </div>
              <div className="text-3xl font-black text-primary">{healthScore}%</div>
           </div>
           <div className="h-2 w-full bg-card-2 rounded-full overflow-hidden border border-border shadow-inner">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${healthScore}%` }} 
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full" 
              />
           </div>
           <div className="flex justify-between mt-3 text-xs font-black uppercase tracking-widest text-text-dim">
              <span>Underperforming</span>
              <span>Optimal</span>
           </div>
        </div>

        {/* Today's Transactions / Activities */}
        <div>
           <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-black text-sm uppercase tracking-widest">Timeline</h3>
              <button className="text-xs font-black text-primary uppercase tracking-widest">View All →</button>
           </div>
           <div className="space-y-3">
              {todayAppts.length > 0 ? todayAppts.slice(0, 5).map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-3xl elite-glass spatial-card border-white/5 transition-colors hover:border-primary/20">
                   <div className="w-10 h-10 rounded-xl bg-card-2 flex items-center justify-center text-lg shadow-inner">
                     {a.status === 'done' ? '✅' : '⏳'}
                   </div>
                   <div className="flex-1">
                      <p className="text-xs font-black">{a.customerName || a.name || 'Guest User'}</p>
                      <p className="text-xs text-text-dim font-bold uppercase tracking-widest mt-0.5">{a.serviceName || a.category || 'Service'} &bull; {a.time || 'Walk-in'}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-black text-emerald-500">₹{a.totalPrice || a.price || 0}</p>
                      <p className="text-xs font-black uppercase text-text-dim">Success</p>
                   </div>
                </div>
              )) : (
                <div className="py-12 border-2 border-dashed border-border rounded-[2.5rem] flex flex-col items-center justify-center text-center opacity-30">
                   <FaChartBar className="text-4xl mb-4" />
                   <p className="font-black text-xs uppercase tracking-[3px]">No Activity Recorded</p>
                </div>
              )}
           </div>
        </div>

        {/* Inventory Snapshot */}
        <div className="p-6 rounded-[2.5rem] elite-glass spatial-card border-white/5">
           <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                 <FaBox className="text-amber-500" />
                 <h3 className="font-black text-sm uppercase tracking-widest">Inventory Snapshot</h3>
              </div>
              <span className="text-xs bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20 font-black">
                 {businessProfile?.inventory?.filter((p: any) => (p.stock || p.quantity) < 5).length || 0} Low Stock
              </span>
           </div>
           <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-text-dim">
                 <span>Operational Status</span>
                 <span className="text-success">Nominal</span>
              </div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-text-dim">
                 <span>Active Assets</span>
                 <span className="text-text">{businessProfile?.inventory?.length || 0} SKU</span>
              </div>
           </div>
        </div>

        {/* Report Footer */}
        <div className="text-center py-8 opacity-20 hover:opacity-100 transition-opacity">
           <p className="text-xs font-black uppercase tracking-[5px]">Line Free India &bull; Enterprise Operations</p>
        </div>
      </div>
    </div>
  );
}
