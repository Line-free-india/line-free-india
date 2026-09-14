import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { triggerHaptic } from '../utils/haptics';
export default function SmartNotifications() {
  const { businessProfile } = useApp(); const nav = useNavigate();
  const appts = businessProfile?.appointments || []; const now = new Date();
  const notifications: {type:string;title:string;msg:string;time:string;icon:string;color:string}[] = [];
  // Low stock alerts
  (businessProfile?.inventory || []).forEach((i: any) => { if ((i.quantity||0) < (i.minStock||5)) notifications.push({type:'stock',title:'Low Stock',msg:`${i.name||i.productName} is running low (${i.quantity} left)`,time:'Now',icon:'📦',color:'text-amber-400'}); });
  // Today's appointments
  appts.filter((a:any)=>{ try{return new Date(a.date||a.dateStr).toDateString()===now.toDateString();}catch{return false;}}).forEach((a:any)=>{notifications.push({type:'appt',title:'Appointment Today',msg:`${a.customerName||a.name||'Customer'} at ${a.time||a.slot||''}`,time:a.time||'',icon:'📅',color:'text-blue-400'});});
  // Upcoming expiries
  ((businessProfile as any)?.documents||[]).forEach((d:any)=>{try{const exp=new Date(d.expiryDate);if(exp>now&&exp<new Date(Date.now()+30*24*60*60*1000))notifications.push({type:'expiry',title:'Expiring Soon',msg:`${d.name} expires on ${exp.toLocaleDateString()}`,time:exp.toLocaleDateString(),icon:'⚠️',color:'text-rose-400'});}catch{}});
  // Pending payments
  ((businessProfile as any)?.invoices||[]).filter((i:any)=>i.status==='pending'||i.status==='unpaid').forEach((i:any)=>{notifications.push({type:'payment',title:'Pending Payment',msg:`Invoice ${i.invoiceNo||''} — ₹${i.grandTotal||i.total||0}`,time:new Date(i.dateStr||i.date||'').toLocaleDateString(),icon:'💰',color:'text-emerald-400'});});
  return (<div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background">
    <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border"><div className="flex items-center gap-3"><button onClick={()=>nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button><div><h1 className="font-black text-lg text-blue-400">Smart Alerts 🔔</h1><p className="text-xs text-blue-200/50 font-bold uppercase tracking-widest">{notifications.length} Active</p></div></div></div>
    <div className="p-4 space-y-3">{notifications.length===0?<div className="text-center py-10 elite-glass border-dashed border-white/5 rounded-3xl opacity-50 spatial-card"><span className="text-3xl block mb-2">✅</span><p className="text-xs font-bold text-text-dim">All clear! No alerts.</p></div>:notifications.map((n,i)=>(<div key={i} className="flex items-start gap-3 p-4 rounded-2xl elite-glass spatial-card border-white/5"><span className="text-lg">{n.icon}</span><div className="flex-1"><p className={`text-xs font-black ${n.color}`}>{n.title}</p><p className="text-xs text-text-dim mt-0.5">{n.msg}</p></div><span className="text-xs text-text-dim font-bold whitespace-nowrap">{n.time}</span></div>))}</div></div>);
}
