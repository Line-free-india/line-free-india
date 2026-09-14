import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { initiateRazorpayPayment, generateUPIQRCodeUrl, generateUPIPaymentLink, recordPaymentTransaction } from '../services/paymentService';

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  businessName: string;
  salonId: string;
  description?: string;
  tokenId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  upiId?: string;
  allowCashOption?: boolean;
  onSuccess: (paymentId: string, method: 'razorpay' | 'upi' | 'cash') => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  businessName,
  salonId,
  description = 'Service Booking',
  tokenId,
  customerName = 'Customer',
  customerPhone = '',
  customerEmail = '',
  upiId = 'kumarsatyam9378@okhdfcbank',
  allowCashOption = false,
  onSuccess
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'razorpay' | 'upi_qr' | 'upi_intent' | 'cash'>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  if (!isOpen) return null;

  const upiLink = generateUPIPaymentLink({
    upiId,
    businessName,
    amount,
    note: description
  });

  const qrUrl = generateUPIQRCodeUrl({
    upiId,
    businessName,
    amount,
    note: description,
    size: 260
  });

  const handleRazorpayPay = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    triggerHaptic('medium');

    const result = await initiateRazorpayPayment({
      amount,
      businessName,
      description,
      salonId,
      tokenId,
      customerName,
      customerPhone,
      customerEmail,
      themeColor: '#00F0FF',
      onSuccess: (paymentId) => {
        setIsProcessing(false);
        triggerHaptic('success');
        onSuccess(paymentId, 'razorpay');
        onClose();
      },
      onFailure: (err) => {
        setIsProcessing(false);
        setErrorMessage(err || 'Payment could not be completed. Try UPI.');
        triggerHaptic('error');
      }
    });

    if (!result.success && result.error) {
      setIsProcessing(false);
      setErrorMessage(result.error);
    }
  };

  const handleOpenUpiApp = () => {
    if (!upiLink) return;
    triggerHaptic('light');
    window.location.href = upiLink;
  };

  const handleManualUpiDone = async () => {
    setIsProcessing(true);
    triggerHaptic('medium');
    try {
      const recordId = await recordPaymentTransaction({
        salonId,
        customerId: customerPhone || 'upi_user',
        customerName,
        amount,
        paymentMethod: 'upi',
        status: 'completed',
        tokenId,
        note: `${description} via UPI App/QR`
      });

      triggerHaptic('success');
      onSuccess(recordId || 'upi_direct', 'upi');
      onClose();
    } catch {
      setErrorMessage('Could not record transaction. Please try again.');
    }
    setIsProcessing(false);
  };

  const handleCashPay = async () => {
    setIsProcessing(true);
    triggerHaptic('medium');
    try {
      const recordId = await recordPaymentTransaction({
        salonId,
        customerId: customerPhone || 'cash_user',
        customerName,
        amount,
        paymentMethod: 'cash',
        status: 'pending',
        tokenId,
        note: `${description} (Pay at Salon Counter)`
      });

      triggerHaptic('success');
      onSuccess(recordId || 'cash_counter', 'cash');
      onClose();
    } catch {
      setErrorMessage('Could not register cash option.');
    }
    setIsProcessing(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-[32px] p-6 shadow-2xl relative overflow-hidden text-white font-sans"
        >
          {/* Subtle Aurora Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Secure Payment</p>
              <h2 className="text-2xl font-black tracking-tight">{businessName}</h2>
              <p className="text-xs text-white/50">{description}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Amount Badge */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between mb-5">
            <span className="text-xs font-bold text-white/60">Total Payable</span>
            <div className="text-right">
              <span className="text-2xl font-black text-cyan-400">₹{amount.toLocaleString('en-IN')}</span>
              <p className="text-[10px] text-white/40">Zero Convenience Fee</p>
            </div>
          </div>

          {/* Method Selector Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white/5 mb-5 text-xs font-bold">
            <button
              onClick={() => { setSelectedMethod('razorpay'); setErrorMessage(''); }}
              className={`py-2 px-2 rounded-xl transition-all ${selectedMethod === 'razorpay' ? 'bg-cyan-500 text-black font-black shadow-md' : 'text-white/60 hover:text-white'}`}
            >
              💳 Cards & Net
            </button>
            <button
              onClick={() => { setSelectedMethod('upi_intent'); setErrorMessage(''); }}
              className={`py-2 px-2 rounded-xl transition-all ${selectedMethod === 'upi_intent' ? 'bg-cyan-500 text-black font-black shadow-md' : 'text-white/60 hover:text-white'}`}
            >
              📱 UPI App
            </button>
            <button
              onClick={() => { setSelectedMethod('upi_qr'); setErrorMessage(''); }}
              className={`py-2 px-2 rounded-xl transition-all ${selectedMethod === 'upi_qr' ? 'bg-cyan-500 text-black font-black shadow-md' : 'text-white/60 hover:text-white'}`}
            >
              📷 Scan QR
            </button>
          </div>

          {/* Tab 1: Razorpay Cards & Netbanking */}
          {selectedMethod === 'razorpay' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold">
                  <span>🛡️</span>
                  <span>100% Encrypted & Bank-Grade Security</span>
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Pay securely with Visa, MasterCard, RuPay, Netbanking (SBI, HDFC, ICICI, Axis), Cred, and EMI.
                </p>
              </div>

              <button
                onClick={handleRazorpayPay}
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black text-sm uppercase tracking-wider shadow-xl shadow-cyan-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>Opening Checkout...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Pay ₹{amount}</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Tab 2: UPI Apps Intent */}
          {selectedMethod === 'upi_intent' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <p className="text-xs text-white/60">Pay directly using any installed UPI app on your mobile:</p>
                <div className="flex justify-around items-center py-2 text-2xl">
                  <span title="Google Pay">🔵</span>
                  <span title="PhonePe">🟣</span>
                  <span title="Paytm">🔷</span>
                  <span title="BHIM">🇮🇳</span>
                </div>
              </div>

              <button
                onClick={handleOpenUpiApp}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>Open UPI App (₹{amount})</span>
                <span>📱</span>
              </button>

              <button
                onClick={handleManualUpiDone}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white text-xs font-bold transition-colors"
              >
                {isProcessing ? 'Verifying...' : 'I have completed the payment in UPI app'}
              </button>
            </div>
          )}

          {/* Tab 3: UPI QR Code */}
          {selectedMethod === 'upi_qr' && (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-white rounded-2xl inline-block shadow-xl border border-white/20">
                <img src={qrUrl} alt="UPI QR" className="w-44 h-44 mx-auto" />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-white/70">Scan with Google Pay, PhonePe, Paytm, or CRED</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-xs text-cyan-400">{upiId}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(upiId);
                      setCopiedUpi(true);
                      triggerHaptic('light');
                      setTimeout(() => setCopiedUpi(false), 2000);
                    }}
                    className="text-[10px] text-white/40 hover:text-white underline"
                  >
                    {copiedUpi ? 'Copied! ✅' : 'Copy'}
                  </button>
                </div>
              </div>

              <button
                onClick={handleManualUpiDone}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all"
              >
                {isProcessing ? 'Confirming...' : 'I Have Paid via QR →'}
              </button>
            </div>
          )}

          {/* Optional Cash Option */}
          {allowCashOption && (
            <div className="mt-4 pt-4 border-t border-white/10 text-center">
              <button
                onClick={handleCashPay}
                disabled={isProcessing}
                className="text-xs font-bold text-white/40 hover:text-white transition-colors"
              >
                Pay in cash at salon counter instead
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium text-center">
              {errorMessage}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
