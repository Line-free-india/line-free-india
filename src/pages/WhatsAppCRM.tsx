import { useState } from 'react';
import { useApp, getCategoryInfo } from '../store/AppContext';
import BackButton from '../components/BackButton';
import { motion } from 'framer-motion';
import { generateMarketingCampaign } from '../services/aiService';

const TEMPLATES = [
  { id: 'offer', label: '🎯 Special Offer', msg: 'Hi {{name}}! 🎉 We have an exclusive offer for you at {{business}}. Visit us today and get 20% off! 🔥\n\n📍 {{location}}\n🔗 Book: {{link}}' },
  { id: 'reminder', label: '⏰ Appointment Reminder', msg: 'Hi {{name}}, just a reminder you have an appointment at {{business}} today! ⏰\n\nWe look forward to seeing you! 😊\n📍 {{location}}' },
  { id: 'newservice', label: '✨ New Service Launch', msg: 'Hey {{name}}! 🚀 {{business}} just launched a new service. Be the first to try it!\n\n📍 {{location}}\n🔗 {{link}}' },
  { id: 'festival', label: '🎊 Festival Greetings', msg: 'Happy Festive Season, {{name}}! 🪔✨ Celebrate with us at {{business}} — special festive packages await!\n\n📍 {{location}}\n🔗 {{link}}' },
  { id: 'feedback', label: '⭐ Ask for Review', msg: 'Hi {{name}}, thank you for visiting {{business}}! 🙏 We hope you had a great experience. Could you take a moment to rate us? ⭐⭐⭐⭐⭐\n\n🔗 {{link}}' },
  { id: 'loyalty', label: '🏆 Loyalty Reward', msg: 'Congratulations {{name}}! 🎉 You\'ve earned loyalty points at {{business}}. Redeem them on your next visit for amazing discounts! 💎\n\n🔗 {{link}}' },
];

