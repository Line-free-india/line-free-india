import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';

export default function CommunityBoard() {
  const { id } = useParams<{ id: string }>();
  const { user, customerProfile, useCommunityMessages, sendCommunityMessage, allSalons, getCategoryInfo } = useApp();
  const nav = useNavigate();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const business = allSalons.find(s => s.uid === id);
  const messages = useCommunityMessages(id || '');
  const catInfo = getCategoryInfo(business?.businessType || 'men_salon');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!text.trim() || !id || !user) return;
    setSending(true);
    triggerHaptic('medium');
    await sendCommunityMessage(id, {
      senderId: user.uid,
      senderName: customerProfile?.name || user.displayName || 'Explorer',
      senderPhoto: customerProfile?.photoURL || user.photoURL || '',
      message: text.trim(),
    });
    setText('');
    setSending(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#08080A]" style={{ height: '100dvh' }}>
      {/* Dynamic Header */}
      <div className="p-5 glass-strong flex items-center gap-4 sticky top-0 z-20 border-b border-white/5">
        <button onClick={() => nav(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white">←</button>
        <div className="flex-1">
          <h2 className="text-sm font-black text-white uppercase tracking-widest truncate">{business?.businessName}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <p className="text-xs font-bold text-success uppercase tracking-widest">Community Board • Live</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl">💬</div>
      </div>

      {/* Community Chat Area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 flex flex-col no-scrollbar">
        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 text-center mb-4 neu-panel">
            <span className="text-4xl block mb-3">🤝</span>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2">Welcome to the Board</h3>
            <p className="text-xs text-text-dim leading-relaxed">Ask about crowd size, wait times, or share your experience with others at {business?.businessName}!</p>
        </div>

        <AnimatePresence>
          {messages.map((msg, i) => {
            const isMine = msg.senderId === user?.uid;
            return (
              <motion.div 
                key={msg.id || i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-3 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 flex-shrink-0 elite-glass">
                   {msg.senderPhoto ? <img src={msg.senderPhoto} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-xs">👤</div>}
                </div>
                <div className={`max-w-[80%] ${isMine ? 'text-right' : 'text-left'}`}>
                  <p className="text-xs font-black text-text-dim uppercase tracking-widest mb-1 px-1">{msg.senderName}</p>
                  <div className={`px-4 py-3 rounded-2xl ${isMine ? 'bg-primary text-white rounded-tr-none' : 'elite-glass border-white/5 text-text rounded-tl-none'}`}>
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Input HUD */}
      <div className="p-4 bg-card/60 backdrop-blur-2xl border-t border-white/5 pb-8">
        <div className="flex gap-3 max-w-2xl mx-auto">
          <input 
             value={text}
             onChange={e => setText(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && handleSend()}
             placeholder="Ask the community..."
             className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
          />
          <button 
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${text.trim() && !sending ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-100' : 'bg-white/5 text-white/20 scale-95'}`}
          >
            {sending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
}
