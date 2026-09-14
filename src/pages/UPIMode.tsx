import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaCheckCircle, FaFingerprint, FaShieldAlt, FaQrcode } from 'react-icons/fa';
import { triggerHaptic } from '../utils/haptics';

export default function UPIMode() {
  const nav = useNavigate();
  const [step, setStep] = useState<'details' | 'authenticating' | 'success'>('details');
  const [amount, setAmount] = useState('1,250.00');

  const handlePay = () => {
    triggerHaptic('medium');
    setStep('authenticating');
    setTimeout(() => {
      setStep('success');
      triggerHaptic('success');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans p-6 overflow-hidden relative">
      {/* 🌌 Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-primary/5 rounded-full blur-[120px] animate-pulse" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-12 relative z-10">
        <button onClick={() => nav(-1)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-all">
          <FaArrowLeft />
        </button>
        <h1 className="text-sm font-black uppercase tracking-[0.3em] text-text-dim">Secured Fintech Node</h1>
        <div className="w-10 h-10 rounded-full bg-emerald-glow/10 border border-emerald-glow/20 flex items-center justify-center text-emerald-glow">
          <FaShieldAlt />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-12 relative z-10"
          >
            {/* Amount Visualizer */}
            <div className="text-center space-y-2">
              <p className="text-xs font-black text-text-dim uppercase tracking-[0.4em]">Payment Amount</p>
              <h2 className="text-6xl font-black tracking-tighter text-white">
                <span className="text-primary mr-1">₹</span>{amount}
              </h2>
            </div>

            {/* Merchant Card */}
            <div className="w-full glass-panel p-8 flex flex-col gap-6">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">🏪</div>
                  <div>
                    <h3 className="text-lg font-black text-white">Universal Business Node</h3>
                    <p className="text-xs font-bold text-text-dim">UPI ID: business.superapp@pay</p>
                  </div>
               </div>
               <div className="h-px bg-white/5 w-full" />
               <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-text-dim uppercase tracking-widest">Transaction Fee</span>
                  <span className="text-emerald-glow">₹0.00 (WAIVED)</span>
               </div>
            </div>

            {/* Action Area */}
            <div className="w-full pt-10 space-y-4">
               <motion.button
                 whileTap={{ scale: 0.98 }}
                 onClick={handlePay}
                 className="w-full bg-primary py-5 rounded-2xl text-white font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(225,29,72,0.3)] flex items-center justify-center gap-3 active:brightness-110 transition-all"
               >
                 Authorize Payment
                 <FaFingerprint className="text-xl" />
               </motion.button>
               <button className="w-full py-4 text-xs font-black text-text-dim uppercase tracking-widest flex items-center justify-center gap-2">
                 <FaQrcode />
                 Show Scanner
               </button>
            </div>
          </motion.div>
        )}

        {step === 'authenticating' && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[50vh] gap-8 relative z-10"
          >
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <FaFingerprint className="text-4xl text-primary animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black text-white uppercase tracking-widest">Encrypting...</h2>
              <p className="text-xs font-bold text-text-dim uppercase tracking-widest">Verifying Biometric Hash</p>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[60vh] gap-10 relative z-10"
          >
            <div className="w-24 h-24 rounded-full bg-emerald-glow flex items-center justify-center text-5xl text-black shadow-[0_0_60px_rgba(52,211,153,0.6)]">
              <FaCheckCircle />
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-black text-white tracking-tighter">SUCCESSFUL!</h2>
              <p className="text-sm font-bold text-text-dim uppercase tracking-widest">Funds Dispatched to Node 712</p>
              <p className="text-xs font-bold text-primary bg-primary/10 py-2 px-4 rounded-lg border border-primary/20">TXN #82910-UOPX-192</p>
            </div>
            <button
               onClick={() => nav('/customer/home')}
               className="mt-8 px-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Back to Universe
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Security Footer */}
      <div className="absolute bottom-10 left-0 w-full flex flex-col items-center gap-2 opacity-30">
        <p className="text-xs font-black uppercase tracking-[0.5em]">Military Grade 256-bit AES Encryption</p>
        <div className="flex gap-4 grayscale">
            <img src="https://img.icons8.com/color/48/000000/visa.png" className="h-4" alt="Visa" />
            <img src="https://img.icons8.com/color/48/000000/mastercard.png" className="h-4" alt="Mastercard" />
            <img src="https://img.icons8.com/color/48/000000/upi.png" className="h-4" alt="UPI" />
        </div>
      </div>
    </div>
  );
}
