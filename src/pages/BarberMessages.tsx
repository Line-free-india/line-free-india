import { useState, useEffect, useRef } from 'react';
import { useApp, getCategoryInfo } from '../store/AppContext';
import BottomNav from '../components/BottomNav';

interface CustomerThread {
  customerId: string;
  customerName: string;
  customerPhoto: string;
  lastMessage: string;
  lastTime: number;
  unread: number;
}

export default function BarberMessages() {
  const { user, businessProfile, useChatMessages, sendMessage } = useApp();
  const salonId = user?.uid || '';

  // Real-time all messages for this salon
  const allMessages = useChatMessages(salonId);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const catInfo = getCategoryInfo(businessProfile?.businessType || 'men_salon');

  // Auto-scroll
  useEffect(() => {
    if (selectedCustomerId) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [allMessages.length, selectedCustomerId]);

  // Build customer threads from all messages
  const threads = new Map<string, CustomerThread>();
  allMessages.forEach(msg => {
    const cid = msg.customerId || (msg.senderRole === 'customer' ? msg.senderId : null);
    if (!cid) return;
    const existing = threads.get(cid);
    const time = (msg.createdAt as number) || 0;
    const isFromCustomer = msg.senderRole === 'customer' || msg.customerId === cid;
    if (!existing || time > existing.lastTime) {
      threads.set(cid, {
        customerId: cid,
        customerName: msg.customerName || msg.senderName || 'Customer',
        customerPhoto: msg.customerPhoto || msg.senderPhoto || '',
        lastMessage: msg.message,
        lastTime: time,
        unread: (existing?.unread || 0) + (isFromCustomer && !msg.read ? 1 : 0),
      });
    } else if (isFromCustomer && !msg.read) {
      threads.set(cid, { ...existing, unread: existing.unread + 1 });
    }
  });

  const sortedThreads = [...threads.values()].sort((a, b) => b.lastTime - a.lastTime);
  const totalUnread = sortedThreads.reduce((s, t) => s + t.unread, 0);

  // Messages in selected conversation
  const convMessages = selectedCustomerId
    ? allMessages.filter(m => (m.customerId === selectedCustomerId) || (m.senderRole === 'customer' && m.senderId === selectedCustomerId) || (m.senderRole === 'business' && (m.customerId === selectedCustomerId || m.senderId === selectedCustomerId)))
    : [];

  const selectedThread = selectedCustomerId ? threads.get(selectedCustomerId) : null;

  const handleReply = async () => {
    if (!replyText.trim() || !salonId || !selectedCustomerId || !businessProfile) return;
    setSending(true);
    await sendMessage({
      salonId,
      salonName: businessProfile.businessName || businessProfile.salonName || '',
      senderId: salonId,
      senderName: businessProfile.businessName || businessProfile.salonName || '',
      senderPhoto: businessProfile.photoURL || '',
      senderRole: 'business',
      customerId: selectedCustomerId,
      customerName: selectedThread?.customerName || 'Customer',
      customerPhoto: selectedThread?.customerPhoto || '',
      message: replyText.trim(),
      createdAt: Date.now(),
      read: false,
    });
    setReplyText('');
    setSending(false);
  };

  const formatTime = (ts: number) => {
    if (!ts) return '';
    const d = new Date(ts), now = new Date();
    return d.toDateString() === now.toDateString()
      ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // ── CONVERSATION VIEW ──
  if (selectedCustomerId && selectedThread) {
    return (
      <div className="min-h-screen flex flex-col animate-fadeIn bg-background" style={{ height: '100dvh' }}>
        {/* Header */}
        <div className="p-4 glass-strong flex items-center gap-4 sticky top-0 z-20 border-b border-border shadow-sm">
          <button onClick={() => setSelectedCustomerId(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors active:scale-95 text-xl text-text">←</button>
          <div className="w-12 h-12 rounded-full bg-card-2 border border-border overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
            {selectedThread.customerPhoto ? <img src={selectedThread.customerPhoto} className="w-full h-full object-cover" alt="" /> : <span className="text-2xl opacity-80">👤</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-base truncate">{selectedThread.customerName}</p>
            <p className="text-text-dim text-xs uppercase font-bold tracking-widest mt-0.5">Customer</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-card" style={{ overflowAnchor: 'none' }}>
          {convMessages.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center justify-center h-full">
              <span className="text-5xl animate-float block mb-4 opacity-50">👤</span>
              <p className="text-text-dim font-bold text-lg">No messages yet</p>
            </div>
          ) : (
            <>
              {convMessages.map((msg, i) => {
                const isBusinessMsg = msg.senderRole === 'business';
                return (
                  <div key={msg.id || i} className={`flex ${isBusinessMsg ? 'justify-end' : 'justify-start'} animate-slideUp`} style={{ animationFillMode: 'both', animationDuration: '0.3s' }}>
                    {!isBusinessMsg && (
                      <div className="w-8 h-8 rounded-full bg-card-2 border border-border overflow-hidden flex-shrink-0 mr-2.5 mt-auto mb-1 flex items-center justify-center shadow-sm">
                        {selectedThread.customerPhoto ? <img src={selectedThread.customerPhoto} className="w-full h-full object-cover" alt="" /> : <span className="text-sm opacity-80">👤</span>}
                      </div>
                    )}
                    <div className={`max-w-[75%] px-4 py-3 shadow-md border ${
                      isBusinessMsg 
                        ? 'bg-gradient-to-br from-primary to-accent text-white rounded-2xl rounded-tr-sm border-transparent' 
                        : 'bg-card border-border rounded-2xl rounded-tl-sm'
                    }`}>
                      <p className={`text-[15px] leading-snug whitespace-pre-wrap ${isBusinessMsg && 'font-medium'}`}>{msg.message}</p>
                      <div className={`flex items-center gap-1 mt-1.5 justify-end ${isBusinessMsg ? 'opacity-80' : 'opacity-50'}`}>
                        <p className={`text-xs font-bold tracking-wider ${isBusinessMsg ? 'text-white' : 'text-text-dim'}`}>
                          {formatTime((msg.createdAt as number) || 0)}
                        </p>
                        {isBusinessMsg && <span className="text-xs">✓✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} className="h-4" />
            </>
          )}
        </div>

        {/* Reply Input */}
        <div className="p-3 bg-card-2 border-t border-border pb-safe shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.3)]">
          <div className="flex gap-2 items-end max-w-lg mx-auto w-full">
            <div className="flex-1 bg-background border border-border rounded-3xl min-h-[50px] flex items-center px-4 shadow-inner focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleReply();
                  }
                }}
                placeholder={`Reply to ${selectedThread.customerName}...`}
                className="w-full bg-transparent text-sm py-3.5 focus:outline-none resize-none max-h-32 font-medium"
                rows={1}
                style={{
                  height: replyText.split('\n').length > 1 ? `${Math.min(replyText.split('\n').length * 20 + 20, 100)}px` : '50px'
                }}
              />
            </div>
            <button
              onClick={handleReply}
              disabled={!replyText.trim() || sending}
              className={`w-[50px] h-[50px] rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-md ${
                replyText.trim() && !sending ? 'bg-primary text-white active:scale-95' : 'bg-card border border-border text-text-dim opacity-50'
              }`}
            >
              {sending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="text-xl ml-1">➤</span>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── THREADS LIST VIEW ──
  return (
    <div className="min-h-screen pb-40 animate-fadeIn bg-background">
      <div className="p-6 sticky top-0 z-10 bg-gradient-to-b from-card to-background border-b border-border shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">Inbox 💬</h1>
            <p className="text-text-dim text-xs font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
              {totalUnread > 0 ? (
                <span className="text-primary bg-primary/10 px-2.5 py-1 rounded-sm border border-primary/20">{totalUnread} Unread Messages</span>
              ) : (
                <span className="text-success bg-success/10 px-2.5 py-1 rounded-sm border border-success/20">All caught up ✅</span>
              )}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-card-2 border border-border flex items-center justify-center shadow-inner relative">
            <span className="text-2xl">{catInfo.icon}</span>
            <div className="absolute -top-1 -right-1 flex items-center gap-1 text-xs text-success font-black bg-success/10 border border-success/30 px-1.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Broadcast Promo FAB */}
        <div className="mb-5 p-4 rounded-3xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-black text-sm flex items-center gap-2">📣 Broadcast Promo</h3>
              <p className="text-xs text-text-dim uppercase tracking-widest mt-0.5 font-bold">Reach {sortedThreads.length > 0 ? `${sortedThreads.length * 5}+ customers` : 'all customers'} instantly</p>
            </div>
            <div className="text-3xl opacity-40">📡</div>
          </div>
          <button onClick={() => alert('Broadcast sent! (Demo: would send WhatsApp/push to all customers.)')} className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-black text-sm active:scale-95 transition-transform shadow-md shadow-primary/20 flex items-center justify-center gap-2">
            ⚡ Send Flash Promo
          </button>
        </div>
        {sortedThreads.length === 0 ? (
          <div className="text-center py-24 bg-card-2 rounded-3xl border border-border shadow-inner mt-4">
            <span className="text-6xl block mb-4 animate-float opacity-50">📱</span>
            <p className="font-black text-lg text-text">Inbox Empty</p>
            <p className="text-text-dim text-sm mt-1 max-w-[220px] mx-auto leading-relaxed">When customers message your {catInfo.label.toLowerCase()}, they'll appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedThreads.map((thread, i) => (
              <button
                key={thread.customerId}
                onClick={() => setSelectedCustomerId(thread.customerId)}
                className={`w-full p-4 rounded-3xl border text-left flex items-start gap-4 hover:border-primary/40 transition-all active:scale-[0.98] animate-fadeIn shadow-sm hover:shadow-md ${
                  thread.unread > 0 ? 'bg-card border-primary/20' : 'bg-card-2 border-border'
                }`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-card border border-border shadow-inner overflow-hidden flex-shrink-0 relative flex items-center justify-center">
                  {thread.customerPhoto ? <img src={thread.customerPhoto} className="w-full h-full object-cover" alt="" /> : <span className="text-2xl opacity-70">👤</span>}
                  {thread.unread > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary ring-2 ring-card rounded-full flex items-center justify-center text-xs text-white font-black shadow-md">{thread.unread > 9 ? '9+' : thread.unread}</div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`font-black text-base truncate pr-2 ${thread.unread > 0 ? 'text-primary' : 'text-text'}`}>{thread.customerName}</p>
                    <span className={`text-xs font-bold uppercase tracking-widest whitespace-nowrap ${thread.unread > 0 ? 'text-primary' : 'text-text-dim'}`}>
                      {formatTime(thread.lastTime)}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 truncate leading-relaxed ${thread.unread > 0 ? 'font-bold text-text' : 'text-text-dim'}`}>{thread.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
