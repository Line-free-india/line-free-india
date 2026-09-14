import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';

export default function BusinessAnalyticsPro() {
  const { businessProfile } = useApp();
  const nav = useNavigate();
  const [period, setPeriod] = useState<'today'|'week'|'month'|'all'>('month');

  const bp: any = businessProfile;
  const appts = bp?.appointments || [];
  const sales = bp?.retailSales || [];
  const expenses = bp?.expenses || [];
  const invoices = bp?.invoices || [];
  const customers = bp?.crmCustomers || [];
  const loyalty = bp?.loyaltyMembers || [];
  const services = bp?.services || [];
  const staff = bp?.staff || [];
  const inventory = bp?.inventory || [];

  const filterByDate = (arr: any[], dateKey: string) => {
    const now = new Date();
    return arr.filter((item: any) => {
      try {
        const d = new Date(item[dateKey]);
        if (period === 'today') return d.toDateString() === now.toDateString();
        if (period === 'week') { const w = new Date(); w.setDate(w.getDate() - 7); return d >= w; }
        if (period === 'month') { return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }
        return true;
      } catch { return true; }
    });
  };

  const filteredSales = filterByDate(sales, 'dateStr');
  const filteredExpenses = filterByDate(expenses, 'date');
  const filteredAppts = filterByDate(appts, 'date');
  const totalRevenue = filteredSales.reduce((a: number, s: any) => a + (s.grandTotal || 0), 0);
  const totalExpenses = filteredExpenses.reduce((a: number, e: any) => a + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const avgTicketSize = filteredSales.length > 0 ? Math.round(totalRevenue / filteredSales.length) : 0;
  const paidInvoices = invoices.filter((i: any) => i.status === 'paid').length;
  const pendingInvoices = invoices.filter((i: any) => i.status !== 'paid').length;
  const lowStock = inventory.filter((i: any) => i.stockLevel <= (i.reorderLevel || 5)).length;

  const expByCategory: Record<string, number> = {};
  filteredExpenses.forEach((e: any) => { expByCategory[e.category] = (expByCategory[e.category] || 0) + e.amount; });
  const topExpCats = Object.entries(expByCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const kpis = [
    { label: 'Revenue', value: `₹${totalRevenue}`, icon: '💰', color: 'text-emerald-400', bg: 'from-emerald-500/10' },
    { label: 'Expenses', value: `₹${totalExpenses}`, icon: '📉', color: 'text-red-400', bg: 'from-red-500/10' },
    { label: 'Net Profit', value: `₹${netProfit}`, icon: '📊', color: netProfit >= 0 ? 'text-emerald-400' : 'text-red-400', bg: netProfit >= 0 ? 'from-emerald-500/10' : 'from-red-500/10' },
    { label: 'Appointments', value: filteredAppts.length, icon: '📅', color: 'text-blue-400', bg: 'from-blue-500/10' },
    { label: 'Sales', value: filteredSales.length, icon: '🛍️', color: 'text-fuchsia-400', bg: 'from-fuchsia-500/10' },
    { label: 'Avg Ticket', value: `₹${avgTicketSize}`, icon: '🎫', color: 'text-amber-400', bg: 'from-amber-500/10' },
    { label: 'Customers', value: customers.length, icon: '👥', color: 'text-sky-400', bg: 'from-sky-500/10' },
    { label: 'Loyalty Members', value: loyalty.length, icon: '⭐', color: 'text-yellow-400', bg: 'from-yellow-500/10' },
    { label: 'Services', value: services.length, icon: '✂️', color: 'text-violet-400', bg: 'from-violet-500/10' },
    { label: 'Staff', value: staff.length, icon: '🧑‍💼', color: 'text-indigo-400', bg: 'from-indigo-500/10' },
    { label: 'Paid Invoices', value: paidInvoices, icon: '✅', color: 'text-emerald-400', bg: 'from-emerald-500/10' },
    { label: 'Pending Invoices', value: pendingInvoices, icon: '⏳', color: 'text-amber-400', bg: 'from-amber-500/10' },
    { label: 'Inventory Items', value: inventory.length, icon: '📦', color: 'text-cyan-400', bg: 'from-cyan-500/10' },
    { label: 'Low Stock Alerts', value: lowStock, icon: '⚠️', color: lowStock > 0 ? 'text-red-400' : 'text-emerald-400', bg: lowStock > 0 ? 'from-red-500/10' : 'from-emerald-500/10' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-background to-background">
      <div className="px-4 app-header-safe pb-3.5 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/home')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div><h1 className="font-black text-lg bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">Analytics Pro 🚀</h1><p className="text-xs text-purple-200/50 font-bold uppercase tracking-widest">{businessProfile?.businessName}</p></div>
        </div>
      </div>
      <div className="p-4 space-y-6">
        <div className="flex gap-1.5 bg-card-2 p-1 rounded-xl border border-border">
          {(['today','week','month','all'] as const).map(p => (<button key={p} onClick={() => setPeriod(p)} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${period === p ? 'bg-purple-500 text-white shadow-md' : 'text-text-dim'}`}>{p}</button>))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {kpis.map(k => (<div key={k.label} className={`bg-gradient-to-br ${k.bg} to-card border border-border rounded-3xl p-4 text-center hover:scale-[1.02] transition-transform`}><span className="text-xl block mb-1">{k.icon}</span><p className={`text-lg font-black ${k.color}`}>{k.value}</p><p className="text-xs font-black uppercase tracking-widest text-text-dim mt-1">{k.label}</p></div>))}
        </div>
        {topExpCats.length > 0 && (
          <div className="elite-glass rounded-3xl p-5 spatial-card">
            <h3 className="font-black text-sm text-text mb-3">Expense Breakdown</h3>
            <div className="space-y-2">{topExpCats.map(([cat, amt]) => { const pct = totalExpenses > 0 ? Math.round((amt as number) / totalExpenses * 100) : 0; return (
              <div key={cat}><div className="flex justify-between text-xs mb-1"><span className="font-bold text-zinc-300">{cat}</span><span className="font-black text-red-400">₹{amt} ({pct}%)</span></div><div className="h-1.5 bg-background rounded-full overflow-hidden"><div className="h-full bg-red-500/60 rounded-full transition-all" style={{width:`${pct}%`}}></div></div></div>
            ); })}</div>
          </div>
        )}
        <div className="elite-glass rounded-3xl p-5 spatial-card">
          <h3 className="font-black text-sm text-text mb-3">Business Health Score</h3>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-background"></circle><circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${Math.min(100, Math.max(0, netProfit >= 0 ? 75 + Math.min(25, customers.length) : 30))} 100`} className={netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}></circle></svg>
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-sm font-black text-zinc-100">{Math.min(100, Math.max(0, netProfit >= 0 ? 75 + Math.min(25, customers.length) : 30))}%</span></div>
            </div>
            <div className="flex-1 space-y-1 text-xs">
              <p className="text-zinc-400">Revenue is {netProfit >= 0 ? <span className="text-emerald-400 font-bold">positive ↑</span> : <span className="text-red-400 font-bold">negative ↓</span>}</p>
              <p className="text-zinc-400">{customers.length} total customers in CRM</p>
              <p className="text-zinc-400">{lowStock > 0 ? <span className="text-amber-400 font-bold">{lowStock} items need restock</span> : <span className="text-emerald-400 font-bold">Inventory healthy</span>}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
