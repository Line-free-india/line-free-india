import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Smartphone, ShieldCheck } from 'lucide-react';
import ResponsiveContainer from '../components/ResponsiveContainer';

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      if (navigator.onLine) {
        window.location.reload();
      }
    }, 1000);
  };

  return (
    <ResponsiveContainer variant="customer">
      <div className="min-h-screen bg-bg text-text flex items-center justify-center p-6 text-center animate-fadeIn">
        <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 shadow-xl space-y-6">
          <div className="w-20 h-20 mx-auto bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-center justify-center text-amber-500">
            <WifiOff className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight">You're Currently Offline</h1>
            <p className="text-xs text-text-dim leading-relaxed">
              No internet connection detected. Active offline tokens are securely cached on your device.
            </p>
          </div>

          <div className="p-4 bg-background/60 border border-border/50 rounded-2xl text-left space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Offline Token Protection Active</span>
            </div>
            <p className="text-text-dim leading-relaxed">
              Your booked token slips remain valid at the merchant counter. Present your saved QR or Token ID on arrival.
            </p>
          </div>

          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full py-3.5 bg-primary text-white hover:opacity-90 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-primary/20"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Checking Network...' : 'Retry Connection'}
          </button>

          {isOnline && (
            <p className="text-xs text-emerald-400 font-semibold animate-fadeIn">
              Connection restored! Click Retry to load live queues.
            </p>
          )}
        </div>
      </div>
    </ResponsiveContainer>
  );
}
