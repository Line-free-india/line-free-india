import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { t } from '../i18n';
import { motion } from 'framer-motion';

export default function RoleSelect() {
  const { setRole, lang } = useApp();
  const nav = useNavigate();
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  const select = (r: 'customer' | 'business') => {
    setRole(r);
    nav(r === 'customer' ? '/customer/auth' : '/barber/auth');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Gradient background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse at 20% 40%, rgba(99, 102, 241, 0.07) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 60%, rgba(6, 182, 212, 0.05) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 90%, rgba(192, 132, 252, 0.04) 0%, transparent 50%),
          var(--color-bg)
        `,
        zIndex: 0,
      }} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'relative', zIndex: 1,
        }}
      >
        <button
          onClick={() => nav('/theme')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', color: 'var(--color-primary)',
            fontSize: 14, fontWeight: 600, padding: '4px 0', cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-dim)', letterSpacing: 0.5 }}>
          STEP 3 OF 3
        </span>
        <div style={{ width: 56 }} />
      </motion.div>

      {/* Main Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 24px 40px',
        maxWidth: 440, margin: '0 auto', width: '100%',
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: 68, height: 68,
            background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)',
            borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 28,
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
            position: 'relative',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 20,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
          }} />
          <span style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: -2 }}>L</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            fontSize: 28, fontWeight: 800, color: 'var(--color-text)',
            letterSpacing: -1, textAlign: 'center', marginBottom: 8,
          }}
        >
          {t('chooseYourPath', lang) || 'How will you use the app?'}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            fontSize: 15, color: 'var(--color-text-dim)',
            textAlign: 'center', marginBottom: 40, maxWidth: 300, fontWeight: 500,
          }}
        >
          {t('roleSelectSubtitle', lang) || 'Select your role to get started'}
        </motion.p>

        {/* Role Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
          {/* Customer Card */}
          <motion.button
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => select('customer')}
            onMouseEnter={() => setHoveredRole('customer')}
            onMouseLeave={() => setHoveredRole(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '22px 20px',
              background: 'var(--color-card)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: hoveredRole === 'customer'
                ? '1.5px solid rgba(59, 130, 246, 0.4)'
                : '1.5px solid var(--color-border)',
              borderRadius: 20,
              textAlign: 'left', cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: hoveredRole === 'customer' ? 'translateY(-3px)' : 'translateY(0)',
              boxShadow: hoveredRole === 'customer'
                ? '0 12px 32px rgba(59, 130, 246, 0.15)'
                : 'var(--shadow-sm)',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Top highlight */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
            }} />

            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, flexShrink: 0,
              border: '1px solid rgba(59, 130, 246, 0.15)',
            }}>
              👤
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
                {t('customer', lang) || 'Customer'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-text-dim)', fontWeight: 500, lineHeight: 1.4 }}>
                {t('customerDesc', lang) || 'Book tokens, skip the queue, track in real-time'}
              </p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.25, flexShrink: 0 }}>
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>

          {/* Business Card */}
          <motion.button
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => select('business')}
            onMouseEnter={() => setHoveredRole('business')}
            onMouseLeave={() => setHoveredRole(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '22px 20px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #7C3AED 100%)',
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 20,
              textAlign: 'left', cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: hoveredRole === 'business' ? 'translateY(-3px)' : 'translateY(0)',
              boxShadow: hoveredRole === 'business'
                ? '0 12px 40px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)'
                : '0 8px 24px rgba(99, 102, 241, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Gradient overlay for shine */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 40%)',
              pointerEvents: 'none',
            }} />

            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'rgba(255, 255, 255, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, flexShrink: 0,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
            }}>
              🏪
            </div>
            <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                {t('business', lang) || 'Business Owner'}
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.75)', fontWeight: 500, lineHeight: 1.4 }}>
                {t('businessDesc', lang) || 'Manage queues, grow with smart tools'}
              </p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.5, flexShrink: 0, position: 'relative', zIndex: 1 }}>
              <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
        </div>

        {/* Trust features */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          style={{
            marginTop: 44,
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 10, width: '100%',
          }}
        >
          {[
            { icon: '⚡', label: 'Real-time tracking', color: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.15)' },
            { icon: '📊', label: 'Smart analytics', color: 'rgba(99, 102, 241, 0.08)', borderColor: 'rgba(99, 102, 241, 0.15)' },
            { icon: '🛡️', label: 'Secure & private', color: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.15)' },
            { icon: '📍', label: 'Location-aware', color: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.15)' },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.7 + i * 0.08 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 14px',
                background: f.color,
                borderRadius: 14,
                border: `1px solid ${f.borderColor}`,
              }}
            >
              <span style={{ fontSize: 17 }}>{f.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-dim)', letterSpacing: -0.2 }}>
                {f.label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Genuine Platform Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            marginTop: 28,
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--color-text-muted)',
            fontSize: 12, fontWeight: 700,
          }}
        >
          <span style={{ fontSize: 14 }}>🇮🇳</span>
          <span>Digital India • Virtual Queue & Token Operating System</span>
        </motion.div>
      </div>
    </div>
  );
}
