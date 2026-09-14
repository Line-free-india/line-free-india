import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

interface Shift { id: string; staffName: string; date: string; startTime: string; endTime: string; role: string; notes: string; }

export default function ShiftPlanner() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [saving, setSaving] = useState(false);
  const [staffName, setStaffName] = useState(''); const [date, setDate] = useState(new Date().toISOString().split('T')[0]); const [startTime, setStartTime] = useState('09:00'); const [endTime, setEndTime] = useState('18:00'); const [role, setRole] = useState('General');

  useEffect(() => { if ((businessProfile as any)?.shifts) setShifts((businessProfile as any).shifts); }, [businessProfile]);
  const saveToDb = async (recs: Shift[]) => { if (!user) return; setSaving(true); try { await updateDoc(doc(db, 'users', user.uid), { shifts: recs }); setShifts(recs); triggerHaptic('success'); } catch(e:any) { alert('Error: ' + e.message); } setSaving(false); };

  const addShift = async () => {
    if (!staffName) return alert('Staff name required.');
    const s: Shift = { id: Date.now().toString(), staffName: staffName.trim(), date, startTime, endTime, role, notes: '' };
    await saveToDb([...shifts, s]); setStaffName('');
  };
  const del = async (id: string) => { await saveToDb(shifts.filter(s=>s.id!==id)); };
  const todayShifts = shifts.filter(s => s.date === new Date().toISOString().split('T')[0]).sort((a,b) => a.startTime.localeCompare(b.startTime));
  const dateShifts = shifts.filter(s => s.date === date).sort((a,b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-background to-background">
      <div className="px-4 app-header-safe pb-3.5 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/home')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div><h1 className="font-black text-lg text-violet-400">Shift Planner 🕐</h1><p className="text-xs text-violet-200/50 font-bold uppercase tracking-widest">{todayShifts.length} Shifts Today</p></div>
        </div>
      </div>
      <div className="p-4 space-y-6">
        <div className="p-5 rounded-3xl elite-glass spatial-card">
          <h2 className="font-black text-sm text-text mb-4">Schedule Shift</h2>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={staffName} onChange={e => setStaffName(e.target.value)} placeholder="Staff Name *" className="col-span-2 w-full p-3 rounded-xl bg-background border border-border outline-none font-bold text-sm text-violet-100" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-violet-100" />
            <select value={role} onChange={e => setRole(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs font-bold text-violet-300"><option>General</option><option>Manager</option><option>Cashier</option><option>Service</option><option>Kitchen</option><option>Delivery</option></select>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs font-bold text-violet-200" />
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs font-bold text-violet-200" />
            <button disabled={saving} onClick={addShift} className="col-span-2 w-full py-3 bg-violet-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">{saving?'Scheduling...':'Add Shift'}</button>
          </div>
        </div>
        <h3 className="font-black text-xs uppercase tracking-widest text-violet-400 px-1">Shifts on {new Date(date).toLocaleDateString()}</h3>
        <div className="space-y-2">{dateShifts.length === 0 ? <p className="text-xs text-text-dim text-center py-4">No shifts scheduled.</p> : dateShifts.map(s => (
          <div key={s.id} className="flex items-center gap-3 p-3 rounded-2xl elite-glass spatial-card group">
            <div className="w-1 h-10 rounded-full bg-violet-500"></div>
            <div className="flex-1"><p className="text-xs font-bold text-violet-100">{s.staffName}</p><p className="text-xs text-text-dim">{s.role} • {s.startTime} — {s.endTime}</p></div>
            <button onClick={() => del(s.id)} className="w-6 h-6 rounded-lg bg-danger/10 text-danger flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
          </div>
        ))}</div>
      </div>
    </div>
  );
}
