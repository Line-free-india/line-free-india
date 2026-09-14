import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, TokenEntry } from '../store/AppContext';
import { doc, updateDoc, onSnapshot, query, collection, where } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

export default function TherapistCalendar() {
  const { businessProfile, loading } = useApp();
  const nav = useNavigate();
  const [tokens, setTokens] = useState<TokenEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // View states
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('all');
  const [assigningRoomFor, setAssigningRoomFor] = useState<string | null>(null);

  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });

  useEffect(() => {
    if (!selectedDate) setSelectedDate(dates[0]);
  }, [dates, selectedDate]);

  useEffect(() => {
    if (businessProfile?.uid && selectedDate) {
      const q = query(
        collection(db, 'tokens'), 
        where('salonId', '==', businessProfile.uid),
        where('date', '==', selectedDate)
      );

      const unsub = onSnapshot(q, snap => {
        const tks = snap.docs.map(d => ({ id: d.id, ...d.data() } as TokenEntry))
          .filter(t => t.status !== 'cancelled' && t.status !== 'no-show'); // active only
        setTokens(tks);
      });
      return () => unsub();
    }
  }, [businessProfile, selectedDate]);

  const updateStaffAndRoom = async (tokenId: string, staffId?: string, roomId?: string) => {
    triggerHaptic('light');
    try {
      const updates: any = {};
      if (staffId !== undefined) updates.assignedStaffId = staffId;
      if (roomId !== undefined) updates.assignedRoomId = roomId;
      
      await updateDoc(doc(db, 'tokens', tokenId), updates);
    } catch (e) {
      alert('Failed to update assignment');
    }
  };

  const markDone = async (tokenId: string) => {
    if(!confirm('Mark this session as completed?')) return;
    try {
      await updateDoc(doc(db, 'tokens', tokenId), { status: 'done' });
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const getDayName = (dateStr: string) => {
    const today = new Date();
    const d = new Date(dateStr);
    if (d.toDateString() === today.toDateString()) return 'Today';
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  if (loading) return null;

  const therapists = businessProfile?.staffMembers || [];
  const rooms = businessProfile?.rooms || [];

  // Filter tokens based on selected therapist
  const displayedTokens = selectedTherapistId === 'all' 
    ? tokens 
    : selectedTherapistId === 'unassigned'
      ? tokens.filter(t => !t.assignedStaffId)
      : tokens.filter(t => t.assignedStaffId === selectedTherapistId);

  // Group by Time ideally, but grouping by status for now to mimic queue
  const waitingTokens = displayedTokens.filter(t => t.status === 'waiting');
  const activeTokens = displayedTokens.filter(t => t.status === 'serving');
  const completedTokens = displayedTokens.filter(t => t.status === 'done');

  const TokenCard = ({ token, isActive }: { token: TokenEntry, isActive: boolean }) => {
    const assignedDoc = therapists.find(t => t.id === token.assignedStaffId);
    const assignedRoom = rooms.find(r => r.id === token.assignedRoomId);

    return (
      <div className={`p-4 rounded-3xl border mb-3 relative overflow-hidden transition-all ${isActive ? 'bg-primary/5 border-primary shadow-md' : 'bg-card border-border shadow-sm'}`}>
        <div className="flex justify-between items-start mb-2">
           <div className="flex items-center gap-2">
             <span className="w-8 h-8 rounded-full elite-glass border-white/10 flex items-center justify-center text-xs font-black shadow-inner spatial-card">
               #{token.tokenNumber}
             </span>
             <div>
               <h3 className="font-bold text-sm">{token.customerName}</h3>
               <p className="text-xs text-text-dim/80">{token.selectedServices.map(s => s.name).join(', ')} ({token.totalTime} mins)</p>
             </div>
           </div>
           {token.isTatkal && <span className="text-xl animate-pulse">⚡</span>}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          {/* Therapist Selector */}
          <div className="relative">
            <label className="text-xs uppercase font-bold text-text-dim tracking-wider mb-1 block">Therapist</label>
            <select 
              value={token.assignedStaffId || ''} 
              onChange={e => updateStaffAndRoom(token.id!, e.target.value, undefined)}
              disabled={token.status === 'done'}
              className="w-full text-xs p-2 bg-background border border-border rounded-lg outline-none font-bold"
            >
              <option value="">Unassigned</option>
              {therapists.map(th => (
                <option key={th.id} value={th.id}>{th.name}</option>
              ))}
            </select>
          </div>

          {/* Room Selector */}
          <div className="relative">
             <label className="text-xs uppercase font-bold text-text-dim tracking-wider mb-1 block">Room</label>
             <select 
              value={token.assignedRoomId || ''} 
              onChange={e => updateStaffAndRoom(token.id!, undefined, e.target.value)}
              disabled={token.status === 'done' || rooms.length === 0}
              className="w-full text-xs p-2 bg-background border border-border rounded-lg outline-none font-bold text-accent"
            >
              <option value="">{rooms.length === 0 ? 'No Rooms Setup' : 'Assign Room'}</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        {token.status !== 'done' && (
          <div className="mt-4 pt-3 border-t border-dashed border-border flex gap-2">
             {token.status === 'waiting' && isActive && (
               <button onClick={async () => await updateDoc(doc(db, 'tokens', token.id!), { status: 'serving' })} className="flex-1 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90">
                 Start Session
               </button>
             )}
             {token.status === 'serving' && (
               <button onClick={() => markDone(token.id!)} className="flex-1 py-2 bg-success text-white rounded-xl text-xs font-bold hover:bg-success/90 shadow-md animate-pulse">
                 Complete Session ✅
               </button>
             )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn">
      <div className="p-4 glass-strong sticky top-0 z-20 flex flex-col gap-3 border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div className="flex-1">
            <h1 className="font-black text-lg">Spa Hub 💆‍♀️</h1>
            <p className="text-xs text-text-dim font-bold uppercase tracking-widest">{displayedTokens.length} Sessions</p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {dates.map(dateStr => (
            <button 
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-[60px] h-[60px] rounded-2xl border transition-all ${selectedDate === dateStr ? 'bg-primary border-primary text-white shadow-md shadow-primary/20' : 'bg-card border-border text-text-dim hover:bg-border'}`}
            >
              <span className="text-xs uppercase font-bold tracking-widest">{getDayName(dateStr)}</span>
              <span className="text-lg font-black">{dateStr.split('-')[2]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* Therapist Filter */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6 pb-2">
          <button 
            onClick={() => setSelectedTherapistId('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${selectedTherapistId === 'all' ? 'bg-primary border-primary text-white shadow-md' : 'bg-card border-border'}`}
          >
            All Appointments
          </button>
          <button 
            onClick={() => setSelectedTherapistId('unassigned')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${selectedTherapistId === 'unassigned' ? 'bg-warning/20 border-warning text-warning shadow-md' : 'bg-card border-border'}`}
          >
            ⚠️ Unassigned ({tokens.filter(t => !t.assignedStaffId).length})
          </button>
          {therapists.map(th => (
            <button 
              key={th.id}
              onClick={() => setSelectedTherapistId(th.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all flex items-center gap-2 ${selectedTherapistId === th.id ? 'elite-glass border-primary text-primary shadow-sm spatial-card' : 'elite-glass border-white/5 spatial-card'}`}
            >
              <span>{th.name}</span>
              <span className="bg-background px-1.5 py-0.5 rounded-md text-xs">{tokens.filter(t => t.assignedStaffId === th.id).length}</span>
            </button>
          ))}
        </div>

        {/* Calendar View (Simplified as Lists by Status) */}
        {displayedTokens.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4 opacity-50">🍃</div>
            <h3 className="font-bold text-text-dim text-lg">No sessions scheduled</h3>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Sessions */}
            {activeTokens.length > 0 && (
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                   In Progress
                </h3>
                {activeTokens.map(t => <TokenCard key={t.id} token={t} isActive={true} />)}
              </div>
            )}

            {/* Waiting Sessions */}
            {waitingTokens.length > 0 && (
              <div>
                 <h3 className="text-xs font-black uppercase tracking-widest text-text-dim mb-3 flex items-center gap-2">
                   ⌛ Waiting / Upcoming
                </h3>
                {waitingTokens.map(t => <TokenCard key={t.id} token={t} isActive={false} />)}
              </div>
            )}

            {/* Completed */}
            {completedTokens.length > 0 && (
              <div>
                 <h3 className="text-xs font-black uppercase tracking-widest text-success mb-3 flex items-center gap-2">
                   ✅ Completed Today
                </h3>
                {completedTokens.map(t => <TokenCard key={t.id} token={t} isActive={false} />)}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
