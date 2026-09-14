import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, DynamicPricingRule, ServiceItem } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

export default function DynamicPricing() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  const [rules, setRules] = useState<DynamicPricingRule[]>([]);
  const [message, setMessage] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ruleName, setRuleName] = useState('');
  const [type, setType] = useState<'surge' | 'discount'>('surge');
  const [percentage, setPercentage] = useState('10');
  const [condition, setCondition] = useState('weekend');
  const [appliesTo, setAppliesTo] = useState<'all' | 'specific_services'>('all');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (businessProfile?.pricingRules) {
      setRules(businessProfile.pricingRules);
    }
  }, [businessProfile]);

  const saveToDb = async (newRecords: DynamicPricingRule[]) => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'barbers', user.uid), { pricingRules: newRecords });
      setRules(newRecords);
      triggerHaptic('success');
    } catch (e: any) {
      setMessage('Error saving pricing rules: ' + e.message);
    }
    setSaving(false);
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleSaveRule = async () => {
    if (!ruleName || !percentage) {
      return setMessage('Rule Name and Percentage are required.');
    }

    if (appliesTo === 'specific_services' && selectedServices.length === 0) {
      return setMessage('Please select at least one service.');
    }

    const newRec: DynamicPricingRule = {
      id: editingId || Date.now().toString(),
      ruleName: ruleName.trim(),
      isActive,
      type,
      percentage: Number(percentage) || 0,
      condition,
      appliesTo,
      specificServices: appliesTo === 'specific_services' ? selectedServices : []
    };

    let updated = [...rules];
    if (editingId) {
      updated = updated.map(r => r.id === editingId ? newRec : r);
    } else {
      updated = [newRec, ...updated];
    }
    
    await saveToDb(updated);
    resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editRule = (r: DynamicPricingRule) => {
    setEditingId(r.id);
    setRuleName(r.ruleName);
    setType(r.type);
    setPercentage(r.percentage.toString());
    setCondition(r.condition);
    setAppliesTo(r.appliesTo);
    setSelectedServices(r.specificServices || []);
    setIsActive(r.isActive);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setRuleName('');
    setType('surge');
    setPercentage('10');
    setCondition('weekend');
    setAppliesTo('all');
    setSelectedServices([]);
    setIsActive(true);
  };

  const deleteRule = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm('Delete this Pricing Rule?')) {
      await saveToDb(rules.filter(r => r.id !== id));
      if (editingId === id) resetForm();
    }
  };

  const toggleRuleActive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    triggerHaptic('light');
    await saveToDb(updated);
  };

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-fuchsia-900/20 via-background to-background">
      <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div>
            <h1 className="font-black text-lg text-fuchsia-400">Dynamic Pricing 💰</h1>
            <p className="text-xs text-fuchsia-200/50 font-bold uppercase tracking-widest">{rules.filter(r => r.isActive).length} Active Rules</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">

        {/* Info Banner */}
        <div className="p-4 rounded-3xl neu-panel border border-fuchsia-500/20 text-xs font-bold text-fuchsia-100/80 leading-relaxed shadow-sm">
          <strong className="text-fuchsia-400">Auto-Scaling Revenue:</strong> Set up surge pricing during festivals, weekends, or peak hours to automatically adjust your catalog prices online.
        </div>

        {/* Editor Form */}
        <div className="p-5 rounded-3xl elite-glass spatial-card border-white/5 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-8xl pointer-events-none -translate-y-4">💸</div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-text text-sm flex items-center gap-2">
                {editingId ? 'Edit Pricing Rule' : 'Create Pricing Rule'}
              </h2>
              {editingId && <button onClick={resetForm} className="text-xs text-text-dim uppercase tracking-widest font-black bg-card-2 px-2 py-1 rounded-md">Cancel Edit</button>}
            </div>

            <div className="space-y-4">
               <div>
                 <input type="text" value={ruleName} onChange={e => setRuleName(e.target.value)} placeholder="Rule Name (e.g. Diwali Surge, Weekend Special)" className="w-full p-3 rounded-xl bg-background border border-border outline-none font-bold text-sm text-fuchsia-100" />
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="text-xs font-black uppercase tracking-widest text-text-dim ml-1 block mb-1">Adjustment Type</label>
                   <select value={type} onChange={e => setType(e.target.value as any)} className={`w-full p-3 rounded-xl bg-background border border-border outline-none text-xs font-black ${type === 'surge' ? 'text-green-400' : 'text-danger'}`}>
                     <option value="surge">Surge (+)</option>
                     <option value="discount">Discount (-)</option>
                   </select>
                 </div>
                 
                 <div>
                   <label className="text-xs font-black uppercase tracking-widest text-text-dim ml-1 block mb-1">Percentage (%)</label>
                   <div className="relative">
                     <input type="number" value={percentage} onChange={e => setPercentage(e.target.value)} className="w-full p-3 pl-8 rounded-xl bg-background border border-border outline-none text-xs text-fuchsia-100 font-bold" />
                     <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-black ${type === 'surge' ? 'text-green-500' : 'text-danger'}`}>{type === 'surge' ? '+' : '-'}</span>
                   </div>
                 </div>
               </div>

               <div>
                 <label className="text-xs font-black uppercase tracking-widest text-text-dim ml-1 block mb-1">When does it apply?</label>
                 <select value={condition} onChange={e => setCondition(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-fuchsia-200 font-bold">
                   <option value="always">Always (Until disabled)</option>
                   <option value="weekend">Weekends (Sat-Sun)</option>
                   <option value="festival">Festival Days (Auto-calendar)</option>
                   <option value="rush_hour">Rush Hours (5 PM - 9 PM)</option>
                 </select>
               </div>

               <div>
                 <label className="text-xs font-black uppercase tracking-widest text-text-dim ml-1 block mb-1">Target Services</label>
                 <div className="flex gap-2">
                   <button onClick={() => setAppliesTo('all')} className={`flex-1 p-2 rounded-xl text-xs font-black transition-all ${appliesTo === 'all' ? 'bg-fuchsia-600 text-white' : 'bg-background border border-border text-text-dim'}`}>All Services</button>
                   <button onClick={() => setAppliesTo('specific_services')} className={`flex-1 p-2 rounded-xl text-xs font-black transition-all ${appliesTo === 'specific_services' ? 'bg-fuchsia-600 text-white' : 'bg-background border border-border text-text-dim'}`}>Specific Services</button>
                 </div>
               </div>

               {appliesTo === 'specific_services' && (
                 <div className="p-3 bg-background rounded-2xl border border-border max-h-48 overflow-y-auto space-y-2">
                   {(businessProfile?.services || []).length === 0 ? (
                     <p className="text-xs text-text-dim text-center py-2">No services found in your catalog.</p>
                   ) : (
                     <div className="grid grid-cols-1 gap-2">
                       {(businessProfile?.services || []).map(s => (
                         <div key={s.id} onClick={() => toggleService(s.id)} className={`p-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors flex justify-between items-center ${selectedServices.includes(s.id) ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-200' : 'bg-card border-border text-text-dim'}`}>
                           <span>{s.name}</span>
                           <span>₹{s.price}</span>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               )}

               <div className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border">
                 <div className="flex-1">
                   <h3 className="font-bold text-xs text-text">Rule Status</h3>
                   <p className="text-xs text-text-dim">Activate this rule immediately upon saving</p>
                 </div>
                 <button onClick={() => setIsActive(!isActive)} className={`w-12 h-6 rounded-full p-1 transition-colors ${isActive ? 'bg-green-500' : 'bg-card-2 border border-border'}`}>
                   <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                 </button>
               </div>

               <div className="pt-2 border-t border-border mt-1">
                <button disabled={saving} onClick={handleSaveRule} className="w-full py-3 bg-fuchsia-600 text-white rounded-xl font-black shadow-[0_4px_15px_rgba(192,38,211,0.3)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest text-xs">
                  {saving ? 'Saving...' : editingId ? 'Update Rule' : 'Create Pricing Rule'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Directory View */}
        <div>
           <h3 className="font-black text-sm text-text mb-3 ml-1">Configured Rules</h3>

           {rules.length === 0 ? (
             <div className="text-center py-6 border border-dashed border-white/10 rounded-3xl opacity-50 elite-glass">
               <span className="text-3xl block mb-2">📉</span>
               <p className="text-xs font-bold text-text-dim">No pricing rules configured.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 gap-3">
               {rules.map(r => (
                 <div key={r.id} onClick={() => editRule(r)} className={`p-4 rounded-3xl elite-glass spatial-card border flex flex-col gap-3 relative shadow-sm cursor-pointer transition-colors group ${r.isActive ? 'border-fuchsia-500/30 hover:border-fuchsia-500/60' : 'border-white/5 opacity-70'}`}>
                   
                   <div className="flex justify-between items-start">
                     <div>
                       <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${r.isActive ? 'bg-green-500 animate-pulse' : 'bg-text-dim'}`}></div>
                         <h4 className="font-black text-text text-sm leading-tight text-fuchsia-100">
                           {r.ruleName}
                         </h4>
                       </div>
                       <p className="text-xs font-black uppercase tracking-widest mt-1 text-fuchsia-100/50">
                         {r.condition.replace('_', ' ')} • {r.appliesTo === 'all' ? 'All Services' : `${r.specificServices?.length || 0} Services`}
                       </p>
                     </div>

                     <div className="text-right absolute top-4 right-4 group-hover:opacity-0 transition-opacity">
                       <span className={`text-xl font-black ${r.type === 'surge' ? 'text-green-400' : 'text-danger'}`}>
                         {r.type === 'surge' ? '+' : '-'}{r.percentage}%
                       </span>
                     </div>

                     <button onClick={(e) => deleteRule(r.id, e)} className="absolute top-4 right-4 opacity-0 transition-all text-danger text-xs flex justify-center items-center hover:bg-danger/20 group-hover:opacity-100 w-8 h-8 rounded-full bg-danger/10 z-10">
                       ✕
                     </button>
                   </div>
                   
                   <div className="flex justify-between items-center mt-1 border-t border-border pt-3">
                     <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded ${r.isActive ? 'bg-green-500/10 text-green-500' : 'bg-background text-text-dim'}`}>
                       {r.isActive ? 'Active' : 'Paused'}
                     </span>
                     
                     <button onClick={(e) => toggleRuleActive(r.id, e)} className="px-4 py-1.5 rounded-xl bg-card-2 border border-border text-xs font-black uppercase tracking-widest hover:bg-border transition-colors">
                       {r.isActive ? 'Pause Rule' : 'Activate'}
                     </button>
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
