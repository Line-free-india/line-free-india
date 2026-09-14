import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../store/AppContext';

export default function Sidebar() {
  const { businessProfile, signOutUser, user } = useApp();
  const nav = useNavigate();
  const loc = useLocation();

  const isBusiness = loc.pathname.startsWith('/barber');
  if (!isBusiness || !user) return null;

  const items = [
    { emoji: '🏠', label: 'Dashboard',    path: '/barber/home' },
    { emoji: '📅', label: 'Calendar',     path: '/barber/calendar' },
    { emoji: '👥', label: 'Customers',    path: '/barber/customers' },
    { emoji: '📊', label: 'Analytics',    path: '/barber/analytics-pro' },
    { emoji: '👤', label: 'Staff',        path: '/barber/staff' },
    { emoji: '💬', label: 'WhatsApp',     path: '/barber/whatsapp' },
    { emoji: '📲', label: 'QR Code',      path: '/barber/qr' },
    { emoji: '🔔', label: 'Alerts',       path: '/barber/notifications' },
    { emoji: '⚙️', label: 'Settings',     path: '/barber/profile' },
  ];

  return (
    <div style={{
      display: 'none',
      // Only show on md+ via media query handled by tailwind
      position: 'fixed', top: 0, left: 0,
      width: 240, height: '100vh',
      background: 'var(--color-card)',
      borderRight: '1px solid var(--color-separator)',
      flexDirection: 'column',
      zIndex: 50, padding: '24px 0',
      overflowY: 'auto',
    }}
    className="md:flex"
    >
      {/* Logo */}
      <div style={{ padding: '0 16px 24px', borderBottom: '1px solid var(--color-separator)', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, background: 'var(--color-primary)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: -1 }}>L</span>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>Line Free India</p>
            <p style={{ fontSize: 14, color: 'var(--color-text-dim)' }}>Business</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, padding: '0 8px' }}>
        {items.map(item => {
          const active = loc.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => nav(item.path)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, marginBottom: 2,
                background: active ? 'rgba(0,122,255,0.1)' : 'transparent',
                color: active ? 'var(--color-primary)' : 'var(--color-text)',
                fontSize: 14, fontWeight: active ? 600 : 400,
                cursor: 'pointer', transition: 'background 0.1s',
              }}
            >
              <span style={{ fontSize: 18 }}>{item.emoji}</span>
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <div style={{ padding: '8px' }}>
        <button
          onClick={async () => { await signOutUser(); nav('/'); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10,
            background: 'transparent', color: 'var(--color-danger)',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 18 }}>🚪</span>
          Sign Out
        </button>
      </div>
    </div>
  );
}
