import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, BridalPackage } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

export default function BridalPackageBuilder() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  const [packages, setPackages] = useState<BridalPackage[]>([]);
  const [saving, setSaving] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [brideStyle, setBrideStyle] = useState('Traditional Indian');
  const [brideHands, setBrideHands] = useState<number>(2); // 2 or 4 (hands + feet)
  const [bridePrice, setBridePrice] = useState<number>(5100);
  const [guestCount, setGuestCount] = useState<number>(0);
  const [guestPricePerPerson, setGuestPricePerPerson] = useState<number>(150);
  const [travelFee, setTravelFee] = useState<number>(0);
  const [status, setStatus] = useState<'Draft' | 'Sent' | 'Booked'>('Draft');

  const totalQuote = bridePrice + (guestCount * guestPricePerPerson) + travelFee;

  useEffect(() => {
    if (businessProfile?.bridalPackages) {
      setPackages(businessProfile.bridalPackages);
    }
  }, [businessProfile]);

  const saveToDb = async (newPkgs: BridalPackage[]) => {
    if (!user) return;
    setSaving(true);
    try {
      const sorted = [...newPkgs].sort((a,b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
      await updateDoc(doc(db, 'users', user.uid), { bridalPackages: sorted });
      setPackages(sorted);
      triggerHaptic('success');
    } catch (e: any) {
      alert('Error saving package: ' + e.message);
    }
    setSaving(false);
  };

  const handleSavePackage = async () => {
    if (!clientName || !eventDate) return alert('Client Name and Event Date required');
    
    const newPkg: BridalPackage = {
      id: editingId || Date.now().toString(),
      clientName: clientName.trim(),
      eventDate,
      brideStyle,
      brideHands,
      bridePrice,
      guestCount,
      guestPricePerPerson,
      travelFee,
      totalQuote,
      status
    };

    let updated = [...packages];
    if (editingId) {
      updated = updated.map(p => p.id === editingId ? newPkg : p);
    } else {
      updated.push(newPkg);
    }

    await saveToDb(updated);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setClientName('');
    setEventDate('');
    setBrideStyle('Traditional Indian');
    setBrideHands(2);
    setBridePrice(5100);
    setGuestCount(0);
    setGuestPricePerPerson(150);
    setTravelFee(0);
    setStatus('Draft');
  };

  const editPkg = (p: BridalPackage) => {
    setEditingId(p.id);
    setClientName(p.clientName);
    setEventDate(p.eventDate);
    setBrideStyle(p.brideStyle);
    setBrideHands(p.brideHands);
    setBridePrice(p.bridePrice);
    setGuestCount(p.guestCount);
    setGuestPricePerPerson(p.guestPricePerPerson);
    setTravelFee(p.travelFee);
    setStatus(p.status);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deletePkg = async (id: string) => {
    if(confirm('Delete this quote?')) {
      await saveToDb(packages.filter(p => p.id !== id));
    }
  };

  const openWhatsApp = (p: BridalPackage) => {
    const text = `Hi ${p.clientName},\n\nHere is your custom Mehendi quote for ${new Date(p.eventDate).toLocaleDateString('en-GB')}:\n\n- Bridal Mehendi (${p.brideStyle}, ${p.brideHands === 2 ? 'Hands only' : 'Hands & Feet'}): ₹${p.bridePrice}\n- Guests (${p.guestCount} persons @ ₹${p.guestPricePerPerson}): ₹${p.guestCount * p.guestPricePerPerson}\n- Travel/Venue Fee: ₹${p.travelFee}\n\n*Total Quote: ₹${p.totalQuote}*\n\nPlease let me know if you'd like to confirm the booking!`;
    window.location.href = `whatsapp://send?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-rose-900/10 via-background to-background">
      <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div>
            <h1 className="font-black text-lg text-primary">Quote Builder 🌿</h1>
            <p className="text-xs text-text-dim font-bold uppercase tracking-widest">{packages.length} Quotes Created</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">

        {/* Builder Form */}
        <div className="p-5 rounded-3xl elite-glass spatial-card border-rose-500/20 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-8xl pointer-events-none -translate-y-4 translate-x-4 mix-blend-overlay">࿎</div>
          
          <h2 className="font-black text-text mb-4 relative z-10 text-rose-500">{editingId ? 'Update Wedding Quote' : 'Create Custom Quote'}</h2>
          
          <div className="space-y-4 relative z-10">
             <div className="grid grid-cols-2 gap-3">
               <div className="col-span-2">
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Client Name / Event Name</label>
                 <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Pooja's Wedding" className="w-full mt-1 p-3 rounded-xl bg-background border border-border outline-none font-bold text-sm" />
               </div>

               <div className="col-span-2">
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Event Date</label>
                 <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full mt-1 p-3 rounded-xl bg-background border border-border outline-none text-sm font-bold text-rose-500" style={{colorScheme: 'dark'}} />
               </div>
               
               <div className="col-span-2 pt-2 border-t border-border mt-1">
                 <p className="text-xs font-black uppercase tracking-widest text-text-dim mb-2">Bridal Requirements</p>
               </div>

               <div className="col-span-2 flex gap-2">
                 <button onClick={() => setBrideHands(2)} className={`flex-1 py-2 text-xs font-bold rounded-xl border ${brideHands === 2 ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-background text-text-dim border-border'}`}>2 Hands</button>
                 <button onClick={() => setBrideHands(4)} className={`flex-1 py-2 text-xs font-bold rounded-xl border ${brideHands === 4 ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-background text-text-dim border-border'}`}>Hands & Feet</button>
               </div>

               <div>
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Mehendi Style</label>
                 <select value={brideStyle} onChange={e => setBrideStyle(e.target.value)} className="w-full mt-1 p-3 rounded-xl bg-background border border-border outline-none text-sm">
                   <option>Traditional Indian</option>
                   <option>Arabic</option>
                   <option>Indo-Arabic</option>
                   <option>Minimalist / Modern</option>
                   <option>Portrait / Figure</option>
                 </select>
               </div>

               <div>
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Bridal Price (₹)</label>
                 <input type="number" value={bridePrice} onChange={e => setBridePrice(parseInt(e.target.value)||0)} className="w-full mt-1 p-3 rounded-xl bg-background border border-border outline-none text-sm font-black" />
               </div>

               <div className="col-span-2 pt-2 border-t border-border mt-1">
                 <p className="text-xs font-black uppercase tracking-widest text-text-dim mb-2">Guest / Sider Requirements</p>
               </div>

               <div>
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">No. of Guests</label>
                 <input type="number" value={guestCount} onChange={e => setGuestCount(parseInt(e.target.value)||0)} className="w-full mt-1 p-3 rounded-xl bg-background border border-border outline-none text-sm" />
               </div>
               <div>
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Price Per Guest (₹)</label>
                 <input type="number" value={guestPricePerPerson} onChange={e => setGuestPricePerPerson(parseInt(e.target.value)||0)} className="w-full mt-1 p-3 rounded-xl bg-background border border-border outline-none text-sm" />
               </div>

               <div className="col-span-2 pt-2 border-t border-border mt-1"></div>

               <div>
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Travel / Venue Fee (₹)</label>
                 <input type="number" value={travelFee} onChange={e => setTravelFee(parseInt(e.target.value)||0)} className="w-full mt-1 p-3 rounded-xl bg-background border border-border outline-none text-sm" />
               </div>
               <div>
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Quote Status</label>
                 <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full mt-1 p-3 rounded-xl bg-background border border-border outline-none text-sm font-bold text-rose-500">
                   <option>Draft</option>
                   <option>Sent</option>
                   <option>Booked</option>
                 </select>
               </div>
             </div>

             {/* Live Quote Summary */}
             <div className="mt-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex justify-between items-center">
               <div>
                 <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">Total Grand Quote</p>
                 <p className="text-2xl font-black text-text mt-1">₹{totalQuote.toLocaleString('en-IN')}</p>
               </div>
               <div className="text-right text-xs text-text-dim space-y-1">
                 <p>Bride: ₹{bridePrice}</p>
                 <p>Guests: ₹{guestCount * guestPricePerPerson}</p>
                 <p>Travel: ₹{travelFee}</p>
               </div>
             </div>

             <div className="flex gap-2 pt-2">
              {editingId && <button onClick={resetForm} className="flex-1 py-3 bg-card-2 border border-border rounded-xl font-bold hover:bg-border transition-colors">Cancel</button>}
              <button disabled={saving} onClick={handleSavePackage} className="flex-[2] py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-black shadow-[0_4px_20px_rgba(225,29,72,0.3)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">
                {saving ? 'Saving...' : editingId ? 'Update & Save' : 'Generate Quote'}
              </button>
            </div>
          </div>
        </div>

        {/* Quotes Directory */}
        <div>
           <div className="flex justify-between items-center mb-4 pl-2">
             <h3 className="font-black text-text-dim uppercase tracking-widest border-l-2 border-rose-500 text-xs pl-2">Quotes & Bookings</h3>
           </div>

           {packages.length === 0 ? (
             <div className="text-center py-6 border border-dashed border-white/10 rounded-3xl opacity-50 elite-glass">
               <span className="text-3xl block mb-2">📝</span>
               <p className="text-xs font-bold text-text-dim">No quotes generated yet.</p>
             </div>
           ) : (
             <div className="grid gap-4">
               {packages.map(p => {
                 let statusColor = 'bg-card-2 text-text-dim border-border';
                 if (p.status === 'Sent') statusColor = 'bg-blue-500/10 text-blue-500 border-blue-500/20';
                 if (p.status === 'Booked') statusColor = 'bg-success/10 text-success border-success/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]';

                 return (
                   <div key={p.id} className="p-4 rounded-3xl elite-glass spatial-card border-white/5 flex flex-col gap-3 transition-colors relative">
                     {p.status === 'Booked' && (
                       <div className="absolute top-0 left-0 w-2 h-full bg-success rounded-l-3xl"></div>
                     )}
                     <div className="flex justify-between items-start pl-1">
                       <div>
                         <span className="text-xs font-black uppercase tracking-widest text-text-dim">{new Date(p.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                         <h4 className="font-black text-text text-lg leading-tight mt-1">{p.clientName}</h4>
                       </div>
                       <div className="flex gap-1 flex-col items-end">
                         <div className={`px-2 py-1 rounded-md text-xs font-black uppercase tracking-widest border ${statusColor}`}>
                           {p.status}
                         </div>
                       </div>
                     </div>

                     {/* Details Card */}
                     <div className="bg-background rounded-xl p-3 border border-border text-xs flex flex-col gap-2 mt-1">
                       <div className="flex justify-between items-center">
                         <span className="text-text-dim">Bride ({p.brideStyle}, {p.brideHands === 2 ? 'Hands' : 'Full'})</span>
                         <span className="font-bold">₹{p.bridePrice}</span>
                       </div>
                       {p.guestCount > 0 && (
                         <div className="flex justify-between items-center">
                           <span className="text-text-dim">Guests ({p.guestCount} @ ₹{p.guestPricePerPerson})</span>
                           <span className="font-bold">₹{p.guestCount * p.guestPricePerPerson}</span>
                         </div>
                       )}
                       {p.travelFee > 0 && (
                         <div className="flex justify-between items-center">
                           <span className="text-text-dim">Travel/Misc</span>
                           <span className="font-bold">₹{p.travelFee}</span>
                         </div>
                       )}
                       <div className="border-t border-border pt-2 mt-1 flex justify-between items-center">
                         <span className="text-xs font-black text-primary uppercase tracking-widest">Total Value</span>
                         <span className="text-base font-black text-rose-500">₹{p.totalQuote.toLocaleString('en-IN')}</span>
                       </div>
                     </div>
                     
                     <div className="flex gap-2 mt-1 relative z-10">
                       <button onClick={() => editPkg(p)} className="flex-1 py-2 rounded-xl bg-card-2 border border-border text-xs font-bold hover:bg-border transition-colors">Edit</button>
                       <button onClick={() => openWhatsApp(p)} className="flex-[2] py-2 rounded-xl bg-green-600/10 text-green-500 border border-green-600/20 text-xs font-bold shadow-sm hover:bg-green-600/20 transition-all flex justify-center items-center gap-2">
                         Share via WhatsApp
                       </button>
                       <button onClick={() => deletePkg(p.id)} className="w-[40px] flex justify-center items-center rounded-xl bg-danger/10 text-danger hover:bg-danger/20 transition-colors">✕</button>
                     </div>
                   </div>
                 );
               })}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
