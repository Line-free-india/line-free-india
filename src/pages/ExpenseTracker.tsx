import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

interface Expense { id: string; date: string; category: string; description: string; amount: number; paymentMethod: string; notes: string; }

export default function ExpenseTracker() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState('all');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Supplies');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  const categories = ['Supplies','Rent','Utilities','Salaries','Marketing','Equipment','Transport','Food','Maintenance','Other'];

  useEffect(() => { if ((businessProfile as any)?.expenses) setExpenses((businessProfile as any).expenses); }, [businessProfile]);

  const saveToDb = async (recs: Expense[]) => {
    if (!user) return; setSaving(true);
    try { await updateDoc(doc(db, 'users', user.uid), { expenses: recs }); setExpenses(recs); triggerHaptic('success'); } catch (e: any) { alert('Error: ' + e.message); }
    setSaving(false);
  };

  const addExpense = async () => {
    if (!description || !amount) return alert('Description and amount required.');
    const exp: Expense = { id: Date.now().toString(), date, category, description: description.trim(), amount: Number(amount), paymentMethod, notes: notes.trim() };
    await saveToDb([exp, ...expenses]);
    setDescription(''); setAmount(''); setNotes('');
  };

  const deleteExp = async (id: string) => {
    if (confirm('Delete this expense?')) await saveToDb(expenses.filter(e => e.id !== id));
  };

  const filtered = filterCat === 'all' ? expenses : expenses.filter(e => e.category === filterCat);
  const totalSpent = filtered.reduce((a, e) => a + e.amount, 0);

  // Monthly grouping
  const thisMonth = expenses.filter(e => { const d = new Date(e.date); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); });
  const monthlyTotal = thisMonth.reduce((a, e) => a + e.amount, 0);

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-background to-background">
      <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div><h1 className="font-black text-lg text-red-400">Expense Tracker 📊</h1><p className="text-xs text-red-200/50 font-bold uppercase tracking-widest">This Month: ₹{monthlyTotal}</p></div>
        </div>
      </div>
      <div className="p-4 space-y-6">
        <div className="p-5 rounded-3xl elite-glass spatial-card">
          <h2 className="font-black text-sm text-text mb-4">Log Expense</h2>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-red-100" />
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs font-bold text-red-300">{categories.map(c => <option key={c}>{c}</option>)}</select>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description *" className="col-span-2 w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-red-100 font-bold" />
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim text-xs">₹</span><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="w-full p-3 pl-7 rounded-xl bg-background border border-border outline-none text-xs text-red-200 font-black" /></div>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-red-300">{['cash','upi','card','bank_transfer'].map(m => <option key={m} value={m}>{m}</option>)}</select>
            <button disabled={saving} onClick={addExpense} className="col-span-2 w-full py-3 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">{saving ? 'Saving...' : 'Log Expense'}</button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={() => setFilterCat('all')} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${filterCat==='all'?'bg-red-500 text-white':'bg-card border border-border text-text-dim'}`}>All (₹{totalSpent})</button>
          {categories.map(c => { const ct = expenses.filter(e=>e.category===c).reduce((a,e)=>a+e.amount,0); return ct > 0 ? <button key={c} onClick={() => setFilterCat(c)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${filterCat===c?'bg-red-500 text-white':'bg-card border border-border text-text-dim'}`}>{c}</button> : null; })}
        </div>
        <div className="space-y-2">
          {filtered.length === 0 ? (<div className="text-center py-8 border border-dashed border-border rounded-3xl opacity-50 bg-card"><span className="text-3xl block mb-2">💸</span><p className="text-xs font-bold text-text-dim">No expenses logged.</p></div>
          ) : filtered.map(e => (
            <div key={e.id} className="flex items-center gap-3 p-3 rounded-2xl elite-glass spatial-card group">
              <div className="flex-1"><p className="text-xs font-bold text-red-100">{e.description}</p><p className="text-xs text-text-dim font-bold">{new Date(e.date).toLocaleDateString()} • {e.category} • {e.paymentMethod}</p></div>
              <p className="text-sm font-black text-red-400">₹{e.amount}</p>
              <button onClick={() => deleteExp(e.id)} className="w-6 h-6 rounded-md bg-danger/10 text-danger flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
