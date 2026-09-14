import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';
import { generateReviewReply } from '../services/aiService';

interface Review {
  id: string;
  customerName: string;
  customerPhone?: string;
  rating: number;
  review?: string;
  comment?: string;
  service?: string;
  date: string | number;
  replied?: boolean;
  reply?: string;
  replyImage?: string;
}

export default function ReviewCollector() {
  const { user, businessProfile, getSalonReviews } = useApp();
  const nav = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [saving, setSaving] = useState(false);
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyImage, setReplyImage] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestPhone, setRequestPhone] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    // Load from verified Firestore reviews collection
    getSalonReviews(user.uid).then(verifiedReviews => {
      if (verifiedReviews && verifiedReviews.length > 0) {
        setReviews(verifiedReviews.map((r: any) => ({
          id: r.id,
          customerName: r.customerName || 'Customer',
          customerPhone: r.customerPhone,
          rating: r.rating || 5,
          review: r.comment || r.review || '',
          service: r.service || 'Service',
          date: r.createdAt || r.date || Date.now(),
          replied: r.replied || !!r.reply,
          reply: r.reply,
          replyImage: r.replyImage
        })));
      } else if ((businessProfile as any)?.reviews) {
        setReviews((businessProfile as any).reviews);
      }
    }).catch(err => {
      console.warn('Could not load reviews:', err);
      if ((businessProfile as any)?.reviews) {
        setReviews((businessProfile as any).reviews);
      }
    });
  }, [user, businessProfile]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleAIDraft = async () => {
    const activeRev = reviews.find(r => r.id === replyId);
    if (!activeRev) return;
    setIsGeneratingAI(true);
    triggerHaptic('medium');
    try {
      const res = await generateReviewReply({
        rating: activeRev.rating,
        customerName: activeRev.customerName,
        comment: activeRev.review,
        businessName: businessProfile?.businessName || 'Our Business',
        service: activeRev.service
      });
      setReplyText(res.replyText);
      triggerHaptic('success');
      showToast(`AI draft ready (${res.tone}) ✨`);
    } catch {
      showToast('AI draft generation failed. Please type manually.');
    }
    setIsGeneratingAI(false);
  };

  const submitReply = async () => {
    if (!replyId || !replyText.trim() || !user) return;
    setSaving(true);
    try {
      // 1. Try updating reviews collection
      try {
        await updateDoc(doc(db, 'reviews', replyId), {
          reply: replyText.trim(),
          replied: true,
          replyImage: replyImage || null
        });
      } catch {
        // Fallback for legacy user reviews
        await updateDoc(doc(db, 'users', user.uid), {
          reviews: reviews.map(r => r.id === replyId ? { ...r, replied: true, reply: replyText.trim(), replyImage: replyImage || undefined } : r)
        });
      }

      setReviews(prev => prev.map(r => r.id === replyId ? { ...r, replied: true, reply: replyText.trim(), replyImage: replyImage || undefined } : r));
      triggerHaptic('success');
      showToast('Reply published successfully! 🎉');
      setReplyId(null);
      setReplyText('');
      setReplyImage(null);
    } catch (e: any) {
      showToast('Could not save reply: ' + (e.message || 'Unknown error'));
    }
    setSaving(false);
  };

  const handleSendWhatsAppLink = () => {
    if (!requestPhone) return;
    const bName = businessProfile?.businessName || 'Business';
    const cleanPhone = requestPhone.replace(/\D/g, '').slice(-10);
    const bookingUrl = `${window.location.origin}/customer/salon/${user?.uid}`;
    const text = `*⭐ Rate Your Experience - ${bName}*\n\nHi! Thank you for visiting us. We hope you enjoyed your service! 🙏\n\nPlease take 30 seconds to rate us and leave a short review:\n👉 ${bookingUrl}\n\nYour feedback helps us continuously improve! ❤️`;
    
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
    setShowRequestModal(false);
    setRequestPhone('');
    showToast('Review request link created!');
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : '0';
  const stars = [5, 4, 3, 2, 1].map(s => ({ star: s, count: reviews.filter(r => r.rating === s).length }));

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-900/20 via-background to-background">
      {/* Top Bar */}
      <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div>
            <h1 className="font-black text-lg text-yellow-400">Reviews & Ratings ⭐</h1>
            <p className="text-xs text-yellow-200/50 font-bold uppercase tracking-widest">{avgRating} Avg • {reviews.length} Total</p>
          </div>
        </div>
        <button 
          onClick={() => setShowRequestModal(true)} 
          className="text-xs font-black uppercase tracking-widest text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg hover:bg-green-500 hover:text-white transition-all shadow-sm"
        >
          Request Review
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Rating Summary Card */}
        <div className="elite-glass rounded-3xl p-5 flex gap-4 items-center spatial-card border border-yellow-500/20">
          <div className="text-center px-2">
            <p className="text-4xl font-black text-yellow-400">{avgRating}</p>
            <p className="text-xs text-text-dim font-bold uppercase mt-1">Average</p>
          </div>
          <div className="flex-1 space-y-1">
            {stars.map(s => (
              <div key={s.star} className="flex items-center gap-2">
                <span className="text-xs font-bold text-yellow-200 w-5">{s.star}★</span>
                <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${reviews.length > 0 ? (s.count / reviews.length) * 100 : 0}%` }}></div>
                </div>
                <span className="text-xs text-text-dim w-6 text-right">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reply Modal with AI Assistant */}
        {replyId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fadeIn">
            <div className="bg-card w-full max-w-md rounded-[32px] p-6 border border-yellow-500/30 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-lg text-yellow-400">Reply to Review</h2>
                <button 
                  onClick={handleAIDraft}
                  disabled={isGeneratingAI}
                  className="px-3 py-1.5 rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-yellow-500/30 transition-all"
                >
                  {isGeneratingAI ? <span className="animate-spin">⌛</span> : <span>✨</span>}
                  <span>AI Draft</span>
                </button>
              </div>

              <textarea 
                value={replyText} 
                onChange={e => setReplyText(e.target.value)} 
                rows={4} 
                placeholder="Write a polite, authentic reply to your customer..." 
                className="w-full p-3.5 rounded-2xl bg-background border border-border outline-none text-xs text-yellow-100 resize-none mb-3 focus:border-yellow-500/50"
              />
              
              <div className="mb-4">
                <p className="text-[11px] font-bold text-yellow-200/50 uppercase tracking-wider mb-2">Attach Photo (Optional)</p>
                <div className="flex gap-2 items-center">
                  <label className="w-12 h-12 rounded-xl bg-background border border-border border-dashed flex items-center justify-center text-xl cursor-pointer hover:border-yellow-500 transition-colors">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setReplyImage(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} />
                    📸
                  </label>
                  {replyImage && (
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-yellow-500">
                      <img src={replyImage} className="w-full h-full object-cover" alt="" />
                      <button onClick={() => setReplyImage(null)} className="absolute top-0 right-0 bg-black/60 text-white text-xs px-1">✕</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => { setReplyId(null); setReplyImage(null); }} className="flex-1 py-3 rounded-xl bg-card-2 text-text-dim text-xs font-black uppercase">Cancel</button>
                <button onClick={submitReply} disabled={saving || !replyText.trim()} className="flex-1 py-3 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-black uppercase shadow-md disabled:opacity-40 transition-all">
                  {saving ? 'Posting...' : 'Post Reply'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Request Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fadeIn">
            <div className="bg-card w-full max-w-sm rounded-[32px] p-6 border border-green-500/30 shadow-2xl">
              <h2 className="font-black text-lg text-green-400 mb-2">Request Review on WhatsApp</h2>
              <p className="text-xs text-text-dim mb-4">Send a polite 1-click review link to your customer's WhatsApp.</p>
              
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={requestPhone}
                onChange={e => setRequestPhone(e.target.value)}
                maxLength={10}
                className="w-full px-4 py-3 rounded-2xl bg-background border border-border text-white text-sm outline-none focus:border-green-500 mb-4"
              />

              <div className="flex gap-2">
                <button onClick={() => setShowRequestModal(false)} className="flex-1 py-3 rounded-xl bg-card-2 text-text-dim text-xs font-black uppercase">Cancel</button>
                <button 
                  onClick={handleSendWhatsAppLink} 
                  disabled={requestPhone.replace(/\D/g, '').length < 10}
                  className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase shadow-md disabled:opacity-40 transition-all"
                >
                  Send via WA
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="p-8 text-center elite-glass rounded-3xl border border-white/5">
              <span className="text-3xl block mb-2">⭐</span>
              <p className="font-bold text-sm text-yellow-100">No customer reviews yet</p>
              <p className="text-xs text-text-dim mt-1">Request reviews from customers after they complete their appointment!</p>
            </div>
          ) : (
            reviews.map(r => (
              <div key={r.id} className="p-5 rounded-3xl elite-glass spatial-card border border-white/5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-black text-sm text-yellow-50">{r.customerName}</h4>
                    <p className="text-[11px] text-text-dim">{r.service} • {new Date(r.date).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className="text-sm text-yellow-400">
                    {'★'.repeat(r.rating)}{'☆'.repeat(Math.max(0, 5 - r.rating))}
                  </div>
                </div>

                <p className="text-xs text-yellow-100/90 mb-3 italic leading-relaxed">
                  "{r.review || 'No written comment'}"
                </p>

                {r.replied && r.reply && (
                  <div className="bg-background/60 rounded-2xl p-3.5 border border-yellow-500/20 mt-2">
                    <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-1">Your Reply:</p>
                    <p className="text-xs text-yellow-100/80 leading-relaxed">{r.reply}</p>
                    {r.replyImage && (
                      <img src={r.replyImage} className="w-full h-32 object-cover rounded-xl mt-2 border border-border" alt="Reply attachment" />
                    )}
                  </div>
                )}

                {!r.replied && (
                  <button 
                    onClick={() => { setReplyId(r.id); setReplyText(''); setReplyImage(null); }} 
                    className="text-xs font-black uppercase text-yellow-400 hover:text-yellow-300 mt-1 flex items-center gap-1"
                  >
                    <span>Reply to Review</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* In-app Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-zinc-900 border border-yellow-500/50 text-white px-4 py-2.5 rounded-2xl z-50 text-xs font-bold shadow-2xl flex items-center gap-2">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 text-white/50 hover:text-white">&times;</button>
        </div>
      )}
    </div>
  );
}
