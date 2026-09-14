import { useState } from 'react';
import { useApp } from '../store/AppContext';
import BackButton from '../components/BackButton';
import { motion } from 'framer-motion';

export default function UPIPayment() {
  const { businessProfile } = useApp();
  const [amount, setAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [note, setNote] = useState('');

  const CAT_COLOR: Record<string, string> = {
    men_salon: '#00f0ff', beauty_parlour: '#ff6eb4', unisex_salon: '#a855f7', restaurant: '#f59e0b',
    cafe: '#d97706', clinic: '#0d9488', hospital: '#0ea5e9', gym: '#dc2626', spa: '#7c3aed',
    coaching: '#4338ca', event_planner: '#fbbf24', pet_care: '#16a34a', law_firm: '#94a3b8',
    photography: '#c026d3', repair_shop: '#ea580c', laundry: '#0891b2', other: '#10b981',
  };
  const aurora = CAT_COLOR[businessProfile?.businessType || 'other'];
  const upiId = businessProfile?.upiId || '';
  const businessName = businessProfile?.businessName || 'Business';

  const generateUPILink = () => {
    if (!upiId || !amount) return '';
    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) return '';
    const params = new URLSearchParams({
      pa: upiId,
      pn: businessName,
      am: amtNum.toFixed(2),
      tn: note || `Payment to ${businessName}`,
      cu: 'INR',
    });
    return `upi://pay?${params.toString()}`;
  };

  const handleOpenUPI = () => {
    const link = generateUPILink();
    if (link) {
      window.location.href = link;
    }
  };

  const upiLink = generateUPILink();
  const qrApiUrl = upiLink ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}` : '';

  return (
    <div className="min-h-screen pb-40 relative overflow-hidden text-white">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: '#060810' }} />
        <motion.div
          animate={{ x:['-20%','20%','-20%'], y:['-15%','15%','-15%'], scale:[1,1.35,1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-10%] left-[-10%] w-[65vw] h-[65vw] rounded-full blur-[120px] opacity-30"
          style={{ background: `radial-gradient(circle, ${aurora} 0%, transparent 70%)` }}
        />
      </div>

      <div className="p-6 relative z-10">
        <BackButton to="/barber/home" />

        <header className="mt-6 mb-8">
          <h1 className="text-3xl font-black tracking-tighter">
            💳 UPI <span style={{ color: aurora }}>Payments</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">Collect payments via UPI instantly</p>
        </header>

        {/* UPI ID Display */}
        <div className="p-4 rounded-2xl mb-6 border" style={{ background: `${aurora}08`, borderColor: `${aurora}25` }}>
          <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: aurora }}>Your UPI ID</div>
          <div className="font-mono text-lg font-bold text-white/90">{upiId || 'Not configured'}</div>
          {!upiId && <p className="text-red-400 text-xs mt-1">Set your UPI ID in Profile Settings to accept payments</p>}
        </div>

        {/* Amount Entry */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-white/40 mb-1 block">Amount (₹)</label>
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount"
              type="number"
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-2xl font-black outline-none focus:border-opacity-50 transition-colors"
              style={{ borderColor: `${aurora}30` }}
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-white/40 mb-1 block">Customer Name (optional)</label>
            <input
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Rahul Kumar"
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-white/40 mb-1 block">Note</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Haircut + Beard Trim"
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm outline-none"
            />
          </div>
        </div>

        {/* QR Code */}
        {upiLink && (
          <div className="p-6 rounded-3xl text-center mb-6" style={{ background: `${aurora}08`, border: `1px solid ${aurora}20` }}>
            <div className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: aurora }}>Scan to Pay</div>
            <div className="inline-block p-4 bg-white rounded-2xl mb-4 shadow-2xl">
              <img src={qrApiUrl} alt="UPI QR" className="w-48 h-48" />
            </div>
            <div className="text-white/60 text-sm font-bold">₹{parseFloat(amount).toLocaleString('en-IN')}</div>
            <div className="text-white/30 text-xs mt-1">to {businessName}</div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleOpenUPI}
            disabled={!upiLink}
            className="w-full p-4 rounded-3xl font-black text-base flex items-center justify-center gap-3 disabled:opacity-30 shadow-2xl active:scale-[0.98] transition-transform"
            style={{ background: `linear-gradient(135deg, ${aurora}80, ${aurora}40)`, boxShadow: `0 10px 30px ${aurora}20` }}
          >
            📱 Open UPI App
          </button>
          
          <button
            onClick={() => {
              if (!upiLink) return;
              navigator.share?.({ title: `Pay ₹${amount} to ${businessName}`, url: upiLink });
            }}
            disabled={!upiLink}
            className="w-full p-3 rounded-2xl border text-sm font-bold text-white/60 disabled:opacity-30"
            style={{ borderColor: `${aurora}30` }}
          >
            📤 Share Payment Link
          </button>
        </div>

        {/* Quick amounts */}
        <div className="mt-6">
          <div className="text-xs font-black uppercase tracking-widest text-white/40 mb-3">Quick Amounts</div>
          <div className="flex flex-wrap gap-2">
            {[100, 200, 300, 500, 1000, 2000].map(amt => (
              <button key={amt}
                onClick={() => setAmount(amt.toString())}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: amount === amt.toString() ? `${aurora}20` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${amount === amt.toString() ? `${aurora}40` : 'rgba(255,255,255,0.08)'}`,
                  color: amount === amt.toString() ? aurora : 'rgba(255,255,255,0.4)',
                }}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
