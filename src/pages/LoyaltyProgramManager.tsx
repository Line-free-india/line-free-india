import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

interface LoyaltyTier { name: string; minPoints: number; perks: string; color: string; }
interface LoyaltyConfig { pointsPerRupee: number; tiers: LoyaltyTier[]; }
interface LoyaltyMember { id: string; name: string; phone: string; points: number; tier: string; history: { date: string; action: string; points: number; }[]; }

export default function LoyaltyProgramManager() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<LoyaltyConfig>({ pointsPerRupee: 1, tiers: [{ name: 'Bronze', minPoints: 0, perks: '5% off', color: 'text-amber-600' }, { name: 'Silver', minPoints: 500, perks: '10% off', color: 'text-zinc-400' }, { name: 'Gold', minPoints: 1500, perks: '15% off + free item', color: 'text-yellow-400' }, { name: 'Platinum', minPoints: 5000, perks: '20% off + priority', color: 'text-violet-400' }] });
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [addPointsId, setAddPointsId] = useState<string|null>(null);
  const [addPts, setAddPts] = useState('');

  useEffect(() => {
    if ((businessProfile as any)?.loyaltyMembers) setMembers((businessProfile as any).loyaltyMembers);
    if ((businessProfile as any)?.loyaltyConfig) setConfig((businessProfile as any).loyaltyConfig);
  }, [businessProfile]);

  const saveToDb = async (m: LoyaltyMember[], c?: LoyaltyConfig) => {
    if (!user) return; setSaving(true);
    try { const updates: any = { loyaltyMembers: m }; if (c) updates.loyaltyConfig = c; await updateDoc(doc(db, 'users', user.uid), updates); setMembers(m); triggerHaptic('success'); } catch (e: any) { alert('Error: ' + e.message); }
    setSaving(false);
  };

  const getTier = (pts: number) => { let t = config.tiers[0]; for (const tier of config.tiers) { if (pts >= tier.minPoints) t = tier; } return t; };

  const addMember = async () => {
    if (!name || !phone) return alert('Name & phone required.');
    const m: LoyaltyMember = { id: Date.now().toString(), name: name.trim(), phone: phone.trim(), points: 0, tier: 'Bronze', history: [{ date: new Date().toISOString(), action: 'Joined program', points: 0 }] };
    await saveToDb([m, ...members]);
    setName(''); setPhone('');
  };

  const awardPoints = async () => {
    if (!addPointsId || !addPts) return;
    const pts = Number(addPts);
    const updated = members.map(m => {
      if (m.id === addPointsId) {
        const np = m.points + pts;
        const tier = getTier(np);
        return { ...m, points: np, tier: tier.name, history: [{ date: new Date().toISOString(), action: `+${pts} points earned`, points: pts }, ...m.history] };
      }
      return m;
    });
    await saveToDb(updated);
    setAddPointsId(null); setAddPts('');
  };

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-900/20 via-background to-background">
      <div className="px-4 app-header-safe pb-3.5 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/home')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div><h1 className="font-black text-lg text-yellow-400">Loyalty Program ⭐</h1><p className="text-xs text-yellow-200/50 font-bold uppercase tracking-widest">{members.length} Members</p></div>
        </div>
      </div>
      <div className="p-4 space-y-6">
        <div className="grid grid-cols-4 gap-2">{config.tiers.map(t => (<div key={t.name} className="elite-glass rounded-2xl p-3 text-center spatial-card"><p className={`text-xs font-black uppercase tracking-widest ${t.color}`}>{t.name}</p><p className="text-xs text-text-dim mt-1">{t.minPoints}+ pts</p><p className="text-xs text-text-dim mt-0.5">{t.perks}</p></div>))}</div>
        <div className="p-5 rounded-3xl elite-glass spatial-card">
          <h2 className="font-black text-sm text-text mb-4">Add Member</h2>
          <div className="flex gap-3">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name *" className="flex-1 p-3 rounded-xl bg-background border border-border outline-none font-bold text-sm text-yellow-100" />
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone *" className="flex-1 p-3 rounded-xl bg-background border border-border outline-none text-xs text-yellow-100" />
            <button disabled={saving} onClick={addMember} className="px-6 bg-yellow-600 text-yellow-950 rounded-xl font-black uppercase tracking-widest text-xs shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">Add</button>
          </div>
        </div>
        {addPointsId && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fadeIn"><div className="bg-card w-full max-w-xs rounded-[32px] p-6 border border-border shadow-2xl animate-slideUp"><h2 className="font-black text-lg text-yellow-400 mb-4">Award Points</h2><div className="relative mb-4"><input type="number" value={addPts} onChange={e => setAddPts(e.target.value)} placeholder="Points to add" className="w-full p-3.5 rounded-2xl bg-background border border-border outline-none text-sm font-black text-yellow-100" /></div><div className="flex gap-2"><button onClick={() => setAddPointsId(null)} className="flex-1 py-3 rounded-xl bg-card-2 border border-border text-text-dim text-xs font-black uppercase tracking-widest">Cancel</button><button onClick={awardPoints} className="flex-1 py-3 rounded-xl bg-yellow-600 text-white text-xs font-black uppercase tracking-widest shadow-md">Award</button></div></div></div>)}
        <div className="space-y-2">
          {members.length === 0 ? (<div className="text-center py-8 border border-dashed border-border rounded-3xl opacity-50 bg-card"><span className="text-3xl block mb-2">⭐</span><p className="text-xs font-bold text-text-dim">No loyalty members.</p></div>
          ) : members.map(m => { const tier = getTier(m.points); return (
            <div key={m.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border group">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-sm font-black text-yellow-400">{m.name[0]}</div>
              <div className="flex-1 min-w-0"><p className="text-xs font-black text-yellow-50 truncate">{m.name}</p><p className="text-xs text-text-dim font-bold">{m.phone}</p></div>
              <div className="text-right"><p className="text-sm font-black text-yellow-400">{m.points} pts</p><p className={`text-xs font-black uppercase tracking-widest ${tier.color}`}>{tier.name}</p></div>
              <button onClick={() => setAddPointsId(m.id)} className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-400 flex items-center justify-center text-xs font-black hover:bg-yellow-500 hover:text-white transition-colors">+</button>
            </div>
          ); })}
        </div>
      </div>
    </div>
  );
}
