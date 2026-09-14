import { motion } from 'framer-motion';

interface ShareProfileProps {
  businessId: string;
  businessName: string;
}

export default function ShareProfile({ businessId, businessName }: ShareProfileProps) {
  const bookingUrl = `${window.location.origin}/customer/salon/${businessId}`;
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${businessName} on Line Free`,
          text: `Book your slot at ${businessName} — skip the queue! 🚀`,
          url: bookingUrl,
        });
      } catch {}
    } else {
      navigator.clipboard?.writeText(bookingUrl);
    }
  };

  const handleWhatsApp = () => {
    const msg = `Check out ${businessName} on Line Free! Book instantly & skip the queue 🚀\n\n${bookingUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(bookingUrl);
  };

  return (
    <div className="p-4 rounded-2xl bg-card border border-border">
      <p className="text-xs font-black uppercase tracking-widest text-text-dim mb-3">Share Your Business</p>
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleShare}
          className="flex-1 p-3 rounded-xl bg-primary/20 border border-primary/30 text-primary text-sm font-bold hover-lift"
        >
          📤 Share
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleWhatsApp}
          className="flex-1 p-3 rounded-xl bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] text-sm font-bold hover-lift"
        >
          💬 WhatsApp
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleCopy}
          className="flex-1 p-3 rounded-xl bg-accent/20 border border-accent/30 text-accent text-sm font-bold hover-lift"
        >
          📋 Copy
        </motion.button>
      </div>
    </div>
  );
}
