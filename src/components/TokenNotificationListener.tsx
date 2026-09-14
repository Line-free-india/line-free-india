import { useEffect, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { useToast } from './ToastSystem';

/**
 * Headless component that listens to real-time notifications from AppContext
 * and triggers high-fidelity toasts ONLY for fresh incoming events during this session.
 */
export default function TokenNotificationListener() {
  const { notifications, user, role } = useApp();
  const { showToast } = useToast();
  const lastNotifId = useRef<string | null>(null);
  const isInitialMount = useRef(true);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    if (!user || notifications.length === 0) return;

    const latest = notifications[0];
    if (!latest || !latest.id) return;

    // On initial mount/load, capture the latest ID and DO NOT show stale historical toasts
    if (isInitialMount.current) {
      lastNotifId.current = latest.id;
      isInitialMount.current = false;
      return;
    }

    // Only trigger for newly arrived unread notifications during this active session
    if (latest.id !== lastNotifId.current && !latest.read) {
      // Must have been created after component mount or within the last 20 seconds
      const isFresh = latest.createdAt ? latest.createdAt >= mountTime.current - 5000 : false;

      if (isFresh) {
        // Business owner receiving a new customer token
        if (role === 'business') {
          // Only show merchant-relevant incoming booking alerts
          const isMerchantAlert = 
            latest.title?.includes('New Customer') || 
            latest.body?.includes('booked Token') ||
            (latest.data && latest.data.tokenId);

          if (isMerchantAlert) {
            showToast(latest.body, 'success');
          }
        } 
        // Customer receiving a call to counter
        else if (role === 'customer' && latest.type === 'token_called') {
          showToast(latest.body, 'info');
        }
      }

      lastNotifId.current = latest.id;
    }
  }, [notifications, user, role, showToast]);

  return null;
}
