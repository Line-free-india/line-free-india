import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

interface Coupon { id: string; code: string; type: 'percentage'|'flat'; value: number; minOrder: number; maxUses: number; usedCount: number; validFrom: string; validTo: string; active: boolean; }

export default function CouponManager() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState(''); const [type, setType] = useState<'percentage'|'flat'>('percentage'); const [value, setValue] = useState(''); const [minOrder, setMinOrder] = useState('0'); const [maxUses, setMaxUses] = useState('100'); const [validTo, setValidTo] = useState('');

  useEffect(() => { if ((businessProfile as any)?.coupons) setCoupons((businessProfile as any).coupons); }, [businessProfile]);
  const saveToDb = async (recs: Coupon[]) => { if (!user) return; setSaving(true); try { await updateDoc(doc(db, 'users', user.uid), { coupons: recs }); setCoupons(recs); triggerHaptic('success'); } catch(e:any) { alert('Error: ' + e.message); } setSaving(false); };

  const addCoupon = async () => {
    if (!code || !value) return alert('Code & value required.');
    const c: Coupon = { id: Date.now().toString(), code: code.trim().toUpperCase(), type, value: Number(value), minOrder: Number(minOrder)||0, maxUses: Number(maxUses)||100, usedCount: 0, validFrom: new Date().toISOString(), validTo: validTo || new Date(Date.now()+30*24*60*60*1000).toISOString(), active: true };
    await saveToDb([c, ...coupons]); setCode(''); setValue('');
  };

  const toggle = async (id: string) => { await saveToDb(coupons.map(c => c.id === id ? {...c, active: !c.active} : c)); };
  const del = async (id: string) => { await saveToDb(coupons.filter(c => c.id !== id)); };

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-900/20 via-background to-background">
      <div className="px-4 app-header-safe pb-3.5 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div><h1 className="font-black text-lg text-fuchsia-400">Coupons 🎟️</h1><p className="text-xs text-fuchsia-200/50 font-bold uppercase tracking-widest">{coupons.filter(c=>c.active).length} Active</p></div>
        </div>
      </div>
      <div className="p-4 space-y-6">
        <div className="p-5 rounded-3xl elite-glass spatial-card border-white/5 shadow-md">
          <h2 className="font-black text-sm text-text mb-4">Create Coupon</h2>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="Coupon Code *" className="w-full p-3 rounded-xl bg-background border border-border outline-none font-bold text-sm text-fuchsia-100 uppercase" />
            <select value={type} onChange={e => setType(e.target.value as any)} className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs font-bold text-fuchsia-300"><option value="percentage">% Off</option><option value="flat">₹ Flat Off</option></select>
            <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder={type==='percentage'?'% off':'₹ off'} className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs font-black text-fuchsia-200" />
            <input type="number" value={minOrder} onChange={e => setMinOrder(e.target.value)} placeholder="Min Order ₹" className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-fuchsia-100" />
            <input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="Max Uses" className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-fuchsia-100" />
            <input type="date" value={validTo} onChange={e => setValidTo(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-fuchsia-100" />
            <button disabled={saving} onClick={addCoupon} className="col-span-2 w-full py-3 bg-fuchsia-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">{saving?'Creating...':'Create Coupon'}</button>
          </div>
        </div>
        <div className="space-y-3">{coupons.map(c => (
          <div key={c.id} className={`p-4 rounded-3xl elite-glass spatial-card shadow-sm group ${!c.active?'border-white/5 opacity-40':'border-fuchsia-500/20'}`}>
            <div className="flex justify-between items-start mb-2"><div><h4 className="font-black text-lg text-fuchsia-400">{c.code}</h4><p className="text-xs text-text-dim font-bold">{c.type==='percentage'?`${c.value}% off`:`₹${c.value} off`} • Min ₹{c.minOrder}</p></div><div className="text-right"><p className="text-xs font-bold text-fuchsia-200">{c.usedCount}/{c.maxUses} used</p><p className="text-xs text-text-dim">Until {new Date(c.validTo).toLocaleDateString()}</p></div></div>
            <div className="flex gap-2 mt-2"><button onClick={() => toggle(c.id)} className={`flex-1 py-2 rounded-xl text-xs font-black uppercase ${c.active?'bg-emerald-500/10 text-emerald-400':'bg-zinc-500/10 text-zinc-400'}`}>{c.active?'Active':'Paused'}</button><button onClick={() => del(c.id)} className="px-4 py-2 rounded-xl bg-danger/10 text-danger text-xs font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">Delete</button></div>
          </div>
        ))}</div>
      </div>
    </div>
  );
}
