import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function sendInAppNotification(userId: string, notification: any): Promise<void> {
  try {
    await addDoc(collection(db, 'notifications'), {
      ...notification,
      userId,
      read: false,
      createdAt: Date.now()
    });
  } catch (error) {
    console.error('sendInAppNotification failed:', error);
  }
}

export async function sendPushNotification(userId: string, notification: any): Promise<boolean> {
  try {
    // 1. Trigger native Browser Web Notification if permitted in current foreground session
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notification.title || 'Line Free India', {
          body: notification.body || '',
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png'
        });
      } catch (browserNotifErr) {
        console.warn('Browser local notification display skipped:', browserNotifErr);
      }
    }

    // 2. Persist in-app notification ledger for the recipient
    await sendInAppNotification(userId, notification);
    return true;
  } catch (error) {
    console.error('sendPushNotification failed:', error);
    return false;
  }
}

/**
 * Normalizes Indian phone number format and generates a direct WhatsApp wa.me link
 */
export function formatWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const standardPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  return `https://wa.me/${standardPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Directly opens WhatsApp with a pre-filled contextual message
 */
export function openWhatsAppChat(phone: string, message: string): void {
  if (typeof window === 'undefined') return;
  const url = formatWhatsAppUrl(phone, message);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function sendWhatsAppMessage(phone: string, templateId: string, params: Record<string, string>): Promise<boolean> {
  try {
    const text = params.text || `Hello! Update from Line Free India regarding your token #${params.tokenNumber || ''}`;
    console.log(`WhatsApp ready for ${phone} with template ${templateId}:`, text);
    return true;
  } catch (error) {
    console.error('sendWhatsAppMessage failed:', error);
    return false;
  }
}

export async function notifyUser(userId: string, notification: any, channels: ('inapp' | 'push' | 'whatsapp')[]): Promise<{
  inapp: boolean; push: boolean; whatsapp: boolean;
}> {
  const result = { inapp: false, push: false, whatsapp: false };
  try {
    if (channels.includes('inapp')) {
      await sendInAppNotification(userId, notification);
      result.inapp = true;
    }
    
    if (channels.includes('push')) {
      result.push = await sendPushNotification(userId, notification);
    }
    
    if (channels.includes('whatsapp') && notification.phone) {
      result.whatsapp = await sendWhatsAppMessage(notification.phone, notification.templateId || 'default', notification.params || {});
    }
    
    return result;
  } catch (error) {
    console.error('notifyUser failed:', error);
    return result;
  }
}
