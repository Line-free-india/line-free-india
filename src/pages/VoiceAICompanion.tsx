import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';

export default function VoiceAICompanion() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiStatus, setAiStatus] = useState<'idle' | 'listening' | 'processing' | 'acting'>('idle');
  const [lastAction, setLastAction] = useState('');

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      setAiStatus('processing');
      processCommand();
    } else {
      setIsListening(true);
      setAiStatus('listening');
      setTranscript('');
      triggerHaptic('medium');
    }
  };

  const processCommand = () => {
    // Simulate speech-to-intent
    setTimeout(() => {
      setAiStatus('acting');
      const mockCommands = [
        'Opening your live queue...',
        'Calling the next customer...',
        'Generated your daily revenue report.',
        'Sent a broadcast to 45 at-risk customers.',
        'Switched shop status to CLOSED.'
      ];
      const action = mockCommands[Math.floor(Math.random() * mockCommands.length)];
      setLastAction(action);
      triggerHaptic('success');
      
      setTimeout(() => {
        setAiStatus('idle');
      }, 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen pb-32 bg-[#060810] text-white font-sans selection:bg-cyan-500/30 overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] bg-[radial-gradient(circle,rgba(6,182,212,0.05)_0%,transparent_70%)]" />
      </div>

      {/* Header */}
      <div className="px-6 pt-14 pb-8 relative z-10 text-center flex flex-col items-center">
        <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
          Demo Feature
        </div>
        <p className="text-xs text-cyan-400 font-black uppercase tracking-[0.5em] mb-2 font-mono">Neural Interface v4.0</p>
        <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Voice Companion</h1>
        <p className="text-zinc-500 text-xs font-medium">Control your entire business ecosystem hands-free.</p>
      </div>

      <div className="px-6 relative z-10 flex flex-col items-center justify-center min-h-[50vh]">
        {/* Visualizer Orb */}
        <div className="relative w-64 h-64 mb-16 flex items-center justify-center">
            <AnimatePresence>
               {isListening && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 0.1 }}
                    exit={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-cyan-500 shadow-[0_0_100px_rgba(6,182,212,0.5)]"
                  />
               )}
            </AnimatePresence>

            {/* Core Orb */}
            <motion.div 
               animate={isListening ? { scale: [1, 1.1, 1], rotate: 360 } : { scale: 1 }}
               transition={isListening ? { duration: 0.5, repeat: Infinity } : { duration: 10, repeat: Infinity, ease: 'linear' }}
               className={`w-40 h-40 rounded-full border-4 flex items-center justify-center relative shadow-2xl transition-colors duration-500 ${isListening ? 'border-cyan-400 bg-cyan-950/30' : 'border-white/10 bg-zinc-900/50'}`}
            >
               <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/20 to-transparent animate-pulse" />
               <span className="text-5xl drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                  {aiStatus === 'idle' ? '💤' : aiStatus === 'listening' ? '🎙️' : aiStatus === 'processing' ? '🧠' : '⚡'}
               </span>
            </motion.div>

            {/* Waveform Slices */}
            {isListening && [...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ height: [10, 40, 10] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                className="absolute w-1 rounded-full bg-cyan-400/40"
                style={{ transform: `rotate(${i * 30}deg) translateY(-100px)` }}
              />
            ))}
        </div>

        {/* Command Display */}
        <div className="max-w-xs text-center min-h-[60px]">
           <AnimatePresence mode="wait">
              {aiStatus === 'listening' ? (
                 <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xl font-bold italic text-cyan-300">Listening to your command...</motion.p>
              ) : aiStatus === 'acting' ? (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                    <p className="text-xs text-zinc-500 font-black uppercase tracking-widest">Executing</p>
                    <p className="text-lg font-black text-emerald-400 italic">{lastAction}</p>
                 </motion.div>
              ) : (
                 <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-zinc-500 text-sm font-medium">Say things like "Show my revenue" or "Call next customer"</motion.p>
              )}
           </AnimatePresence>
        </div>
      </div>

      {/* Mic Button */}
      <div className="fixed bottom-12 left-0 right-0 flex justify-center z-50">
         <motion.button 
           whileTap={{ scale: 0.9 }}
           onClick={toggleListening}
           className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${isListening ? 'bg-cyan-500 shadow-cyan-500/40' : 'bg-white text-black'}`}
         >
            {isListening ? (
               <div className="w-6 h-6 bg-black rounded" />
            ) : (
               <span className="text-3xl">🎤</span>
            )}
         </motion.button>
      </div>

      {/* Background Pulse for Acting */}
      <AnimatePresence>
         {aiStatus === 'acting' && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 pointer-events-none bg-emerald-500/5 ring-inset ring-[40px] ring-emerald-500/10"
            />
         )}
      </AnimatePresence>
    </div>
  );
}
