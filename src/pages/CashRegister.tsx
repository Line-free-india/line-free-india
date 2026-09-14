import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

interface CashEntry { id: string; type: 'in'|'out'; amount: number; description: string; paymentMode: string; time: string; }

export default function CashRegister() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<'in'|'out'>('in'); const [amount, setAmount] = useState(''); const [description, setDescription] = useState(''); const [paymentMode, setPaymentMode] = useState('cash');

  useEffect(() => { if ((businessProfile as any)?.cashRegister) setEntries((businessProfile as any).cashRegister); }, [businessProfile]);
  const saveToDb = async (recs: CashEntry[]) => { if (!user) return; setSaving(true); try { await updateDoc(doc(db, 'users', user.uid), { cashRegister: recs }); setEntries(recs); triggerHaptic('success'); } catch(e:any) { alert('Error: ' + e.message); } setSaving(false); };

  const addEntry = async () => {
    if (!amount) return alert('Amount required.');
    const e: CashEntry = { id: Date.now().toString(), type, amount: Number(amount), description: description.trim(), paymentMode, time: new Date().toISOString() };
    await saveToDb([e, ...entries]); setAmount(''); setDescription('');
  };

  const todayEntries = entries.filter(e => { try { return new Date(e.time).toDateString() === new Date().toDateString(); } catch { return false; } });
  const totalIn = todayEntries.filter(e=>e.type==='in').reduce((a,e)=>a+e.amount,0);
  const totalOut = todayEntries.filter(e=>e.type==='out').reduce((a,e)=>a+e.amount,0);
  const balance = totalIn - totalOut;

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-background to-background">
      <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div><h1 className="font-black text-lg text-emerald-400">Cash Register 💵</h1><p className="text-xs text-emerald-200/50 font-bold uppercase tracking-widest">Balance: ₹{balance}</p></div>
        </div>
      </div>
      <div className="p-4 space-y-6">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card border border-emerald-500/20 rounded-2xl p-3 text-center"><p className="text-xs font-black text-emerald-400">₹{totalIn}</p><p className="text-xs text-text-dim font-bold uppercase">Cash In</p></div>
          <div className="bg-card border border-rose-500/20 rounded-2xl p-3 text-center"><p className="text-xs font-black text-rose-400">₹{totalOut}</p><p className="text-xs text-text-dim font-bold uppercase">Cash Out</p></div>
          <div className="elite-glass rounded-2xl p-3 text-center spatial-card"><p className={`text-xs font-black ${balance>=0?'text-emerald-400':'text-rose-400'}`}>₹{balance}</p><p className="text-xs text-text-dim font-bold uppercase">Net</p></div>
        </div>
        <div className="p-5 rounded-3xl elite-glass spatial-card">
          <div className="flex gap-1 bg-card-2 p-1 rounded-xl border border-border mb-4">{(['in','out'] as const).map(t => (<button key={t} onClick={() => setType(t)} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${type===t?(t==='in'?'bg-emerald-500 text-white':'bg-rose-500 text-white'):'text-text-dim'}`}>{t==='in'?'💰 Cash In':'📤 Cash Out'}</button>))}</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim text-xs">₹</span><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount *" className="w-full p-3 pl-7 rounded-xl bg-background border border-border outline-none text-sm font-black text-emerald-200" /></div>
            <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs font-bold text-emerald-300"><option>cash</option><option>upi</option><option>card</option></select>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="col-span-2 w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-emerald-100" />
            <button disabled={saving} onClick={addEntry} className={`col-span-2 w-full py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 ${type==='in'?'bg-emerald-600 text-white':'bg-rose-600 text-white'}`}>{saving?'Recording...':'Record'}</button>
          </div>
        </div>
        <div className="space-y-2">{todayEntries.map(e => (
          <div key={e.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border">
            <div className={`w-2 h-8 rounded-full ${e.type==='in'?'bg-emerald-500':'bg-rose-500'}`}></div>
            <div className="flex-1"><p className="text-xs font-bold text-emerald-100">{e.description || (e.type==='in'?'Cash In':'Cash Out')}</p><p className="text-xs text-text-dim">{new Date(e.time).toLocaleTimeString()} • {e.paymentMode}</p></div>
            <p className={`text-sm font-black ${e.type==='in'?'text-emerald-400':'text-rose-400'}`}>{e.type==='in'?'+':'-'}₹{e.amount}</p>
          </div>
        ))}</div>
      </div>
    </div>
  );
}
