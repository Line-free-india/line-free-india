import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, InventoryItem } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

export default function SmartInventory() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [message, setMessage] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Pieces');
  const [alertThreshold, setAlertThreshold] = useState('5');
  const [lastRestocked, setLastRestocked] = useState('');
  const [price, setPrice] = useState('0');

  useEffect(() => {
    if (businessProfile?.inventory) {
      setItems(businessProfile.inventory);
    }
  }, [businessProfile]);

  const saveToDb = async (newRecords: InventoryItem[]) => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'barbers', user.uid), { inventory: newRecords });
      setItems(newRecords);
      triggerHaptic('success');
    } catch (e: any) {
      setMessage('Error saving inventory: ' + e.message);
    }
    setSaving(false);
  };

  const handleSaveItem = async () => {
    if (!itemName || !quantity || !unit) {
      return setMessage('Item Name, Quantity, and Unit are required.');
    }

    const newRec: InventoryItem = {
      id: editingId || Date.now().toString(),
      itemName: itemName.trim(),
      category: category.trim() || 'General',
      quantity: Number(quantity) || 0,
      unit: unit.trim(),
      price: Number(price) || 0,
      alertThreshold: Number(alertThreshold) || 0,
      lastRestocked: lastRestocked || new Date().toISOString().split('T')[0]
    };

    let updated = [...items];
    if (editingId) {
      updated = updated.map(i => i.id === editingId ? newRec : i);
    } else {
      updated = [newRec, ...updated];
    }
    
    await saveToDb(updated);
    resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editItem = (item: InventoryItem) => {
    setEditingId(item.id);
    setItemName(item.itemName);
    setCategory(item.category);
    setQuantity(item.quantity.toString());
    setUnit(item.unit);
    setPrice(item.price?.toString() || '0');
    setAlertThreshold(item.alertThreshold.toString());
    setLastRestocked(item.lastRestocked);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setItemName('');
    setCategory('');
    setQuantity('');
    setUnit('Pieces');
    setPrice('0');
    setAlertThreshold('5');
    setLastRestocked('');
  };

  const deleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm('Delete this Item from inventory?')) {
      await saveToDb(items.filter(r => r.id !== id));
      if (editingId === id) resetForm();
    }
  };

  const updateStock = async (id: string, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = items.map(item => {
      if (item.id === id) {
        const newQ = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQ, lastRestocked: delta > 0 ? new Date().toISOString().split('T')[0] : item.lastRestocked };
      }
      return item;
    });
    triggerHaptic('light');
    await saveToDb(updated);
  };

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category));
    return ['All', ...Array.from(cats)];
  }, [items]);

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (filterCategory !== 'All') {
      filtered = filtered.filter(i => i.category === filterCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(i => i.itemName.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }
    return filtered.sort((a,b) => {
      const aLow = a.quantity <= a.alertThreshold;
      const bLow = b.quantity <= b.alertThreshold;
      if (aLow && !bLow) return -1;
      if (!aLow && bLow) return 1;
      return a.itemName.localeCompare(b.itemName);
    });
  }, [items, search, filterCategory]);

  const lowStockCount = items.filter(i => i.quantity <= i.alertThreshold).length;

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background">
      <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div>
            <h1 className="font-black text-lg text-blue-400">Smart Inventory 📦</h1>
            <p className="text-xs text-blue-200/50 font-bold uppercase tracking-widest">{items.length} Items Total</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">

        {lowStockCount > 0 && (
          <div className="p-4 rounded-3xl bg-danger/10 border border-danger/20 flex items-center gap-4">
            <span className="text-3xl text-danger animate-pulse">⚠️</span>
            <div>
              <h3 className="font-black text-danger text-sm">Low Stock Alert!</h3>
              <p className="text-xs font-bold text-danger/70 mt-0.5">{lowStockCount} items are running low and need restocking.</p>
            </div>
          </div>
        )}

        {/* Editor Form */}
        <div className="p-5 rounded-3xl elite-glass spatial-card relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-8xl pointer-events-none -translate-y-4">📦</div>
          <div className="flex justify-between items-center mb-4 relative z-10">
            <h2 className="font-black text-text text-sm flex items-center gap-2">{editingId ? 'Edit Inventory Item' : 'Add New Item'}</h2>
            {editingId && <button onClick={resetForm} className="text-xs text-text-dim uppercase tracking-widest font-black neu-btn px-2 py-1 rounded-md">Cancel Edit</button>}
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10">
             <div className="col-span-2">
               <input type="text" value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Item Name (e.g. L'Oreal Shampoo)" className="w-full p-3 rounded-xl bg-background border border-border outline-none font-bold text-sm text-blue-100" />
             </div>
             
             <div>
               <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="Category (e.g. Hair Care)" className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-blue-100" />
               <datalist id="cats">
                 {categories.filter(c => c !== 'All').map(c => <option key={c} value={c} />)}
               </datalist>
             </div>
             
             <div className="flex gap-2">
                 <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Qty" className="flex-[2] p-3 rounded-xl bg-background border border-border outline-none text-xs text-blue-100 font-bold" />
                 <select value={unit} onChange={e => setUnit(e.target.value)} className="flex-[3] p-3 rounded-xl bg-background border border-border outline-none text-xs text-blue-300 font-bold">
                   <option>Pieces</option>
                   <option>Bottles</option>
                   <option>Liters</option>
                   <option>ml</option>
                   <option>Kg</option>
                   <option>Grams</option>
                   <option>Boxes</option>
                 </select>
             </div>

             <div>
               <label className="text-xs font-black uppercase tracking-widest text-text-dim ml-1 block mb-1">Alert Below Qty</label>
               <input type="number" value={alertThreshold} onChange={e => setAlertThreshold(e.target.value)} placeholder="Threshold" className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-blue-100" />
             </div>

             <div>
               <label className="text-xs font-black uppercase tracking-widest text-text-dim ml-1 block mb-1">Retail Price (₹)</label>
               <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-blue-100 font-bold" />
             </div>

             <div>
               <label className="text-xs font-black uppercase tracking-widest text-text-dim ml-1 block mb-1">Last Restocked</label>
               <input type="date" value={lastRestocked} onChange={e => setLastRestocked(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs font-bold text-blue-100" />
             </div>

             <div className="col-span-2 pt-2 border-t border-border mt-1">
              <button disabled={saving} onClick={handleSaveItem} className="w-full py-3 bg-blue-600 text-white rounded-xl font-black shadow-[0_4px_15px_rgba(37,99,235,0.3)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest text-xs">
                {saving ? 'Saving...' : editingId ? 'Update Item' : 'Add to Inventory'}
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {items.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(c => (
              <button 
                key={c}
                onClick={() => setFilterCategory(c)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-sm ${filterCategory === c ? 'bg-blue-500 text-white' : 'bg-card border border-border text-text hover:bg-border'}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Directory View */}
        <div>
           <div className="relative mb-4">
             <input 
               type="text" 
               placeholder="Search inventory..." 
               value={search}
               onChange={e => setSearch(e.target.value)}
               className="w-full p-3 pl-10 rounded-xl elite-glass border-white/10 outline-none text-xs font-bold shadow-sm text-blue-100"
             />
             <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50">🔍</span>
           </div>

           {filteredItems.length === 0 ? (
             <div className="text-center py-6 border border-dashed border-border rounded-3xl opacity-50 bg-card">
               <span className="text-3xl block mb-2">🤷‍♂️</span>
               <p className="text-xs font-bold text-text-dim">No items found.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 gap-3">
               {filteredItems.map(item => {
                 const isLow = item.quantity <= item.alertThreshold;
                 return (
                   <div key={item.id} onClick={() => editItem(item)} className={`p-4 rounded-3xl border bg-card flex flex-col gap-3 relative shadow-sm cursor-pointer transition-colors group ${isLow ? 'border-danger/50 bg-danger/5' : 'border-border hover:border-blue-500/50'}`}>
                     
                     <div className="flex justify-between items-start">
                       <div className="pr-12">
                         <h4 className="font-black text-text text-sm leading-tight flex items-center gap-2 text-blue-200">
                           {item.itemName}
                           {isLow && <span className="text-xs bg-danger text-white px-2 py-0.5 rounded-sm uppercase tracking-widest">Low</span>}
                         </h4>
                         <p className="text-xs font-black uppercase tracking-widest mt-1 text-blue-100/50">{item.category}</p>
                       </div>

                       <div className="text-right absolute top-4 right-4 group-hover:opacity-0 transition-opacity">
                         <span className={`text-xl font-black ${isLow ? 'text-danger' : 'text-blue-400'}`}>{item.quantity}</span>
                         <span className="text-xs font-bold text-text-dim ml-1">{item.unit}</span>
                       </div>

                       <button onClick={(e) => deleteItem(item.id, e)} className="absolute top-4 right-4 opacity-0 transition-all text-danger text-xs flex justify-center items-center hover:bg-danger/20 group-hover:opacity-100 w-8 h-8 rounded-full bg-danger/10 z-10">
                         ✕
                       </button>
                     </div>
                     
                     <div className="flex justify-between items-center mt-1">
                       <p className="text-xs font-bold text-text-dim flex items-center gap-1">
                         <span>🔄</span> 
                         {item.lastRestocked ? `Restocked: ${new Date(item.lastRestocked).toLocaleDateString('en-GB')}` : 'Never restocked'}
                       </p>
                       
                       {/* Quick Adjust */}
                       <div className="flex items-center gap-1 bg-background rounded-full border border-border p-1" onClick={e => e.stopPropagation()}>
                         <button onClick={(e) => updateStock(item.id, -1, e)} className="w-6 h-6 rounded-full flex items-center justify-center bg-card-2 hover:bg-danger/20 hover:text-danger transition-colors text-xs font-black">-</button>
                         <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                         <button onClick={(e) => updateStock(item.id, 1, e)} className="w-6 h-6 rounded-full flex items-center justify-center bg-card-2 hover:bg-green-500/20 hover:text-green-500 transition-colors text-xs font-black">+</button>
                       </div>
                     </div>

                   </div>
                 );
               })}
             </div>
           )}
        </div>
      </div>
    {message && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg z-50 text-sm">{message} <button onClick={() => setMessage('')} className="ml-2 text-white/50 hover:text-white">&times;</button></div>}
</div>
  );
}
