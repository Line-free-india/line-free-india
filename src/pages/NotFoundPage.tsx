import { useNavigate } from 'react-router-dom';
import { Compass, Home, Search, ArrowLeft } from 'lucide-react';
import ResponsiveContainer from '../components/ResponsiveContainer';

export default function NotFoundPage() {
  const nav = useNavigate();

  return (
    <ResponsiveContainer variant="customer">
      <div className="min-h-screen bg-bg text-text flex items-center justify-center p-6 text-center animate-fadeIn">
        <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 shadow-xl space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-75" />
            <div className="relative w-24 h-24 bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center text-primary">
              <Compass className="w-12 h-12 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-red-500/10 text-red-400 font-mono text-xs font-bold rounded-full border border-red-500/20">
              Error 404
            </span>
            <h1 className="text-2xl font-black tracking-tight">Page Not Found</h1>
            <p className="text-xs text-text-dim leading-relaxed">
              Looks like this counter or queue line doesn't exist, or has been moved to a new station.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => nav(-1)}
              className="w-full py-3 bg-background border border-border hover:bg-card-hover font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            <button
              onClick={() => nav('/customer/home')}
              className="w-full py-3 bg-primary text-white hover:opacity-90 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-primary/20"
            >
              <Home className="w-4 h-4" />
              Return to Customer Home
            </button>
            <button
              onClick={() => nav('/customer/search')}
              className="w-full py-3 bg-background border border-border hover:bg-card-hover text-text-dim hover:text-text font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
            >
              <Search className="w-4 h-4" />
              Search Businesses &amp; Queues
            </button>
          </div>
        </div>
      </div>
    </ResponsiveContainer>
  );
}
