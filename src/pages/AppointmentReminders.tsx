import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { triggerHaptic } from '../utils/haptics';

export default function AppointmentReminders() {
  const { businessProfile } = useApp();
  const nav = useNavigate();
  const appts = businessProfile?.appointments || [];
  const now = new Date();
  const upcoming = appts.filter((a: any) => { try { const d = new Date(a.date || a.dateStr); return d >= now; } catch { return false; } }).sort((a: any, b: any) => new Date(a.date||a.dateStr).getTime() - new Date(b.date||b.dateStr).getTime()).slice(0, 50);
  const today = upcoming.filter((a: any) => { try { return new Date(a.date||a.dateStr).toDateString() === now.toDateString(); } catch { return false; } });
  const tomorrow = upcoming.filter((a: any) => { try { const t = new Date(); t.setDate(t.getDate()+1); return new Date(a.date||a.dateStr).toDateString() === t.toDateString(); } catch { return false; } });

  const sendReminder = (a: any) => {
    const phone = a.customerPhone || a.phone;
    if (!phone) return alert('No phone number.');
    const text = `*📅 Appointment Reminder - ${businessProfile?.businessName || 'Business'}*\nHi ${a.customerName || a.name || 'Customer'},\nJust a reminder about your appointment:\n📅 ${new Date(a.date||a.dateStr).toLocaleDateString()}\n⏰ ${a.time || a.slot || 'Scheduled'}\n✂️ ${a.service || a.serviceName || ''}\n\n_We look forward to seeing you!_`;
    const s = '91' + phone.replace(/\D/g,'').slice(-10);
    window.open(`https://wa.me/${s}?text=${encodeURIComponent(text)}`, '_blank');
    triggerHaptic('success');
  };

  const sendBulk = (list: any[]) => { list.forEach((a, i) => setTimeout(() => sendReminder(a), i * 500)); };

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background">
      <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div><h1 className="font-black text-lg text-blue-400">Reminders 🔔</h1><p className="text-xs text-blue-200/50 font-bold uppercase tracking-widest">{today.length} Today • {tomorrow.length} Tomorrow</p></div>
        </div>
      </div>
      <div className="p-4 space-y-6">
        {today.length > 0 && (
          <div className="bg-card border border-blue-500/20 rounded-3xl p-5">
            <div className="flex justify-between items-center mb-3"><h3 className="font-black text-sm text-blue-400">Today's Appointments</h3><button onClick={() => sendBulk(today)} className="text-xs font-black uppercase tracking-widest text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg hover:bg-green-500 hover:text-white transition-all">Remind All</button></div>
            <div className="space-y-2">{today.map((a: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                <div className="flex-1"><p className="text-xs font-bold text-blue-100">{a.customerName||a.name||'Customer'}</p><p className="text-xs text-text-dim">{a.time||a.slot||''} • {a.service||a.serviceName||''}</p></div>
                <button onClick={() => sendReminder(a)} className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase hover:bg-blue-500 hover:text-white transition-all">📱</button>
              </div>
            ))}</div>
          </div>
        )}
        {tomorrow.length > 0 && (
          <div className="elite-glass rounded-3xl p-5 spatial-card">
            <div className="flex justify-between items-center mb-3"><h3 className="font-black text-sm text-amber-400">Tomorrow</h3><button onClick={() => sendBulk(tomorrow)} className="text-xs font-black uppercase tracking-widest text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg hover:bg-green-500 hover:text-white transition-all">Remind All</button></div>
            <div className="space-y-2">{tomorrow.map((a: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                <div className="flex-1"><p className="text-xs font-bold text-amber-100">{a.customerName||a.name||'Customer'}</p><p className="text-xs text-text-dim">{a.time||a.slot||''} • {a.service||a.serviceName||''}</p></div>
                <button onClick={() => sendReminder(a)} className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase hover:bg-amber-500 hover:text-white transition-all">📱</button>
              </div>
            ))}</div>
          </div>
        )}
        {upcoming.length === 0 && (<div className="text-center py-10 border border-dashed border-border rounded-3xl opacity-50 bg-card"><span className="text-3xl block mb-2">🔔</span><p className="text-xs font-bold text-text-dim">No upcoming appointments.</p></div>)}
      </div>
    </div>
  );
}
