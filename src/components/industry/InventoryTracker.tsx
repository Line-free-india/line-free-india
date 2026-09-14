import React, { useState } from 'react';
import { Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Search, Plus, Filter, MoreVertical, Layers, ChevronRight } from 'lucide-react';

interface StockItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  price: number;
}

const InventoryTracker: React.FC = () => {
  const [inventory, setInventory] = useState<StockItem[]>([
    { id: '1', name: 'Premium Hair Wax', sku: 'HW-001', category: 'Styling', quantity: 45, minThreshold: 10, unit: 'pcs', price: 499 },
    { id: '2', name: 'Herbal Shampoo 1L', sku: 'SH-042', category: 'Wash', quantity: 8, minThreshold: 15, unit: 'btl', price: 850 },
    { id: '3', name: 'Sterilized Needles', sku: 'ND-99', category: 'Medical', quantity: 500, minThreshold: 100, unit: 'box', price: 120 },
  ]);

  const [search, setSearch] = useState('');

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = inventory.filter(p => p.quantity <= p.minThreshold).length;

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-dm">Inventory Management</h2>
        <button className="btn-primary flex items-center gap-2 px-4 py-2 text-sm w-auto">
          <Plus size={18} /> Add Stock
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Layers size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Total Items</span>
          </div>
          <p className="text-2xl font-black">{inventory.length}</p>
        </div>
        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
          lowStockCount > 0 
            ? 'bg-danger/10 border-danger/20 text-danger' 
            : 'bg-success/10 border-success/20 text-success'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Low Stock</span>
          </div>
          <p className="text-2xl font-black">{lowStockCount}</p>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-colors" size={18} />
        <input 
          type="text" 
          placeholder="Search by name or SKU..." 
          className="input-field pl-10 bg-white/5"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-lg text-text-dim">
           <Filter size={16} />
        </button>
      </div>

      <div className="space-y-4">
        {filteredInventory.map(item => {
           const isLow = item.quantity <= item.minThreshold;
           const stockPercent = Math.min((item.quantity / (item.minThreshold * 4)) * 100, 100);
           
           return (
             <div key={item.id} className={`premium-card p-4 glass-card relative overflow-hidden transition-all hover:scale-[1.01] ${
               isLow ? 'border-danger/30 active:bg-danger/5' : 'border-white/5 active:bg-white/5'
             }`}>
               <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isLow ? 'bg-danger/20 text-danger' : 'bg-primary/20 text-primary'
                    }`}>
                      <Package size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm tracking-tight">{item.name}</h3>
                      <p className="text-xs font-mono text-text-dim uppercase tracking-wider">{item.sku} • {item.category}</p>
                    </div>
                  </div>
                  <button className="p-1 text-text-dim hover:text-white">
                    <MoreVertical size={16} />
                  </button>
               </div>

               <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-text-dim uppercase">Availability</p>
                    <div className="flex items-center gap-2">
                       <span className={`text-xl font-black ${isLow ? 'text-danger' : 'text-success'}`}>
                         {item.quantity}
                       </span>
                       <span className="text-xs text-text-dim font-bold">{item.unit}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <p className="text-xs font-bold text-text-dim uppercase font-mono">MRP: ₹{item.price}</p>
                     <div className="flex gap-1">
                        <button className="bg-white/5 hover:bg-white/10 p-1.5 rounded-lg border border-white/5">
                           <ArrowUpRight size={14} className="text-success" />
                        </button>
                        <button className="bg-white/5 hover:bg-white/10 p-1.5 rounded-lg border border-white/5">
                           <ArrowDownRight size={14} className="text-danger" />
                        </button>
                     </div>
                  </div>
               </div>

               <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${isLow ? 'bg-danger' : 'bg-success'}`}
                    style={{ width: `${stockPercent}%` }}
                  ></div>
               </div>
             </div>
           );
        })}
      </div>

      <div className="pt-4 border-t border-white/5">
         <button className="flex items-center justify-between w-full p-4 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
            <div className="flex items-center gap-3">
               <div className="bg-primary/20 p-2 rounded-xl">
                  <AlertTriangle size={20} />
               </div>
               <div className="text-left">
                  <p className="text-xs font-bold uppercase tracking-tight">Stock Insights</p>
                  <p className="text-xs opacity-80">You have {lowStockCount} items running low</p>
               </div>
            </div>
            <ChevronRight size={20} />
         </button>
      </div>
    </div>
  );
};

export default InventoryTracker;
