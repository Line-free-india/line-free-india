import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp, getCategoryInfo } from '../store/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaExchangeAlt, FaClock, FaStar, FaMapMarkerAlt, FaTag } from 'react-icons/fa';
import { triggerHaptic } from '../utils/haptics';

export default function BusinessCompare() {
  const { allSalons } = useApp();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const id1 = searchParams.get('id1');
  const id2 = searchParams.get('id2');

  const b1 = useMemo(() => allSalons.find(s => s.uid === id1), [allSalons, id1]);
  const b2 = useMemo(() => allSalons.find(s => s.uid === id2), [allSalons, id2]);

  const getPriceIndex = (services: any[] | undefined) => {
    if (!services || services.length === 0) return '₹';
    const avg = services.reduce((acc, s) => acc + s.price, 0) / services.length;
    if (avg < 200) return '₹';
    if (avg < 500) return '₹₹';
    return '₹₹₹';
  };

  const ComparisonRow = ({ label, icon, val1, val2, highlight1, highlight2 }: any) => (
    <div className="py-6 border-b border-white/5">
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-primary text-xs">{icon}</span>
        <span className="text-xs font-black uppercase tracking-[0.3em] text-text-dim">{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-8 items-center text-center px-4">
        <div className={`p-4 rounded-2xl transition-all ${highlight1 ? 'bg-primary/10 border border-primary/20 scale-105 shadow-xl' : 'opacity-60'}`}>
          <span className={`text-sm font-black ${highlight1 ? 'text-primary' : 'text-text'}`}>{val1}</span>
        </div>
        <div className={`p-4 rounded-2xl transition-all ${highlight2 ? 'bg-primary/10 border border-primary/20 scale-105 shadow-xl' : 'opacity-60'}`}>
          <span className={`text-sm font-black ${highlight2 ? 'text-primary' : 'text-text'}`}>{val2}</span>
        </div>
      </div>
    </div>
  );

  if (!b1 || !b2) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-10 text-center">
        <div className="w-20 h-20 bg-card rounded-[2.5rem] flex items-center justify-center text-3xl mb-6 shadow-2xl border border-white/10">❌</div>
        <h2 className="text-2xl font-black text-text mb-2">Invalid Selection</h2>
        <p className="text-text-dim text-sm mb-10">Please select two businesses to compare.</p>
        <button onClick={() => nav(-1)} className="px-10 py-5 bg-primary rounded-full text-white font-black uppercase text-xs tracking-widest active:scale-95 transition-all">Go Back</button>
      </div>
    );
  }

  const cat1 = getCategoryInfo(b1.businessType);
  const cat2 = getCategoryInfo(b2.businessType);

  return (
    <div className="min-h-screen bg-background text-text overflow-x-hidden pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 p-6 safe-top">
        <div className="flex items-center gap-4">
          <button onClick={() => nav(-1)} className="w-12 h-12 bg-card rounded-2xl border border-white/10 flex items-center justify-center active:scale-90 transition-all">
            <FaArrowLeft />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black">Comparison</h1>
            <p className="text-xs font-black text-text-dim uppercase tracking-widest">Decision Matrix 3.0</p>
          </div>
        </div>
      </div>

      {/* Hero Head-to-Head */}
      <div className="p-6">
        <div className="relative grid grid-cols-2 gap-4 h-64">
           {/* Business 1 */}
           <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="elite-glass spatial-card rounded-[3rem] p-6 flex flex-col items-center justify-center text-center border-white/5 relative overflow-hidden group">
              <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden mb-4 shadow-2xl border border-white/10 group-hover:scale-110 transition-transform">
                <img src={b1.bannerImageURL || b1.photoURL} className="w-full h-full object-cover" alt="" />
              </div>
              <h2 className="text-sm font-black truncate w-full">{b1.businessName}</h2>
              <p className="text-xs font-black text-primary uppercase tracking-widest mt-1">{cat1.label}</p>
           </motion.div>

           {/* VS Indicator */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-primary rounded-full border-4 border-background flex items-center justify-center z-10 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
              <FaExchangeAlt className="text-white text-lg" />
           </div>

           {/* Business 2 */}
           <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="elite-glass spatial-card rounded-[3rem] p-6 flex flex-col items-center justify-center text-center border-white/5 relative overflow-hidden group">
              <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden mb-4 shadow-2xl border border-white/10 group-hover:scale-110 transition-transform">
                <img src={b2.bannerImageURL || b2.photoURL} className="w-full h-full object-cover" alt="" />
              </div>
              <h2 className="text-sm font-black truncate w-full">{b2.businessName}</h2>
              <p className="text-xs font-black text-primary uppercase tracking-widest mt-1">{cat2.label}</p>
           </motion.div>
        </div>
      </div>

      {/* Comparison List */}
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="px-6">
        <div className="elite-glass spatial-card rounded-[3rem] border-white/5 overflow-hidden shadow-2xl">
          
          <ComparisonRow 
            label="Live Wait Time" 
            icon={<FaClock />} 
            val1={`${b1.queueDelayMinutes || 0} min`} 
            val2={`${b2.queueDelayMinutes || 0} min`}
            highlight1={(b1.queueDelayMinutes || 0) <= (b2.queueDelayMinutes || 0)}
            highlight2={(b2.queueDelayMinutes || 0) < (b1.queueDelayMinutes || 0)}
          />

          <ComparisonRow 
            label="Customer Rating" 
            icon={<FaStar />} 
            val1={`⭐ ${b1.rating || 'N/A'}`} 
            val2={`⭐ ${b2.rating || 'N/A'}`}
            highlight1={(b1.rating || 0) >= (b2.rating || 0)}
            highlight2={(b2.rating || 0) > (b1.rating || 0)}
          />

          <ComparisonRow 
            label="Price Range" 
            icon={<FaTag />} 
            val1={getPriceIndex(b1.services)} 
            val2={getPriceIndex(b2.services)}
            highlight1={getPriceIndex(b1.services).length <= getPriceIndex(b2.services).length}
            highlight2={getPriceIndex(b2.services).length < getPriceIndex(b1.services).length}
          />

          <ComparisonRow 
            label="Operational Status" 
            icon={<FaMapMarkerAlt />} 
            val1={b1.isOpen ? '🟢 Open' : '🔴 Closed'} 
            val2={b2.isOpen ? '🟢 Open' : '🔴 Closed'}
            highlight1={b1.isOpen}
            highlight2={b2.isOpen}
          />

        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="fixed bottom-10 inset-x-0 px-6 flex gap-4">
        <button 
          onClick={() => { triggerHaptic('success'); nav(`/customer/salon/${b1.uid}`); }}
          className="flex-1 py-5 neu-btn border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl"
        >
          Select {b1.businessName?.split(' ')[0]}
        </button>
        <button 
          onClick={() => { triggerHaptic('success'); nav(`/customer/salon/${b2.uid}`); }}
          className="flex-1 py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl"
        >
          Select {b2.businessName?.split(' ')[0]}
        </button>
      </div>
    </div>
  );
}
