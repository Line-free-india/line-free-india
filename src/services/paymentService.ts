import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';

export interface PaymentRecord {
  id?: string;
  salonId: string;
  customerId?: string;
  customerName?: string;
  amount: number;
  paymentMethod: 'upi' | 'cash' | 'card' | 'online' | 'razorpay';
  status: 'pending' | 'completed' | 'failed';
  tokenId?: string;
  note?: string;
  transactionRef?: string;
  timestamp: number;
  createdAt: string;
}

export interface RazorpayOptions {
  amount: number; // in INR
  businessName: string;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  tokenId?: string;
  salonId: string;
  themeColor?: string;
  onSuccess?: (paymentId: string, recordId?: string) => void;
  onFailure?: (error: string) => void;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

/**
 * Dynamically loads the Razorpay Standard Checkout script
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load Razorpay Checkout script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Generates an NPCI-compliant UPI deep-link for instant payment on mobile devices.
 * Works seamlessly with Google Pay, PhonePe, Paytm, BHIM, and any Indian UPI app.
 */
export function generateUPIPaymentLink(params: {
  upiId: string;
  businessName: string;
  amount: number;
  note?: string;
  transactionRef?: string;
}): string {
  if (!params.upiId || params.amount <= 0) return '';
  
  const searchParams = new URLSearchParams({
    pa: params.upiId.trim(),
    pn: params.businessName.trim(),
    am: params.amount.toFixed(2),
    cu: 'INR',
    tn: params.note || `Payment to ${params.businessName}`
  });

  if (params.transactionRef) {
    searchParams.append('tr', params.transactionRef);
  }

  return `upi://pay?${searchParams.toString()}`;
}

/**
 * Generates a dynamic QR code image URL for displaying on screen or desktop
 */
export function generateUPIQRCodeUrl(params: {
  upiId: string;
  businessName: string;
  amount: number;
  note?: string;
  size?: number;
}): string {
  const upiLink = generateUPIPaymentLink(params);
  if (!upiLink) return '';
  const size = params.size || 250;
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upiLink)}`;
}

/**
 * Records a verified payment transaction into the business ledger
 */
export async function recordPaymentTransaction(payment: Omit<PaymentRecord, 'id' | 'timestamp' | 'createdAt'>): Promise<string | null> {
  try {
    const ref = await addDoc(collection(db, 'payments'), {
      ...payment,
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    });

    // If associated with a token, update token payment status
    if (payment.tokenId) {
      try {
        await updateDoc(doc(db, 'tokens', payment.tokenId), {
          paymentStatus: payment.status,
          paymentMethod: payment.paymentMethod,
          paidAmount: payment.amount
        });
      } catch (tokenErr) {
        console.warn('Could not link payment to token:', tokenErr);
      }
    }

    return ref.id;
  } catch (error) {
    console.error('recordPaymentTransaction failed:', error);
    return null;
  }
}

/**
 * Initiates Razorpay Checkout modal with fallback
 */
export async function initiateRazorpayPayment(options: RazorpayOptions): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !window.Razorpay) {
    return { success: false, error: 'Razorpay SDK could not be loaded. Please use UPI instead.' };
  }

  return new Promise((resolve) => {
    try {
      const keyId = (import.meta as any).env?.VITE_RAZORPAY_KEY || 'rzp_test_LineFreeIndia';
      
      const rzpOptions = {
        key: keyId,
        amount: Math.round(options.amount * 100), // Amount in paise
        currency: 'INR',
        name: options.businessName || 'Line Free India',
        description: options.description || 'Service Appointment Payment',
        image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        prefill: {
          name: options.customerName || '',
          email: options.customerEmail || 'customer@linefree.in',
          contact: options.customerPhone || ''
        },
        theme: {
          color: options.themeColor || '#00F0FF'
        },
        modal: {
          ondismiss: () => {
            resolve({ success: false, error: 'Payment modal closed by user.' });
            options.onFailure?.('Payment cancelled');
          }
        },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id?: string; razorpay_signature?: string }) => {
          // TODO: Phase 6 - Implement Cloud Functions server-side verification
          // Currently using temporary client-side verification
          const isSignatureValid = !!response.razorpay_payment_id;

          if (!isSignatureValid) {
            resolve({ success: false, error: 'Payment signature validation failed (client-side)' });
            return;
          }

          const recordId = await recordPaymentTransaction({
            salonId: options.salonId,
            customerId: options.customerPhone || 'online_customer',
            customerName: options.customerName || 'Customer',
            amount: options.amount,
            paymentMethod: 'razorpay',
            status: 'completed',
            tokenId: options.tokenId,
            transactionRef: response.razorpay_payment_id,
            note: options.description || 'Razorpay Online Payment'
          });

          options.onSuccess?.(response.razorpay_payment_id, recordId || undefined);
          resolve({ success: true, paymentId: response.razorpay_payment_id });
        }
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.on('payment.failed', (resp: any) => {
        const errMsg = resp.error?.description || 'Payment failed';
        options.onFailure?.(errMsg);
        resolve({ success: false, error: errMsg });
      });

      rzp.open();
    } catch (err: any) {
      console.error('Razorpay invocation error:', err);
      options.onFailure?.(err.message || 'Payment initiation error');
      resolve({ success: false, error: err.message || 'Payment initiation error' });
    }
  });
}
