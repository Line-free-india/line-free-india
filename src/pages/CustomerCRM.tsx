import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUserPlus, 
  FaSearch, 
  FaArrowLeft, 
  FaPhoneAlt, 
  FaWhatsapp, 
  FaEnvelope, 
  FaTag, 
  FaTrash, 
  FaEdit,
  FaFilter,
  FaEllipsisV
} from 'react-icons/fa';

interface Customer { 
  id: string; 
  name: string; 
  phone: string; 
  email: string; 
  firstVisit: string; 
  lastVisit: string; 
  totalVisits: number; 
  totalSpent: number; 
  tags: string[]; 
  notes: string; 
  tier?: 'VIP' | 'Regular' | 'New';
}

export default function CustomerCRM() {
  const { user, businessProfile, loading } = useApp();
  const nav = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string|null>(null);

  useEffect(() => { 
    if ((businessProfile as any)?.crmCustomers) {
      setCustomers((businessProfile as any).crmCustomers);
    } 
  }, [businessProfile]);

  const saveToDb = async (recs: Customer[]) => {
    if (!user) return;
    setSaving(true);
    try { 
      await updateDoc(doc(db, 'users', user.uid), { crmCustomers: recs }); 
      setCustomers(recs); 
      triggerHaptic('success'); 
    } catch (e: any) { 
      console.error('CRM Save Error:', e);
    }
    setSaving(false);
  };

  const handleSave = async () => {
    if (!name || !phone) return;
    const now = new Date().toISOString();
    const c: Customer = { 
      id: editingId || `cust_${Date.now()}`, 
      name: name.trim(), 
      phone: phone.trim(), 
      email: email.trim(), 
      firstVisit: editingId ? (customers.find(x=>x.id===editingId)?.firstVisit||now) : now, 
      lastVisit: now, 
      totalVisits: editingId ? (customers.find(x=>x.id===editingId)?.totalVisits||0) : 1, 
      totalSpent: editingId ? (customers.find(x=>x.id===editingId)?.totalSpent||0) : 0, 
      tags: tags.split(',').map(t=>t.trim()).filter(Boolean), 
      notes: notes.trim(),
      tier: (editingId ? (customers.find(x=>x.id===editingId)?.totalVisits||0) : 1) > 10 ? 'VIP' : 'Regular'
    };
    let updated = editingId ? customers.map(x=>x.id===editingId?c:x) : [c, ...customers];
    await saveToDb(updated);
    resetForm();
    setShowAddForm(false);
  };

  const resetForm = () => { 
    setEditingId(null); 
    setName(''); 
    setPhone(''); 
    setEmail(''); 
    setTags(''); 
    setNotes(''); 
  };

  const edit = (c: Customer) => { 
    setEditingId(c.id); 
    setName(c.name); 
    setPhone(c.phone); 
    setEmail(c.email); 
    setTags(c.tags.join(', ')); 
    setNotes(c.notes); 
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const del = async (id: string) => { 
    if(window.confirm('Archive this customer record?')) {
      await saveToDb(customers.filter(c=>c.id!==id)); 
    }
  };

  const filtered = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone.includes(search) ||
      c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    );
  }, [customers, search]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-bg text-text pb-20 animate-fadeIn">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-30 glass-strong border-b border-border p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { triggerHaptic('light'); nav(-1); }}
            className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-text-dim hover:text-text transition-all active:scale-95"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight">Client Hub 👥</h1>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-text-dim text-primary">{customers.length} Contacts</p>
          </div>
        </div>
        <button 
          onClick={() => { triggerHaptic('medium'); setShowAddForm(!showAddForm); resetForm(); }}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 ${showAddForm ? 'bg-card border border-border text-text' : 'bg-primary text-white shadow-primary/30'}`}
        >
          {showAddForm ? <FaArrowLeft className="rotate-90" /> : <FaUserPlus />}
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Search Bar */}
        {!showAddForm && (
          <div className="relative group">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search by name, phone or tags..." 
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-card border border-border outline-none text-sm font-bold focus:border-primary/50 transition-all shadow-inner"
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {showAddForm ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="neu-panel p-6 rounded-[2.5rem] space-y-6"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-black text-sm uppercase tracking-widest">{editingId ? 'Refine Profile' : 'New Client Profile'}</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-text-dim uppercase tracking-widest ml-1">Full Name *</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahul Sharma" className="w-full p-4 rounded-2xl bg-bg border border-border outline-none font-black text-xs text-primary shadow-inner" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-text-dim uppercase tracking-widest ml-1">Mobile *</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 00000 00000" className="w-full p-4 rounded-2xl bg-bg border border-border outline-none font-black text-xs text-primary shadow-inner" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-text-dim uppercase tracking-widest ml-1">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="rahul@example.com" className="w-full p-4 rounded-2xl bg-bg border border-border outline-none font-bold text-xs shadow-inner" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-text-dim uppercase tracking-widest ml-1">Tags (Comma separated)</label>
                  <div className="relative">
                    <FaTag className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim text-xs" />
                    <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="VIP, Regular, Referral" className="w-full pl-10 pr-4 py-4 rounded-2xl bg-bg border border-border outline-none font-bold text-xs shadow-inner" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-text-dim uppercase tracking-widest ml-1">Private Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Preferences, special requests..." rows={3} className="w-full p-4 rounded-2xl bg-bg border border-border outline-none text-xs font-semibold resize-none shadow-inner"></textarea>
                </div>

                <button 
                  disabled={saving || !name || !phone} 
                  onClick={handleSave} 
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  {saving ? 'Processing...' : (editingId ? 'Update Identity' : 'Secure Entry')}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filtered.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-text-dim flex items-center justify-center text-3xl mb-4">🔍</div>
                  <p className="font-black text-xs uppercase tracking-[3px]">No matching records</p>
                </div>
              ) : filtered.map((c, i) => (
                <motion.div 
                  key={c.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative"
                >
                  <div className="p-5 rounded-[2.5rem] bg-card border border-border flex items-center gap-5 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                    {/* Avatar with Tier Ring */}
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-lg font-black bg-bg shadow-inner ${c.totalVisits > 10 ? 'border-primary text-primary' : 'border-border text-text-dim'}`}>
                        {c.name[0]}
                      </div>
                      {c.totalVisits > 10 && (
                        <div className="absolute -bottom-1 -right-1 bg-primary text-white text-xs px-1.5 py-0.5 rounded-full font-black uppercase ring-2 ring-card">VIP</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                         <h3 className="font-black text-sm truncate">{c.name}</h3>
                         {c.totalSpent > 5000 && <span className="text-xs bg-success/10 text-success px-1.5 py-0.5 rounded-full font-black border border-success/20">Elite</span>}
                      </div>
                      <p className="text-xs font-bold text-text-dim mt-1 uppercase tracking-widest">
                         {c.totalVisits} Visits &bull; ₹{c.totalSpent} Worth
                      </p>
                      
                      <div className="flex gap-2 mt-2">
                        {c.tags.slice(0, 3).map(t => (
                          <span key={t} className="text-xs bg-primary/5 text-primary/70 px-2 py-0.5 rounded-md border border-primary/10 font-bold">#{t}</span>
                        ))}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-col gap-2">
                       <div className="flex gap-1">
                          <a href={`tel:${c.phone}`} className="w-8 h-8 rounded-xl bg-bg border border-border flex items-center justify-center text-xs text-text-dim hover:text-primary transition-colors">
                            <FaPhoneAlt />
                          </a>
                          <a href={`https://wa.me/${c.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-xl bg-bg border border-border flex items-center justify-center text-sm text-text-dim hover:text-success transition-colors">
                            <FaWhatsapp />
                          </a>
                          <button onClick={() => edit(c)} className="w-8 h-8 rounded-xl bg-bg border border-border flex items-center justify-center text-xs text-text-dim hover:text-indigo-400 transition-colors">
                            <FaEdit />
                          </button>
                       </div>
                    </div>
                  </div>
                  
                  {/* Delete Button (Hidden till hover) */}
                  <button 
                    onClick={() => del(c.id)}
                    className="absolute -right-2 -top-2 w-7 h-7 bg-danger text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <FaTrash />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Intelligence Insight */}
        {!showAddForm && customers.length > 5 && (
           <div className="p-6 rounded-[2.5rem] bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 mt-10">
              <div className="flex items-center gap-3 mb-3">
                 <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">🚀</div>
                 <h4 className="font-black text-xs uppercase tracking-widest">Growth Forecast</h4>
              </div>
              <p className="text-xs font-medium text-text-dim leading-relaxed">
                Found <span className="text-primary font-black">{customers.filter(c => c.totalVisits > 5).length} loyal clients</span>. Consider sending a WhatsApp broadcast for new promotional services to boost retention by 15%.
              </p>
           </div>
        )}
      </div>
    </div>
  );
}
