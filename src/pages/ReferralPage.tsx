import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';

export default function ReferralPage() {
  const { customerProfile, updateProfile } = useApp();
  const nav = useNavigate();
  const [copying, setCopying] = useState(false);

  const referralCode = customerProfile?.referralCode || `LFI-${customerProfile?.uid?.slice(0, 6).toUpperCase()}`;

  const handleCopy = () => {
    triggerHaptic('medium');
    navigator.clipboard.writeText(referralCode);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const handleShare = () => {
    triggerHaptic('light');
    if (navigator.share) {
      navigator.share({
        title: 'Line Free India',
        text: `Hey! Save time and skip lines with Line Free India. Use my code ${referralCode} to get 50 bonus points!`,
        url: window.location.origin
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#08080A] p-6 pb-20">
      <header className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
        <button onClick={() => nav(-1)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white">←</button>
        <h1 className="text-sm font-black text-white uppercase tracking-[0.3em]">Refer & Earn</h1>
        <div className="w-10 h-10" />
      </header>

      <div className="space-y-8 max-w-md mx-auto">
        {/* Points HUD */}
        <section className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-[2.5rem] p-8 border border-white/10 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-[60px]" />
          <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-2">Available Rewards</p>
          <h2 className="text-6xl font-black text-white mb-2">{customerProfile?.referralPoints || 0}</h2>
          <p className="text-xs text-text-dim font-bold uppercase tracking-widest">LF Points</p>
          <div className="mt-6 flex justify-center">
            <button className="px-6 py-2 bg-white/10 backdrop-blur-md rounded-full text-xs font-black text-white uppercase tracking-widest border border-white/10">Redeem for Tatkal Passes</button>
          </div>
        </section>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-4">
           <div className="elite-glass spatial-card border-white/5 rounded-3xl p-5">
              <span className="text-2xl mb-3 block">👥</span>
              <p className="text-xs font-black text-white uppercase tracking-widest mb-1">Invited</p>
              <p className="text-lg font-black text-primary">0 Friends</p>
           </div>
           <div className="elite-glass spatial-card border-white/5 rounded-3xl p-5">
              <span className="text-2xl mb-3 block">🎫</span>
              <p className="text-xs font-black text-white uppercase tracking-widest mb-1">Earned</p>
              <p className="text-lg font-black text-accent">0 Points</p>
           </div>
        </div>

        {/* Share Section */}
        <section className="elite-glass spatial-card border-white/5 rounded-[2rem] p-6">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Your Invitation Link</h3>
          <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between mb-6 group transition-all focus-within:border-primary/50">
            <span className="text-sm font-bold text-white/50 tracking-wider truncate mr-4">{referralCode}</span>
            <button onClick={handleCopy} className="text-primary font-black text-xs uppercase tracking-widest active:scale-95 transition-transform">
              {copying ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button 
            onClick={handleShare}
            className="w-full bg-primary text-white font-black uppercase tracking-[0.2em] py-5 rounded-2xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
          >
            Invite Friends Now
          </button>
        </section>

        {/* Steps */}
        <section className="space-y-5 px-4">
           {[
             { title: 'Share Code', desc: 'Send your referral code to your friends.', icon: '📲' },
             { title: 'They Join', desc: 'When they join Line Free India.', icon: '✨' },
             { title: 'Get Points', desc: 'Receive 50 points per successful referral.', icon: '💰' }
           ].map((step, si) => (
             <div key={si} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-lg">{step.icon}</div>
                <div>
                   <h4 className="text-xs font-black text-white uppercase tracking-widest">{step.title}</h4>
                   <p className="text-sm text-text-dim mt-1">{step.desc}</p>
                </div>
             </div>
           ))}
        </section>
      </div>
    </div>
  );
}
