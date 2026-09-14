import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, RetailSale, RetailSaleItem, InventoryItem } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

export default function ProductRetailPOS() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<RetailSale[]>([]);
  const [saving, setSaving] = useState(false);

  // Cart State
  const [cart, setCart] = useState<RetailSaleItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('upi');

  // View Toggle
  const [view, setView] = useState<'pos' | 'history'>('pos');

  useEffect(() => {
    if (businessProfile?.inventory) {
        // filter out things that are internal supplies if we want, but let's assume all retail-able items flag or just show all for now
        setInventory(businessProfile.inventory.filter(i => i.quantity > 0));
    }
    if (businessProfile?.retailSales) {
        setSales(businessProfile.retailSales);
    }
  }, [businessProfile]);

  const addToCart = (item: InventoryItem) => {
      triggerHaptic('light');
      const existing = cart.find(c => c.inventoryId === item.id);
      if (existing) {
          if (existing.quantity >= item.quantity) return alert('Cannot exceed available stock.');
          setCart(cart.map(c => c.inventoryId === item.id ? { ...c, quantity: c.quantity + 1, total: (c.quantity + 1) * c.unitPrice } : c));
      } else {
          // Fallback to averageCost if retailPrice not defined? (For demo, use averageCost as unitPrice)
          const price = item.price || 0;
          setCart([...cart, {
              inventoryId: item.id,
              name: item.itemName,
              quantity: 1,
              unitPrice: price,
              total: price
          }]);
      }
  };

  const removeFromCart = (id: string) => {
      triggerHaptic('light');
      setCart(cart.filter(c => c.inventoryId !== id));
  };

  const updateCartQty = (id: string, delta: number) => {
      triggerHaptic('light');
      setCart(cart.map(c => {
          if (c.inventoryId === id) {
              const newQty = Math.max(1, c.quantity + delta);
              const invItem = inventory.find(i => i.id === id);
              if (invItem && newQty > invItem.quantity) return c; // block
              return { ...c, quantity: newQty, total: newQty * c.unitPrice };
          }
          return c;
      }));
  };

  const checkout = async () => {
      if (cart.length === 0) return;
      if (!user || !businessProfile) return;

      const subtotal = cart.reduce((acc, curr) => acc + curr.total, 0);
      const tax = 0; // Configurable later
      const grandTotal = subtotal + tax;

      const newSale: RetailSale = {
          id: Date.now().toString(),
          dateStr: new Date().toISOString(),
          clientName: clientName.trim() || undefined,
          clientPhone: clientPhone.trim() || undefined,
          items: cart,
          subtotal,
          tax,
          grandTotal,
          paymentMethod
      };

      setSaving(true);
      try {
          // 1. Add to sales history
          const updatedSales = [newSale, ...sales];
          
          // 2. Decrement inventory
          const updatedInv = [...(businessProfile.inventory || [])].map(invItem => {
              const incart = cart.find(c => c.inventoryId === invItem.id);
              if (incart) {
                  return { ...invItem, quantity: Math.max(0, invItem.quantity - incart.quantity) };
              }
              return invItem;
          });

          await updateDoc(doc(db, 'barbers', user.uid), { 
              retailSales: updatedSales,
              inventory: updatedInv
          });

          setSales(updatedSales);
          setInventory(updatedInv.filter(i => i.quantity > 0)); // update local list
          triggerHaptic('success');
          
          if (clientPhone && confirm('Checkout successful. Send e-receipt to customer via WhatsApp?')) {
              sendReceipt(newSale);
          }

          // Reset
          setCart([]);
          setClientName('');
          setClientPhone('');
          setPaymentMethod('upi');

      } catch(e: any) {
          alert('Error during checkout: ' + e.message);
      }
      setSaving(false);
  };

  const sendReceipt = (sale: RetailSale) => {
      if (!sale.clientPhone) return;
      const bname = businessProfile?.businessName || 'Store';
      
      let itemStr = sale.items.map(i => `▫️ ${i.quantity}x ${i.name} (₹${i.total})`).join('\n');
      
      const text = `*🛍️ Purchase Receipt - ${bname}*\nHi ${sale.clientName || 'Customer'},\n\nThank you for your purchase:\n\n${itemStr}\n\n*Total Paid: ₹${sale.grandTotal}*\nPayment Mode: ${sale.paymentMethod.toUpperCase()}\n\n_We hope to see you again soon!_`;

      const sanitized = '91' + sale.clientPhone.replace(/\D/g, '').slice(-10);
      window.open(`https://wa.me/${sanitized}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const subtotal = cart.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-900/20 via-background to-background flex flex-col">
      <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div>
            <h1 className="font-black text-lg text-fuchsia-300">Retail POS 🛒</h1>
            <p className="text-xs text-fuchsia-200/50 font-bold uppercase tracking-widest">{sales.length} Sales Today</p>
          </div>
        </div>
        <div className="flex gap-1 elite-glass p-1 rounded-xl border-white/5 spatial-card">
            <button onClick={() => setView('pos')} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-colors ${view === 'pos' ? 'bg-fuchsia-500 text-white shadow-md' : 'text-text-dim'}`}>POS</button>
            <button onClick={() => setView('history')} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-colors ${view === 'history' ? 'bg-fuchsia-500 text-white shadow-md' : 'text-text-dim'}`}>History</button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4 relative">
        {view === 'pos' ? (
           <div className="h-full flex flex-col lg:flex-row gap-4">
               {/* Left: Product Grid */}
               <div className="flex-1 bg-card rounded-3xl border border-border p-4 flex flex-col min-h-[40vh] shadow-sm">
                   <h2 className="text-xs font-black uppercase tracking-widest text-text-dim mb-3">Available Products</h2>
                   <div className="flex-1 overflow-y-auto scrollbar-hide">
                       {inventory.length === 0 ? (
                           <p className="text-xs font-bold text-text-dim text-center mt-10">No items available in inventory. Please add retail products in Smart Inventory first.</p>
                       ) : (
                           <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                               {inventory.map(item => (
                                   <button 
                                       key={item.id} 
                                       onClick={() => addToCart(item)}
                                       className="bg-background border border-border rounded-2xl p-3 text-left hover:border-fuchsia-500/50 active:scale-95 transition-all group flex flex-col justify-between h-28"
                                   >
                                       <div>
                                           <div className="text-xs font-black text-blue-400 mb-1">{item.category}</div>
                                           <div className="text-xs font-bold text-zinc-100 line-clamp-2 leading-tight group-hover:text-fuchsia-300 transition-colors">{item.itemName}</div>
                                       </div>
                                       <div className="flex justify-between items-end mt-2">
                                           <span className="text-xs text-text-dim font-bold">{item.quantity} left</span>
                                           <span className="text-sm font-black text-emerald-400">₹{item.price || 0}</span>
                                       </div>
                                   </button>
                               ))}
                           </div>
                       )}
                   </div>
               </div>

               {/* Right: Cart & Checkout */}
               <div className="lg:w-[400px] flex flex-col gap-4">
                   {/* Cart Items */}
                   <div className="flex-1 bg-card rounded-3xl border border-border p-4 flex flex-col shadow-sm min-h-[40vh]">
                       <h2 className="text-xs font-black uppercase tracking-widest text-text-dim mb-3 flex justify-between">
                           <span>Current Cart</span>
                           <span className="text-fuchsia-400">{cart.length} Items</span>
                       </h2>
                       <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2">
                           {cart.length === 0 ? (
                               <div className="h-full flex items-center justify-center opacity-30 text-4xl">🛍️</div>
                           ) : (
                               cart.map(c => (
                                   <div key={c.inventoryId} className="flex items-center gap-3 bg-background border border-border p-3 rounded-xl animate-scaleIn">
                                       <div className="flex-1 truncate">
                                           <p className="text-xs font-bold text-zinc-100 truncate">{c.name}</p>
                                           <p className="text-xs text-zinc-500 font-medium">₹{c.unitPrice} / unit</p>
                                       </div>
                                       <div className="flex items-center gap-2 elite-glass rounded-lg p-0.5 border-white/5 spatial-card">
                                           <button onClick={() => updateCartQty(c.inventoryId, -1)} className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">−</button>
                                           <span className="text-xs font-black w-4 text-center">{c.quantity}</span>
                                           <button onClick={() => updateCartQty(c.inventoryId, 1)} className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">+</button>
                                       </div>
                                       <div className="w-14 text-right">
                                           <p className="text-xs font-black text-fuchsia-300">₹{c.total}</p>
                                       </div>
                                       <button onClick={() => removeFromCart(c.inventoryId)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors ml-1">✕</button>
                                   </div>
                               ))
                           )}
                       </div>
                   </div>

                   {/* Checkout Panel */}
                   <div className="bg-card rounded-3xl border border-fuchsia-500/30 p-4 shadow-[0_0_20px_rgba(217,70,239,0.05)]">
                       <div className="space-y-3 mb-4">
                           <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Customer Name (Optional)" className="w-full p-3 rounded-xl bg-background border border-border outline-none font-bold text-xs text-zinc-200" />
                           <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="WhatsApp No. (Optional)" className="w-full p-3 rounded-xl bg-background border border-border outline-none font-bold text-xs text-zinc-200" />
                       </div>

                       <div className="mb-4">
                           <label className="text-xs font-black uppercase tracking-widest text-text-dim mb-2 block">Payment Mode</label>
                           <div className="flex bg-background rounded-xl p-1 border border-border">
                               {['upi', 'card', 'cash'].map(pm => (
                                   <button key={pm} onClick={() => setPaymentMethod(pm as any)} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${paymentMethod === pm ? 'bg-fuchsia-500 text-white shadow-sm' : 'text-zinc-500'}`}>
                                       {pm}
                                   </button>
                               ))}
                           </div>
                       </div>

                       <div className="flex justify-between items-end mb-4 bg-background/50 p-3 rounded-xl border border-dashed border-border">
                           <span className="text-sm font-black uppercase tracking-widest text-text-dim">Total</span>
                           <span className="text-2xl font-black text-emerald-400">₹{subtotal}</span>
                       </div>

                       <button 
                           disabled={cart.length === 0 || saving} 
                           onClick={checkout}
                           className="w-full py-4 rounded-xl bg-fuchsia-600 text-white font-black uppercase tracking-widest text-xs shadow-[0_4px_15px_rgba(217,70,239,0.3)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                       >
                           {saving ? 'Processing...' : `Charge ₹${subtotal}`}
                       </button>
                   </div>
               </div>
           </div>
        ) : (
           <div className="max-w-3xl mx-auto h-full overflow-y-auto scrollbar-hide pb-10">
               {sales.length === 0 ? (
                   <div className="text-center py-10 opacity-50">
                       <p className="text-xs font-bold text-text-dim">No sales history yet.</p>
                   </div>
               ) : (
                   <div className="space-y-3">
                       {sales.map(s => (
                           <div key={s.id} className="elite-glass rounded-3xl p-4 flex flex-col md:flex-row justify-between gap-4 spatial-card">
                               <div>
                                   <div className="flex items-center gap-2 mb-1">
                                       <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">{new Date(s.dateStr).toLocaleString()}</span>
                                       <span className={`px-2 py-0.5 rounded text-xs font-black uppercase tracking-widest ${s.paymentMethod==='cash' ? 'bg-amber-500/20 text-amber-500' : s.paymentMethod==='upi' ? 'bg-blue-500/20 text-blue-500' : 'bg-purple-500/20 text-purple-500'}`}>{s.paymentMethod}</span>
                                   </div>
                                   <p className="text-sm font-black text-zinc-100">{s.clientName || 'Walk-in Customer'}</p>
                                   {s.clientPhone && <p className="text-xs font-medium text-zinc-500">{s.clientPhone}</p>}
                               </div>
                               
                               <div className="text-right flex flex-col justify-between items-end">
                                   <div className="text-sm font-black text-emerald-400 mb-2">₹{s.grandTotal}</div>
                                   <div className="text-xs text-zinc-400 max-w-[200px] truncate text-right border-l-2 border-fuchsia-500/30 pl-2 opacity-80">
                                       {s.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                   </div>
                               </div>
                           </div>
                       ))}
                   </div>
               )}
           </div>
        )}
      </div>
    </div>
  );
}
