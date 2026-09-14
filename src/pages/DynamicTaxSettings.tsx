import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, TaxSettings } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

export default function DynamicTaxSettings() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  const [taxes, setTaxes] = useState<TaxSettings[]>([]);
  const [message, setMessage] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Form State
  const [taxName, setTaxName] = useState('GST');
  const [percentage, setPercentage] = useState('18');
  const [taxId, setTaxId] = useState('');
  const [isIncludedInPrice, setIsIncludedInPrice] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (businessProfile?.taxSettings) {
      setTaxes(businessProfile.taxSettings);
    }
  }, [businessProfile]);

  const saveToDb = async (newTaxes: TaxSettings[]) => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { taxSettings: newTaxes });
      setTaxes(newTaxes);
      triggerHaptic('success');
    } catch (e: any) {
      setMessage('Error updating tax settings: ' + e.message);
    }
    setSaving(false);
  };

  const handleSaveTax = async () => {
    if (!taxName.trim() || !percentage) return setMessage('Tax Name and Percentage are required');
    
    const newTax: TaxSettings = {
      isEnabled: true,
      taxName: taxName.trim(),
      percentage: Number(percentage),
      taxId: taxId.trim() || undefined,
      isIncludedInPrice
    };

    let updated = [...taxes];
    if (editingIndex !== null) {
      updated[editingIndex] = { ...updated[editingIndex], ...newTax };
    } else {
      updated.push(newTax);
    }

    await saveToDb(updated);
    resetForm();
  };

  const toggleTax = async (index: number) => {
    const updated = [...taxes];
    updated[index].isEnabled = !updated[index].isEnabled;
    await saveToDb(updated);
  };

  const deleteTax = async (index: number) => {
    if(window.confirm('Delete this tax configuration?')) {
      await saveToDb(taxes.filter((_, i) => i !== index));
    }
  };

  const resetForm = () => {
    setEditingIndex(null);
    setTaxName('GST');
    setPercentage('18');
    setTaxId('');
    setIsIncludedInPrice(false);
  };

  const editTax = (t: TaxSettings, idx: number) => {
    setEditingIndex(idx);
    setTaxName(t.taxName);
    setPercentage(t.percentage.toString());
    setTaxId(t.taxId || '');
    setIsIncludedInPrice(t.isIncludedInPrice);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn">
      <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div>
            <h1 className="font-black text-lg text-primary">Tax Settings 💸</h1>
            <p className="text-xs text-text-dim font-bold uppercase tracking-widest">{taxes.filter(t => t.isEnabled).length} Active Taxes</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Editor Form */}
        <div className="p-5 rounded-3xl elite-glass spatial-card border-white/5 shadow-md">
          <h2 className="font-black text-text mb-4">{editingIndex !== null ? 'Edit Tax Config' : 'Add New Tax'}</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Tax Name</label>
                 <input type="text" value={taxName} onChange={e => setTaxName(e.target.value)} placeholder="e.g. GST" className="w-full mt-1 p-3 rounded-xl bg-background border border-border focus:border-primary/50 outline-none font-bold" />
              </div>
              
              <div>
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Percentage (%)</label>
                 <input type="number" value={percentage} onChange={e => setPercentage(e.target.value)} placeholder="e.g. 18" className="w-full mt-1 p-3 rounded-xl bg-background border border-border focus:border-primary/50 outline-none font-bold text-primary" />
              </div>

              <div className="col-span-2">
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Tax Registration Number (Optional)</label>
                 <input type="text" value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="e.g. GSTIN12345678" className="w-full mt-1 p-3 rounded-xl bg-background border border-border focus:border-primary/50 outline-none uppercase" />
              </div>
              
              <div className="col-span-2 bg-background p-4 rounded-xl border border-border mt-1">
                 <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-2">
                     <span className="text-lg">🏷️</span>
                     <div>
                       <span className="text-sm font-bold text-text block">Tax Applied On</span>
                       <span className="text-xs text-text-dim">Is the tax included in your MRP?</span>
                     </div>
                   </div>
                 </div>
                 <div className="flex gap-2 mt-3">
                   <button 
                     onClick={() => setIsIncludedInPrice(true)}
                     className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${isIncludedInPrice ? 'bg-primary/20 border-primary text-primary' : 'bg-card border-border text-text-dim'}`}
                   >Included (Inclusive)</button>
                   <button 
                     onClick={() => setIsIncludedInPrice(false)}
                     className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${!isIncludedInPrice ? 'bg-primary/20 border-primary text-primary' : 'bg-card border-border text-text-dim'}`}
                   >Added at Checkout</button>
                 </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {editingIndex !== null && <button onClick={resetForm} className="flex-1 py-3 bg-card-2 border border-border rounded-xl font-bold hover:bg-border transition-colors">Cancel</button>}
              <button disabled={saving} onClick={handleSaveTax} className="flex-[2] py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary/90 transition-colors active:scale-95 disabled:opacity-50">
                {saving ? 'Saving...' : editingIndex !== null ? 'Update Tax' : 'Add Tax Region'}
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        <div>
           {taxes.length === 0 ? (
             <div className="text-center py-10 opacity-50">
                <span className="text-4xl block mb-2">🤷</span>
                <p className="text-xs font-bold text-text-dim">No taxes configured. Services are strictly flat priced.</p>
             </div>
           ) : (
             <div className="grid gap-3">
               {taxes.map((t, idx) => (
                 <div key={idx} className={`p-4 rounded-3xl elite-glass spatial-card border flex gap-4 transition-all ${!t.isEnabled ? 'border-white/5 opacity-60 grayscale' : 'border-primary/20 shadow-sm'}`}>
                   
                   <div className="flex-1">
                     <div className="flex flex-col mb-2">
                       <h4 className={`font-black text-lg ${!t.isEnabled ? 'text-text-dim' : 'text-text'}`}>{t.taxName} <span className="text-primary">{t.percentage}%</span></h4>
                       {t.taxId && <p className="text-xs font-bold text-text-dim uppercase tracking-widest mt-0.5">ID: {t.taxId}</p>}
                     </div>
                     
                     <p className="text-xs font-bold text-text-dim px-2 py-1 bg-background rounded-lg inline-block border border-border">
                       {t.isIncludedInPrice ? 'Inclusive (Included in Price)' : 'Exclusive (Added to Bill)'}
                     </p>
                   </div>
                   
                   <div className="flex flex-col gap-2 w-24">
                     <button 
                       onClick={() => toggleTax(idx)}
                       className={`py-1.5 rounded-lg text-xs font-bold border transition-colors ${t.isEnabled ? 'bg-success/10 border-success/30 text-success' : 'bg-card-2 border-border text-text'}`}
                     >
                       {t.isEnabled ? 'Active' : 'Disabled'}
                     </button>
                     <div className="flex gap-2">
                       <button onClick={() => editTax(t, idx)} className="flex-1 py-1.5 rounded-lg bg-card-2 border border-border text-xs font-bold text-text hover:bg-border transition-colors">Edit</button>
                       <button onClick={() => deleteTax(idx)} className="w-8 flex justify-center items-center rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors">🗑️</button>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    {message && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg z-50 text-sm">{message} <button onClick={() => setMessage('')} className="ml-2 text-white/50 hover:text-white">&times;</button></div>}
</div>
  );
}
