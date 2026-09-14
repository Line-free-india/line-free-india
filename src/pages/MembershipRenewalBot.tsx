import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, UserMembership } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

export default function MembershipRenewalBot() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  const [members, setMembers] = useState<UserMembership[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (businessProfile?.gymMembers) {
      setMembers(businessProfile.gymMembers);
    }
  }, [businessProfile]);

  const saveToDb = async (newMembers: UserMembership[]) => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { gymMembers: newMembers });
      setMembers(newMembers);
      triggerHaptic('success');
    } catch (e: any) {
      alert('Error updating memberships: ' + e.message);
    }
    setSaving(false);
  };

  const sendReminder = (member: UserMembership) => {
    alert(`Pre-written WhatsApp Template opened for ${member.gymId} (SIMULATED).\n\n"Hi! Your ${member.planName} at ${businessProfile?.businessName} is expiring soon! Renew now to keep your streak alive! 💪"`);
    triggerHaptic('success');
  };

  const renewMembership = async (id: string, days: number) => {
    const updated = members.map(m => {
      if (m.id === id) {
        const currentExp = new Date(m.expiresAt);
        const newExp = new Date(Math.max(Date.now(), currentExp.getTime()) + days * 24 * 60 * 60 * 1000);
        return { ...m, expiresAt: newExp.getTime() };
      }
      return m;
    });
    await saveToDb(updated);
  };

  const addManualMember = async () => {
    const name = prompt('Enter Member Name:');
    if (!name) return;
    const plan = prompt('Enter Plan Name (e.g. Monthly, Quarterly):') || 'Monthly';
    
    const newMember: UserMembership = {
      id: Date.now().toString(),
      gymId: name, // Using gymId as member name temporarily for manual entries
      gymName: businessProfile?.businessName || 'Gym',
      planName: plan,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      qrCode: 'manual_' + Date.now()
    };
    await saveToDb([...members, newMember]);
  };

  const deleteMember = async (id: string) => {
    if(confirm('Remove this member?')) {
      await saveToDb(members.filter(m => m.id !== id));
    }
  };

  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  const expired = members.filter(m => m.expiresAt < now);
  const expiringSoon = members.filter(m => m.expiresAt >= now && m.expiresAt < now + sevenDays);
  const active = members.filter(m => m.expiresAt >= now + sevenDays);

  const getDaysLeft = (ms: number) => Math.ceil((ms - now) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background">
      <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div>
            <h1 className="font-black text-lg text-primary">Renewal Bot 🤖</h1>
            <p className="text-xs text-text-dim font-bold uppercase tracking-widest">{members.length} Members Tracked</p>
          </div>
        </div>
        <button onClick={addManualMember} disabled={saving} className="text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">+</button>
      </div>

      <div className="p-4 space-y-6">
        
        {/* KPI Banner */}
        <div className="grid grid-cols-3 gap-3">
           <div className="bg-danger/10 border border-danger/30 rounded-2xl p-3 flex flex-col items-center justify-center">
             <span className="text-2xl font-black text-danger">{expired.length}</span>
             <span className="text-xs font-bold text-danger uppercase">Expired</span>
           </div>
           <div className="bg-warning/10 border border-warning/30 rounded-2xl p-3 flex flex-col items-center justify-center animate-pulse">
             <span className="text-2xl font-black text-warning">{expiringSoon.length}</span>
             <span className="text-xs font-bold text-warning uppercase text-center leading-tight">Expiring Soon</span>
           </div>
           <div className="bg-success/10 border border-success/30 rounded-2xl p-3 flex flex-col items-center justify-center">
             <span className="text-2xl font-black text-success">{active.length}</span>
             <span className="text-xs font-bold text-success uppercase">Active</span>
           </div>
        </div>

        {/* Action Center - Expiring Soon */}
        {expiringSoon.length > 0 && (
          <div className="elite-glass spatial-card border-warning/30 rounded-3xl p-5 shadow-lg shadow-warning/5">
            <h2 className="font-black text-warning mb-4 flex items-center gap-2">⚠️ Follow-up Required <span className="text-xs bg-warning text-white px-2 py-0.5 rounded-full">{expiringSoon.length}</span></h2>
            <div className="space-y-3">
              {expiringSoon.map(m => (
                <div key={m.id} className="flex flex-col gap-2 p-3 elite-glass rounded-xl border-warning/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-text text-sm">{m.gymId}</h4>
                      <p className="text-xs text-text-dim">{m.planName} • Expires in {getDaysLeft(m.expiresAt)} days</p>
                    </div>
                    <button onClick={() => sendReminder(m)} className="bg-green-500/10 text-green-500 hover:bg-green-500/20 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-500/20 transition-colors flex items-center gap-1">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                      Ping
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => renewMembership(m.id, 30)} className="flex-1 py-1 text-xs bg-card border border-warning/30 rounded text-warning font-bold active:scale-95 transition-transform">+ 1 Month</button>
                    <button onClick={() => renewMembership(m.id, 90)} className="flex-1 py-1 text-xs bg-card border border-warning/30 rounded text-warning font-bold active:scale-95 transition-transform">+ 3 Months</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expired List */}
        {expired.length > 0 && (
          <div>
            <h3 className="font-black text-text-dim uppercase tracking-widest pl-2 mb-3 border-l-2 border-danger text-xs">Expired ({expired.length})</h3>
            <div className="grid gap-2">
              {expired.map(m => (
                <div key={m.id} className="p-3 rounded-2xl elite-glass spatial-card border-danger/20 flex justify-between items-center grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all">
                  <div>
                    <h4 className="font-bold text-text text-sm line-through">{m.gymId}</h4>
                    <p className="text-xs text-danger font-bold mt-0.5">Expired {-getDaysLeft(m.expiresAt)} days ago</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <button onClick={() => renewMembership(m.id, 30)} className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg shadow active:scale-95">Renew</button>
                    <button onClick={() => deleteMember(m.id)} className="text-xs text-text-dim underline mt-1">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active List */}
        {active.length > 0 && (
          <div>
            <h3 className="font-black text-text-dim uppercase tracking-widest pl-2 mb-3 mt-6 border-l-2 border-success text-xs">Healthy Active ({active.length})</h3>
            <div className="grid gap-2">
              {active.map(m => (
                <div key={m.id} className="p-3 rounded-2xl elite-glass spatial-card border-white/5 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                       <h4 className="font-bold text-text text-sm">{m.gymId}</h4>
                       <span className="text-xs bg-success/10 text-success px-1.5 py-0.5 rounded font-bold uppercase">{m.planName}</span>
                    </div>
                    <p className="text-xs text-text-dim font-bold">Expires: {new Date(m.expiresAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => deleteMember(m.id)} className="w-8 h-8 flex justify-center items-center rounded-lg bg-danger/5 text-danger/50 hover:bg-danger/20 hover:text-danger transition-colors">🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
