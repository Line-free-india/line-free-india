import { Component, ReactNode } from 'react';

/**
 * Feature #90: Error Boundary & Crash Recovery
 * Catches render errors and shows a beautiful recovery UI
 */

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an unhandled render error:', error, errorInfo);

    // Auto-recover from chunk / dynamic import load errors
    const msg = error?.message || '';
    if (
      msg.includes('dynamically imported') ||
      msg.includes('Loading chunk') ||
      msg.includes('Failed to fetch') ||
      msg.includes('module script')
    ) {
      const lastReload = parseInt(sessionStorage.getItem('eb_chunk_reload') || '0', 10);
      const now = Date.now();
      if (now - lastReload > 8000) {
        sessionStorage.setItem('eb_chunk_reload', now.toString());
        window.location.reload();
      }
    }
  }

  handleRetry = () => {
    const msg = this.state.error?.message || '';
    if (
      msg.includes('dynamically imported') ||
      msg.includes('Loading chunk') ||
      msg.includes('Failed to fetch') ||
      msg.includes('module script')
    ) {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null });
  };

  handleGoBack = () => {
    this.setState({ hasError: false, error: null });
    try {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/customer/home';
      }
    } catch {
      window.location.href = '/customer/home';
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#030303] text-gray-200">
          <div className="relative rounded-3xl p-8 max-w-sm w-full text-center space-y-6 overflow-hidden">
            {/* Glassmorphic Aurora Background */}
            <div className="absolute inset-0 bg-[#0A0A0B]/80 backdrop-blur-2xl border border-white/5 rounded-3xl z-0" />
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-600/30 blur-[60px] rounded-full z-0" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-emerald-600/30 blur-[60px] rounded-full z-0" />

            <div className="relative z-10 space-y-6">
              {/* Animated error icon */}
              <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                <span className="text-4xl filter drop-shadow-md">✨</span>
              </div>

              <div>
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Temporary Interruption</h2>
                <p className="text-gray-400 text-sm leading-relaxed font-medium">
                  We intercepted a temporary issue. Don't worry, your queue & booking data are safe.
                </p>
              </div>

              {this.state.error && (
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-left backdrop-blur-md">
                  <p className="text-xs text-gray-500 font-mono break-all leading-relaxed">
                    {this.state.error.message?.slice(0, 150)}
                  </p>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <button
                  onClick={this.handleGoBack}
                  className="w-full py-4 bg-primary text-white font-bold uppercase tracking-wider text-sm rounded-2xl hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                >
                  ← Go Back
                </button>

                <button
                  onClick={this.handleRetry}
                  className="w-full py-4 bg-white/10 text-white font-bold uppercase tracking-wider text-sm rounded-2xl border border-white/10 hover:bg-white/15 transition-colors"
                >
                  Try Again
                </button>

                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full py-3 bg-transparent text-gray-400 font-bold uppercase tracking-wider text-xs rounded-2xl hover:text-white transition-colors"
                >
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
