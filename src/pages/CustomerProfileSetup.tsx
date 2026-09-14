import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import LocationPicker from '../components/LocationPicker';
import { triggerHaptic } from '../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomerProfileSetup() {
  const { user, saveCustomerProfile, customerProfile } = useApp();
  const nav = useNavigate();

  const [step, setStep] = useState(1);
  const [name, setName] = useState(customerProfile?.name || user?.displayName || '');
  const [phone, setPhone] = useState(customerProfile?.phone || '');
  const [location, setLocation] = useState(customerProfile?.location || '');
  const [lat, setLat] = useState<number | undefined>(customerProfile?.lat);
  const [lng, setLng] = useState<number | undefined>(customerProfile?.lng);
  const [fetchingAddr, setFetchingAddr] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!name && (user?.displayName || customerProfile?.name)) {
      setName(user?.displayName || customerProfile?.name || '');
    }
  }, [user, customerProfile, name]);

  useEffect(() => {
    if (!user) {
      nav('/customer/auth', { replace: true });
    }
  }, [user, nav]);

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!name.trim()) { setError('Please enter your full name.'); return; }
      if (!phone.trim() || phone.trim().length < 10) { setError('Please enter a valid 10-digit number.'); return; }
      setStep(2);
      triggerHaptic('selection');
    }
  };

  const handleComplete = async () => {
    setError('');
    if (!location.trim()) { setError('Please provide your location.'); triggerHaptic('error'); return; }
    if (!agreeTerms) { setError('You must accept the Terms of Service.'); triggerHaptic('error'); return; }

    setSubmitting(true);
    try {
      const profile = {
        uid: user?.uid || '',
        name: name.trim() || user?.displayName || 'Customer',
        phone: phone.trim(),
        location: location.trim(),
        photoURL: user?.photoURL || '',
        favoriteSalons: customerProfile?.favoriteSalons || [],
        subscription: customerProfile?.subscription || null,
        createdAt: customerProfile?.createdAt || Date.now(),
        lat,
        lng,
        termsAcceptedAt: Date.now(),
      };

      await saveCustomerProfile(profile);
      triggerHaptic('success');
      nav('/customer/home', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile. Please try again.');
      triggerHaptic('error');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    background: 'var(--color-bg)',
    border: '1.5px solid var(--color-border)',
    borderRadius: 14,
    fontSize: 16,
    color: 'var(--color-text)',
    outline: 'none',
    fontFamily: 'inherit',
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
      {/* Background gradient mesh */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse at 80% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 20% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 50%),
          var(--color-bg)
        `,
        zIndex: 0,
      }} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'relative', zIndex: 1,
        }}
      >
        <button
          onClick={() => {
            if (step === 2) { setStep(1); triggerHaptic('selection'); }
            else nav('/customer/auth');
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', color: 'var(--color-primary)',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        
        {/* Step Indicator */}
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 24, height: 4, borderRadius: 2, background: 'var(--color-primary)' }} />
          <div style={{ width: 24, height: 4, borderRadius: 2, background: step === 2 ? 'var(--color-primary)' : 'var(--color-border)' }} />
        </div>
      </motion.div>

      {/* Main Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '24px 24px 40px',
        position: 'relative', zIndex: 1,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', maxWidth: 400 }}
        >
          {/* Avatar Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              style={{
                width: 88, height: 88,
                borderRadius: '50%',
                background: 'var(--color-card)',
                border: '2px solid rgba(59, 130, 246, 0.3)',
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', marginBottom: 16,
              }}
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 40 }}>👤</span>
              )}
            </motion.div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-text)', letterSpacing: -0.5, marginBottom: 8 }}>
              {step === 1 ? 'Complete Profile' : 'Set Location'}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--color-text-dim)', fontWeight: 500, textAlign: 'center' }}>
              {step === 1 ? "Let's get to know you better" : "To find businesses near you"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  padding: '12px 16px', background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 12,
                  marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span style={{ fontSize: 13, color: 'var(--color-danger)', fontWeight: 600 }}>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                style={{
                  background: 'var(--color-card)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 24, padding: 24,
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                      Full Name
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input style={{ ...inputStyle, paddingLeft: 44 }} type="text" placeholder="Enter your name" value={name}
                        onChange={e => setName(e.target.value)} onFocus={inputFocusHandler} onBlur={inputBlurHandler} />
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                      Mobile Number
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input style={{ ...inputStyle, paddingLeft: 44 }} type="tel" placeholder="e.g. 9876543210" value={phone}
                        onChange={e => setPhone(e.target.value)} onFocus={inputFocusHandler} onBlur={inputBlurHandler} />
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>We'll send SMS alerts for your tokens.</p>
                  </div>
                </div>

                <button onClick={handleNext} className="premium-btn premium-btn-primary" style={{ width: '100%', padding: '14px', fontSize: 16, marginTop: 24 }}>
                  Continue
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                style={{
                  background: 'var(--color-card)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 24, padding: 24,
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                      Search City / Area
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input style={{ ...inputStyle, paddingLeft: 44 }} type="text" placeholder="e.g. Kankarbagh, Patna" value={fetchingAddr ? 'Locating...' : location}
                        onChange={e => setLocation(e.target.value)} disabled={fetchingAddr} onFocus={inputFocusHandler} onBlur={inputBlurHandler} />
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                      Or Pin on Map
                    </label>
                    <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                      <LocationPicker
                        lat={lat}
                        lng={lng}
                        onChange={(l, g) => { setLat(l); setLng(g); }}
                        onAddressFound={addr => setLocation(addr)}
                        isFetchingAddress={setFetchingAddr}
                      />
                    </div>
                  </div>

                  {/* Terms */}
                  <div style={{ marginTop: 8, padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: 16, border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                      <div style={{ position: 'relative', marginTop: 2 }}>
                        <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)}
                          style={{
                            appearance: 'none', width: 20, height: 20, borderRadius: 6,
                            border: `2px solid ${agreeTerms ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            background: agreeTerms ? 'var(--color-primary)' : 'transparent',
                            outline: 'none', cursor: 'pointer', transition: 'all 0.2s',
                          }}
                        />
                        {agreeTerms && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', top: 4, left: 4, pointerEvents: 'none' }}>
                            <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--color-text-dim)', lineHeight: 1.5, fontWeight: 500 }}>
                        I agree to the <Link to="/terms" style={{ color: 'var(--color-primary)' }}>Terms of Service</Link> and <Link to="/privacy" style={{ color: 'var(--color-primary)' }}>Privacy Policy</Link>.
                      </p>
                    </label>
                  </div>
                </div>

                <button onClick={handleComplete} disabled={submitting} className="premium-btn premium-btn-primary" style={{ width: '100%', padding: '14px', fontSize: 16, marginTop: 24 }}>
                  {submitting ? 'Saving...' : 'Explore Businesses'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
