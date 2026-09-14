import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import BackButton from '../components/BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';

export default function CustomerAuth() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user, setRole, t } = useApp();
  const nav = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleGoogle = async () => {
    if (cooldown > 0) return;
    triggerHaptic('medium');
    setError('');
    setLoading(true);
    setCooldown(30);
    try {
      const result = await signInWithGoogle();
      if (!result) return;
      setRole('customer');
      const uid = (result as any)?.user?.uid || user?.uid;
      if (uid) {
        try {
          const snap = await getDoc(doc(db, 'customers', uid));
          if (snap.exists()) {
            triggerHaptic('success');
            nav('/customer/home', { replace: true });
            return;
          }
        } catch {}
      }
      triggerHaptic('light');
      nav('/customer/setup', { replace: true });
    } catch (err: any) {
      triggerHaptic('error');
      if (err?.code === 'auth/popup-closed-by-user') setError('Sign-in cancelled. Please try again.');
      else if (err?.code === 'auth/popup-blocked') setError('Popup blocked. Please allow popups for this site.');
      else setError(err?.message || 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchPanel = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setError('');
    setTimeout(() => {
      setIsSignUp(!isSignUp);
      setIsTransitioning(false);
    }, 600);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      triggerHaptic('error');
      return;
    }
    if (isSignUp && !username) {
      setError('Please enter a username.');
      triggerHaptic('error');
      return;
    }
    triggerHaptic('medium');
    setError('');
    setLoading(true);
    try {
      let result;
      if (isSignUp) {
        result = await signUpWithEmail(email, password);
        // Update display name with username
        if (result?.user) {
          await result.user.updateProfile({ displayName: username });
        }
      } else {
        result = await signInWithEmail(email, password);
      }
      setRole('customer');
      const uid = (result as any)?.user?.uid || user?.uid;
      if (uid) {
        try {
          const snap = await getDoc(doc(db, 'customers', uid));
          if (snap.exists()) {
            triggerHaptic('success');
            nav('/customer/home', { replace: true });
            return;
          }
        } catch {}
      }
      triggerHaptic('light');
      nav('/customer/setup', { replace: true });
    } catch (err: any) {
      triggerHaptic('error');
      if (err?.code === 'auth/email-already-in-use') setError('Email already in use. Please sign in.');
      else if (err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found') setError('Invalid email or password.');
      else setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsExisting = async () => {
    if (!user) return;
    triggerHaptic('medium');
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'customers', user.uid));
      if (snap.exists()) {
        triggerHaptic('success');
        nav('/customer/home', { replace: true });
      } else {
        triggerHaptic('light');
        nav('/customer/setup', { replace: true });
      }
    } catch {
      nav('/customer/setup', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  // Already logged in — show profile card
  if (user) {
    return (
      <div className="min-h-screen flex flex-col p-6 animate-fadeIn relative overflow-hidden" style={{ background: '#0C0C0E' }}>
        {/* Background */}
        <div className="fixed inset-0 -z-10">
          <motion.div
            animate={{ x:['-15%','15%','-15%'], y:['-10%','10%','-10%'] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="ambient-orb cyan"
            style={{ top: '-15%', left: '-10%', width: '250px', height: '250px' }}
          />
        </div>
        
        <div className="relative z-20 pt-4">
           <BackButton to="/role" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-5xl mx-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            transition={{ type: 'spring', damping: 20 }}
            className="w-full p-8 flex flex-col items-center relative overflow-hidden neu-panel"
            style={{ borderRadius: '32px' }}
          >
            {/* Profile avatar */}
            <div className="relative w-28 h-28 mb-6">
              <div 
                className="w-full h-full rounded-full overflow-hidden relative z-10 flex items-center justify-center"
                style={{ 
                  border: '3px solid rgba(0,240,255,0.2)', 
                  boxShadow: '0 0 30px rgba(0,240,255,0.15)',
                  background: '#141416'
                }}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-5xl opacity-80">💎</span>
                )}
              </div>
            </div>

            <p className="text-2xl font-black mb-1 text-white type-display">{user.displayName || 'Welcome'}</p>
            <p className="text-xs font-medium uppercase tracking-[3px] mb-8" style={{ color: '#52525B' }}>{user.email}</p>

            <button 
              onClick={handleContinueAsExisting} 
              disabled={loading}
              className="w-full py-4 font-black text-sm uppercase tracking-[3px] active:scale-95 transition-all"
              style={{
                borderRadius: '18px',
                background: 'linear-gradient(135deg, rgba(0,240,255,0.1), rgba(16,185,129,0.1))',
                border: '1px solid rgba(0,240,255,0.2)',
                color: '#00F0FF',
                boxShadow: '0 0 25px rgba(0,240,255,0.1)'
              }}
            >
              {loading ? (
                <div className="flex justify-center items-center gap-2">
                  <div className="w-3 h-3 border-2 border-[#00F0FF]/50 border-t-[#00F0FF] rounded-full animate-spin" />
                  Verifying...
                </div>
              ) : 'Continue →'}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Login screen
  return (
    <div className="min-h-screen flex flex-col p-6 animate-fadeIn relative overflow-hidden" style={{ background: '#0C0C0E' }}>
      
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <motion.div 
          animate={{ x:['-15%','15%','-15%'], y:['-10%','10%','-10%'], scale:[1,1.2,1] }} 
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="ambient-orb cyan"
          style={{ top: '-10%', left: '-15%' }}
        />
        <motion.div 
          animate={{ x:['10%','-10%','10%'], y:['10%','-10%','10%'] }} 
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
          className="ambient-orb violet"
          style={{ bottom: '-5%', right: '-15%', width: '200px', height: '200px' }}
        />
      </div>

      <div className="relative z-20 pt-4">
         <BackButton to="/role" />
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-5xl mx-auto">
        
        {/* Hero Icon */}
        <motion.div 
          initial={{ scale: 0, rotate: -180 }} 
          animate={{ scale: 1, rotate: 0 }} 
          transition={{ type: 'spring', damping: 12 }}
          className="w-28 h-28 flex items-center justify-center mb-10 holo-card"
          style={{ 
            borderRadius: '36px',
            boxShadow: '0 0 50px rgba(0,240,255,0.2), inset 0 0 25px rgba(0,240,255,0.05)',
            border: '1px solid rgba(0,240,255,0.15)'
          }}
        >
          <motion.span 
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="text-6xl"
            style={{ filter: 'drop-shadow(0 0 20px rgba(0,240,255,0.5))' }}
          >
            💎
          </motion.span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center w-full">
           <h1 
             className="text-4xl font-black mb-3 type-display"
             style={{
               background: 'linear-gradient(135deg, #fff, #00F0FF)',
               WebkitBackgroundClip: 'text',
               WebkitTextFillColor: 'transparent'
             }}
           >
             Welcome
           </h1>
           <p className="text-xs font-bold uppercase tracking-[4px] px-8" style={{ color: '#52525B' }}>
             Sign in to skip every queue
           </p>
        </motion.div>

        <div className="w-full mt-10">
           <AnimatePresence>
             {error && (
               <motion.div 
                 initial={{ opacity: 0, height: 0 }} 
                 animate={{ opacity: 1, height: 'auto' }} 
                 exit={{ opacity: 0, height: 0 }}
                 className="w-full mb-6 p-4 text-xs font-bold uppercase tracking-wider text-center"
                 style={{
                   borderRadius: '16px',
                   background: 'rgba(244,63,94,0.06)',
                   border: '1px solid rgba(244,63,94,0.15)',
                   color: '#F43F5E'
                 }}
               >
                 {error}
               </motion.div>
             )}
           </AnimatePresence>

           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
             {/* Panel Wrapper with Sliding Animation */}
             <div className="relative overflow-hidden">
               <motion.div 
                 animate={{ x: isSignUp ? '-100%' : '0%' }}
                 transition={{ duration: 0.6, ease: [0.68, -0.55, 0.265, 1.55] }}
                 className="flex w-[200%]"
               >
                 {/* Login Panel */}
                 <div className="w-1/2 flex-shrink-0">
                   <form onSubmit={handleEmailAuth} className="flex flex-col gap-4 mb-6">
                     {/* Email Input with Floating Label */}
                     <div className="relative">
                       <input 
                         type="email" 
                         placeholder=" " 
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                         className="w-full p-4 pl-12 text-sm outline-none transition-all peer"
                         style={{
                           borderRadius: '20px',
                           background: 'rgba(255,255,255,0.03)',
                           border: '1px solid rgba(255,255,255,0.08)',
                           color: '#fff',
                           boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)'
                         }}
                       />
                       <label 
                         className="absolute left-12 top-1/2 -translate-y-1/2 text-sm text-zinc-600 transition-all duration-200 pointer-events-none peer-focus:top-0 peer-focus:left-3 peer-focus:text-xs peer-focus:text-[#00F0FF] peer-focus:bg-[#0C0C0E] peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-[#00F0FF] peer-[:not(:placeholder-shown)]:bg-[#0C0C0E] peer-[:not(:placeholder-shown)]:px-2"
                       >
                         Email Address
                       </label>
                       <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 peer-focus:text-[#00F0FF] transition-colors" style={{ fontSize: '14px' }} />
                     </div>

                     {/* Password Input with Floating Label */}
                     <div className="relative">
                       <input 
                         type="password" 
                         placeholder=" " 
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         className="w-full p-4 pl-12 text-sm outline-none transition-all peer"
                         style={{
                           borderRadius: '20px',
                           background: 'rgba(255,255,255,0.03)',
                           border: '1px solid rgba(255,255,255,0.08)',
                           color: '#fff',
                           boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)'
                         }}
                       />
                       <label 
                         className="absolute left-12 top-1/2 -translate-y-1/2 text-sm text-zinc-600 transition-all duration-200 pointer-events-none peer-focus:top-0 peer-focus:left-3 peer-focus:text-xs peer-focus:text-[#00F0FF] peer-focus:bg-[#0C0C0E] peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-[#00F0FF] peer-[:not(:placeholder-shown)]:bg-[#0C0C0E] peer-[:not(:placeholder-shown)]:px-2"
                       >
                         Password
                       </label>
                       <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 peer-focus:text-[#00F0FF] transition-colors" style={{ fontSize: '14px' }} />
                     </div>

                     <button 
                       type="submit"
                       disabled={loading || isTransitioning}
                       className="w-full p-4 font-black text-sm uppercase tracking-[3px] flex items-center justify-center gap-4 transition-all active:scale-95 mt-2"
                       style={{
                         borderRadius: '20px',
                         background: 'linear-gradient(135deg, rgba(0,240,255,0.2), rgba(16,185,129,0.2))',
                         border: '1px solid rgba(0,240,255,0.3)',
                         color: '#00F0FF',
                         boxShadow: '0 0 20px rgba(0,240,255,0.1)'
                       }}
                     >
                       {loading ? (
                         <div className="w-5 h-5 border-2 border-[#00F0FF]/30 border-t-[#00F0FF] rounded-full animate-spin" />
                       ) : 'Sign In'}
                     </button>
                   </form>
                 </div>

                 {/* Signup Panel */}
                 <div className="w-1/2 flex-shrink-0">
                   <form onSubmit={handleEmailAuth} className="flex flex-col gap-4 mb-6">
                     {/* Username Input with Floating Label */}
                     <div className="relative">
                       <input 
                         type="text" 
                         placeholder=" " 
                         value={username}
                         onChange={(e) => setUsername(e.target.value)}
                         className="w-full p-4 pl-12 text-sm outline-none transition-all peer"
                         style={{
                           borderRadius: '20px',
                           background: 'rgba(255,255,255,0.03)',
                           border: '1px solid rgba(255,255,255,0.08)',
                           color: '#fff',
                           boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)'
                         }}
                       />
                       <label 
                         className="absolute left-12 top-1/2 -translate-y-1/2 text-sm text-zinc-600 transition-all duration-200 pointer-events-none peer-focus:top-0 peer-focus:left-3 peer-focus:text-xs peer-focus:text-[#00F0FF] peer-focus:bg-[#0C0C0E] peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-[#00F0FF] peer-[:not(:placeholder-shown)]:bg-[#0C0C0E] peer-[:not(:placeholder-shown)]:px-2"
                       >
                         Username
                       </label>
                       <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 peer-focus:text-[#00F0FF] transition-colors" style={{ fontSize: '14px' }} />
                     </div>

                     {/* Email Input with Floating Label */}
                     <div className="relative">
                       <input 
                         type="email" 
                         placeholder=" " 
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                         className="w-full p-4 pl-12 text-sm outline-none transition-all peer"
                         style={{
                           borderRadius: '20px',
                           background: 'rgba(255,255,255,0.03)',
                           border: '1px solid rgba(255,255,255,0.08)',
                           color: '#fff',
                           boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)'
                         }}
                       />
                       <label 
                         className="absolute left-12 top-1/2 -translate-y-1/2 text-sm text-zinc-600 transition-all duration-200 pointer-events-none peer-focus:top-0 peer-focus:left-3 peer-focus:text-xs peer-focus:text-[#00F0FF] peer-focus:bg-[#0C0C0E] peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-[#00F0FF] peer-[:not(:placeholder-shown)]:bg-[#0C0C0E] peer-[:not(:placeholder-shown)]:px-2"
                       >
                         Email Address
                       </label>
                       <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 peer-focus:text-[#00F0FF] transition-colors" style={{ fontSize: '14px' }} />
                     </div>

                     {/* Password Input with Floating Label */}
                     <div className="relative">
                       <input 
                         type="password" 
                         placeholder=" " 
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         className="w-full p-4 pl-12 text-sm outline-none transition-all peer"
                         style={{
                           borderRadius: '20px',
                           background: 'rgba(255,255,255,0.03)',
                           border: '1px solid rgba(255,255,255,0.08)',
                           color: '#fff',
                           boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)'
                         }}
                       />
                       <label 
                         className="absolute left-12 top-1/2 -translate-y-1/2 text-sm text-zinc-600 transition-all duration-200 pointer-events-none peer-focus:top-0 peer-focus:left-3 peer-focus:text-xs peer-focus:text-[#00F0FF] peer-focus:bg-[#0C0C0E] peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-[#00F0FF] peer-[:not(:placeholder-shown)]:bg-[#0C0C0E] peer-[:not(:placeholder-shown)]:px-2"
                       >
                         Password
                       </label>
                       <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 peer-focus:text-[#00F0FF] transition-colors" style={{ fontSize: '14px' }} />
                     </div>

                     <button 
                       type="submit"
                       disabled={loading || isTransitioning}
                       className="w-full p-4 font-black text-sm uppercase tracking-[3px] flex items-center justify-center gap-4 transition-all active:scale-95 mt-2"
                       style={{
                         borderRadius: '20px',
                         background: 'linear-gradient(135deg, rgba(0,240,255,0.2), rgba(16,185,129,0.2))',
                         border: '1px solid rgba(0,240,255,0.3)',
                         color: '#00F0FF',
                         boxShadow: '0 0 20px rgba(0,240,255,0.1)'
                       }}
                     >
                       {loading ? (
                         <div className="w-5 h-5 border-2 border-[#00F0FF]/30 border-t-[#00F0FF] rounded-full animate-spin" />
                       ) : 'Create Account'}
                     </button>
                   </form>
                 </div>
               </motion.div>
             </div>

             <div className="flex items-center justify-between mb-6">
               <div className="h-px bg-zinc-800 flex-1" />
               <span className="px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">OR</span>
               <div className="h-px bg-zinc-800 flex-1" />
             </div>

             <button 
               onClick={handleGoogle} 
               disabled={loading}
               type="button"
               className="w-full p-4 font-black text-sm uppercase tracking-[3px] flex items-center justify-center gap-4 transition-all active:scale-95"
               style={{
                 borderRadius: '20px',
                 background: 'linear-gradient(145deg, #151518, #101012)',
                 boxShadow: '8px 8px 16px #0a0a0b, -8px -8px 16px #202025',
                 border: '1px solid rgba(255,255,255,0.04)',
                 color: '#fff'
               }}
             >
               {loading ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-[#00F0FF] rounded-full animate-spin" />
               ) : (
                 <svg width="20" height="20" viewBox="0 0 48 48">
                   <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                   <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                   <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                   <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                 </svg>
               )}
               {loading ? 'Authenticating...' : 'Sign in with Google'}
             </button>

             <div className="mt-6 text-center">
               <button 
                 type="button"
                 onClick={switchPanel}
                 disabled={isTransitioning}
                 className="text-xs font-bold text-zinc-400 uppercase tracking-wider hover:text-white transition-colors"
               >
                 {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
               </button>
             </div>
           </motion.div>

           {cooldown > 0 && (
             <p className="text-xs font-bold mt-4 text-center uppercase tracking-[2px]" style={{ color: '#52525B' }}>
               Retry in <span style={{ color: '#00F0FF' }}>{cooldown}s</span>
             </p>
           )}
        </div>

        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.8 }} 
          className="text-xs mt-12 text-center uppercase tracking-[3px] font-bold"
          style={{ color: '#3F3F46' }}
        >
          Protected by <span style={{ color: '#00F0FF' }}>Line Free Security</span>
        </motion.p>
      </div>
    </div>
  );
}
