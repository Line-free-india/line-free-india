import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

interface GroomingJob { id: string; petName: string; breed: string; ownerName: string; ownerPhone: string; steps: { name: string; done: boolean; }[]; status: 'waiting'|'in_progress'|'done'; startedAt?: string; completedAt?: string; notes: string; }

const DEFAULT_STEPS = ['Bath & Rinse','Blow Dry','Nail Trim','Ear Cleaning','Coat Brushing','Haircut / Styling','Sanitize & Deodorize','Final Check'];

export default function GroomingChecklist() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  const [jobs, setJobs] = useState<GroomingJob[]>([]);
  const [saving, setSaving] = useState(false);
  const [petName, setPetName] = useState('');
  const [breed, setBreed] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => { if ((businessProfile as any)?.groomingJobs) setJobs((businessProfile as any).groomingJobs); }, [businessProfile]);

  const saveToDb = async (recs: GroomingJob[]) => {
    if (!user) return; setSaving(true);
    try { await updateDoc(doc(db, 'users', user.uid), { groomingJobs: recs }); setJobs(recs); triggerHaptic('success'); } catch (e: any) { alert('Error: ' + e.message); }
    setSaving(false);
  };

  const addJob = async () => {
    if (!petName || !ownerName) return alert('Pet name and owner name required.');
    const job: GroomingJob = { id: Date.now().toString(), petName: petName.trim(), breed: breed.trim(), ownerName: ownerName.trim(), ownerPhone: ownerPhone.trim(), steps: DEFAULT_STEPS.map(s => ({ name: s, done: false })), status: 'waiting', notes: notes.trim() };
    await saveToDb([job, ...jobs]);
    setPetName(''); setBreed(''); setOwnerName(''); setOwnerPhone(''); setNotes('');
  };

  const toggleStep = async (jobId: string, stepIdx: number) => {
    const updated = jobs.map(j => {
      if (j.id === jobId) {
        const newSteps = j.steps.map((s, i) => i === stepIdx ? { ...s, done: !s.done } : s);
        const allDone = newSteps.every(s => s.done);
        const anyDone = newSteps.some(s => s.done);
        return { ...j, steps: newSteps, status: (allDone ? 'done' : anyDone ? 'in_progress' : 'waiting') as any, startedAt: j.startedAt || (anyDone ? new Date().toISOString() : undefined), completedAt: allDone ? new Date().toISOString() : undefined };
      }
      return j;
    });
    await saveToDb(updated);
    const job = updated.find(j => j.id === jobId);
    if (job?.status === 'done' && job.ownerPhone) {
      const text = `*🐾 Grooming Complete! - ${businessProfile?.businessName || 'Pet Spa'}*\nHi ${job.ownerName},\n${job.petName} is all groomed and ready for pickup! 🎀\n_Thank you for choosing us!_`;
      const s = '91' + job.ownerPhone.replace(/\D/g, '').slice(-10);
      window.open(`https://wa.me/${s}?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const statusColors: Record<string, string> = { waiting: 'text-zinc-500', in_progress: 'text-blue-400', done: 'text-emerald-400' };

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-background to-background">
      <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div><h1 className="font-black text-lg text-cyan-400">Grooming Checklist 🐕</h1><p className="text-xs text-cyan-200/50 font-bold uppercase tracking-widest">{jobs.filter(j=>j.status!=='done').length} Active</p></div>
        </div>
      </div>
      <div className="p-4 space-y-6">
        <div className="p-5 rounded-3xl elite-glass spatial-card border-white/5 shadow-md">
          <h2 className="font-black text-sm text-text mb-4">New Grooming Session</h2>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={petName} onChange={e => setPetName(e.target.value)} placeholder="Pet Name *" className="w-full p-3 rounded-xl bg-background border border-border outline-none font-bold text-sm text-cyan-100" />
            <input type="text" value={breed} onChange={e => setBreed(e.target.value)} placeholder="Breed" className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-cyan-100" />
            <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Owner Name *" className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-cyan-100 font-bold" />
            <input type="tel" value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)} placeholder="Owner WhatsApp" className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-cyan-100" />
            <button disabled={saving} onClick={addJob} className="col-span-2 w-full py-3 bg-cyan-600 text-cyan-950 rounded-xl font-black uppercase tracking-widest text-xs shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">{saving ? 'Saving...' : 'Start Session'}</button>
          </div>
        </div>
        <div className="space-y-4">
          {jobs.length === 0 ? (<div className="text-center py-8 border border-dashed border-white/10 rounded-3xl opacity-50 elite-glass"><span className="text-3xl block mb-2">🐾</span><p className="text-xs font-bold text-text-dim">No grooming sessions.</p></div>
          ) : jobs.map(j => (
            <div key={j.id} className={`p-4 rounded-3xl elite-glass spatial-card shadow-sm ${j.status==='done'?'border-emerald-500/20 opacity-60':'border-white/5'}`}>
              <div className="flex justify-between items-start mb-3"><div><h4 className="font-black text-base text-cyan-50">{j.petName} <span className="text-xs text-text-dim font-bold">({j.breed})</span></h4><p className="text-xs text-cyan-200/50 font-bold">Owner: {j.ownerName}</p></div><span className={`text-xs font-black uppercase tracking-widest ${statusColors[j.status]}`}>{j.status.replace('_',' ')}</span></div>
              <div className="space-y-1.5">{j.steps.map((s, si) => (
                <button key={si} onClick={() => toggleStep(j.id, si)} className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs text-left transition-all ${s.done ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-background border border-border hover:border-cyan-500/30'}`}>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs transition-colors ${s.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-background border-border text-transparent'}`}>✓</div>
                  <span className={`font-bold ${s.done ? 'text-emerald-300 line-through opacity-60' : 'text-cyan-100'}`}>{s.name}</span>
                </button>
              ))}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
