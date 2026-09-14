import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

export default function InventoryLowAlerts() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  const [products, setProducts] = useState<{ id: string; name: string; price: number; stock?: number }[]>([]);
  const [saving, setSaving] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  const LOW_STOCK_THRESHOLD = 5;

  useEffect(() => {
    if (businessProfile?.products) {
      setProducts(businessProfile.products);
    }
  }, [businessProfile]);

  const saveToDb = async (newProducts: any[]) => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { products: newProducts });
      setProducts(newProducts);
      triggerHaptic('success');
    } catch (e: any) {
      alert('Error updating inventory: ' + e.message);
    }
    setSaving(false);
  };

  const handleSaveProduct = async () => {
    if (!name.trim() || !price) return alert('Name and Price are required');
    
    const newProduct = {
      id: editingId || Date.now().toString() + Math.random().toString(36).substring(7),
      name: name.trim(),
      price: Number(price),
      stock: stock ? Number(stock) : 0
    };

    let updated = [...products];
    if (editingId) {
      updated = updated.map(p => p.id === editingId ? newProduct : p);
    } else {
      updated.push(newProduct);
    }

    await saveToDb(updated);
    resetForm();
  };

  const updateStock = async (id: string, delta: number) => {
    const updated = products.map(p => {
      if(p.id === id) {
        const newStock = Math.max(0, (p.stock || 0) + delta);
        return { ...p, stock: newStock };
      }
      return p;
    });
    await saveToDb(updated);
  };

  const deleteProduct = async (id: string) => {
    if(confirm('Delete this product from inventory?')) {
      await saveToDb(products.filter(p => p.id !== id));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setStock('');
  };

  const editProduct = (p: any) => {
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.price.toString());
    setStock(p.stock?.toString() || '0');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const lowStockProducts = products.filter(p => (p.stock ?? 0) <= LOW_STOCK_THRESHOLD);
  const outOfStockProducts = products.filter(p => (p.stock ?? 0) === 0);

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn">
      <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div>
            <h1 className="font-black text-lg text-primary">Inventory & Stock 📦</h1>
            <p className="text-xs text-text-dim font-bold uppercase tracking-widest">{products.length} Products Tracked</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Alerts Banner */}
        {outOfStockProducts.length > 0 && (
          <div className="bg-danger/10 border border-danger/30 rounded-2xl p-4 flex items-center justify-between animate-pulse">
            <div>
              <h3 className="font-black text-danger text-sm">🚨 {outOfStockProducts.length} Products Out of Stock!</h3>
              <p className="text-xs text-danger/80">Refill inventory immediately to avoid missing retail sales.</p>
            </div>
            <span className="text-3xl">⚠️</span>
          </div>
        )}

        {(lowStockProducts.length > 0 && outOfStockProducts.length === 0) && (
          <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h3 className="font-black text-warning text-sm">⚠️ {lowStockProducts.length} Items Running Low</h3>
              <p className="text-xs text-warning/80">Stock is below {LOW_STOCK_THRESHOLD} units. Time to reorder.</p>
            </div>
            <span className="text-3xl">📉</span>
          </div>
        )}

        {/* Editor Form */}
        <div className="p-5 rounded-3xl bg-card border border-border shadow-sm">
          <h2 className="font-black text-text mb-4">{editingId ? 'Edit Product' : 'Add Retail Product'}</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Product Name</label>
                 <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. L'Oreal Hair Serum" className="w-full mt-1 p-3 rounded-xl bg-background border border-border outline-none font-bold text-sm" />
              </div>
              
              <div>
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Selling Price (₹)</label>
                 <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 450" className="w-full mt-1 p-3 rounded-xl bg-background border border-border outline-none font-bold text-primary text-sm" />
              </div>

              <div>
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Current Stock qty</label>
                 <input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="e.g. 20" className="w-full mt-1 p-3 rounded-xl bg-background border border-border outline-none text-sm" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {editingId && <button onClick={resetForm} className="flex-1 py-3 neu-btn rounded-xl font-bold hover:bg-border transition-colors">Cancel</button>}
              <button disabled={saving} onClick={handleSaveProduct} className="flex-[2] py-3 btn-primary rounded-xl font-bold shadow-md hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-50">
                {saving ? 'Saving...' : editingId ? 'Update Item' : 'Add to Inventory'}
              </button>
            </div>
          </div>
        </div>

        {/* Master List */}
        <div>
           {products.length === 0 ? (
             <div className="text-center py-10 opacity-50">
                <span className="text-4xl block mb-2">🛍️</span>
                <p className="text-xs font-bold text-text-dim">No products in inventory.</p>
             </div>
           ) : (
             <div className="grid gap-3">
               {products.map(p => {
                 const currentStock = p.stock || 0;
                 const isLow = currentStock > 0 && currentStock <= LOW_STOCK_THRESHOLD;
                 const isOut = currentStock === 0;

                 return (
                   <div key={p.id} className={`p-4 rounded-3xl border flex gap-4 items-center bg-card shadow-sm transition-all ${isOut ? 'border-danger/30 outline outline-1 outline-danger/20' : isLow ? 'border-warning/30 outline outline-1 outline-warning/20' : 'border-border'}`}>
                     
                     <div className="flex-1">
                       <h4 className="font-bold text-text mb-1 line-clamp-1">{p.name}</h4>
                       <p className="text-primary font-black mb-2">₹{p.price}</p>
                       
                       <div className="flex items-center gap-2">
                         <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded border ${isOut ? 'bg-danger/10 text-danger border-danger/20' : isLow ? 'bg-warning/10 text-warning border-warning/20' : 'bg-success/10 text-success border-success/20'}`}>
                           {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                         </span>
                       </div>
                     </div>
                     
                     <div className="flex flex-col items-center gap-2">
                       <div className="flex items-center bg-background border border-border rounded-xl p-1">
                         <button onClick={() => updateStock(p.id, -1)} className="w-8 h-8 flex items-center justify-center bg-card-2 rounded-lg text-text font-black active:scale-95">-</button>
                         <span className="w-10 text-center font-black text-lg">{currentStock}</span>
                         <button onClick={() => updateStock(p.id, 1)} className="w-8 h-8 flex items-center justify-center bg-primary/20 text-primary rounded-lg font-black active:scale-95">+</button>
                       </div>
                       
                       <div className="flex gap-2 w-full mt-1">
                         <button onClick={() => editProduct(p)} className="flex-1 py-1.5 rounded-lg bg-card-2 border border-border text-xs font-bold text-text hover:bg-border transition-colors">Edit</button>
                         <button onClick={() => deleteProduct(p.id)} className="w-8 flex justify-center items-center rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors">🗑️</button>
                       </div>
                     </div>

                   </div>
                 );
               })}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
