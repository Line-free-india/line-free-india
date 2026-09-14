import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import BottomNav from '../components/BottomNav';

const NOTIF_ICONS: Record<string, string> = {
  token_ready: '🎫', token_called: '🔔', salon_open: '💈', review: '⭐', general: '📢',
};

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead, unreadCount, role, requestNotificationPermission } = useApp();
  const nav = useNavigate();
  const [perm, setPerm] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        return Notification.permission;
      }
    } catch {}
    return 'default';
  });

  const handleEnablePush = async () => {
    try {
      await requestNotificationPermission();
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPerm(Notification.permission);
      }
    } catch (e) {
      console.warn('Notification permission error:', e);
    }
  };

  const handleClick = async (n: any) => {
    await markNotificationRead(n.id);
    if (n.data?.salonId && role === 'customer') nav(`/customer/salon/${n.data.salonId}`);
  };

  const backPath = role === 'business' ? '/barber/home' : '/customer/home';

  return (
    <div className="min-h-screen pb-40 animate-fadeIn">
      <div className="px-5 app-header-safe pb-6">
        <BackButton to={backPath} />
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold">🔔 Notifications</h1>
          {unreadCount > 0 && (
            <button onClick={markAllNotificationsRead} className="text-primary text-sm font-medium">
              Mark all read
            </button>
          )}
        </div>

        {perm !== 'granted' && perm !== 'denied' && (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slideUp">
            <div>
              <p className="font-bold text-sm">Enable Push Notifications</p>
              <p className="text-text-dim text-xs mt-0.5">Get instant alerts when your token is ready, even when the app is closed.</p>
            </div>
            <button onClick={handleEnablePush} className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl active:scale-95 transition-transform flex-shrink-0">
              Enable Now
            </button>
          </div>
        )}
        {perm === 'denied' && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm">
            Push notifications are blocked in your browser. Please enable notifications from browser settings for instant alerts.
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl block mb-3 animate-float">🔕</span>
            <p className="text-text-dim font-medium">No notifications yet</p>
            <p className="text-text-dim text-xs mt-1">We'll notify you about tokens, reviews & more</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n, i) => (
              <button
                key={n.id || i}
                onClick={() => handleClick(n)}
                className={`w-full text-left p-4 rounded-2xl elite-glass spatial-card border transition-all active:scale-[0.98] animate-fadeIn ${
                  n.read ? 'border-white/5 opacity-70' : 'border-primary/20 shadow-sm'
                }`}
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{NOTIF_ICONS[n.type] || '📢'}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`font-semibold text-sm ${!n.read ? 'text-text' : 'text-text-dim'}`}>{n.title}</p>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                    </div>
                    <p className="text-text-dim text-xs mt-0.5">{n.body}</p>
                    <p className="text-text-dim text-xs mt-1.5">
                      {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
