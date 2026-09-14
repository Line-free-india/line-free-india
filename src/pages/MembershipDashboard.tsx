import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

interface Membership { id: string; name: string; phone: string; plan: string; startDate: string; endDate: string; washesUsed: number; washesTotal: number; status: 'active'|'expired'|'paused'; }

export default function MembershipDashboard() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  const [members, setMembers] = useState<Membership[]>([]);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [plan, setPlan] = useState('Basic'); const [washesTotal, setWashesTotal] = useState('12');

  useEffect(() => { if ((businessProfile as any)?.memberships) setMembers((businessProfile as any).memberships); }, [businessProfile]);

  const saveToDb = async (recs: Membership[]) => { if (!user) return; setSaving(true); try { await updateDoc(doc(db, 'users', user.uid), { memberships: recs }); setMembers(recs); triggerHaptic('success'); } catch (e: any) { alert('Error: ' + e.message); } setSaving(false); };

  const addMember = async () => {
    if (!name || !phone) return alert('Name & phone required.');
    const start = new Date(); const end = new Date(); end.setMonth(end.getMonth() + (plan === 'Premium' ? 6 : plan === 'Gold' ? 3 : 1));
    const m: Membership = { id: Date.now().toString(), name: name.trim(), phone: phone.trim(), plan, startDate: start.toISOString(), endDate: end.toISOString(), washesUsed: 0, washesTotal: Number(washesTotal) || 12, status: 'active' };
    await saveToDb([m, ...members]);
    setName(''); setPhone('');
  };

  const useWash = async (id: string) => { await saveToDb(members.map(m => m.id === id ? { ...m, washesUsed: m.washesUsed + 1 } : m)); };

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background">
      <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div><h1 className="font-black text-lg text-blue-400">Memberships 🎫</h1><p className="text-xs text-blue-200/50 font-bold uppercase tracking-widest">{members.filter(m=>m.status==='active').length} Active</p></div>
        </div>
      </div>
      <div className="p-4 space-y-6">
        <div className="p-5 rounded-3xl elite-glass spatial-card">
          <h2 className="font-black text-sm text-text mb-4">New Membership</h2>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name *" className="w-full p-3 rounded-xl bg-background border border-border outline-none font-bold text-sm text-blue-100" />
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone *" className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-blue-100" />
            <select value={plan} onChange={e => setPlan(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs font-bold text-blue-300"><option>Basic</option><option>Gold</option><option>Premium</option></select>
            <input type="number" value={washesTotal} onChange={e => setWashesTotal(e.target.value)} placeholder="Total Washes" className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs font-bold text-blue-200" />
            <button disabled={saving} onClick={addMember} className="col-span-2 w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">{saving ? 'Saving...' : 'Add Member'}</button>
          </div>
        </div>
        <div className="space-y-3">{members.map(m => { const pct = m.washesTotal > 0 ? Math.round(m.washesUsed/m.washesTotal*100) : 0; return (
          <div key={m.id} className="p-4 rounded-3xl elite-glass spatial-card">
            <div className="flex justify-between items-start mb-3"><div><h4 className="font-black text-sm text-blue-50">{m.name}</h4><p className="text-xs text-blue-200/50 font-bold">{m.plan} • Exp: {new Date(m.endDate).toLocaleDateString()}</p></div><span className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded ${m.status==='active'?'bg-emerald-500/20 text-emerald-400':'bg-rose-500/20 text-rose-400'}`}>{m.status}</span></div>
            <div className="flex items-center gap-3"><div className="flex-1"><div className="h-2 bg-background rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all" style={{width:`${pct}%`}}></div></div></div><span className="text-xs font-black text-blue-400">{m.washesUsed}/{m.washesTotal}</span>{m.status==='active' && m.washesUsed < m.washesTotal && <button onClick={() => useWash(m.id)} className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase hover:bg-blue-500 hover:text-white transition-all">Use</button>}</div>
          </div>
        ); })}</div>
      </div>
    </div>
  );
}
