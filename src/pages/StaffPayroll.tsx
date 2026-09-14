import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';
import { motion } from 'framer-motion';

interface PayrollEntry { id: string; staffName: string; staffId: string; month: string; baseSalary: number; bonus: number; deductions: number; netPay: number; status: 'pending'|'paid'; paidDate?: string; }

export default function StaffPayroll() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [message, setMessage] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [staffId, setStaffId] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [bonus, setBonus] = useState('0');
  const [deductions, setDeductions] = useState('0');
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7));

  const staffList = businessProfile?.staffMembers || [];

  useEffect(() => { if ((businessProfile as any)?.payroll) setEntries((businessProfile as any).payroll); }, [businessProfile]);
  
  const saveToDb = async (recs: PayrollEntry[]) => { 
    if (!user) return; 
    setSaving(true); 
    try { 
      await updateDoc(doc(db, 'barbers', user.uid), { payroll: recs }); 
      setEntries(recs); 
      triggerHaptic('success'); 
    } catch (e: any) { setMessage('Error: ' + e.message); } 
    setSaving(false); 
  };

  const autoCalc = () => {
    const s = staffList.find(st => st.id === staffId);
    if (!s) return;
    triggerHaptic('light');
    // Automated Logic: 20% commission on earningsToday as a bonus
    const comm = Math.round((s.earningsToday || 0) * 0.20);
    setBonus(comm.toString());
    setBaseSalary("500"); // Base per day/session for demo
    setMessage(`AI Insight: Calculated ₹${comm} commission (20% of today's ₹${s.earningsToday} performance).`);
  };

  const addEntry = async () => {
    const s = staffList.find(st => st.id === staffId);
    if (!s || !baseSalary) return setMessage('Staff selection & base salary required.');
    const base = Number(baseSalary)||0; const bon = Number(bonus)||0; const ded = Number(deductions)||0;
    const e: PayrollEntry = { 
      id: Date.now().toString(), 
      staffName: s.name, 
      staffId: s.id, 
      month, 
      baseSalary: base, 
      bonus: bon, 
      deductions: ded, 
      netPay: base + bon - ded, 
      status: 'pending' 
    };
    await saveToDb([e, ...entries]); 
    setStaffId(''); setBaseSalary(''); setBonus('0'); setDeductions('0');
  };

  const markPaid = async (id: string) => { await saveToDb(entries.map(e => e.id === id ? { ...e, status: 'paid' as const, paidDate: new Date().toISOString() } : e)); };
  const totalPending = entries.filter(e => e.status === 'pending').reduce((a, e) => a + e.netPay, 0);
  const totalPaid = entries.filter(e => e.status === 'paid').reduce((a, e) => a + e.netPay, 0);

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 animate-fadeIn">
      {/* Premium Header */}
      <div className="p-6 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-30 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => nav('/barber/dashboard')} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95">←</button>
          <div>
            <h1 className="font-black text-xl text-emerald-400">Payroll Engine 💵</h1>
            <p className="text-xs text-zinc-500 font-black uppercase tracking-[0.3em]">Total Pending: ₹{totalPending.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Quick Insights */}
        <div className="grid grid-cols-2 gap-4">
           <div className="p-5 rounded-3xl elite-glass spatial-card border-white/5">
              <p className="text-xs text-zinc-500 font-black uppercase tracking-widest mb-1">Total Paid</p>
              <p className="text-2xl font-black text-white">₹{totalPaid.toLocaleString('en-IN')}</p>
           </div>
           <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs text-emerald-400 font-black uppercase tracking-widest mb-1">Efficiency</p>
              <p className="text-2xl font-black text-emerald-500">98.4%</p>
           </div>
        </div>

        {/* Form Container */}
        <div className="p-6 rounded-[2.5rem] elite-glass spatial-card border-white/5 shadow-2xl space-y-6">
          <h2 className="font-black text-sm uppercase tracking-widest text-zinc-400">Deploy Compensation</h2>
          
          <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Recipient</label>
                <select value={staffId} onChange={e => setStaffId(e.target.value)} className="w-full p-4 rounded-2xl bg-black border border-white/10 outline-none font-bold text-sm">
                   <option value="">Select Staff Member</option>
                   {staffList.map(s => <option key={s.id} value={s.id}>{s.name} (Earned: ₹{s.earningsToday})</option>)}
                </select>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Base (₹)</label>
                   <input type="number" value={baseSalary} onChange={e => setBaseSalary(e.target.value)} className="w-full p-4 rounded-2xl bg-black border border-white/10 outline-none font-bold text-sm" />
                </div>
                <div className="space-y-2 relative">
                   <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Commissions (₹)</label>
                   <input type="number" value={bonus} onChange={e => setBonus(e.target.value)} className="w-full p-4 rounded-2xl bg-black border border-white/10 outline-none font-bold text-sm" />
                   {staffId && <button onClick={autoCalc} className="absolute right-3 bottom-3 text-emerald-400 text-xs font-black uppercase">Auto</button>}
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Deductions (₹)</label>
                <input type="number" value={deductions} onChange={e => setDeductions(e.target.value)} className="w-full p-4 rounded-2xl bg-black border border-white/10 outline-none font-bold text-sm text-rose-400" />
             </div>

             <div className="flex items-center justify-between p-4 bg-black rounded-2xl border border-white/5">
                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Net Payout</span>
                <span className="text-xl font-black text-emerald-400">₹{(Number(baseSalary)||0) + (Number(bonus)||0) - (Number(deductions)||0)}</span>
             </div>

             <button disabled={saving || !staffId} onClick={addEntry} className="w-full py-5 bg-emerald-500 text-black rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50">
                {saving ? 'Processing...' : 'Authorize Transaction →'}
             </button>
          </div>
        </div>

        {/* Records */}
        <div className="space-y-4">
           <h3 className="font-black text-xs text-zinc-500 uppercase tracking-widest px-1">Ledger Activity</h3>
           <div className="space-y-3">
              {entries.map(e => (
                <div key={e.id} className="p-5 rounded-3xl elite-glass spatial-card border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors">
                  <div>
                    <p className="text-sm font-black text-white">{e.staffName}</p>
                    <p className="text-xs text-zinc-500 font-black uppercase tracking-widest mt-1">{e.month}</p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="text-lg font-black text-emerald-400">₹{e.netPay}</p>
                      <p className="text-xs text-zinc-500 font-bold">Base: ₹{e.baseSalary} + Comm: ₹{e.bonus}</p>
                    </div>
                    {e.status === 'pending' ? (
                      <button onClick={() => markPaid(e.id)} className="px-4 py-2 bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase border border-emerald-500/20 rounded-xl hover:bg-emerald-500 hover:text-black transition-all">Pay</button>
                    ) : (
                      <span className="text-xs font-black text-emerald-500 uppercase">Settled</span>
                    )}
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    {message && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg z-50 text-sm">{message} <button onClick={() => setMessage('')} className="ml-2 text-white/50 hover:text-white">&times;</button></div>}
</div>
  );
}
