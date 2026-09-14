import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';

export default function SupportChat() {
  const { user, customerProfile } = useApp();
  const nav = useNavigate();
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<any[]>([
    { id: '1', sender: 'admin', text: 'Hi! I am your Line Free assistant. How can I help you today?', time: Date.now() }
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    triggerHaptic('light');
    const newMsg = { id: Date.now().toString(), sender: 'user', text: text.trim(), time: Date.now() };
    setMessages(prev => [...prev, newMsg]);
    setText('');

    // Simulate Admin Reply
    setTimeout(() => {
        setMessages(prev => [...prev, { 
            id: (Date.now()+1).toString(), 
            sender: 'admin', 
            text: "Thanks for reaching out! One of our agents will be with you shortly. If this is about a specific token, please mention your Token ID.", 
            time: Date.now() 
        }]);
    }, 1500);
  };

  const quickReplies = [
    "Wait time issue",
    "Token not working",
    "Refund request",
    "App giving error"
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="p-5 glass-strong flex items-center gap-4 sticky top-0 z-20 border-b border-white/5">
        <button onClick={() => nav(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white">←</button>
        <div className="flex-1">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Help & Support</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <p className="text-xs font-bold text-success uppercase tracking-widest">Support Online</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary text-xl">🎧</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 flex flex-col no-scrollbar">
        <AnimatePresence>
          {messages.map((msg) => {
            const isMine = msg.sender === 'user';
            return (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl ${isMine ? 'bg-primary text-white rounded-tr-none' : 'bg-card border border-white/10 text-text rounded-tl-none'}`}>
                   <p className="text-sm leading-relaxed">{msg.text}</p>
                   <p className={`text-xs mt-1.5 font-bold uppercase tracking-widest ${isMine ? 'text-white/60' : 'text-text-dim'}`}>
                      {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Input Section */}
      <div className="p-4 bg-card/60 backdrop-blur-2xl border-t border-white/5 pb-8 space-y-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
           {quickReplies.map(reply => (
             <button 
                key={reply} 
                onClick={() => setText(reply)}
                className="whitespace-nowrap px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-black text-text-dim uppercase tracking-widest"
             >
                {reply}
             </button>
           ))}
        </div>
        
        <div className="flex gap-3">
          <input 
             value={text}
             onChange={e => setText(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && handleSend()}
             placeholder="Describe your issue..."
             className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={!text.trim()}
            className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
