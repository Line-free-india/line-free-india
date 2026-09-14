import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { triggerHaptic } from '../utils/haptics';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink
} from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';

export interface PremiumAnimatedAuthProps {
  mode: 'customer' | 'business';
}

export default function PremiumAnimatedAuth({ mode }: PremiumAnimatedAuthProps) {
  const { signInWithGoogle, setRole } = useApp();
  const nav = useNavigate();

  type AuthState = 'email' | 'emailLinkSent' | 'verifyingLink' | 'phoneInput';
  const [authState, setAuthState] = useState<AuthState>('email');
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [bizName, setBizName] = useState('');
  
  const isCustomer = mode === 'customer';

  // Check if returning from Email Link
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      setAuthState('verifyingLink');
      let storedEmail = window.localStorage.getItem('emailForSignIn');
      if (!storedEmail) {
        storedEmail = window.prompt('Please provide your email for confirmation');
      }
      
      if (storedEmail) {
        setLoading(true);
        signInWithEmailLink(auth, storedEmail, window.location.href)
          .then(async (result) => {
            window.localStorage.removeItem('emailForSignIn');
            const u = result.user;
            
            // Check if phone number already exists in Firestore or Auth
            const userDoc = await getDoc(doc(db, 'users', u.uid));
            const userData = userDoc.data();
            
            if (u.phoneNumber || (userData && userData.phone)) {
              await finishAuth(u, u.phoneNumber || userData?.phone);
            } else {
              setAuthState('phoneInput');
            }
          })
          .catch((err) => {
            setError(err.message || 'Link expired or invalid.');
            setAuthState('email');
          })
          .finally(() => setLoading(false));
      } else {
        setAuthState('email');
      }
    }
  }, [nav]);

  const finishAuth = async (u: any, finalPhone?: string) => {
    setRole(mode);
    triggerHaptic('success');
    
    // Save bizName if provided
    if (!isCustomer && bizName.trim()) {
      try { await u.updateProfile({ displayName: bizName.trim() }); } catch {}
    }

    const phoneToSave = finalPhone || phone || u.phoneNumber || '';

    await setDoc(doc(db, 'users', u.uid), { 
      role: mode, 
      email: u.email || '', 
      phone: phoneToSave,
      updatedAt: Date.now() 
    }, { merge: true });

    const col = isCustomer ? 'customers' : 'barbers';
    const snap = await getDoc(doc(db, col, u.uid));
    const fallback = isCustomer ? '/customer/setup' : '/barber/setup';
    const home = isCustomer ? '/customer/home' : '/barber/home';
    nav(snap.exists() ? home : fallback, { replace: true });
  };

  const handleSendEmailLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!isCustomer && !isLoginMode && !bizName.trim()) { setError('Please enter your business name.'); return; }
    
    setLoading(true); setError('');
    try {
      const actionCodeSettings = {
        url: window.location.href, // Current URL
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setAuthState('emailLinkSent');
      triggerHaptic('success');
    } catch (err: any) {
      triggerHaptic('error');
      setError(err.message || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    if (loading) return;
    if (!isCustomer && !isLoginMode && !bizName.trim() && authState === 'email') { 
      setError('Please enter your business name first.'); 
      return; 
    }

    setLoading(true); setError('');
    try {
      const cred = await signInWithGoogle();
      if (!cred) return;
      const u = cred.user;
      
      const userDoc = await getDoc(doc(db, 'users', u.uid));
      const userData = userDoc.data();
      
      if (u.phoneNumber || (userData && userData.phone)) {
        await finishAuth(u, u.phoneNumber || userData?.phone);
      } else {
        setAuthState('phoneInput');
      }
    } catch (err: any) {
      triggerHaptic('error');
      setError(err.code === 'auth/popup-closed-by-user' ? 'Sign-in cancelled.' : err.message || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  const handleSavePhoneAndFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }
    if (loading) return;
    setLoading(true); setError('');
    try {
      if (!auth.currentUser) throw new Error("No user found.");
      await finishAuth(auth.currentUser, phone);
    } catch (err: any) {
      triggerHaptic('error');
      setError(err.message || 'Failed to save phone number.');
    } finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
    borderRadius: 14, fontSize: 16, color: 'var(--color-text)', outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
  };

  const inputFocusHandler = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--color-primary)';
    e.target.style.boxShadow = '0 0 0 3px rgba(var(--color-primary-rgb), 0.1)';
  };
  const inputBlurHandler = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--color-border)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 30%, rgba(99, 102, 241, 0.07) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(6, 182, 212, 0.05) 0%, transparent 50%), var(--color-bg)', zIndex: 0 }} />

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <button onClick={() => { if (authState !== 'email') setAuthState('email'); else nav(-1); }} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', color: 'var(--color-primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: isCustomer ? 'rgba(59, 130, 246, 0.08)' : 'rgba(139, 92, 246, 0.08)', border: `1px solid ${isCustomer ? 'rgba(59, 130, 246, 0.15)' : 'rgba(139, 92, 246, 0.15)'}` }}>
          <span style={{ fontSize: 14 }}>{isCustomer ? '👤' : '🏪'}</span>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: isCustomer ? '#3B82F6' : '#8B5CF6' }}>{isCustomer ? 'CUSTOMER' : 'BUSINESS'}</span>
        </div>
        <div style={{ width: 56 }} />
      </motion.div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 24px 40px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} style={{ width: '100%', maxWidth: 380 }}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }} style={{ width: 60, height: 60, background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, boxShadow: '0 6px 24px rgba(99, 102, 241, 0.3)', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%)' }} />
            <span style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -2 }}>L</span>
          </motion.div>

          <AnimatePresence mode="wait">
            
            {/* EMAIL LINK SENT STATE */}
            {authState === 'emailLinkSent' && (
              <motion.div key="sent" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, color: 'var(--color-text)' }}>Check your inbox!</h2>
                <div style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 16, border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <span style={{ fontSize: 24 }}>✉️</span>
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-success)', marginBottom: 6 }}>Magic Link Sent</p>
                  <p style={{ fontSize: 13, color: 'var(--color-text-dim)' }}>We sent a sign-in link to <strong>{email}</strong>. Click the link to instantly verify your account securely.</p>
                </div>
                <button onClick={() => setAuthState('email')} className="premium-btn" style={{ width: '100%', padding: '14px', background: 'var(--color-card)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>Use a different email</button>
              </motion.div>
            )}

            {/* VERIFYING LINK STATE */}
            {authState === 'verifyingLink' && (
              <motion.div key="verifying" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-10">
                <div style={{ width: 40, height: 40, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 20 }} />
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)' }}>Verifying your secure link...</h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-dim)', marginTop: 8 }}>Please wait while we log you in.</p>
              </motion.div>
            )}

            {/* PHONE COLLECTION STATE */}
            {authState === 'phoneInput' && (
              <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, color: 'var(--color-text)' }}>Final step: Phone Number</h2>
                <p style={{ fontSize: 14, color: 'var(--color-text-dim)', marginBottom: 28, fontWeight: 500 }}>Enter your phone number for bookings & alerts.</p>
                {error && <p style={{ fontSize: 13, color: 'var(--color-danger)', fontWeight: 500, marginBottom: 16 }}>{error}</p>}
                <form onSubmit={handleSavePhoneAndFinish} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <input style={inputStyle} type="tel" placeholder="+91 9876543210" value={phone} onChange={e => setPhone(e.target.value)} required disabled={loading} onFocus={inputFocusHandler} onBlur={inputBlurHandler} />
                  <button type="submit" disabled={loading} className="premium-btn premium-btn-primary" style={{ width: '100%', padding: '14px', fontSize: 16 }}>{loading ? 'Saving...' : 'Continue'}</button>
                </form>
              </motion.div>
            )}

            {/* EMAIL / GOOGLE STATE */}
            {authState === 'email' && (
              <motion.div key="auth" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, letterSpacing: -0.5, color: 'var(--color-text)' }}>
                  {isLoginMode ? (isCustomer ? 'Welcome Back' : 'Business Partner') : 'Create Account'}
                </h2>
                <p style={{ fontSize: 14, color: 'var(--color-text-dim)', marginBottom: 28, fontWeight: 500 }}>
                  {isLoginMode ? 'Sign in securely to continue.' : 'Get started with a secure free account.'}
                </p>

                {error && <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: 'var(--color-danger)', fontWeight: 500 }}>{error}</span>
                </div>}

                <button onClick={handleGoogle} disabled={loading} style={{ width: '100%', padding: '14px', background: 'var(--color-card)', backdropFilter: 'blur(20px)', border: '1.5px solid var(--color-border)', borderRadius: 14, fontSize: 15, fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, transition: 'all 0.25s ease', marginBottom: 20 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Continue with Google
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, var(--color-border))' }} />
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: 0.5 }}>OR USE PASSWORDLESS EMAIL</span>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--color-border), transparent)' }} />
                </div>

                <form onSubmit={handleSendEmailLink} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {!isCustomer && !isLoginMode && (
                    <div style={{ position: 'relative' }}>
                      <input style={{ ...inputStyle, paddingLeft: 44 }} type="text" placeholder="Business Name" value={bizName} onChange={e => setBizName(e.target.value)} disabled={loading} onFocus={inputFocusHandler} onBlur={inputBlurHandler} />
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.35 }}>🏪</span>
                    </div>
                  )}

                  <div style={{ position: 'relative' }}>
                    <input style={{ ...inputStyle, paddingLeft: 44 }} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} onFocus={inputFocusHandler} onBlur={inputBlurHandler} />
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.35 }}>
                      <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2"/><path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>

                  <button type="submit" disabled={loading} className="premium-btn premium-btn-primary" style={{ width: '100%', padding: '14px', fontSize: 16, marginTop: 4 }}>
                    {loading ? <div style={{ width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} /> : (isLoginMode ? 'Sign In with Magic Link' : 'Sign Up with Magic Link')}
                  </button>
                </form>

                {/* Trust badges */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--color-separator)' }}>
                  {[{ icon: '🔒', label: 'Encrypted' }, { icon: '🛡️', label: 'Secure' }, { icon: '✓', label: 'Verified' }].map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 12 }}>{b.icon}</span><span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>{b.label}</span>
                    </div>
                  ))}
                </div>

                {/* Toggle Login/Signup Mode */}
                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <p style={{ fontSize: 13, color: 'var(--color-text-dim)', fontWeight: 600 }}>
                    {isLoginMode ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button 
                      type="button"
                      onClick={(e) => { e.preventDefault(); setIsLoginMode(!isLoginMode); }} 
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 800, cursor: 'pointer', padding: 0 }}
                    >
                      {isLoginMode ? "Sign up here" : "Sign in here"}
                    </button>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