export default function WhatsAppCRM() {
  const { businessProfile, user } = useApp();
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [customMsg, setCustomMsg] = useState('');
  const [phone, setPhone] = useState('');
  const [sentCount, setSentCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [aiOccasion, setAiOccasion] = useState<'diwali' | 'eid' | 'holi' | 'new_year' | 'weekend_rush' | 'slow_weekday'>('weekend_rush');
  const [aiDiscount, setAiDiscount] = useState<number>(20);

  const catInfo = getCategoryInfo(businessProfile?.businessType || 'men_salon');
  const CAT_COLOR: Record<string, string> = {
    men_salon: '#00f0ff', beauty_parlour: '#ff6eb4', unisex_salon: '#a855f7', restaurant: '#f59e0b',
    cafe: '#d97706', clinic: '#0d9488', hospital: '#0ea5e9', gym: '#dc2626', spa: '#7c3aed',
    coaching: '#4338ca', event_planner: '#fbbf24', pet_care: '#16a34a', law_firm: '#94a3b8',
    photography: '#c026d3', repair_shop: '#ea580c', laundry: '#0891b2', other: '#10b981',
  };
  const aurora = CAT_COLOR[businessProfile?.businessType || 'other'];

  const bookingUrl = `${window.location.origin}/customer/salon/${user?.uid}`;
  const getProcessedMsg = (msg: string) => {
    return msg
      .replace(/\{\{name\}\}/g, 'Customer')
      .replace(/\{\{business\}\}/g, businessProfile?.businessName || 'Our Business')
      .replace(/\{\{location\}\}/g, businessProfile?.location || 'Visit us')
      .replace(/\{\{link\}\}/g, bookingUrl);
  };

  const handleSendBulk = () => {
    const msg = customMsg || getProcessedMsg(selectedTemplate.msg);
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    setSentCount(prev => prev + 1);
  };

  const handleSendToNumber = () => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const msg = customMsg || getProcessedMsg(selectedTemplate.msg);
    const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    setSentCount(prev => prev + 1);
  };

  return (
    <div className="min-h-screen pb-40 relative overflow-hidden text-white">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: '#060810' }} />
        <motion.div
          animate={{ x:['-20%','20%','-20%'], y:['-15%','15%','-15%'], scale:[1,1.35,1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-10%] left-[-10%] w-[65vw] h-[65vw] rounded-full blur-[120px] opacity-30"
          style={{ background: `radial-gradient(circle, #25D366 0%, transparent 70%)` }}
        />
        <motion.div
          animate={{ x:['20%','-20%','20%'], y:['20%','-20%','20%'] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[-5%] right-[-5%] w-[50vw] h-[50vw] rounded-full blur-[110px] opacity-20"
          style={{ background: `radial-gradient(circle, ${aurora} 0%, transparent 70%)` }}
        />
      </div>

      <div className="px-5 app-header-safe pb-8 relative z-10">
        <BackButton to="/barber/home" />

        <header className="mt-6 mb-8">
          <h1 className="text-3xl font-black tracking-tighter">
            <span className="text-[#25D366]">WhatsApp</span> CRM
          </h1>
          <p className="text-white/40 text-sm mt-1">Send promos, reminders & collect reviews</p>
          {sentCount > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] text-sm font-bold">
              ✅ {sentCount} sent this session
            </div>
          )}
        </header>

        {/* Templates */}
        <h2 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3">Message Templates</h2>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {TEMPLATES.map(t => (
            <button key={t.id}
              onClick={() => { setSelectedTemplate(t); setCustomMsg(''); }}
              className={`p-3 rounded-2xl text-left transition-all text-sm font-bold ${
                selectedTemplate.id === t.id
                  ? 'bg-[#25D366]/15 border border-[#25D366]/40 text-[#25D366]'
                  : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* AI Campaign Generator */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#25D366]/15 via-black/40 to-emerald-950/20 border border-[#25D366]/30 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-[#25D366] uppercase tracking-widest flex items-center gap-2">
              <span>✨</span> AI Campaign Co-Pilot
            </h2>
            <span className="text-[10px] bg-[#25D366]/20 text-[#25D366] px-2 py-0.5 rounded-full font-bold uppercase">Smart Copy</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-white/50 uppercase font-bold block mb-1">Occasion / Theme</label>
              <select 
                value={aiOccasion}
                onChange={e => setAiOccasion(e.target.value as any)}
                className="w-full bg-white/10 border border-white/10 rounded-xl px-2 py-2 text-xs text-white outline-none"
              >
                <option value="weekend_rush" className="bg-zinc-900">Weekend Special</option>
                <option value="slow_weekday" className="bg-zinc-900">Slow Hours Deal</option>
                <option value="diwali" className="bg-zinc-900">Diwali Festive</option>
                <option value="eid" className="bg-zinc-900">Eid Mubarak</option>
                <option value="holi" className="bg-zinc-900">Holi Special</option>
                <option value="new_year" className="bg-zinc-900">New Year Promo</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-white/50 uppercase font-bold block mb-1">Discount %</label>
              <input
                type="number"
                value={aiDiscount}
                onChange={e => setAiDiscount(Number(e.target.value))}
                min={5}
                max={50}
                className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          <button
            onClick={() => {
              const camp = generateMarketingCampaign({
                occasion: aiOccasion,
                discountPercent: aiDiscount,
                businessName: businessProfile?.businessName || 'Our Business',
                bookingUrl
              });
              setCustomMsg(camp.whatsappCopy);
              setToastMessage('Generated AI Campaign Message! ✨');
              setTimeout(() => setToastMessage(''), 3000);
            }}
            className="w-full py-2.5 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] text-xs font-black uppercase tracking-wider transition-colors"
          >
            ⚡ Generate High-Converting Copy
          </button>
        </div>

        {/* Preview */}
        <h2 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3">Message Preview</h2>
        <div className="p-4 rounded-2xl bg-[#1a2e1a]/60 border border-[#25D366]/20 mb-6">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#25D366]/10">
            <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-sm font-black text-white">{catInfo.icon}</div>
            <div>
              <div className="text-sm font-bold text-[#25D366]">{businessProfile?.businessName}</div>
              <div className="text-xs text-white/30">via WhatsApp</div>
            </div>
          </div>
          <textarea
            value={customMsg || getProcessedMsg(selectedTemplate.msg)}
            onChange={e => setCustomMsg(e.target.value)}
            className="w-full bg-transparent text-white/80 text-sm leading-relaxed resize-none min-h-[120px] outline-none"
            placeholder="Customize your message..."
          />
        </div>

        {/* Send to single number */}
        <h2 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3">Send to Customer</h2>
        <div className="flex gap-2 mb-6">
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="Phone number (10 digits)"
            className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#25D366]/50 transition-colors"
            type="tel"
            maxLength={10}
          />
          <button
            onClick={handleSendToNumber}
            disabled={phone.replace(/\D/g, '').length < 10}
            className="px-5 py-3 rounded-2xl bg-[#25D366] text-white font-black text-sm disabled:opacity-30 shadow-lg shadow-[#25D366]/20"
          >
            Send →
          </button>
        </div>

        {/* Broadcast */}
        <button
          onClick={handleSendBulk}
          className="w-full p-4 rounded-3xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-black text-base flex items-center justify-center gap-3 shadow-2xl shadow-[#25D366]/20 active:scale-[0.98] transition-transform"
        >
          📢 Broadcast to All Contacts
        </button>
        <p className="text-white/20 text-xs text-center mt-2">Opens WhatsApp web — select contacts to send</p>
      </div>
    {toastMessage && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-zinc-900 border border-[#25D366]/40 text-white px-4 py-2 rounded-xl z-50 text-xs font-bold shadow-2xl flex items-center gap-2">{toastMessage} <button onClick={() => setToastMessage('')} className="ml-2 text-white/50 hover:text-white">&times;</button></div>}
</div>
  );
}
