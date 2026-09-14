import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { triggerHaptic } from '../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Clock, 
  DollarSign, 
  Grid,
  ArrowLeft,
  Info,
  CheckCircle2,
  X
} from 'lucide-react';

const MenuEditor: React.FC = () => {
  const { businessProfile, updateBusinessServices } = useApp();
  const nav = useNavigate();
  const [services, setServices] = useState<any[]>(businessProfile?.customServices || (businessProfile as any)?.services || []);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newService, setNewService] = useState({ name: '', price: 0, avgTime: 15, category: 'General' });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const categories = Array.from(new Set(services.map(s => s.category || 'General')));

  const handleAddService = () => {
    const s = { ...newService, id: Date.now().toString() };
    const updated = [...services, s];
    setServices(updated);
    setShowAddModal(false);
    setNewService({ name: '', price: 0, avgTime: 15, category: 'General' });
  };

  const handleDeleteService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  const handleUpdateService = (id: string, updates: any) => {
    setServices(services.map(s => s.id === id ? { ...s, ...updates } : s));
    setIsEditing(null);
  };

  const handleSaveAll = async () => {
    setSaveStatus('saving');
    await updateBusinessServices(services);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  if (!businessProfile) return null;

  return (
    <div className="min-h-screen bg-bg pb-32 relative animate-fadeIn">
      {/* Background gradient mesh */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse at 10% 0%, rgba(59, 130, 246, 0.08) 0%, transparent 60%),
          radial-gradient(ellipse at 90% 20%, rgba(139, 92, 246, 0.06) 0%, transparent 50%),
          var(--color-bg)
        `,
        zIndex: 0, pointerEvents: 'none',
      }} />

      {/* Sticky Safe Top Header */}
      <header className="bg-white/95 dark:bg-card/95 backdrop-blur-md border-b border-border px-4 app-header-safe pb-3.5 shadow-xs sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              triggerHaptic('light');
              nav(-1);
            }}
            className="w-10 h-10 rounded-2xl bg-card-2 border border-border flex items-center justify-center text-text-dim hover:text-text transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-black text-text tracking-tight flex items-center gap-2">
              <Grid className="text-primary w-5 h-5" />
              Service Menu Editor
            </h1>
            <p className="text-xs text-text-dim font-bold">Customize services & pricing</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-black shadow-sm flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
        >
          <Plus size={16} /> Add Service
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-4 relative z-10">

        {/* Categories & Items */}
        <div className="space-y-12">
          {categories.map(cat => (
            <div key={cat} className="space-y-6">
              <h3 className="text-xl font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-3 border-l-4 border-primary pl-4">
                {cat}
              </h3>
              <div className="grid gap-4">
                {services.filter(s => (s.category || 'General') === cat).map(service => (
                  <motion.div
                    layout
                    key={service.id}
                    className="premium-card p-6 flex items-center justify-between group hover:scale-[1.02] hover:border-primary/50 transition-all cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-text">{service.name}</span>
                        <span className="px-3 py-1 bg-card-2 rounded-lg text-xs font-black text-text-dim uppercase tracking-widest border border-border shadow-inner">
                          ID: {service.id.slice(-4)}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 mt-3">
                        <div className="flex items-center gap-2 text-primary font-bold">
                          <DollarSign size={16} />
                          <span>{service.price}</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-dim">
                          <Clock size={16} />
                          <span>{service.avgTime} min</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setIsEditing(service.id)}
                        className="p-3 bg-card-2 hover:bg-card-hover rounded-xl text-text-dim hover:text-text transition-all border border-border"
                      >
                        <Edit3 size={20} />
                      </button>
                      <button 
                        onClick={() => handleDeleteService(service.id)}
                        className="p-3 bg-danger/10 hover:bg-danger/20 border border-danger/20 rounded-xl text-danger transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sticky Save Bar */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-50">
          <div className="glass-ultra p-4 rounded-full shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-4 ml-4">
              <div className="w-10 h-10 rounded-full bg-card-2 border border-border flex items-center justify-center text-text-dim shadow-inner">
                <Info size={20} />
              </div>
              <p className="text-sm font-bold text-text-dim">{services.length} services listed</p>
            </div>
            <button
              onClick={handleSaveAll}
              disabled={saveStatus === 'saving'}
              className={`premium-btn px-8 flex items-center gap-3 transition-all ${
                saveStatus === 'saved' ? 'bg-success border-success text-white' : 'premium-btn-primary'
              }`}
            >
              {saveStatus === 'saving' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : saveStatus === 'saved' ? (
                <>
                  <CheckCircle2 size={20} /> Published
                </>
              ) : (
                <>
                  <Save size={20} /> Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Add Modal */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setShowAddModal(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-md premium-card p-8 overflow-hidden shadow-2xl"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-text tracking-tight">New Service</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-text-dim hover:text-text bg-card-2 p-2 rounded-full border border-border"><X size={20} /></button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-black text-text-dim uppercase tracking-[0.2em] mb-2 block ml-1">Service Name</label>
                    <input 
                      type="text" 
                      value={newService.name}
                      onChange={e => setNewService({...newService, name: e.target.value})}
                      className="input-field"
                      placeholder="e.g. Premium Haircut"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-black text-text-dim uppercase tracking-[0.2em] mb-2 block ml-1">Price (₹)</label>
                      <input 
                        type="number" 
                        value={newService.price}
                        onChange={e => setNewService({...newService, price: Number(e.target.value)})}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-text-dim uppercase tracking-[0.2em] mb-2 block ml-1">Time (Min)</label>
                      <input 
                        type="number" 
                        value={newService.avgTime}
                        onChange={e => setNewService({...newService, avgTime: Number(e.target.value)})}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-text-dim uppercase tracking-[0.2em] mb-2 block ml-1">Category</label>
                    <select 
                      value={newService.category}
                      onChange={e => setNewService({...newService, category: e.target.value})}
                      className="input-field appearance-none cursor-pointer"
                    >
                      <option value="General">General</option>
                      <option value="Premium">Premium</option>
                      <option value="Express">Express</option>
                      <option value="Add-on">Add-on</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={handleAddService}
                    className="premium-btn premium-btn-primary w-full mt-4 py-4"
                  >
                    Confirm & Add
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default MenuEditor;
