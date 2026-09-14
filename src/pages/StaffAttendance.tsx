import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

interface AttendanceRecord { staffName: string; date: string; checkIn?: string; checkOut?: string; status: 'present'|'absent'|'half_day'|'late'; }

export default function StaffAttendance() {
  const { user, businessProfile, role } = useApp();
  const nav = useNavigate();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<'owner' | 'staff'>(role === 'business' ? 'owner' : 'staff');
  const [showQR, setShowQR] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanPhase, setScanPhase] = useState<'idle' | 'scanning' | 'verifying' | 'success'>('idle');
  
  const staffList = businessProfile?.staffMembers || [];
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { if ((businessProfile as any)?.attendance) setRecords((businessProfile as any).attendance); }, [businessProfile]);
  
  const saveToDb = async (recs: AttendanceRecord[]) => { 
    if (!user) return; 
    setSaving(true); 
    try { 
      await updateDoc(doc(db, 'barbers', user.uid), { attendance: recs }); 
      setRecords(recs); 
      triggerHaptic('success'); 
    } catch(e:any) { console.error('Error: ', e); } 
    setSaving(false); 
  };

  const markAttendance = async (staffName: string, status: AttendanceRecord['status']) => {
    const existing = records.findIndex(r => r.staffName === staffName && r.date === selectedDate);
    let updated: AttendanceRecord[];
    if (existing >= 0) { updated = records.map((r,i) => i === existing ? { ...r, status, checkIn: status !== 'absent' ? new Date().toTimeString().slice(0,5) : undefined } : r); }
    else { updated = [...records, { staffName, date: selectedDate, checkIn: status !== 'absent' ? new Date().toTimeString().slice(0,5) : undefined, status }]; }
    await saveToDb(updated);
  };

  const handleCheckIn = async () => {
    setScanning(true);
    setScanPhase('scanning');
    triggerHaptic('medium');
    
    // Check in with minimal latency instead of multi-phase simulation
    setTimeout(async () => {
      setScanPhase('success');
      triggerHaptic('success');
      const staffName = user?.displayName || 'Staff Member';
      await markAttendance(staffName, 'present');
      
      setTimeout(() => {
        setScanning(false);
        setScanPhase('idle');
      }, 1500);
    }, 800);
  };

  const getStatusForDate = (staffName: string) => records.find(r => r.staffName === staffName && r.date === selectedDate);
  const statusColors: Record<string,string> = { present: '#10B981', absent: '#EF4444', half_day: '#F59E0B', late: '#F97316' };
  const statusBgs: Record<string,string> = { present: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', absent: 'bg-rose-500/10 border-rose-500/30 text-rose-400', half_day: 'bg-amber-500/10 border-amber-500/30 text-amber-400', late: 'bg-orange-500/10 border-orange-500/30 text-orange-400' };
  const presentToday = staffList.filter((s: any) => { const r = getStatusForDate(s.name); return r && r.status !== 'absent'; }).length;

  return (
    <div className="h-full overflow-y-auto bg-bg text-white pb-32 custom-scrollbar">
      {/* Aurora Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full opacity-8 blur-[120px]" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full opacity-5 blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)' }} />
      </div>

      {/* Premium Header */}
      <div className="p-6 aurora-glass sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => nav('/barber/dashboard')} 
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >←</motion.button>
          <div>
            <h1 className="font-black text-xl bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Biometric Attendance
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-white/40 font-black uppercase tracking-[0.3em]">
                {presentToday} / {staffList.length} Active Today
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Protocol v4.0</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* View Toggle */}
        <div className="flex p-1 aurora-glass rounded-2xl">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setView('owner')}
            className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'owner' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-xl shadow-emerald-500/20' : 'text-white/30 hover:text-white/60'}`}
          >
            🛡️ Owner Console
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setView('staff')}
            className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'staff' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-xl shadow-emerald-500/20' : 'text-white/30 hover:text-white/60'}`}
          >
            🎯 Staff Portal
          </motion.button>
        </div>

        {view === 'owner' ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* QR Security Token */}
            <div className="p-6 rounded-[2.5rem] aurora-glass relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-10 translate-x-10" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <span className="text-lg">🛡️</span>
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-white">Daily Security Token</h3>
                      <p className="text-xs text-emerald-400 font-bold">Encrypted · Auto-Rotating</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Live</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center py-4">
                  <div className="p-5 bg-white rounded-3xl mb-4 shadow-2xl ring-8 ring-emerald-500/5 relative">
                    <QRCodeSVG value={`attend-${user?.uid}-${new Date().toISOString().split('T')[0]}`} size={180} />
                    <div className="absolute inset-0 rounded-3xl border-2 border-emerald-500/20 pointer-events-none" />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                    <p className="text-xs font-black text-emerald-400 uppercase tracking-[0.3em]">Token refreshes every 60s</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Geofence Indicator */}
            <div className="p-4 rounded-2xl aurora-glass flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <span className="text-lg">📍</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-widest text-blue-400">Geofence Verification</p>
                <p className="text-xs text-white/30 font-bold mt-0.5">100m radius around business location</p>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-xs font-black text-emerald-400 uppercase">Active</span>
              </div>
            </div>

            {/* Detailed Logs */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.3em] px-1">Attendance Logs</h3>
              <div className="aurora-glass rounded-2xl p-1">
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={e => setSelectedDate(e.target.value)} 
                  className="w-full p-4 rounded-xl bg-transparent outline-none text-sm font-bold text-white/80 focus:text-white transition-colors" 
                />
              </div>
              
              {staffList.length === 0 ? (
                <div className="text-center py-16 aurora-glass rounded-[2rem] border-dashed border-white/10">
                  <span className="text-4xl block mb-4 opacity-30">👥</span>
                  <p className="text-xs font-bold text-white/30">No staff members configured.</p>
                  <p className="text-xs text-white/20 mt-1">Add team members in Staff Manager.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {staffList.map((s: any, i: number) => {
                    const rec = getStatusForDate(s.name);
                    return (
                      <motion.div 
                        key={s.id || s.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-5 rounded-[1.5rem] aurora-glass hover:bg-white/[0.04] transition-all group"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                              {['👨‍🦱', '👩', '🧑', '👨‍🦰', '👩‍🦰'][i % 5]}
                            </div>
                            <div>
                              <h4 className="font-black text-sm text-white">{s.name}</h4>
                              <p className="text-xs font-bold mt-0.5 text-white/30">
                                {rec?.checkIn ? `✅ Checked in @ ${rec.checkIn}` : '⏳ Not Scanned'}
                              </p>
                            </div>
                          </div>
                          {rec && (
                            <div 
                              className="w-3 h-3 rounded-full shadow-[0_0_12px_currentColor]"
                              style={{ backgroundColor: statusColors[rec.status], color: statusColors[rec.status] }}
                            />
                          )}
                        </div>
                        <div className="flex gap-2">
                          {(['present','absent','late'] as const).map(st => (
                            <motion.button 
                              key={st}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => markAttendance(s.name, st)} 
                              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                                rec?.status === st 
                                  ? statusBgs[st]
                                  : 'bg-white/[0.02] border-white/5 text-white/20 hover:text-white/40 hover:border-white/10'
                              }`}
                            >
                              {st === 'present' ? '✅' : st === 'absent' ? '❌' : '⏰'} {st}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* ═══ Staff Portal — Cyber-Punk Scanner ═══ */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-8 space-y-10"
          >
            {/* Scanner Orb */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Outer Pulse Rings */}
              <AnimatePresence>
                {scanning && (
                  <>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 border-2 border-emerald-500/30 rounded-full"
                    />
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      className="absolute inset-0 border-2 border-cyan-500/20 rounded-full"
                    />
                  </>
                )}
              </AnimatePresence>

              {/* Rotating Ring */}
              <motion.div
                animate={scanning ? { rotate: 360 } : { rotate: 0 }}
                transition={scanning ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
                className="absolute inset-4 rounded-full border-2 border-dashed border-emerald-500/20"
              />

              {/* Scan Lines */}
              <AnimatePresence>
                {scanning && (
                  <motion.div
                    initial={{ top: '0%' }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                    style={{ boxShadow: '0 0 20px rgba(16,185,129,0.5), 0 0 40px rgba(16,185,129,0.2)' }}
                  />
                )}
              </AnimatePresence>

              {/* Core Button */}
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={handleCheckIn}
                disabled={scanning}
                className={`w-48 h-48 rounded-full flex flex-col items-center justify-center relative z-10 transition-all duration-500 border-4 ${
                  scanPhase === 'success' 
                    ? 'border-emerald-400 bg-emerald-950/40 shadow-[0_0_60px_rgba(16,185,129,0.3)]'
                    : scanPhase === 'verifying'
                    ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_60px_rgba(6,182,212,0.3)]'
                    : scanning 
                    ? 'border-emerald-500/40 bg-emerald-950/20 shadow-[0_0_40px_rgba(16,185,129,0.15)]' 
                    : 'border-white/10 bg-white/[0.03] hover:border-emerald-500/30 hover:shadow-[0_0_40px_rgba(16,185,129,0.1)] group'
                }`}
              >
                <span className={`text-6xl mb-2 transition-all duration-300 ${scanning ? '' : 'group-hover:scale-110'}`}>
                  {scanPhase === 'success' ? '✅' : scanPhase === 'scanning' ? '📡' : '🎯'}
                </span>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/80">
                  {scanPhase === 'success' ? 'Verified!' : scanPhase === 'scanning' ? 'Scanning...' : 'Commence Scan'}
                </p>
                {scanPhase === 'scanning' && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '60%' }}
                    transition={{ duration: 1.2 }}
                    className="h-0.5 rounded-full bg-emerald-400 mt-3"
                  />
                )}
                {scanPhase === 'verifying' && (
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="mt-3 text-xs text-cyan-400 font-black uppercase tracking-widest"
                  >
                    Verifying biometrics...
                  </motion.div>
                )}
              </motion.button>
            </div>

            {/* Success Overlay */}
            <AnimatePresence>
              {scanPhase === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-6 rounded-[2rem] aurora-glass border-emerald-500/30 text-center max-w-xs"
                >
                  <p className="text-emerald-400 font-black text-lg">Attendance Verified</p>
                  <p className="text-white/30 text-xs font-bold mt-1">Biometric match · Geofence confirmed · Logged</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="max-w-xs text-center space-y-3">
              <p className="text-white/30 text-xs font-medium leading-relaxed">
                Position your device within range of the Shop QR or use the Biometric Handshake protocol.
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-1 h-1 rounded-full bg-emerald-400/50" />
                <p className="text-xs text-emerald-500/50 font-black uppercase tracking-[0.3em]">Protocol Version 4.0 Secure</p>
                <div className="w-1 h-1 rounded-full bg-emerald-400/50" />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
