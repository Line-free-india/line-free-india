import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, Lang } from '../store/AppContext';
import { motion } from 'framer-motion';

export default function LanguageSelect() {
  const { setLang, user, role } = useApp();
  const nav = useNavigate();

  useEffect(() => {
    if (user && role) {
      nav(role === 'business' ? '/barber/home' : '/customer/home', { replace: true });
    }
  }, [user, role, nav]);

  const select = (l: Lang) => {
    setLang(l);
    setTimeout(() => nav('/theme'), 300);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Animated gradient mesh background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse at 30% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, rgba(6, 182, 212, 0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(192, 132, 252, 0.04) 0%, transparent 60%),
          var(--color-bg)
        `,
        zIndex: 0,
      }} />

      {/* Floating decorative orbs */}
      <motion.div
        animate={{ y: [-8, 8, -8], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '10%', right: '10%',
          width: 120, height: 120, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
          filter: 'blur(30px)', zIndex: 0,
        }}
      />
      <motion.div
        animate={{ y: [6, -10, 6] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', bottom: '15%', left: '5%',
          width: 100, height: 100, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, transparent 70%)',
          filter: 'blur(25px)', zIndex: 0,
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: 72, height: 72, borderRadius: 22,
            background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 28,
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3), 0 0 0 1px rgba(255,255,255,0.1)',
            position: 'relative',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 22,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
          }} />
          <span style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: -2 }}>L</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: 28, fontWeight: 800, letterSpacing: -1,
            marginBottom: 8, textAlign: 'center',
            color: 'var(--color-text)',
          }}
        >
          Line Free India
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: 15, color: 'var(--color-text-dim)',
            marginBottom: 48, textAlign: 'center', fontWeight: 500,
          }}
        >
          Choose your language / अपनी भाषा चुनें
        </motion.p>

        {/* Language options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
          {[
            { lang: 'en' as Lang, label: 'English', sub: 'Continue in English', flag: '🇬🇧' },
            { lang: 'hi' as Lang, label: 'हिंदी', sub: 'हिंदी में जारी रखें', flag: '🇮🇳' },
          ].map((opt, i) => (
            <motion.button
              key={opt.lang}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => select(opt.lang)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '18px 20px',
                background: 'var(--color-card)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--color-border)',
                borderRadius: 18, cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                overflow: 'hidden',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99, 102, 241, 0.35)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(99, 102, 241, 0.15)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              {/* Highlight line on top */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
              }} />

              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'rgba(var(--color-primary-rgb), 0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, flexShrink: 0,
                border: '1px solid rgba(var(--color-primary-rgb), 0.12)',
              }}>
                {opt.flag}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)', marginBottom: 3 }}>
                  {opt.label}
                </p>
                <p style={{ fontSize: 13, color: 'var(--color-text-dim)', fontWeight: 500 }}>
                  {opt.sub}
                </p>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.25 }}>
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.button>
          ))}
        </div>

        {/* Footer badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            marginTop: 56,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px',
            background: 'rgba(var(--color-primary-rgb), 0.06)',
            borderRadius: 100,
            border: '1px solid rgba(var(--color-primary-rgb), 0.1)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', letterSpacing: 0.3 }}>
            Secure & Private
          </span>
        </motion.div>
      </div>
    </div>
  );
}
