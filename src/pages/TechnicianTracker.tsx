import { useState } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';

interface TravelEntry {
  id: string;
  technician: string;
  status: 'en-route' | 'on-site' | 'completed';
  location: string;
  time: string;
  distance: string;
}

const MOCK_TRAVEL: TravelEntry[] = [
  { id: '1', technician: 'Rahul S.', status: 'on-site', location: 'DLF Phase 3, Cyber City', time: '11:45 AM', distance: '3.2 km' },
  { id: '2', technician: 'Amit K.', status: 'en-route', location: 'Sushant Lok 1', time: '12:15 PM', distance: '1.8 km' },
  { id: '3', technician: 'Siddharth P.', status: 'completed', location: 'Sector 56, Gurgaon', time: '10:30 AM', distance: '5.4 km' },
];

export default function TechnicianTracker() {
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');

  return (
    <div className="min-h-screen pb-32 bg-[#060810] text-white font-sans">
      {/* Header */}
      <div className="px-6 pt-14 pb-8 bg-gradient-to-b from-[#101420] to-transparent">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-xs text-emerald-400 font-black uppercase tracking-[0.3em] mb-1">Field Intelligence</p>
            <h1 className="text-2xl font-black tracking-tight">Travel Log</h1>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl">🛰️</div>
        </div>

        {/* Status Pills */}
        <div className="flex gap-3 bg-white/5 p-1 rounded-2xl border border-white/5">
          {['live', 'history'].map(tab => (
            <button
              key={tab}
              onClick={() => { triggerHaptic('light'); setActiveTab(tab as any); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Dynamic Radar Map Simulation */}
        <div className="aspect-square w-full rounded-[3rem] bg-[#0c101a] border border-white/5 relative overflow-hidden flex items-center justify-center">
            {/* Radar Grid */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(16,185,129,0.3)_1px,transparent_1px)] bg-[size:30px_30px]" />
            
            {/* Pulsing Central Node */}
            <div className="relative">
              <motion.div animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 4, repeat: Infinity }} className="absolute inset-0 w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-500/50" />
              <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_20px_#10b981]" />
            </div>

            {/* Simulated Tech Nodes */}
            {MOCK_TRAVEL.map((t, idx) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute"
                style={{ top: `${20 + idx * 25}%`, left: `${15 + idx * 30}%` }}
              >
                <div className="relative">
                   <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className={`w-3 h-3 rounded-full ${t.status === 'on-site' ? 'bg-emerald-500' : 'bg-amber-500'} border-2 border-[#060810] shadow-lg`} />
                   <div className="absolute top-4 left-0 bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 whitespace-nowrap">
                      <p className="text-[7px] font-black uppercase tracking-tighter text-white/50">{t.technician}</p>
                   </div>
                </div>
              </motion.div>
            ))}

            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
               <div className="bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Signal Strong</p>
               </div>
               <p className="text-xs text-zinc-600 font-mono tracking-tighter">GPS: 28.4595° N, 77.0266° E</p>
            </div>
        </div>

        {/* Live List */}
        <div className="space-y-4">
           <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 px-2">Active Deployments</h3>
           {MOCK_TRAVEL.map(log => (
             <motion.div 
               key={log.id} 
               whileTap={{ scale: 0.98 }}
               className="p-5 rounded-[2rem] elite-glass spatial-card border-white/5 flex items-center justify-between"
             >
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${log.status === 'completed' ? 'bg-zinc-800' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                      {log.status === 'on-site' ? '🏠' : log.status === 'en-route' ? '🛵' : '✅'}
                   </div>
                   <div>
                      <h4 className="font-bold text-sm">{log.technician}</h4>
                      <p className="text-xs text-zinc-500 font-medium truncate max-w-[150px]">{log.location}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">{log.status}</p>
                   <p className="text-xs text-zinc-600 font-mono">{log.distance} away</p>
                </div>
             </motion.div>
           ))}
        </div>

        <button className="w-full py-5 rounded-[2rem] bg-emerald-500 text-black font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">Assign New Token</button>
      </div>
    </div>
  );
}
