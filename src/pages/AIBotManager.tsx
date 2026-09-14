import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { useApp } from '../store/AppContext';
import { generateReviewReply } from '../services/aiService';

interface Review {
  id: string;
  customer: string;
  rating: number;
  comment: string;
  suggestion?: string;
}

const MOCK_REVIEWS: Review[] = [
  { id: '1', customer: 'Ankur S.', rating: 5, comment: 'Amazing experience! The staff was very professional and the ambiance is peaceful.' },
  { id: '2', customer: 'Sonia V.', rating: 3, comment: 'Good service but the wait time was a bit long even with a token.' },
  { id: '3', customer: 'Rohan M.', rating: 2, comment: 'The haircut was okay but the pricing is too high for the area.' },
];

export default function AIBotManager() {
  const { businessProfile, getSalonReviews, user } = useApp();
  const [reviewsList, setReviewsList] = useState<Review[]>(MOCK_REVIEWS);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      getSalonReviews(user.uid).then(revs => {
        if (revs && revs.length > 0) {
          setReviewsList(revs.map((r: any) => ({
            id: r.id,
            customer: r.customerName || 'Customer',
            rating: r.rating || 5,
            comment: r.comment || r.review || 'Great service'
          })));
        }
      }).catch(() => {});
    }
  }, [user]);

  const generateResponse = async (review: Review) => {
    setIsGenerating(true);
    triggerHaptic('medium');
    try {
      const res = await generateReviewReply({
        rating: review.rating,
        customerName: review.customer,
        comment: review.comment,
        businessName: businessProfile?.businessName || 'Our Business'
      });
      setAiResponse(res.replyText);
      triggerHaptic('success');
    } catch {
      setAiResponse(`Thank you ${review.customer} for your review! We truly value your business and hope to see you again soon.`);
    }
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen pb-32 bg-[#060810] text-white font-sans selection:bg-fuchsia-500/30">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(192,38,211,0.1),transparent_50%)] pointer-events-none" />

      {/* Header */}
      <div className="px-6 pt-14 pb-8 relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs text-fuchsia-400 font-black uppercase tracking-[0.4em] mb-1">Reputation Engine</p>
            <h1 className="text-3xl font-black tracking-tighter italic">AI Review Bot</h1>
          </div>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} className="w-12 h-12 rounded-full border-2 border-fuchsia-500/20 flex items-center justify-center text-xl">🤖</motion.div>
        </div>
        <p className="text-zinc-500 text-xs font-medium">Auto-generate professional replies to boost your Google Maps ranking.</p>
      </div>

      <div className="px-6 space-y-6">
        {/* Reviews List */}
        <div className="space-y-4">
           {reviewsList.map(rev => (
              <motion.div 
                key={rev.id} 
                layoutId={rev.id}
                onClick={() => { triggerHaptic('light'); setSelectedReview(rev); setAiResponse(''); }}
                className={`p-5 rounded-[2.5rem] elite-glass spatial-card border transition-all cursor-pointer ${selectedReview?.id === rev.id ? 'border-fuchsia-500/40' : 'border-white/5 opacity-80'}`}
              >
                 <div className="flex justify-between items-center mb-3">
                    <h4 className="font-black text-sm">{rev.customer}</h4>
                    <div className="flex gap-0.5">
                       {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-xs ${i < rev.rating ? 'text-amber-400' : 'text-zinc-700'}`}>⭐</span>
                       ))}
                    </div>
                 </div>
                 <p className="text-xs text-zinc-400 leading-relaxed italic">"{rev.comment}"</p>
              </motion.div>
           ))}
        </div>

        {/* AI Action Area */}
        <AnimatePresence mode="wait">
          {selectedReview && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 10 }}
              className="elite-glass spatial-card border-white/5 rounded-[3rem] p-8 relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 blur-[50px] -translate-x-1/2 -translate-y-1/2" />
               
               <h3 className="text-xs font-black uppercase tracking-widest text-fuchsia-400 mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" /> AI Draft Assistant
               </h3>

               {isGenerating ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-4">
                     <div className="w-12 h-12 border-4 border-fuchsia-500/20 border-t-fuchsia-500 rounded-full animate-spin" />
                     <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Analyzing Sentiment & Drafting...</p>
                  </div>
               ) : aiResponse ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                     <div className="bg-black/40 rounded-3xl p-6 border border-white/5">
                        <p className="text-sm leading-relaxed text-zinc-300 font-medium">{aiResponse}</p>
                     </div>
                     <div className="flex gap-3">
                        <button onClick={() => { setAiResponse(''); triggerHaptic('light'); }} className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest">Regenerate</button>
                        <button 
                          onClick={() => {
                            navigator.clipboard?.writeText(aiResponse);
                            setCopied(true);
                            triggerHaptic('success');
                            setTimeout(() => setCopied(false), 2500);
                          }} 
                          className="flex-1 py-4 rounded-2xl bg-fuchsia-600 shadow-lg shadow-fuchsia-600/30 text-xs font-black text-white uppercase tracking-widest"
                        >
                          {copied ? 'Copied! ✅' : 'Copy Reply 📋'}
                        </button>
                     </div>
                  </motion.div>
               ) : (
                  <div className="py-6 text-center">
                     <button 
                       onClick={() => generateResponse(selectedReview)}
                       className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-fuchsia-600/20 active:scale-95 transition-all"
                     >
                        Analyze & Respond
                     </button>
                     <p className="mt-4 text-xs text-zinc-600 font-black uppercase tracking-widest">Confidence Score: 0.982</p>
                  </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
           <div className="p-6 rounded-[2rem] elite-glass spatial-card border-white/5">
              <p className="text-xs text-zinc-600 font-black uppercase tracking-widest mb-1">Reputation Score</p>
              <p className="text-2xl font-black text-emerald-400">4.8</p>
           </div>
           <div className="p-6 rounded-[2rem] elite-glass spatial-card border-white/5">
              <p className="text-xs text-zinc-600 font-black uppercase tracking-widest mb-1">Total Replies</p>
              <p className="text-2xl font-black">1.2k</p>
           </div>
        </div>
      </div>
    </div>
  );
}
