import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useApp, BusinessProfile, getCategoryInfo } from '../store/AppContext';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaDownload, FaShareAlt, FaCheckCircle, FaRocket, FaPrint, FaQrcode } from 'react-icons/fa';

interface Props { id?: string; }

type PosterTheme = 'modern' | 'glass' | 'midnight' | 'minimal';

export default function SalonQRPage({ id: propId }: Props) {
  const params = useParams<{ id: string }>();
  const { user, allBusinesses, getBusinessById, businessProfile, t } = useApp();
  const nav = useNavigate();
  const [salon, setSalon] = useState<BusinessProfile | null>(null);
  const [activeTheme, setActiveTheme] = useState<PosterTheme>('modern');
  const posterRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const salonId = propId === 'own'
    ? user?.uid
    : (params.id || propId || '');

  useEffect(() => {
    if (!salonId) return;
    if (propId === 'own' && businessProfile) { setSalon(businessProfile); return; }
    const found = allBusinesses.find(s => s.uid === salonId);
    if (found) { setSalon(found); return; }
    getBusinessById(salonId).then(s => { if (s) setSalon(s); });
  }, [salonId, allBusinesses, businessProfile, propId]);

  const bookingUrl = `${window.location.origin}/qr/${salonId}?qr=true`;
  const termInfo = getCategoryInfo(salon?.businessType || 'men_salon');

  const handleDownload = async () => {
    if (!posterRef.current || !salon) {
      alert('Poster not ready');
      return;
    }
    setIsDownloading(true);
    
    try {
      // Create canvas manually
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');
      
      // Set canvas size
      const canvasWidth = 680;
      const canvasHeight = 1100;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Get theme colors
      const bgGradient = activeTheme === 'modern' 
        ? ctx.createLinearGradient(0, 0, 0, 1100)
        : activeTheme === 'glass'
        ? ctx.createLinearGradient(0, 0, 0, 1100)
        : null;
      
      if (activeTheme === 'modern' && bgGradient) {
        bgGradient.addColorStop(0, '#4f46e5');
        bgGradient.addColorStop(0.5, '#7c3aed');
        bgGradient.addColorStop(1, '#581c87');
        ctx.fillStyle = bgGradient;
      } else if (activeTheme === 'glass' && bgGradient) {
        bgGradient.addColorStop(0, '#22d3ee');
        bgGradient.addColorStop(1, '#3b82f6');
        ctx.fillStyle = bgGradient;
      } else if (activeTheme === 'midnight') {
        ctx.fillStyle = '#0A0A0A';
      } else {
        ctx.fillStyle = '#ffffff';
      }
      
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // Draw text
      ctx.fillStyle = activeTheme === 'minimal' ? '#000000' : '#ffffff';
      ctx.font = 'bold 80px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SKIP THE', canvasWidth / 2, 200);
      ctx.globalAlpha = 0.5;
      ctx.fillText('QUEUE', canvasWidth / 2, 280);
      ctx.globalAlpha = 1;
      
      ctx.font = 'bold 16px Arial';
      ctx.fillText('BOOK ONLINE INSTANTLY', canvasWidth / 2, 330);
      
      // Get QR code canvas
      const qrCanvas = document.querySelector('#salon-qr-canvas') as HTMLCanvasElement;
      if (qrCanvas) {
        // Draw white background for QR
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(240, 450, 200, 200);
        // Draw QR code
        ctx.drawImage(qrCanvas, 240, 450, 200, 200);
      }
      
      // Draw business name
      ctx.fillStyle = activeTheme === 'minimal' ? '#000000' : '#ffffff';
      ctx.font = 'bold 32px Arial';
      ctx.fillText(salon.businessName, canvasWidth / 2, 720);

      // Action Message
      ctx.font = 'bold 36px Inter, sans-serif';
      ctx.fillStyle = activeTheme === 'minimal' ? '#0f172a' : '#ffffff';
      ctx.fillText('SCAN TO JOIN LIVE QUEUE', canvasWidth / 2, 780);

      ctx.font = '400 22px Inter, sans-serif';
      ctx.fillStyle = activeTheme === 'minimal' ? '#64748b' : '#94a3b8';
      ctx.fillText('Save your precious time — check wait time & token status', canvasWidth / 2, 830);

      // Brand Footer
      ctx.font = '900 28px Inter, sans-serif';
      ctx.fillStyle = '#6366f1';
      ctx.fillText('LINE FREE INDIA', canvasWidth / 2, 1000);

      ctx.font = '500 18px Inter, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('India’s Smart Queue OS • linefreeindia.com', canvasWidth / 2, 1035);

      // Convert to PNG and download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${salon.businessName}-Poster.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setDownloadStatus({ type: 'success', message: 'Poster downloaded successfully!' });
      setTimeout(() => setDownloadStatus(null), 3000);
    } catch (err: any) {
      console.error('Download failed:', err);
      setDownloadStatus({ type: 'error', message: `Download failed: ${err?.message || 'Unknown error'}` });
      setTimeout(() => setDownloadStatus(null), 4000);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadQR = () => {
    const qrCanvas = document.querySelector('#salon-qr-canvas') as HTMLCanvasElement;
    if (!qrCanvas || !salon) {
      setDownloadStatus({ type: 'error', message: 'QR Code is still rendering, please wait a moment.' });
      setTimeout(() => setDownloadStatus(null), 3000);
      return;
    }
    try {
      const badgeCanvas = document.createElement('canvas');
      badgeCanvas.width = 600;
      badgeCanvas.height = 600;
      const bCtx = badgeCanvas.getContext('2d');
      if (!bCtx) return;
      bCtx.fillStyle = '#ffffff';
      bCtx.fillRect(0, 0, 600, 600);
      bCtx.drawImage(qrCanvas, 75, 75, 450, 450);
      bCtx.fillStyle = '#0f172a';
      bCtx.font = 'bold 24px Inter, sans-serif';
      bCtx.textAlign = 'center';
      bCtx.fillText(salon.businessName, 300, 50);
      bCtx.font = '700 18px Inter, sans-serif';
      bCtx.fillStyle = '#6366f1';
      bCtx.fillText('SCAN TO JOIN QUEUE • LINE FREE INDIA', 300, 565);

      const dataUrl = badgeCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${salon.businessName}-QR.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadStatus({ type: 'success', message: 'High-Res QR Code downloaded!' });
      setTimeout(() => setDownloadStatus(null), 3000);
    } catch (e: any) {
      setDownloadStatus({ type: 'error', message: 'QR Code download failed.' });
      setTimeout(() => setDownloadStatus(null), 3000);
    }
  };

  const handleShare = async () => {
    if (!salon) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${salon.businessName} - Line Free India`,
          text: `Join the live queue for ${salon.businessName} online without standing in line:`,
          url: bookingUrl,
        });
        setDownloadStatus({ type: 'success', message: 'Link shared!' });
        setTimeout(() => setDownloadStatus(null), 2500);
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setDownloadStatus({ type: 'success', message: 'Booking link copied to clipboard! 📋' });
      setTimeout(() => setDownloadStatus(null), 3000);
    } catch {
      setDownloadStatus({ type: 'error', message: 'Could not copy link to clipboard.' });
      setTimeout(() => setDownloadStatus(null), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const themes: { id: PosterTheme; label: string; icon: string; colors: string }[] = [
    { id: 'modern', label: 'Indigo Fusion', icon: '🎨', colors: 'from-indigo-600 to-violet-600' },
    { id: 'glass', label: 'Crystal Glass', icon: '💎', colors: 'from-blue-400 to-emerald-400' },
    { id: 'midnight', label: 'Onyx Dark', icon: '🌑', colors: 'from-gray-900 to-black' },
    { id: 'minimal', label: 'Pure White', icon: '⚪', colors: 'from-gray-100 to-white' }
  ];

  if (!salon) return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen pb-40 bg-bg overflow-x-hidden relative">
      {downloadStatus && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-all ${
          downloadStatus.type === 'success' ? 'bg-success text-white' : 'bg-danger text-white'
        }`}>
          {downloadStatus.message}
        </div>
      )}
      {/* Header HUD */}
      <div className="p-6 sticky top-0 z-[100] bg-bg/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button onClick={() => nav(-1)} className="w-10 h-10 elite-glass rounded-xl border-white/10 flex items-center justify-center text-text shadow-sm spatial-card">
            <FaArrowLeft />
          </button>
          <div className="text-center">
            <h1 className="text-sm font-black uppercase tracking-[3px]">Poster Builder</h1>
            <p className="text-xs font-bold text-text-dim uppercase tracking-widest mt-0.5">Marketing Command</p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6">
        {/* Style Selector */}
        <div className="mb-8 overflow-x-auto no-scrollbar py-2 flex gap-3">
          {themes.map(th => (
            <button
              key={th.id}
              onClick={() => setActiveTheme(th.id)}
              className={`flex-shrink-0 px-6 py-4 rounded-[2rem] border transition-all flex flex-col items-center gap-2 group ${activeTheme === th.id ? 'bg-primary/20 border-primary ring-4 ring-primary/10 scale-105 shadow-2xl' : 'bg-card/40 border-white/5 opacity-50 hover:opacity-80'}`}
            >
              <span className={`text-2xl transition-transform group-hover:scale-125 ${activeTheme === th.id ? 'animate-bounce' : ''}`}>{th.icon}</span>
              <span className="text-xs font-black uppercase tracking-[2px] text-text whitespace-nowrap">{th.label}</span>
            </button>
          ))}
        </div>

        {/* Poster Preview Area */}
        <div className="flex justify-center mb-10 perspective-1000">
          <motion.div 
            ref={posterRef}
            initial={{ rotateY: 15, rotateX: 5 }}
            animate={{ rotateY: 0, rotateX: 0 }}
            style={{
              background: activeTheme === 'modern' ? 'linear-gradient(to bottom right, #4f46e5, #7c3aed, #581c87)' :
                         activeTheme === 'glass' ? 'linear-gradient(to bottom right, #22d3ee, #3b82f6)' :
                         activeTheme === 'midnight' ? '#0A0A0A' :
                         '#ffffff'
            }}
            className={`relative w-[340px] h-[550px] rounded-[3rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] flex flex-col items-center p-8 ${
              activeTheme === 'modern' ? 'border border-white/10' :
              activeTheme === 'glass' ? 'border border-white/20' :
              activeTheme === 'midnight' ? 'border border-white/5' :
              'border border-gray-200'
            }`}
          >
            {/* Background elements */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-[100px] rounded-full" />
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full" />
            </div>

            {/* Content Top */}
            <div className="relative z-10 w-full text-center mt-4">
              <div className={`mx-auto w-max px-4 py-1.5 rounded-full border mb-6 flex items-center gap-2 ${activeTheme === 'minimal' ? 'bg-black text-white border-transparent' : 'bg-white/10 border-white/20 text-white'}`}>
                <FaRocket className="text-xs" />
                <span className="text-xs font-black uppercase tracking-[3px]">Official Digital Service</span>
              </div>
              
              <h2 className={`text-4xl font-black tracking-tighter leading-[0.9] ${activeTheme === 'minimal' ? 'text-black' : 'text-white'}`}>
                SKIP THE <br/> <span className="opacity-50">QUEUE</span>
              </h2>
              <p className={`text-xs font-bold uppercase tracking-[4px] mt-4 ${activeTheme === 'minimal' ? 'text-gray-400' : 'text-white/60'}`}>
                Book Online Instantly
              </p>
            </div>

            {/* QR Center */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full">
              <div className={`p-6 rounded-[2.5rem] shadow-2xl relative ${activeTheme === 'minimal' ? 'bg-gray-50' : 'bg-white'}`}>
                 <div className="absolute -inset-4 bg-primary/10 blur-xl opacity-0 hover:opacity-100 transition-opacity" />
                 <QRCodeCanvas
                    id="salon-qr-canvas"
                    value={bookingUrl}
                    size={160}
                    bgColor="transparent"
                    fgColor={activeTheme === 'minimal' ? '#000000' : '#1e1b4b'}
                    level="H"
                    includeMargin={false}
                 />
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center border border-gray-100">
                       <span className="text-xl">{termInfo.icon}</span>
                    </div>
                 </div>
              </div>
              <p className={`mt-6 text-xs font-black uppercase tracking-[3px] ${activeTheme === 'minimal' ? 'text-black/30' : 'text-white/30'}`}>
                Scan with camera
              </p>
            </div>

            {/* Business Footer */}
            <div className={`relative z-10 w-full p-6 rounded-[2.5rem] mt-auto flex flex-col items-center text-center ${activeTheme === 'minimal' ? 'bg-gray-100' : 'bg-white/10 backdrop-blur-md border border-white/10'}`}>
                <h3 className={`text-lg font-black uppercase tracking-tight ${activeTheme === 'minimal' ? 'text-black' : 'text-white'}`}>
                  {salon.businessName}
                </h3>
                {salon.location && (
                  <p className={`text-xs font-bold mt-1 opacity-60 flex items-center gap-1 ${activeTheme === 'minimal' ? 'text-gray-600' : 'text-white'}`}>
                    📍 {salon.location.split(',')[0]}
                  </p>
                )}
                
                <div className="mt-4 flex gap-4">
                  <div className="flex flex-col items-center">
                    <FaCheckCircle className="text-primary text-xs mb-1" />
                    <span className={`text-[7px] font-black uppercase tracking-widest ${activeTheme === 'minimal' ? 'text-black/40' : 'text-white/40'}`}>Real-time</span>
                  </div>
                  <div className="flex flex-col items-center border-x border-white/5 px-4">
                    <FaCheckCircle className="text-primary text-xs mb-1" />
                    <span className={`text-[7px] font-black uppercase tracking-widest ${activeTheme === 'minimal' ? 'text-black/40' : 'text-white/40'}`}>Verified</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <FaCheckCircle className="text-primary text-xs mb-1" />
                    <span className={`text-[7px] font-black uppercase tracking-widest ${activeTheme === 'minimal' ? 'text-black/40' : 'text-white/40'}`}>Fast Track</span>
                  </div>
                </div>
            </div>

            {/* Line Free Branding */}
            <div className="absolute bottom-4 inset-x-0 text-center">
              <p className={`text-xs font-black uppercase tracking-[5px] opacity-20 ${activeTheme === 'minimal' ? 'text-black' : 'text-white'}`}>
                Powered by Line Free India
              </p>
            </div>
          </motion.div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn-glow w-full h-15 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[3px] shadow-2xl disabled:opacity-50 cursor-pointer rounded-2xl active:scale-[0.98] transition-all"
          >
            {isDownloading ? (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating High-Res Poster...
              </div>
            ) : <><FaDownload /> Download Marketing Poster (PNG)</>}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleDownloadQR}
              className="py-3.5 px-4 bg-card border border-border hover:border-primary/40 text-text rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <FaQrcode className="text-primary text-sm" />
              <span>Download QR Only</span>
            </button>

            <button 
              onClick={handlePrint}
              className="py-3.5 px-4 bg-card border border-border hover:border-primary/40 text-text rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <FaPrint className="text-primary text-sm" />
              <span>Print Poster</span>
            </button>
          </div>
          
          <button 
            onClick={handleShare}
            className="w-full py-3.5 bg-white/[0.04] backdrop-blur-md border border-white/10 text-text rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-all active:scale-[0.98] px-6 cursor-pointer"
          >
             <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[3px]">
               <FaShareAlt className="text-primary" /> Share Booking Link
             </div>
             <span className="text-[11px] opacity-50 font-mono truncate w-full text-center">{bookingUrl}</span>
          </button>
        </div>

        {/* Tips Section */}
        <div className="mt-10 bg-primary/5 rounded-[2.5rem] p-8 border border-primary/10">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl">
                 💡
              </div>
              <div>
                 <p className="text-xs font-black text-primary uppercase tracking-[3px]">Growth hack</p>
                 <p className="text-sm font-black text-text">Pro Installation Guide</p>
              </div>
           </div>
           
           <div className="space-y-4">
              {[
                { step: '01', text: 'Print in HIGH-GLOSS on A4 or A5 paper' },
                { step: '02', text: 'Place at Eye-Level near the entrance' },
                { step: '03', text: 'Add a small "Scan to Book" sticker on mirrors' },
                { step: '04', text: 'Share your booking link on Instagram Bio' }
              ].map((tip, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <span className="text-primary/40 font-black text-xs">{tip.step}</span>
                  <p className="text-xs font-bold text-text-dim">{tip.text}</p>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
