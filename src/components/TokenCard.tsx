import { motion } from 'framer-motion';
import { TokenEntry, getCategoryInfo, BusinessCategory } from '../store/AppContext';
import { FaQrcode, FaDownload, FaShareAlt, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';

interface TokenCardProps {
  token: TokenEntry;
  livePos?: number;
  liveWait?: number;
  businessType?: BusinessCategory;
}

export default function TokenCard({ token, livePos, liveWait, businessType }: TokenCardProps) {
  const termInfo = getCategoryInfo(businessType || 'men_salon');
  
  const downloadCard = async () => {
    const card = document.getElementById(`token-card-${token.id}`);
    if (!card) return;
    const canvas = await html2canvas(card, {
      backgroundColor: null,
      scale: 3,
      useCORS: true
    });
    const link = document.createElement('a');
    link.download = `Token-${token.tokenNumber}-${token.salonName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <motion.div 
        id={`token-card-${token.id}`}
        initial={{ rotateY: -20, opacity: 0, scale: 0.9 }}
        animate={{ rotateY: 0, opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05, rotateY: 5, rotateX: 5 }}
        className="relative w-full max-w-[320px] md:w-80 lg:w-96 h-[520px] rounded-[3rem] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)] group preserve-3d holo-card"
      >
        {/* Glass Background */}
        <div className="absolute inset-0 bg-card/40 backdrop-blur-2xl border border-white/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-black/60" />
        
        {/* Animated Mesh */}
        <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
        
        {/* Top Section: Business Info */}
        <div className="relative p-8 text-center pt-12">
          <div className="absolute top-6 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary/20 backdrop-blur-md rounded-full text-[7px] font-black text-primary border border-primary/30 uppercase tracking-[0.3em]">
             VIP Digital Token
          </div>
          <div className="w-20 h-20 mx-auto bg-white/10 rounded-3xl flex items-center justify-center text-5xl mb-4 border border-white/20 shadow-2xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 animate-pulse" />
             <span className="relative z-10">{termInfo.icon}</span>
          </div>
          <h2 className="text-xl font-black text-text tracking-tighter uppercase mb-1">{token.salonName}</h2>
          <p className="text-sm font-bold text-text-dim mt-1">{token.customerName}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <p className="text-xs font-black text-primary tracking-[2px] uppercase">Verified Pass</p>
          </div>
        </div>
         {/* Middle Section: Token Number */}
        <div className="relative flex flex-col items-center justify-center -mt-2">
          <div className="relative p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/5 shadow-inner">
             <div className="absolute -inset-10 bg-primary/10 blur-[60px] animate-pulse rounded-full" />
             <p className="text-xs font-black text-text-dim uppercase tracking-[4px] mb-3 text-center">Your ID</p>
             <h1 className="text-8xl font-black text-text tracking-tighter drop-shadow-[0_0_30px_rgba(16,185,129,0.4)] leading-none">
               {token.tokenNumber}
             </h1>
          </div>
        </div>
         {/* Status Pills */}
        <div className="relative px-6 mt-8 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/10 text-center">
               <FaClock className="mx-auto text-primary mb-1" />
               <p className="text-xs font-bold text-text-dim uppercase tracking-widest">Est. Wait</p>
               <p className="text-sm font-black text-text">{liveWait ?? token.estimatedWaitMinutes}m</p>
            </div>
            <div className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/10 text-center">
               <span className="text-2xl mb-1">🏆</span>
               <p className="text-xs font-bold text-text-dim uppercase tracking-widest">Your Position</p>
               <p className="text-sm font-black text-text">{livePos ?? 1}{livePos === 1 ? 'st' : livePos === 2 ? 'nd' : livePos === 3 ? 'rd' : 'th'}</p>
            </div>
          </div>
        </div>

        {/* Footer: Date & Security */}
        <div className="absolute bottom-10 inset-x-0 px-8 flex justify-between items-end">
           <div className="text-left">
              <p className="text-xs font-black text-text-dim uppercase tracking-widest">Valid Today</p>
              <p className="text-xs font-black text-text">{token.date}</p>
           </div>
           <div className="bg-white p-2 rounded-xl shadow-xl">
              <QRCodeSVG 
                value={`${window.location.origin}/customer/salon/${token.salonId}?token=${token.id}`}
                size={48}
                bgColor="transparent"
                fgColor="#000000"
                level="M"
              />
           </div>
        </div>

        {/* Decorative corner accents */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/20 rounded-tl-lg" />
        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-white/20 rounded-tr-lg" />
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-white/20 rounded-bl-lg" />
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/20 rounded-br-lg" />
      </motion.div>

      {/* Action Buttons */}
      <div className="flex gap-4 w-full max-w-[320px] md:w-80 lg:w-96">
        <button 
          onClick={downloadCard}
          className="btn-glow flex-1 flex items-center justify-center gap-3 text-xs shadow-2xl active:scale-95 transition-all"
        >
          <FaDownload /> Download
        </button>
        <button 
          onClick={async () => {
            try {
              const card = document.getElementById(`token-card-${token.id}`);
              if (!card) return;
              const canvas = await html2canvas(card, { backgroundColor: null, scale: 3, useCORS: true });
              const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'));
              if (blob && navigator.share) {
                const file = new File([blob], `Token-${token.tokenNumber}.png`, { type: 'image/png' });
                await navigator.share({ title: `Token #${token.tokenNumber} - ${token.salonName}`, text: `My VIP Token #${token.tokenNumber} at ${token.salonName}`, files: [file] });
              } else if (blob) {
                const link = document.createElement('a');
                link.download = `Token-${token.tokenNumber}.png`;
                link.href = URL.createObjectURL(blob);
                link.click();
              }
            } catch (e) { console.error('Share failed:', e); }
          }}
          className="flex-1 h-[58px] bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-white font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all active:scale-95 outline-none"
        >
          <FaShareAlt className="text-primary" /> Share
        </button>
      </div>
    </div>
  );
}
