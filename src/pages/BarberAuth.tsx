import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import BackButton from '../components/BackButton';
import { motion } from 'framer-motion';
import { useResponsive } from '../hooks/useResponsive';

export default function BarberAuth() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, setRole, user, businessProfile, t } = useApp();
  const nav = useNavigate();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithGoogle();
      if (!result) return;
      setRole('business');
      const uid = (result as any)?.user?.uid || (result as any)?.uid;
      if (uid) {
        const profileDoc = await getDoc(doc(db, 'barbers', uid));
        if (profileDoc.exists()) {
          nav('/barber/home', { replace: true });
        } else {
          nav('/barber/setup', { replace: true });
        }
      } else if (businessProfile) {
        nav('/barber/home', { replace: true });
      } else {
        nav('/barber/setup', { replace: true });
      }
    } catch (e: any) {
      setError(e?.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      let result;
      if (isSignUp) {
        result = await signUpWithEmail(email, password);
      } else {
        result = await signInWithEmail(email, password);
      }
      setRole('business');
      const uid = (result as any)?.user?.uid || user?.uid;
      if (uid) {
        const profileDoc = await getDoc(doc(db, 'barbers', uid));
        if (profileDoc.exists()) {
          nav('/barber/home', { replace: true });
        } else {
          nav('/barber/setup', { replace: true });
        }
      } else if (businessProfile) {
        nav('/barber/home', { replace: true });
      } else {
        nav('/barber/setup', { replace: true });
      }
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') setError('Email already in use. Please sign in.');
      else if (err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found') setError('Invalid email or password.');
      else setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  if (user && businessProfile) {
    nav('/barber/home', { replace: true });
    return null;
  }

  // Already logged in — Neuromorphic profile card
  if (user && !businessProfile) {
    const avatarSize = isMobile ? 'w-20 h-20' : isTablet ? 'w-24 h-24' : 'w-32 h-32';
    const cardPadding = isMobile ? 'p-6' : isTablet ? 'p-8' : 'p-10';
    const maxWidth = isMobile ? 'max-w-xs' : isTablet ? 'max-w-sm' : 'max-w-4xl';
    
    return (
      <div className="min-h-screen flex flex-col p-6 animate-fadeIn relative overflow-hidden">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0" style={{ background: 'var(--color-bg)' }} />
          <motion.div
            animate={{ x:['-20%','20%','-20%'], y:['-10%','10%','-10%'] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
            className="ambient-orb violet"
            style={{ top: '-10%', right: '-10%' }}
          />
        </div>
        <BackButton to="/role" />
        <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`neu-panel ${cardPadding} flex flex-col items-center ${maxWidth} w-full`}
            style={{ borderRadius: '28px' }}
          >
            <div 
              className={`${avatarSize} rounded-full overflow-hidden mb-5`}
              style={{ border: '3px solid rgba(0,240,255,0.2)', boxShadow: '0 0 25px rgba(0,240,255,0.15)' }}
            >
              {user.photoURL ? <img src={user.photoURL} className={`${avatarSize} object-cover`} alt="" /> : <div className={`${avatarSize} flex items-center justify-center text-4xl`} style={{ background: '#1a1a1d' }}>🏪</div>}
            </div>
            <p className="text-white text-sm font-bold mb-1">{user.displayName}</p>
            <p className="text-xs font-semibold mb-6" style={{ color: '#52525B' }}>{user.email}</p>
            <button 
              onClick={() => { setRole('business'); nav('/barber/setup'); }} 
              className="neu-action-btn-primary w-full py-4 px-6 font-black text-sm"
              style={{ borderRadius: '16px', minHeight: '44px' }}
            >
              Setup Your Business →
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Login screen — Onyx-Titanium premium
  const iconSize = isMobile ? 'w-20 h-20' : isTablet ? 'w-24 h-24' : 'w-28 h-28';
  const titleSize = isMobile ? 'text-3xl' : isTablet ? 'text-4xl' : 'text-5xl';
  const maxWidth = isMobile ? 'max-w-xs' : isTablet ? 'max-w-sm' : 'max-w-md';
  const padding = isMobile ? 'p-6' : isTablet ? 'p-8' : 'p-10';
  
  return (
    <div className={`min-h-screen flex flex-col ${padding} animate-fadeIn relative overflow-hidden`}>
      {/* Ambient glow background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: 'var(--color-bg)' }} />
        <motion.div
          animate={{ x:['-15%','15%','-15%'], y:['-10%','10%','-10%'], scale:[1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="ambient-orb violet"
          style={{ top: '-5%', left: '-10%' }}
        />
        <motion.div
          animate={{ x:['10%','-10%','10%'], y:['5%','-10%','5%'] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="ambient-orb cyan"
          style={{ bottom: '-5%', right: '-10%', width: '200px', height: '200px' }}
        />
      </div>

      <BackButton to="/role" />

      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        {/* Premium icon */}
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12 }}
          className={`${iconSize} flex items-center justify-center mb-6 holo-card`}
          style={{ 
            borderRadius: '24px',
            boxShadow: '0 0 40px rgba(139,92,246,0.2), inset 0 0 20px rgba(139,92,246,0.05)',
            border: '1px solid rgba(139,92,246,0.2)'
          }}
        >
          <span className={`${isMobile ? 'text-4xl' : isTablet ? 'text-5xl' : 'text-6xl'}`} style={{ filter: 'drop-shadow(0 0 15px rgba(139,92,246,0.5))' }}>⚡</span>
        </motion.div>

        <motion.h1 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`${titleSize} font-black uppercase mb-2 type-display`}
          style={{ 
            letterSpacing: '4px',
            background: 'linear-gradient(135deg, #fff, #8B5CF6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          {t('role.business')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className={`${isMobile ? 'text-sm' : 'text-base'} text-center mb-8 ${maxWidth} font-medium`}
          style={{ color: '#71717A' }}
        >
          Register your business & manage queue digitally
        </motion.p>

        {error && <p className="text-xs mb-4 text-center font-bold uppercase tracking-wider p-3 rounded-2xl" style={{ color: '#F43F5E', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)' }}>{error}</p>}

        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45, type: 'spring' }} className={`w-full ${maxWidth}`}>
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-3 mb-6">
            <input 
              type="email" 
              placeholder="Business Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 text-sm outline-none transition-all placeholder:text-zinc-600 focus:border-[#8B5CF6]"
              style={{
                borderRadius: '18px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#fff',
                boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)',
                minHeight: '44px'
              }}
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 text-sm outline-none transition-all placeholder:text-zinc-600 focus:border-[#8B5CF6]"
              style={{
                borderRadius: '18px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#fff',
                boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)',
                minHeight: '44px'
              }}
            />
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 mt-2 flex items-center justify-center gap-3 font-black text-sm transition-all active:scale-95"
              style={{
                borderRadius: '18px',
                background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(0,240,255,0.2))',
                border: '1px solid rgba(139,92,246,0.3)',
                color: '#8B5CF6',
                boxShadow: '0 0 20px rgba(139,92,246,0.1)',
                minHeight: '44px'
              }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#8B5CF6]/30 border-t-[#8B5CF6] rounded-full animate-spin" />
              ) : (isSignUp ? 'REGISTER BUSINESS' : 'BUSINESS LOGIN')}
            </button>
          </form>

          <div className="flex items-center justify-between mb-6">
            <div className="h-px bg-zinc-800 flex-1" />
            <span className="px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">OR</span>
            <div className="h-px bg-zinc-800 flex-1" />
          </div>

          <button 
            onClick={handleLogin} 
            disabled={loading}
            type="button"
            className="w-full py-4 px-8 flex items-center justify-center gap-3 font-black text-sm transition-all active:scale-95"
            style={{
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #141416, #1a1a1d)',
              boxShadow: '8px 8px 16px #0a0a0b, -8px -8px 16px #1e1e23',
              border: '1px solid rgba(255,255,255,0.04)',
              color: '#fff',
              minHeight: '44px'
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-[#8B5CF6] rounded-full animate-spin" />
                <span style={{ color: '#71717A' }}>CONNECTING...</span>
              </div>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                {t('auth.google')}
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-bold text-zinc-400 uppercase tracking-wider hover:text-white transition-colors"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              {isSignUp ? 'Login to existing business' : 'Register a new business'}
            </button>
          </div>
        </motion.div>

        {/* Features — Premium glass card */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className={`mt-8 w-full ${maxWidth}`}
        >
          <div 
            className="glass-panel p-5"
            style={{ borderRadius: '22px' }}
          >
            <p className="text-xs font-black uppercase tracking-[3px] mb-4" style={{ color: '#00F0FF' }}>⚡ Business OS</p>
            <ul className="space-y-3">
              {[
                '18 Beauty & Wellness business types',
                'Digital queue & booking management',
                'QR code for instant customer access',
                'Analytics & revenue tracking',
                '30 days free trial included',
              ].map((item, i) => (
                <motion.li 
                  key={i}
                  initial={{ x: -15, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="flex items-center gap-3 text-xs font-medium"
                  style={{ color: '#A1A1AA' }}
                >
                  <span style={{ color: '#10B981' }}>✓</span> {item}
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
