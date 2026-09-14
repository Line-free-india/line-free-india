import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

interface Contract { id: string; clientName: string; clientPhone: string; title: string; startDate: string; endDate: string; value: number; status: 'draft'|'active'|'completed'|'expired'; terms: string; renewalDate?: string; }

export default function ContractManager() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState(''); const [clientPhone, setClientPhone] = useState(''); const [title, setTitle] = useState(''); const [value, setValue] = useState(''); const [endDate, setEndDate] = useState(''); const [terms, setTerms] = useState('');

  useEffect(() => { if ((businessProfile as any)?.contracts) setContracts((businessProfile as any).contracts); }, [businessProfile]);
  const saveToDb = async (recs: Contract[]) => { if (!user) return; setSaving(true); try { await updateDoc(doc(db, 'users', user.uid), { contracts: recs }); setContracts(recs); triggerHaptic('success'); } catch(e:any) { alert('Error: ' + e.message); } setSaving(false); };

  const addContract = async () => {
    if (!clientName || !title) return alert('Client & title required.');
    const c: Contract = { id: Date.now().toString(), clientName: clientName.trim(), clientPhone: clientPhone.trim(), title: title.trim(), startDate: new Date().toISOString(), endDate: endDate || new Date(Date.now()+365*24*60*60*1000).toISOString(), value: Number(value)||0, status: 'draft', terms: terms.trim() };
    await saveToDb([c, ...contracts]); setClientName(''); setClientPhone(''); setTitle(''); setValue(''); setEndDate(''); setTerms('');
  };

  const updateStatus = async (id: string, s: Contract['status']) => { await saveToDb(contracts.map(c => c.id === id ? { ...c, status: s } : c)); };
  const totalActive = contracts.filter(c => c.status === 'active').reduce((a,c) => a + c.value, 0);

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-700/20 via-background to-background">
      <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div><h1 className="font-black text-lg text-zinc-300">Contract Manager 📝</h1><p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">₹{totalActive} Active Contracts</p></div>
        </div>
      </div>
      <div className="p-4 space-y-6">
        <div className="p-5 rounded-3xl elite-glass spatial-card border-white/5 shadow-md">
          <h2 className="font-black text-sm text-text mb-4">New Contract</h2>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client Name *" className="w-full p-3 rounded-xl bg-background border border-border outline-none font-bold text-sm text-zinc-100" />
            <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="Phone" className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-zinc-100" />
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Contract Title *" className="col-span-2 w-full p-3 rounded-xl bg-background border border-border outline-none text-xs font-bold text-zinc-100" />
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim text-xs">₹</span><input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="Value" className="w-full p-3 pl-7 rounded-xl bg-background border border-border outline-none text-xs font-black text-zinc-200" /></div>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-zinc-100" />
            <button disabled={saving} onClick={addContract} className="col-span-2 w-full py-3 bg-zinc-200 text-zinc-900 rounded-xl font-black uppercase tracking-widest text-xs shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">{saving?'Creating...':'Create Contract'}</button>
          </div>
        </div>
        <div className="space-y-3">{contracts.map(c => (
          <div key={c.id} className={`p-4 rounded-3xl elite-glass spatial-card shadow-sm ${c.status==='completed'||c.status==='expired'?'border-white/5 opacity-50':'border-zinc-600/30'}`}>
            <div className="flex justify-between items-start mb-2"><div><h4 className="font-black text-sm text-zinc-100">{c.title}</h4><p className="text-xs text-text-dim">{c.clientName} • {new Date(c.startDate).toLocaleDateString()} — {new Date(c.endDate).toLocaleDateString()}</p></div><div className="text-right"><p className="font-black text-zinc-300">₹{c.value}</p><span className={`text-xs font-black uppercase px-1.5 py-0.5 rounded ${c.status==='active'?'bg-emerald-500/20 text-emerald-400':c.status==='draft'?'bg-blue-500/20 text-blue-400':'bg-zinc-500/20 text-zinc-400'}`}>{c.status}</span></div></div>
            <div className="flex gap-2 mt-2">
              {c.status === 'draft' && <button onClick={() => updateStatus(c.id, 'active')} className="flex-1 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase hover:bg-emerald-500 hover:text-white transition-all">Activate</button>}
              {c.status === 'active' && <button onClick={() => updateStatus(c.id, 'completed')} className="flex-1 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase hover:bg-blue-500 hover:text-white transition-all">Complete</button>}
            </div>
          </div>
        ))}</div>
      </div>
    </div>
  );
}
