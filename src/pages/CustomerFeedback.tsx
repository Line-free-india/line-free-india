import { useState, useEffect } from 'react';import { useNavigate } from 'react-router-dom';import { useApp } from '../store/AppContext';import { doc, updateDoc } from 'firebase/firestore';import { db } from '../firebase';import { triggerHaptic } from '../utils/haptics';
interface Feedback { id:string; customerName:string; phone:string; rating:number; category:string; message:string; date:string; resolved:boolean; }
export default function CustomerFeedback() { const { user, businessProfile } = useApp(); const nav = useNavigate(); const [feedbacks, setFeedbacks] = useState<Feedback[]>([]); const [saving, setSaving] = useState(false);
  const [customerName, setCustomerName] = useState(''); const [rating, setRating] = useState(5); const [category, setCategory] = useState('Service'); const [message, setMessage] = useState(''); const [showAddService, setShowAddService] = useState(false);
  useEffect(() => { if ((businessProfile as any)?.feedbacks) setFeedbacks((businessProfile as any).feedbacks); }, [businessProfile]);
  const saveToDb = async (r: Feedback[]) => { if (!user) return; setSaving(true); try { await updateDoc(doc(db, 'users', user.uid), { feedbacks: r }); setFeedbacks(r); triggerHaptic('success'); } catch(e:any){ setMessage(e.message); } setSaving(false); };
  const add = async () => { if (!customerName) return setMessage('Required.'); const f:Feedback={id:Date.now().toString(),customerName:customerName.trim(),phone:'',rating,category,message:message.trim(),date:new Date().toISOString(),resolved:false}; await saveToDb([f,...feedbacks]); setCustomerName(''); setMessage(''); setRating(5); };
  const resolve = async (id:string) => { await saveToDb(feedbacks.map(f=>f.id===id?{...f,resolved:true}:f)); };
  const avg = feedbacks.length>0?(feedbacks.reduce((a,f)=>a+f.rating,0)/feedbacks.length).toFixed(1):'0';
  return (<div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-900/20 via-background to-background">
    <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border"><div className="flex items-center gap-3"><button onClick={()=>nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2">←</button><div><h1 className="font-black text-lg text-yellow-400">Feedback 💬</h1><p className="text-xs text-yellow-200/50 font-bold uppercase tracking-widest">{avg} Avg • {feedbacks.length} Total</p></div></div></div>
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold text-yellow-50">Customer Reviews</h2>
      </div>

      <div className="space-y-2">{feedbacks.map(f=>(<div key={f.id} className={`p-3.5 rounded-2xl bg-card border border-border ${f.resolved?'opacity-40':''}`}><div className="flex justify-between items-start"><div><p className="text-xs font-black text-yellow-50">{f.customerName}</p><p className="text-xs text-text-dim">{f.category} • {new Date(f.date).toLocaleDateString()}</p></div><div className="flex items-center gap-2"><span className="text-sm text-yellow-400">{'★'.repeat(f.rating)}</span>{!f.resolved&&<button onClick={()=>resolve(f.id)} className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">✓</button>}</div></div>{f.message&&<p className="text-xs text-yellow-100/70 mt-1">{f.message}</p>}</div>))}</div>
    </div>{message && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg z-50 text-sm">{message} <button onClick={() => setMessage('')} className="ml-2 text-white/50 hover:text-white">&times;</button></div>}
 </div>);
}
