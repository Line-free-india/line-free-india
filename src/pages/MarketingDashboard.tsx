import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { triggerHaptic } from '../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';

interface ScheduledCampaign { id: string; type: 'birthday' | 'anniversary' | 'win_back'; discount: number; active: boolean; message: string; }

export default function MarketingDashboard() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  const [campaigns, setCampaigns] = useState<ScheduledCampaign[]>([
    { id: '1', type: 'birthday', discount: 20, active: true, message: "Happy Birthday! {name}, enjoy 20% OFF today at {salon}." },
    { id: '2', type: 'win_back', discount: 15, active: false, message: "We haven't seen you in a while! Here's 15% OFF for your next visit." }
  ]);

  const toggleCampaign = (id: string) => {
    triggerHaptic('light');
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-32 animate-fadeIn">
      {/* Header */}
      <div className="p-6 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-30 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => nav('/barber/dashboard')} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95">←</button>
          <div>
            <h1 className="font-black text-xl bg-gradient-to-r from-fuchsia-400 to-primary bg-clip-text text-transparent">Growth Center</h1>
            <p className="text-xs text-zinc-500 font-black uppercase tracking-[0.3em]">CRM & Loyalty Engine</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Campaign Control */}
        <div className="space-y-4">
           <div className="flex justify-between items-end px-1">
              <div>
                <h3 className="font-black text-sm uppercase tracking-widest text-zinc-400">Smart Automations</h3>
                <p className="text-xs text-zinc-500 font-bold mt-1">AI-driven customer re-engagement</p>
              </div>
              <button className="text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">+ Active Bolt</button>
           </div>

           <div className="space-y-4">
              {campaigns.map(c => (
                <div key={c.id} className={`p-6 rounded-[2.5rem] elite-glass spatial-card border transition-all ${c.active ? 'border-primary/30 shadow-[0_0_30px_rgba(99,102,241,0.1)]' : 'border-white/5 opacity-60'}`}>
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl ${c.type === 'birthday' ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-primary/20 text-primary'}`}>
                            {c.type === 'birthday' ? '🎂' : '📈'}
                         </div>
                         <div>
                            <h4 className="font-black text-sm uppercase tracking-tight">{c.type.replace('_',' ')} Protocol</h4>
                            <p className="text-xs text-emerald-400 font-bold">{c.discount}% Discount Lock</p>
                         </div>
                      </div>
                      <button onClick={() => toggleCampaign(c.id)} className={`w-12 h-6 rounded-full relative transition-colors ${c.active ? 'bg-emerald-500' : 'bg-zinc-800'}`}>
                         <motion.div animate={{ x: c.active ? 24 : 4 }} className="absolute top-1 w-4 h-4 bg-white rounded-full" />
                      </button>
                   </div>
                   <div className="p-4 bg-black/40 rounded-2xl border border-white/5 mb-4">
                      <p className="text-xs text-zinc-400 font-medium leading-relaxed italic">"{c.message}"</p>
                   </div>
                   <div className="flex items-center justify-between">
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Sent via WhatsApp API • Beta</p>
                      <button className="text-xs font-black text-zinc-400 hover:text-white transition-colors">Edit Logic</button>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Marketing KPI Card */}
        <div className="p-8 rounded-[3rem] bg-gradient-to-br from-indigo-600 to-violet-700 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
           <p className="text-xs text-white/60 font-black uppercase tracking-[0.3em] mb-2">Campaign Yield</p>
           <h2 className="text-4xl font-black text-white mb-6">₹12,450<span className="text-lg opacity-50 ml-2">Extra Revenue</span></h2>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                 <p className="text-xs text-white/50 font-black uppercase tracking-widest mb-1">Conversions</p>
                 <p className="text-xl font-black text-white">48</p>
              </div>
              <div className="bg-black/20 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                 <p className="text-xs text-white/50 font-black uppercase tracking-widest mb-1">ROI Index</p>
                 <p className="text-xl font-black text-emerald-400">12.4x</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
