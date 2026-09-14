import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';
interface Lead { id:string; name:string; phone:string; email:string; source:string; status:'new'|'contacted'|'qualified'|'proposal'|'won'|'lost'; value:number; notes:string; createdAt:string; }
export default function LeadManager() {
  const { user, businessProfile } = useApp(); const nav = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]); const [saving, setSaving] = useState(false);
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [source, setSource] = useState('Walk-in'); const [value, setValue] = useState('');
  const [filter, setFilter] = useState('all');
  useEffect(() => { if ((businessProfile as any)?.leads) setLeads((businessProfile as any).leads); }, [businessProfile]);
  const saveToDb = async (r: Lead[]) => { if (!user) return; setSaving(true); try { await updateDoc(doc(db, 'users', user.uid), { leads: r }); setLeads(r); triggerHaptic('success'); } catch(e:any){ alert(e.message); } setSaving(false); };
  const add = async () => { if (!name) return alert('Name required.'); const l:Lead={id:Date.now().toString(),name:name.trim(),phone:phone.trim(),email:'',source,status:'new',value:Number(value)||0,notes:'',createdAt:new Date().toISOString()}; await saveToDb([l,...leads]); setName(''); setPhone(''); setValue(''); };
  const updateStatus = async (id:string,s:Lead['status']) => { await saveToDb(leads.map(l=>l.id===id?{...l,status:s}:l)); };
  const pipeline = ['new','contacted','qualified','proposal','won','lost'];
  const pipeColors: Record<string,string> = {new:'text-blue-400',contacted:'text-amber-400',qualified:'text-purple-400',proposal:'text-cyan-400',won:'text-emerald-400',lost:'text-rose-400'};
  const filtered = filter==='all'?leads:leads.filter(l=>l.status===filter);
  const totalPipeline = leads.filter(l=>l.status!=='won'&&l.status!=='lost').reduce((a,l)=>a+l.value,0);
  return (<div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background">
    <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border"><div className="flex items-center gap-3"><button onClick={()=>nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button><div><h1 className="font-black text-lg text-blue-400">Lead Manager 🎯</h1><p className="text-xs text-blue-200/50 font-bold uppercase tracking-widest">₹{totalPipeline} Pipeline</p></div></div></div>
    <div className="p-4 space-y-6">
      <div className="p-5 rounded-3xl bg-card border border-border shadow-md"><div className="grid grid-cols-2 gap-3">
        <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Lead Name *" className="w-full p-3 rounded-xl bg-background border border-border outline-none font-bold text-sm text-blue-100"/>
        <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone" className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-blue-100"/>
        <select value={source} onChange={e=>setSource(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs font-bold text-blue-300"><option>Walk-in</option><option>WhatsApp</option><option>Google</option><option>Instagram</option><option>Referral</option><option>Other</option></select>
        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim text-xs">₹</span><input type="number" value={value} onChange={e=>setValue(e.target.value)} placeholder="Value" className="w-full p-3 pl-7 rounded-xl bg-background border border-border outline-none text-xs font-black text-blue-200"/></div>
        <button disabled={saving} onClick={add} className="col-span-2 w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">{saving?'Adding...':'Add Lead'}</button>
      </div></div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{['all',...pipeline].map(s=>(<button key={s} onClick={()=>setFilter(s)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${filter===s?'bg-blue-500 text-white':'bg-card border border-border text-text-dim'}`}>{s}</button>))}</div>
      <div className="space-y-2">{filtered.map(l=>(<div key={l.id} className="p-3.5 rounded-2xl elite-glass spatial-card"><div className="flex justify-between items-start mb-2"><div><p className="text-xs font-black text-blue-50">{l.name}</p><p className="text-xs text-text-dim">{l.source} • {new Date(l.createdAt).toLocaleDateString()}</p></div><div className="text-right"><p className="text-sm font-black text-blue-400">₹{l.value}</p><span className={`text-xs font-black uppercase ${pipeColors[l.status]}`}>{l.status}</span></div></div>
        <div className="flex gap-1 mt-1">{pipeline.filter(s=>s!==l.status).slice(0,3).map(s=>(<button key={s} onClick={()=>updateStatus(l.id,s as Lead['status'])} className={`px-2 py-1 rounded-lg text-xs font-black uppercase bg-card-2 border border-border ${pipeColors[s]} hover:opacity-80`}>{s}</button>))}</div></div>))}</div>
    </div></div>);
}
