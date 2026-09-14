import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

interface CalendarEvent { id: string; title: string; date: string; time: string; duration: number; type: 'appointment'|'meeting'|'block'|'personal'; color: string; notes: string; }

export default function BookingCalendar() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState(''); const [time, setTime] = useState('10:00'); const [duration, setDuration] = useState('60'); const [type, setType] = useState<CalendarEvent['type']>('appointment');
  const [viewMonth, setViewMonth] = useState(new Date());

  useEffect(() => { if ((businessProfile as any)?.calendarEvents) setEvents((businessProfile as any).calendarEvents); }, [businessProfile]);
  const saveToDb = async (recs: CalendarEvent[]) => { if (!user) return; setSaving(true); try { await updateDoc(doc(db, 'users', user.uid), { calendarEvents: recs }); setEvents(recs); triggerHaptic('success'); } catch(e:any) { alert('Error: ' + e.message); } setSaving(false); };

  const addEvent = async () => {
    if (!title) return alert('Title required.');
    const colors: Record<string,string> = { appointment: 'bg-blue-500', meeting: 'bg-purple-500', block: 'bg-zinc-500', personal: 'bg-emerald-500' };
    const e: CalendarEvent = { id: Date.now().toString(), title: title.trim(), date: selectedDate, time, duration: Number(duration)||60, type, color: colors[type], notes: '' };
    await saveToDb([...events, e]); setTitle('');
  };

  const del = async (id: string) => { await saveToDb(events.filter(e=>e.id!==id)); };
  const dayEvents = events.filter(e => e.date === selectedDate).sort((a,b) => a.time.localeCompare(b.time));

  // Calendar grid
  const year = viewMonth.getFullYear(); const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number|null)[] = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_,i) => i+1)];

  const prevMonth = () => { const d = new Date(viewMonth); d.setMonth(d.getMonth()-1); setViewMonth(d); };
  const nextMonth = () => { const d = new Date(viewMonth); d.setMonth(d.getMonth()+1); setViewMonth(d); };
  const hasEvents = (day: number) => events.some(e => e.date === `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`);

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background">
      <div className="px-4 app-header-safe pb-3.5 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div><h1 className="font-black text-lg text-blue-400">Calendar 📆</h1><p className="text-xs text-blue-200/50 font-bold uppercase tracking-widest">{dayEvents.length} Events Today</p></div>
        </div>
      </div>
      <div className="p-4 space-y-6">
        <div className="elite-glass rounded-3xl p-4 spatial-card">
          <div className="flex justify-between items-center mb-3"><button onClick={prevMonth} className="w-8 h-8 rounded-lg neu-btn flex items-center justify-center text-xs">←</button><h3 className="font-black text-sm text-blue-300">{viewMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h3><button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-card-2 flex items-center justify-center text-xs">→</button></div>
          <div className="grid grid-cols-7 gap-1 mb-2">{['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-center text-xs font-black text-text-dim uppercase">{d}</div>)}</div>
          <div className="grid grid-cols-7 gap-1">{days.map((day, i) => day ? (
            <button key={i} onClick={() => setSelectedDate(`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`)} className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all relative ${selectedDate === `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` ? 'bg-blue-500 text-white' : 'text-zinc-300 hover:bg-card-2'}`}>
              {day}{hasEvents(day) && <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-blue-400"></div>}
            </button>
          ) : <div key={i}></div>)}</div>
        </div>
        <div className="p-5 rounded-3xl bg-card border border-border shadow-md">
          <h2 className="font-black text-sm text-text mb-3">Add Event — {new Date(selectedDate).toLocaleDateString()}</h2>
          <div className="flex gap-2 flex-wrap">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title *" className="flex-1 min-w-[150px] p-2.5 rounded-lg bg-background border border-border outline-none text-xs text-blue-100 font-bold" />
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-24 p-2.5 rounded-lg bg-background border border-border outline-none text-xs text-blue-100" />
            <select value={type} onChange={e => setType(e.target.value as any)} className="w-28 p-2.5 rounded-lg bg-background border border-border outline-none text-xs font-bold text-blue-300"><option value="appointment">Appt</option><option value="meeting">Meeting</option><option value="block">Block</option><option value="personal">Personal</option></select>
            <button disabled={saving} onClick={addEvent} className="px-4 bg-blue-600 text-white rounded-lg font-black uppercase tracking-widest text-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">Add</button>
          </div>
        </div>
        <div className="space-y-2">{dayEvents.length === 0 ? (<p className="text-xs text-text-dim text-center py-4">No events on this date.</p>) : dayEvents.map(e => (
          <div key={e.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border group">
            <div className={`w-1 h-8 rounded-full ${e.color}`}></div>
            <div className="flex-1"><p className="text-xs font-bold text-blue-100">{e.title}</p><p className="text-xs text-text-dim">{e.time} • {e.duration}min • {e.type}</p></div>
            <button onClick={() => del(e.id)} className="w-6 h-6 rounded-lg bg-danger/10 text-danger flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
          </div>
        ))}</div>
      </div>
    </div>
  );
}
