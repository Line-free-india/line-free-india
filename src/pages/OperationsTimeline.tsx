import { useEffect, useState } from 'react';
import { useApp, TokenEntry } from '../store/AppContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function OperationsTimeline() {
  const { user, getSalonTokens, businessProfile } = useApp();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'booking' | 'completed' | 'alert'>('all');

  useEffect(() => {
    if (!user) return;
    const fetchTokens = async () => {
      setLoading(true);
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const tokens = await getSalonTokens(user.uid, today);
      
      const tlEvents: any[] = [];
      
      // Business opened
      if (businessProfile?.isOpen) {
        tlEvents.push({
          id: 'open',
          time: '09:00', // Approx opening time
          type: 'alert',
          title: '🟢 Business Opened',
          timestamp: new Date().setHours(9, 0, 0, 0)
        });
      }

      let completedTokens = 0;
      let revenue = 0;

      tokens.forEach(t => {
        const timeStr = new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        
        tlEvents.push({
          id: `book_${t.id}`,
          time: timeStr,
          type: 'booking',
          title: `🎫 Token #${t.tokenNumber} — ${t.customerName} (${t.selectedServices.map(s => s.name).join(', ')})`,
          timestamp: t.createdAt
        });

        if (t.status === 'done') {
          completedTokens++;
          revenue += (t.totalPrice || 0);
          tlEvents.push({
            id: `done_${t.id}`,
            time: new Date(t.createdAt + (t.totalTime * 60000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }), // estimated end
            type: 'completed',
            title: `✅ Token #${t.tokenNumber} Completed — ₹${t.totalPrice}`,
            timestamp: t.createdAt + (t.totalTime * 60000)
          });
        } else if (t.status === 'cancelled') {
          tlEvents.push({
            id: `cancel_${t.id}`,
            time: new Date(t.createdAt + 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }), // approx
            type: 'alert',
            title: `❌ Token #${t.tokenNumber} Cancelled`,
            timestamp: t.createdAt + 60000
          });
        }
      });

      if (tokens.length > 5) {
        tlEvents.push({
          id: 'rush',
          time: '12:00',
          type: 'alert',
          title: '⚠️ Queue Rush Detected (5+ waiting)',
          timestamp: new Date().setHours(12, 0, 0, 0)
        });
      }

      if (completedTokens > 0) {
        tlEvents.push({
          id: 'summary',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          type: 'summary',
          title: `📊 Current Summary: ${completedTokens} served, ₹${revenue} revenue`,
          timestamp: Date.now()
        });
      }

      tlEvents.sort((a, b) => a.timestamp - b.timestamp);
      setEvents(tlEvents);
      setLoading(false);
    };
    fetchTokens();
  }, [user, businessProfile]);

  const filtered = events.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'summary') return e.type === 'summary';
    return e.type === filter;
  });

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn">
      <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div>
            <h1 className="font-black text-lg text-emerald-400">Operations Timeline 📋</h1>
            <p className="text-[10px] text-emerald-200/50 font-bold uppercase tracking-widest">Business Audit Trail</p>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
          {['all', 'booking', 'completed', 'alert'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${filter === f ? 'bg-emerald-600 text-white' : 'bg-card border border-border text-text-dim'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center p-8 text-emerald-400 font-bold animate-pulse">Loading operations...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-8 text-text-dim font-bold">No events for this filter.</div>
        ) : (
          <motion.div 
            initial="hidden" animate="show"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
            className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent"
          >
            {filtered.map((e, i) => (
              <motion.div 
                key={e.id}
                variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow flex-none ${e.type === 'alert' ? 'bg-orange-500 text-white' : e.type === 'completed' || e.type === 'summary' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
                  {e.type === 'alert' ? '⚠️' : e.type === 'completed' ? '✅' : e.type === 'summary' ? '📊' : '🎫'}
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-card shadow">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-emerald-400 text-xs">{e.time}</span>
                  </div>
                  <div className="text-sm font-bold text-emerald-50">{e.title}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
