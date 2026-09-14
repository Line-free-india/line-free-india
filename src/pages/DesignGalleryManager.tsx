import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, PortfolioItem } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

export default function DesignGalleryManager() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('small');
  const [colorType, setColorType] = useState<'black_work' | 'color'>('black_work');
  const [estimatedPrice, setEstimatedPrice] = useState('');

  useEffect(() => {
    if (businessProfile?.portfolioItems) {
      setItems(businessProfile.portfolioItems);
    }
  }, [businessProfile]);

  const saveToDb = async (newItems: PortfolioItem[]) => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { portfolioItems: newItems });
      setItems(newItems);
      triggerHaptic('success');
    } catch (e: any) {
      alert('Error updating gallery: ' + e.message);
    }
    setSaving(false);
  };

  const handleSaveItem = async () => {
    if (!title.trim() || !url.trim() || !category.trim()) return alert('Title, Image URL, and Category are required');
    
    const newItem: PortfolioItem = {
      id: editingId || Date.now().toString() + Math.random().toString(36).substring(7),
      title: title.trim(),
      url: url.trim(),
      category: category.trim(),
      size,
      colorType,
      estimatedPrice: estimatedPrice ? Number(estimatedPrice) : undefined
    };

    const updatedItems = editingId 
      ? items.map(i => i.id === editingId ? newItem : i)
      : [newItem, ...items];
      
    await saveToDb(updatedItems);
    resetForm();
  };

  const deleteItem = async (id: string) => {
    if(confirm('Delete this design from gallery?')) {
      await saveToDb(items.filter(i => i.id !== id));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setUrl('');
    setCategory('');
    setSize('small');
    setColorType('black_work');
    setEstimatedPrice('');
  };

  const editItem = (item: PortfolioItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setUrl(item.url);
    setCategory(item.category);
    setSize(item.size);
    setColorType(item.colorType);
    setEstimatedPrice(item.estimatedPrice?.toString() || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categories = Array.from(new Set(items.map(i => i.category)));

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800 via-background to-background">
      <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div>
            <h1 className="font-black text-lg text-text">Tattoo Design Gallery 🖌️</h1>
            <p className="text-xs text-text-dim font-bold uppercase tracking-widest">{items.length} Designs Live</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-8">
        {/* Editor Form */}
        <div className="p-5 rounded-3xl elite-glass spatial-card border-white/5 shadow-md">
          <h2 className="font-black text-text mb-4">{editingId ? 'Edit Design' : 'Upload New Design'}</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Design Title</label>
                 <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Minimalist Geometric Rose" className="w-full mt-1 p-3 rounded-xl bg-background border border-border focus:border-text/50 outline-none font-bold" />
              </div>
              
              <div className="col-span-2">
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Image URL</label>
                 <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="e.g. https://image.url" className="w-full mt-1 p-3 rounded-xl bg-background border border-border focus:border-text/50 outline-none" />
              </div>

              <div>
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Category / Style</label>
                 <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Realism, Line Art" list="category-options" className="w-full mt-1 p-3 rounded-xl bg-background border border-border focus:border-text/50 outline-none" />
                 <datalist id="category-options">
                   {categories.map(c => <option key={c} value={c} />)}
                 </datalist>
              </div>

              <div>
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Est. Starting Price (₹)</label>
                 <input type="number" value={estimatedPrice} onChange={e => setEstimatedPrice(e.target.value)} placeholder="e.g. 1500" className="w-full mt-1 p-3 rounded-xl bg-background border border-border focus:border-text/50 outline-none font-bold" />
              </div>

               <div className="col-span-2 mt-2">
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1 mb-2 block">Size</label>
                 <div className="flex gap-2">
                   {['small', 'medium', 'large'].map(s => (
                     <button 
                       key={s} 
                       onClick={() => setSize(s as any)}
                       className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all capitalize ${size === s ? 'bg-text text-background border-text' : 'bg-card border-border text-text-dim hover:border-text/30'}`}
                     >{s}</button>
                   ))}
                 </div>
              </div>

               <div className="col-span-2 mt-2">
                 <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1 mb-2 block">Color Setup</label>
                 <div className="flex gap-2">
                   <button 
                     onClick={() => setColorType('black_work')}
                     className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${colorType === 'black_work' ? 'bg-black text-white border-black' : 'bg-card border-border text-text-dim hover:border-text/30'}`}
                   >⚫ Black Work</button>
                   <button 
                     onClick={() => setColorType('color')}
                     className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${colorType === 'color' ? 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-white border-transparent' : 'bg-card border-border text-text-dim hover:border-text/30'}`}
                   >🌈 Color</button>
                 </div>
              </div>
              
            </div>

            <div className="flex gap-2 pt-4 border-t border-border mt-2 rounded">
              {editingId && <button onClick={resetForm} className="flex-1 py-3 bg-card-2 border border-border rounded-xl font-bold hover:bg-border transition-colors">Cancel</button>}
              <button disabled={saving} onClick={handleSaveItem} className="flex-[2] py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary/90 transition-colors active:scale-95 disabled:opacity-50">
                {saving ? 'Saving...' : editingId ? 'Update Design' : 'Publish to Gallery'}
              </button>
            </div>
          </div>
        </div>

        {/* Existing Gallery Grid */}
        <div>
           {categories.length === 0 ? (
             <div className="text-center py-10 opacity-50">
                <span className="text-4xl block mb-2">🖼️</span>
                <p className="text-xs font-bold text-text-dim">Your gallery is currently empty.</p>
             </div>
           ) : (
             categories.map(cat => (
               <div key={cat} className="mb-8">
                 <h3 className="font-black text-text uppercase tracking-widest pl-2 mb-4 border-l-2 border-primary text-lg">{cat}</h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                   {items.filter(i => i.category === cat).map(item => (
                     <div key={item.id} className="elite-glass spatial-card rounded-2xl border-white/5 overflow-hidden flex flex-col group relative">
                       {/* Tags Overlay */}
                       <div className="absolute top-2 left-2 right-2 flex justify-between z-10 pointer-events-none">
                         <span className="text-xs font-black uppercase px-2 py-1 bg-black/60 backdrop-blur-md text-white rounded-md shadow-sm">
                           {item.size}
                         </span>
                         <span className={`w-3 h-3 rounded-full shadow-sm border border-white/20 ${item.colorType === 'black_work' ? 'bg-black' : 'bg-gradient-to-br from-red-500 to-blue-500'}`}></span>
                       </div>

                       {/* Image */}
                       <div className="w-full aspect-[4/5] bg-card-2 flex items-center justify-center overflow-hidden">
                         {item.url ? (
                           <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                         ) : (
                           <span className="opacity-20 text-3xl">📷</span>
                         )}
                       </div>
                       
                       {/* Info */}
                       <div className="p-3 flex flex-col flex-1 justify-between bg-card z-10 relative border-t border-border">
                         <div>
                           <h4 className="font-bold text-text text-sm mb-1 leading-tight line-clamp-2">{item.title}</h4>
                           {item.estimatedPrice && <p className="text-primary font-black text-xs">Starts ₹{item.estimatedPrice}</p>}
                         </div>
                         <div className="flex gap-1 mt-3">
                           <button onClick={() => editItem(item)} className="flex-1 py-1.5 rounded-lg bg-card-2 border border-border text-xs font-bold text-text hover:bg-border transition-colors">Edit</button>
                           <button onClick={() => deleteItem(item.id)} className="w-8 flex items-center justify-center rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors">🗑️</button>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
}
