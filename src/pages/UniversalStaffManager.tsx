import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, StaffMember } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

export default function UniversalStaffManager() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Editor Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [target, setTarget] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    if (businessProfile?.staffMembers) {
      setStaff(businessProfile.staffMembers);
    }
  }, [businessProfile]);

  const saveToDb = async (updatedStaff: StaffMember[]) => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'barbers', user.uid), { staffMembers: updatedStaff });
      setStaff(updatedStaff);
      triggerHaptic('success');
    } catch (e: any) {
      alert('Error updating staff configuration: ' + e.message);
    }
    setSaving(false);
  };

  const parseTarget = (t: string) => {
    const num = parseInt(t);
    return isNaN(num) ? undefined : num;
  };

  const handleSaveStaff = async () => {
    if (!name.trim()) return alert('Name is required');

    const newStaff: StaffMember = {
      id: editingId || Date.now().toString() + Math.random().toString(36).substring(7),
      name: name.trim(),
      role: role.trim() || undefined,
      isAvailable,
      targetEarnings: parseTarget(target),
      earningsToday: editingId ? staff.find(s => s.id === editingId)?.earningsToday : 0,
      serviceIds: editingId ? staff.find(s => s.id === editingId)?.serviceIds : []
    };

    const updated = editingId 
      ? staff.map(s => s.id === editingId ? newStaff : s)
      : [...staff, newStaff];

    await saveToDb(updated);
    resetForm();
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    const updated = staff.map(s => s.id === id ? { ...s, isAvailable: !currentStatus } : s);
    await saveToDb(updated);
  };

  const deleteStaff = async (id: string) => {
    if(confirm('Remove this staff member permanently?')) {
      await saveToDb(staff.filter(s => s.id !== id));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setRole('');
    setTarget('');
    setIsAvailable(true);
  };

  const editStaff = (s: StaffMember) => {
    setEditingId(s.id);
    setName(s.name);
    setRole(s.role || '');
    setTarget(s.targetEarnings?.toString() || '');
    setIsAvailable(s.isAvailable);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // KPI calculations
  const totalTarget = staff.reduce((acc, s) => acc + (s.targetEarnings || 0), 0);
  const totalEarned = staff.reduce((acc, s) => acc + (s.earningsToday || 0), 0);
  const percentAchieved = totalTarget > 0 ? Math.round((totalEarned / totalTarget) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn">
      <div className="px-4 app-header-safe pb-3.5 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div>
            <h1 className="font-black text-lg text-primary">Team Management 👥</h1>
            <p className="text-xs text-text-dim font-bold uppercase tracking-widest">{staff.length} Active Members</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Universal KPIs */}
        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
           <p className="text-xs font-bold text-text-dim uppercase tracking-widest mb-1 z-10">Team KPI Target (Today)</p>
           <h2 className="text-4xl font-black text-text z-10">₹{totalEarned} <span className="text-xl text-text-dim/50">/ {totalTarget || '?'}</span></h2>
           
           {totalTarget > 0 && (
             <div className="w-full max-w-[200px] h-2 bg-card-2 rounded-full overflow-hidden mt-4 z-10">
               <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${Math.min(percentAchieved, 100)}%` }}></div>
             </div>
           )}
           {totalTarget > 0 && <p className="text-xs font-bold text-primary mt-1 z-10">{percentAchieved}% Achieved</p>}
        </div>

        {/* Form */}
        <div className="p-5 rounded-3xl elite-glass spatial-card">
          <h2 className="font-black text-text mb-4">{editingId ? 'Edit Team Member' : 'Add New Member'}</h2>
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-3">
               <div className="col-span-2">
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Full Name</label>
                 <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe" className="w-full mt-1 p-3 rounded-xl bg-background border border-border outline-none font-bold text-sm" />
               </div>
               
               <div>
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Role/Title (Opt)</label>
                 <input type="text" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Sr. Stylist" className="w-full mt-1 p-3 rounded-xl bg-background border border-border outline-none text-sm" />
               </div>

               <div>
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Daily Target (₹)</label>
                 <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g. 5000" className="w-full mt-1 p-3 rounded-xl bg-background border border-border outline-none text-sm" />
               </div>

               <div className="col-span-2 flex items-center gap-3 bg-background p-3 rounded-xl border border-border mt-1">
                 <span className="text-xs font-bold text-text-dim">Currently Active/Available?</span>
                 <button onClick={() => setIsAvailable(!isAvailable)} className={`ml-auto w-12 h-6 rounded-full relative transition-colors ${isAvailable ? 'bg-success' : 'bg-card-2'}`}>
                   <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isAvailable ? 'translate-x-6' : 'translate-x-0'}`}></span>
                 </button>
               </div>
             </div>
             
             <div className="flex gap-2 pt-2">
              {editingId && <button onClick={resetForm} className="flex-1 py-3 neu-btn rounded-xl font-bold hover:bg-border transition-colors">Cancel</button>}
              <button disabled={saving} onClick={handleSaveStaff} className="flex-[2] py-3 btn-primary rounded-xl font-bold shadow-md hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-50">
                {saving ? 'Saving...' : editingId ? 'Update Profile' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>

        {/* Staff List */}
        <div className="space-y-3">
          {staff.length === 0 ? (
            <div className="text-center py-10 opacity-50">
               <span className="text-4xl block mb-2">🤷‍♂️</span>
               <p className="text-xs font-bold text-text-dim">No team members added yet.</p>
            </div>
          ) : (
            staff.map(s => {
              const sTarget = s.targetEarnings || 0;
              const sEarned = s.earningsToday || 0;
              const sPerc = sTarget > 0 ? Math.round((sEarned / sTarget) * 100) : 0;
              return (
                <div key={s.id} className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all ${!s.isAvailable ? 'bg-card border-border opacity-70 grayscale' : 'bg-card border-border shadow-sm'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-bold text-text text-sm">{s.name}</h4>
                          {s.role && <span className="text-xs uppercase tracking-widest bg-card-2 px-1.5 py-0.5 rounded text-text-dim">{s.role}</span>}
                        </div>
                        <p className="text-xs text-text-dim flex items-center gap-1 font-bold">
                           <span className={`w-2 h-2 rounded-full ${s.isAvailable ? 'bg-success' : 'bg-warning'}`}></span>
                           {s.isAvailable ? 'On Duty' : 'Off Duty'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => editStaff(s)} className="w-8 flex items-center justify-center rounded-lg bg-card-2 border border-border text-xs font-bold text-text hover:bg-border transition-colors">✏️</button>
                      <button onClick={() => deleteStaff(s.id)} className="w-8 flex items-center justify-center rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors">🗑️</button>
                    </div>
                  </div>

                  {sTarget > 0 && (
                    <div className="bg-background rounded-xl p-3 border border-border mt-1">
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-text-dim">Daily Target</span>
                        <span className="text-text">₹{sEarned} / {sTarget}</span>
                      </div>
                      <div className="w-full h-1.5 bg-card-2 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${sPerc >= 100 ? 'bg-success' : 'bg-primary'}`} style={{ width: `${Math.min(sPerc, 100)}%` }}></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t border-border mt-1 relative flex justify-center">
                     <button 
                       onClick={() => toggleAvailability(s.id, s.isAvailable)}
                       className={`w-full py-2 rounded-xl text-xs font-bold border transition-colors ${s.isAvailable ? 'bg-warning/10 border-warning/30 text-warning hover:bg-warning/20' : 'bg-success/10 border-success/30 text-success hover:bg-success/20'}`}
                     >
                       {s.isAvailable ? 'Mark Off Duty' : 'Mark On Duty'}
                     </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
