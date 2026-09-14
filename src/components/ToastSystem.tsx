import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{
  showToast: (message: string, type?: ToastType) => void;
}>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const ICONS: Record<ToastType, React.ReactNode> = {
    success: <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">✨</div>,
    error: <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.3)]">✖</div>,
    info: <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">🔔</div>,
    warning: <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">⚠️</div>,
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-6 left-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none" style={{ maxWidth: '420px', margin: '0 auto' }}>
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -50, scale: 0.8, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)', transition: { duration: 0.2 } }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className="pointer-events-auto relative group overflow-hidden"
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            >
              {/* Premium Aurora Glow */}
              <div className="absolute inset-0 bg-[#0A0A0B]/80 backdrop-blur-2xl rounded-2xl border border-white/10" />
              <div className={`absolute top-0 left-0 w-1 h-full rounded-full ${t.type === 'success' ? 'bg-emerald-500' : t.type === 'error' ? 'bg-rose-500' : 'bg-primary'}`} />
              
              <div className="relative p-4 flex items-center gap-4">
                {ICONS[t.type]}
                <div className="flex-1">
                   <p className="text-[13px] font-black text-white leading-tight">{t.message}</p>
                   <p className="text-xs font-bold text-text-dim/60 uppercase tracking-widest mt-1">System Notification</p>
                </div>
              </div>

              {/* Progress Bar */}
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 3.5, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-0.5 opacity-30 ${t.type === 'success' ? 'bg-emerald-500' : t.type === 'error' ? 'bg-rose-500' : 'bg-primary'}`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
