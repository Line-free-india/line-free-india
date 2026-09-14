import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { setThemeMode, ThemeMode } from '../hooks/useTheme';
import { t } from '../i18n';
import { motion } from 'framer-motion';

export default function ThemeSelect() {
  const { lang, user, role } = useApp();
  const nav = useNavigate();
  const [selected, setSelected] = useState<ThemeMode | null>(null);

  useEffect(() => {
    if (user && role) {
      nav(role === 'business' ? '/barber/home' : '/customer/home', { replace: true });
    }
  }, [user, role, nav]);

  const select = (mode: ThemeMode) => {
    setSelected(mode);
    setThemeMode(mode);
    setTimeout(() => nav('/role'), 400);
  };

  const themes = [
    {
      mode: 'light' as ThemeMode,
      icon: '☀️',
      label: t('lightMode', lang) || 'Light',
      desc: 'Clean & minimal — perfect for daytime',
      preview: {
        bg: '#F8F9FC',
        card: '#FFFFFF',
        text: '#0F172A',
        accent: '#2563EB',
        border: 'rgba(148,163,184,0.2)',
      },
    },
    {
      mode: 'dark' as ThemeMode,
      icon: '🌙',
      label: t('darkMode', lang) || 'Dark',
      desc: 'Sleek & elegant — easy on the eyes',
      preview: {
        bg: '#060813',
        card: '#0F172A',
        text: '#F8FAFC',
        accent: '#38BDF8',
        border: 'rgba(255,255,255,0.08)',
      },
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Gradient mesh background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse at 25% 30%, rgba(99, 102, 241, 0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 75% 70%, rgba(6, 182, 212, 0.05) 0%, transparent 50%),
          var(--color-bg)
        `,
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => nav('/')}
          style={{
            alignSelf: 'flex-start',
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', color: 'var(--color-primary)',
            fontSize: 14, fontWeight: 600, padding: '8px 0',
            marginBottom: 32, cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: 40 }}
        >
          <h1 style={{
            fontSize: 28, fontWeight: 800, letterSpacing: -1,
            marginBottom: 10, color: 'var(--color-text)',
          }}>
            {t('chooseTheme', lang) || 'Choose your vibe'}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--color-text-dim)', fontWeight: 500 }}>
            {t('themeDescription', lang) || 'You can change this anytime in settings'}
          </p>
        </motion.div>

        {/* Theme cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
          {themes.map((theme, i) => (
            <motion.button
              key={theme.mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => select(theme.mode)}
              style={{
                display: 'flex', alignItems: 'stretch', gap: 0,
                background: 'var(--color-card)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: selected === theme.mode
                  ? '2px solid var(--color-primary)'
                  : '1.5px solid var(--color-border)',
                borderRadius: 20, cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: selected === theme.mode
                  ? '0 8px 32px rgba(var(--color-primary-rgb), 0.2)'
                  : 'var(--shadow-sm)',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                if (selected !== theme.mode) {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                }
              }}
              onMouseLeave={e => {
                if (selected !== theme.mode) {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
                }
              }}
            >
              {/* Preview mini-UI */}
              <div style={{
                width: 100, flexShrink: 0,
                background: theme.preview.bg,
                padding: 12,
                display: 'flex', flexDirection: 'column', gap: 6,
                borderRight: `1px solid ${theme.preview.border}`,
              }}>
                {/* Mini header bar */}
                <div style={{
                  height: 6, width: '60%', borderRadius: 3,
                  background: theme.preview.text, opacity: 0.15,
                }} />
                {/* Mini cards */}
                <div style={{
                  background: theme.preview.card,
                  borderRadius: 6, padding: 6,
                  border: `1px solid ${theme.preview.border}`,
                }}>
                  <div style={{ height: 4, width: '80%', borderRadius: 2, background: theme.preview.text, opacity: 0.12, marginBottom: 4 }} />
                  <div style={{ height: 4, width: '50%', borderRadius: 2, background: theme.preview.accent, opacity: 0.5 }} />
                </div>
                <div style={{
                  background: theme.preview.card,
                  borderRadius: 6, padding: 6,
                  border: `1px solid ${theme.preview.border}`,
                }}>
                  <div style={{ height: 4, width: '70%', borderRadius: 2, background: theme.preview.text, opacity: 0.12, marginBottom: 4 }} />
                  <div style={{ height: 4, width: '40%', borderRadius: 2, background: theme.preview.accent, opacity: 0.4 }} />
                </div>
                {/* Mini button */}
                <div style={{
                  height: 14, borderRadius: 4,
                  background: theme.preview.accent,
                  opacity: 0.8,
                }} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, padding: '18px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 24 }}>{theme.icon}</span>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
                    {theme.label}
                  </p>
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-text-dim)', fontWeight: 500, lineHeight: 1.4 }}>
                  {theme.desc}
                </p>
                {selected === theme.mode && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      marginTop: 10,
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px',
                      background: 'rgba(var(--color-primary-rgb), 0.1)',
                      borderRadius: 8,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)' }}>Selected</span>
                  </motion.div>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Step indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            marginTop: 48,
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <div style={{ width: 24, height: 3, borderRadius: 100, background: 'var(--color-primary)', opacity: 0.3 }} />
          <div style={{ width: 24, height: 3, borderRadius: 100, background: 'var(--color-primary)' }} />
          <div style={{ width: 24, height: 3, borderRadius: 100, background: 'var(--color-border)' }} />
        </motion.div>
      </div>
    </div>
  );
}
