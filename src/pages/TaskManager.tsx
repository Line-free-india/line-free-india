import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

interface Task { id: string; title: string; assignedTo: string; priority: 'low'|'medium'|'high'|'urgent'; dueDate: string; status: 'todo'|'in_progress'|'done'; createdAt: string; }

export default function TaskManager() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(''); const [assignedTo, setAssignedTo] = useState(''); const [priority, setPriority] = useState<Task['priority']>('medium'); const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState<'all'|'todo'|'in_progress'|'done'>('all');

  useEffect(() => { if ((businessProfile as any)?.tasks) setTasks((businessProfile as any).tasks); }, [businessProfile]);
  const saveToDb = async (recs: Task[]) => { if (!user) return; setSaving(true); try { await updateDoc(doc(db, 'users', user.uid), { tasks: recs }); setTasks(recs); triggerHaptic('success'); } catch(e:any) { alert('Error: ' + e.message); } setSaving(false); };

  const addTask = async () => {
    if (!title) return alert('Title required.');
    const t: Task = { id: Date.now().toString(), title: title.trim(), assignedTo: assignedTo.trim(), priority, dueDate, status: 'todo', createdAt: new Date().toISOString() };
    await saveToDb([t, ...tasks]); setTitle(''); setAssignedTo('');
  };

  const updateStatus = async (id: string, s: Task['status']) => { await saveToDb(tasks.map(t => t.id === id ? { ...t, status: s } : t)); };
  const del = async (id: string) => { await saveToDb(tasks.filter(t => t.id !== id)); };
  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const prioColors: Record<string,string> = { low: 'text-zinc-400', medium: 'text-blue-400', high: 'text-amber-400', urgent: 'text-rose-500 animate-pulse' };

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-background to-background">
      <div className="px-4 app-header-safe pb-3.5 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/home')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div><h1 className="font-black text-lg text-purple-400">Task Manager ✅</h1><p className="text-xs text-purple-200/50 font-bold uppercase tracking-widest">{tasks.filter(t=>t.status!=='done').length} Open</p></div>
        </div>
      </div>
      <div className="p-4 space-y-6">
        <div className="p-5 rounded-3xl elite-glass spatial-card">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Task Title *" className="col-span-2 w-full p-3 rounded-xl bg-background border border-border outline-none font-bold text-sm text-purple-100" />
            <input type="text" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} placeholder="Assign To" className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-purple-100" />
            <select value={priority} onChange={e => setPriority(e.target.value as any)} className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs font-bold text-purple-300"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-purple-100" />
            <button disabled={saving} onClick={addTask} className="w-full py-3 bg-purple-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">{saving ? 'Adding...' : 'Add Task'}</button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{['all','todo','in_progress','done'].map(s => (<button key={s} onClick={() => setFilter(s as any)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${filter===s?'bg-purple-500 text-white':'bg-card border border-border text-text-dim'}`}>{s.replace('_',' ')}</button>))}</div>
        <div className="space-y-2">{filtered.map(t => (
          <div key={t.id} className={`flex items-center gap-3 p-3.5 rounded-2xl elite-glass spatial-card group ${t.status==='done'?'border-emerald-500/20 opacity-50':'border-white/5'}`}>
            <button onClick={() => updateStatus(t.id, t.status==='done'?'todo':t.status==='todo'?'in_progress':'done')} className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs transition-colors ${t.status==='done'?'bg-emerald-500 border-emerald-500 text-white':'bg-background border-border text-transparent hover:border-purple-500'}`}>✓</button>
            <div className="flex-1 min-w-0"><p className={`text-xs font-bold ${t.status==='done'?'line-through text-text-dim':'text-purple-100'}`}>{t.title}</p><p className="text-xs text-text-dim">{t.assignedTo && `→ ${t.assignedTo} • `}<span className={prioColors[t.priority]}>{t.priority}</span>{t.dueDate && ` • Due ${new Date(t.dueDate).toLocaleDateString()}`}</p></div>
            <button onClick={() => del(t.id)} className="w-6 h-6 rounded-lg bg-danger/10 text-danger flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
          </div>
        ))}</div>
      </div>
    </div>
  );
}
