import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useApp, BarberProfile, getCategoryInfo } from '../store/AppContext';
import ResponsiveContainer from '../components/ResponsiveContainer';

export default function CustomerChat() {
  const { salonId } = useParams<{ salonId: string }>();
  const { user, customerProfile, useChatMessages, sendMessage, getSalonById, allSalons } = useApp();
  const nav = useNavigate();
  const [salon, setSalon] = useState<BarberProfile | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Real-time messages via onSnapshot
  const messages = useChatMessages(salonId || '');

  useEffect(() => {
    if (salonId) {
      const found = allSalons.find(s => s.uid === salonId);
      if (found) setSalon(found);
      else getSalonById(salonId).then(setSalon);
    }
  }, [salonId, allSalons]);

  // Auto-scroll on new messages
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [messages.length]);

  const catInfo = getCategoryInfo(salon?.businessType || 'men_salon');

  const handleSend = async () => {
    if (!text.trim() || !salonId || !user || !salon) return;
    setSending(true);
    await sendMessage({
      salonId,
      salonName: salon.businessName || salon.salonName || '',
      senderId: user.uid,
      senderName: customerProfile?.name || user.displayName || 'Customer',
      senderPhoto: customerProfile?.photoURL || user.photoURL || '',
      senderRole: 'customer',
      // legacy support
      customerId: user.uid,
      customerName: customerProfile?.name || user.displayName || 'Customer',
      customerPhoto: customerProfile?.photoURL || user.photoURL || '',
      message: text.trim(),
      createdAt: Date.now(),
      read: false,
    });
    setText('');
    setSending(false);
  };

  const formatTime = (ts: any) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // Group by date
  const grouped: { date: string; msgs: typeof messages }[] = [];
  messages.forEach(msg => {
    const d = new Date(msg.createdAt || 0);
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const label = d.toDateString() === today.toDateString() ? 'Today'
      : d.toDateString() === yesterday.toDateString() ? 'Yesterday'
      : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const last = grouped[grouped.length - 1];
    if (last && last.date === label) last.msgs.push(msg);
    else grouped.push({ date: label, msgs: [msg] });
  });

  return (
    <ResponsiveContainer variant="customer">
    <div className="min-h-screen flex flex-col animate-fadeIn" style={{ height: '100dvh' }}>
      {/* Premium Header */}
      <div className="p-4 glass-strong flex items-center gap-4 sticky top-0 z-20 border-b border-border shadow-sm">
        <button onClick={() => nav(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors active:scale-95 text-xl text-text">←</button>
        <div className="w-12 h-12 rounded-full bg-card-2 border border-border shadow-inner overflow-hidden flex-shrink-0 relative flex items-center justify-center">
          {salon?.photoURL ? <img src={salon.photoURL} className="w-full h-full object-cover" alt="" /> : <span className="text-2xl opacity-80">{catInfo.icon}</span>}
          {salon?.isOpen && <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-success ring-2 ring-card rounded-full" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-base truncate pr-2">{salon?.businessName || salon?.salonName || 'Business'}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">{catInfo.label}</span>
            <span className="text-text-dim text-xs">•</span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-sm ${salon?.isOpen ? 'text-success bg-success/10' : 'text-danger bg-danger/10'}`}>
              {salon?.isOpen ? 'Open Now' : 'Closed'}
            </span>
          </div>
        </div>
        {salon?.phone && <a href={`tel:${salon.phone}`} className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl active:scale-95 shadow-sm transition-transform">📞</a>}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-card" style={{ overflowAnchor: 'none' }}>
        {messages.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center justify-center h-full">
            <div className="w-24 h-24 bg-card-2 rounded-full flex items-center justify-center mb-6 shadow-inner border border-border">
              <span className="text-5xl animate-float">{catInfo.icon}</span>
            </div>
            <p className="font-black text-lg text-text mb-2">Start a conversation</p>
            <p className="text-text-dim text-sm max-w-[200px] leading-relaxed">Ask {salon?.businessName || 'the business'} anything regarding your {catInfo.terminology.item.toLowerCase()} or visit.</p>
          </div>
        ) : (
          <>
            {grouped.map((group, gi) => (
              <div key={gi} className="space-y-4">
                <div className="text-center my-6">
                  <span className="text-xs font-bold tracking-widest uppercase text-text-dim bg-background border border-border shadow-sm px-4 py-1.5 rounded-full">{group.date}</span>
                </div>
                {group.msgs.map((msg, i) => {
                  const isMine = msg.senderRole === 'customer';
                  const isBusinessMsg = msg.senderRole === 'business';
                  return (
                    <div key={msg.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-slideUp`} style={{ animationFillMode: 'both', animationDuration: '0.3s' }}>
                      {!isMine && (
                        <div className="w-8 h-8 rounded-full bg-card-2 border border-border shadow-sm overflow-hidden flex-shrink-0 mr-2.5 mt-auto mb-1 flex items-center justify-center">
                          {(isBusinessMsg ? salon?.photoURL : msg.senderPhoto || msg.customerPhoto) ? (
                            <img src={(isBusinessMsg ? salon?.photoURL : msg.senderPhoto || msg.customerPhoto) || ''} className="w-full h-full object-cover" alt="" />
                          ) : <span className="text-sm opacity-80">{isBusinessMsg ? catInfo.icon : '👤'}</span>}
                        </div>
                      )}
                      
                      <div className={`max-w-[75%] px-4 py-3 shadow-md border ${
                        isMine 
                          ? 'bg-gradient-to-br from-primary to-accent text-white rounded-2xl rounded-tr-sm border-transparent' 
                          : 'bg-card border-border rounded-2xl rounded-tl-sm'
                      }`}>
                        {!isMine && (
                          <p className="text-xs font-black tracking-widest uppercase text-primary mb-1.5 opacity-90">
                            {isBusinessMsg ? (salon?.businessName || salon?.salonName || 'Business') : (msg.senderName || msg.customerName)}
                          </p>
                        )}
                        <p className={`text-[15px] leading-snug whitespace-pre-wrap ${isMine && 'font-medium'}`}>{msg.message}</p>
                        <div className={`flex items-center gap-1 mt-1.5 justify-end ${isMine ? 'opacity-80' : 'opacity-50'}`}>
                          <p className={`text-xs font-bold tracking-wider ${isMine ? 'text-white' : 'text-text-dim'}`}>
                            {formatTime(msg.createdAt)}
                          </p>
                          {isMine && <span className="text-xs">✓✓</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={bottomRef} className="h-4" />
          </>
        )}
      </div>

      {/* Deep WhatsApp-style Input */}
      <div className="p-3 bg-card-2 border-t border-border pb-safe shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.3)] flex flex-col">
        {/* Quick Auto-Replies */}
        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1 -mx-3 px-3">
          {["I'm here! 👋", "Running 5 min late 🏃", "Is there a delay? 🤔", "Thank you! 🙏"].map(reply => (
            <button key={reply} onClick={() => setText(reply)} className="whitespace-nowrap px-4 py-1.5 rounded-full bg-card border border-border text-xs font-bold text-text-dim hover:text-primary hover:border-primary/50 transition-colors shadow-sm active:scale-95">
              {reply}
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-end max-w-lg mx-auto w-full">
          <div className="flex-1 bg-background border border-border rounded-3xl min-h-[50px] flex items-center px-4 shadow-inner focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message..."
              className="w-full bg-transparent text-sm py-3.5 focus:outline-none resize-none max-h-32 font-medium"
              rows={1}
              style={{
                height: text.split('\n').length > 1 ? `${Math.min(text.split('\n').length * 20 + 20, 100)}px` : '50px'
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className={`w-[50px] h-[50px] rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-md ${
              text.trim() && !sending ? 'bg-primary text-white active:scale-95' : 'bg-card border border-border text-text-dim opacity-50'
            }`}
          >
            {sending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="text-xl ml-1">➤</span>}
          </button>
        </div>
      </div>
    </div>
    </ResponsiveContainer>
  );
}
