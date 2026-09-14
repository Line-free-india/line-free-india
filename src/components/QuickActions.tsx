import { useNavigate } from 'react-router-dom';
import { useApp, getCategoryInfo } from '../store/AppContext';
import { AnimatePresence, motion } from 'framer-motion';

interface Props { onClose: () => void; }

export default function QuickActions({ onClose }: Props) {
  const nav = useNavigate();
  const { businessProfile } = useApp();

  const actions = [
    { icon: '👥', label: 'Queue',       path: '/barber/customers' },
    { icon: '📊', label: 'Analytics',   path: '/barber/analytics' },
    { icon: '💬', label: 'Messages',    path: '/barber/messages' },
    { icon: '📢', label: 'WhatsApp',    path: '/barber/whatsapp' },
    { icon: '🛍️', label: 'Products',    path: '/barber/sell-products' },
    { icon: '📲', label: 'QR Code',     path: '/barber/qr' },
    { icon: '👤', label: 'Staff',       path: '/barber/staff' },
    { icon: '📅', label: 'Calendar',    path: '/barber/calendar' },
    { icon: '⚙️', label: 'Settings',    path: '/barber/profile' },
  ];

  const go = (path: string) => { nav(path); onClose(); };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 9999,
          display: 'flex', alignItems: 'flex-end',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            background: 'var(--color-card)',
            width: '100%',
            maxWidth: 480,
            margin: '0 auto',
            borderRadius: '20px 20px 0 0',
            padding: '20px 16px',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Handle */}
          <div style={{ width: 36, height: 4, background: 'var(--color-border)', borderRadius: 100, margin: '0 auto 20px' }} />

          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', marginBottom: 16, paddingLeft: 4 }}>
            Quick Actions
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {actions.map(a => (
              <button
                key={a.path}
                onClick={() => go(a.path)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '14px 8px',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 14, cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 24 }}>{a.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-dim)' }}>{a.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            style={{
              width: '100%', marginTop: 16, padding: '14px',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 14, fontSize: 15, fontWeight: 500,
              color: 'var(--color-text-dim)', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
