import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, ReferralSettings } from '../store/AppContext';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

export default function UniversalReferralEngine() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);

  // Form State
  const [isEnabled, setIsEnabled] = useState(false);
  const [pointsPerReferral, setPointsPerReferral] = useState('50');
  const [refereeDiscount, setRefereeDiscount] = useState('10');

  // Issue points state
  const [targetPhone, setTargetPhone] = useState('');
  const [pointsToIssue, setPointsToIssue] = useState('20');
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    if (businessProfile?.referralSettings) {
      setIsEnabled(businessProfile.referralSettings.isEnabled);
      setPointsPerReferral(businessProfile.referralSettings.pointsPerReferral.toString());
      setRefereeDiscount(businessProfile.referralSettings.refereeDiscount.toString());
    }
  }, [businessProfile]);

  const saveSettings = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const newSettings: ReferralSettings = {
        isEnabled,
        pointsPerReferral: parseInt(pointsPerReferral) || 0,
        refereeDiscount: parseInt(refereeDiscount) || 0,
      };
      await updateDoc(doc(db, 'users', user.uid), { referralSettings: newSettings });
      triggerHaptic('success');
    } catch (e: any) {
      alert('Error updating referral settings: ' + e.message);
    }
    setSaving(false);
  };

  const issuePoints = async () => {
    if (!targetPhone || !pointsToIssue) return alert('Enter phone and points.');
    setIssuing(true);
    try {
      const q = query(collection(db, 'users'), where('phone', '==', targetPhone), where('role', '==', 'customer'));
      const snap = await getDocs(q);
      if (snap.empty) {
        alert('No customer found with that phone number.');
        setIssuing(false);
        return;
      }
      const customerDoc = snap.docs[0];
      const currentPts = customerDoc.data().loyaltyPoints || 0;
      await updateDoc(doc(db, 'users', customerDoc.id), {
        loyaltyPoints: currentPts + parseInt(pointsToIssue)
      });
      triggerHaptic('success');
      setTargetPhone('');
      setPointsToIssue('20');
      alert(`Successfully issued ${pointsToIssue} points!`);
    } catch (e: any) {
      alert('Error issuing points: ' + e.message);
    }
    setIssuing(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-yellow-900/20 via-background to-background">
      <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div>
            <h1 className="font-black text-lg text-primary">Referral Engine 🎁</h1>
            <p className="text-xs text-text-dim font-bold uppercase tracking-widest">Growth & Loyalty</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">

        {/* Global Settings */}
        <div className="p-5 rounded-3xl elite-glass spatial-card relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-8xl pointer-events-none -translate-y-4">⚙️</div>
          <h2 className="font-black text-text mb-4 text-sm relative z-10 flex items-center gap-2">
            Referral Program Settings
            {isEnabled && <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></span>}
          </h2>
          
          <div className="space-y-4 relative z-10">
             
             <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                <div>
                   <p className="font-bold text-sm text-text">Enable Referrals</p>
                   <p className="text-xs font-bold text-text-dim uppercase tracking-widest mt-0.5">Let customers refer friends</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isEnabled} onChange={e => setIsEnabled(e.target.checked)} />
                  <div className="w-11 h-6 bg-card-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
             </div>

             <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className="text-xs uppercase tracking-widest text-text-dim font-bold block mb-1 pl-1">Points per Referral</label>
                 <div className="relative">
                   <input type="number" value={pointsPerReferral} onChange={e => setPointsPerReferral(e.target.value)} disabled={!isEnabled} className="w-full p-3 pl-8 rounded-xl bg-background border border-border outline-none font-black text-primary disabled:opacity-50" />
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 text-xs">✨</span>
                 </div>
               </div>
               <div>
                 <label className="text-xs uppercase tracking-widest text-text-dim font-bold block mb-1 pl-1">Referee Discount (%)</label>
                 <div className="relative">
                   <input type="number" value={refereeDiscount} onChange={e => setRefereeDiscount(e.target.value)} disabled={!isEnabled} className="w-full p-3 pl-8 rounded-xl bg-background border border-border outline-none font-black text-green-500 disabled:opacity-50" />
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 text-xs">%</span>
                 </div>
               </div>
             </div>

             <button disabled={saving} onClick={saveSettings} className="w-full py-3 neu-btn text-text rounded-xl font-black shadow-sm hover:bg-border active:scale-95 transition-all outline-none uppercase tracking-widest text-xs">
                {saving ? 'Saving...' : 'Save Settings'}
             </button>
          </div>
        </div>

        {/* Ad-Hoc Point Issuance */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.05] text-8xl pointer-events-none -translate-y-4 text-yellow-500">✨</div>
          <h2 className="font-black text-amber-500 mb-1 text-sm relative z-10 flex items-center gap-2">Issue Loyalty Points</h2>
          <p className="text-xs text-text-dim font-bold mb-4 relative z-10 leading-relaxed">Reward customers directly to their wallet. Great for compensations or ad-hoc promotions.</p>

          <div className="grid grid-cols-3 gap-3 relative z-10">
             <div className="col-span-2">
               <input type="tel" value={targetPhone} onChange={e => setTargetPhone(e.target.value)} placeholder="Customer Phone" className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs font-bold" />
             </div>
             <div>
               <div className="relative">
                 <input type="number" value={pointsToIssue} onChange={e => setPointsToIssue(e.target.value)} placeholder="Pts" className="w-full p-3 pl-7 rounded-xl bg-background border border-yellow-500/50 outline-none text-xs font-black text-yellow-500" />
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 text-xs shadow-none">✨</span>
               </div>
             </div>
             
             <button disabled={issuing} onClick={issuePoints} className="col-span-3 py-3 bg-yellow-500 text-yellow-950 rounded-xl font-black shadow-[0_4px_15px_rgba(234,179,8,0.3)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest text-xs">
                {issuing ? 'Issuing...' : 'Grant Points'}
             </button>
          </div>
        </div>

        {/* Info Module */}
        <div className="p-5 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center text-center opacity-70">
           <span className="text-3xl mb-2 grayscale">📈</span>
           <h3 className="font-black text-text text-sm mb-1">How it Works</h3>
           <p className="text-xs font-bold text-text-dim max-w-[250px] leading-relaxed">Customers share their unique link. When a new user books with you using their link, both parties receive wallet points automatically.</p>
        </div>

      </div>
    </div>
  );
}
