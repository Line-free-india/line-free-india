import React, { useState } from 'react';
import { Plus, Trash2, Edit2, GripVertical, Image as ImageIcon } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  image?: string;
}

const MenuBuilder: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([
    { id: '1', name: 'Margherita Pizza', description: 'Classic tomato, mozzarella, basil', price: 299, category: 'Main Course', isAvailable: true },
    { id: '2', name: 'Cold Coffee', description: 'Creamy espresso blend', price: 150, category: 'Beverages', isAvailable: true },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: 'General',
    isAvailable: true
  });

  const addItem = () => {
    if (newItem.name && newItem.price) {
      const item: MenuItem = {
        id: Date.now().toString(),
        name: newItem.name!,
        description: newItem.description || '',
        price: newItem.price!,
        category: newItem.category || 'General',
        isAvailable: true
      };
      setItems([...items, item]);
      setNewItem({ name: '', description: '', price: 0, category: 'General' });
      setIsAdding(false);
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-playfair">Digital Menu Builder</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm w-auto"
        >
          <Plus size={18} /> Add Item
        </button>
      </div>

      {isAdding && (
        <div className="glass-card p-4 rounded-2xl space-y-4 animate-scaleIn">
          <input 
            type="text" 
            placeholder="Item Name" 
            className="input-field"
            value={newItem.name}
            onChange={e => setNewItem({...newItem, name: e.target.value})}
          />
          <textarea 
            placeholder="Description" 
            className="input-field min-h-[80px]"
            value={newItem.description}
            onChange={e => setNewItem({...newItem, description: e.target.value})}
          />
          <div className="grid grid-cols-2 gap-3">
            <input 
              type="number" 
              placeholder="Price" 
              className="input-field"
              value={newItem.price || ''}
              onChange={e => setNewItem({...newItem, price: Number(e.target.value)})}
            />
            <select 
              className="input-field"
              value={newItem.category}
              onChange={e => setNewItem({...newItem, category: e.target.value})}
            >
              <option value="Main Course">Main Course</option>
              <option value="Appetizers">Appetizers</option>
              <option value="Beverages">Beverages</option>
              <option value="Desserts">Desserts</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={addItem} className="btn-primary flex-1">Save Item</button>
            <button onClick={() => setIsAdding(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="premium-card p-4 flex items-center gap-4 hover-lift">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ImageIcon size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold">{item.name}</h3>
                <span className="text-primary font-bold">₹{item.price}</span>
              </div>
              <p className="text-xs text-text-dim line-clamp-1">{item.description}</p>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-1 inline-block uppercase font-bold tracking-wider">
                {item.category}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => removeItem(item.id)}
                className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                title="Remove"
              >
                <Trash2 size={16} />
              </button>
              <button className="p-2 text-text-dim hover:bg-white/5 rounded-lg transition-colors cursor-grab">
                <GripVertical size={16} />
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && !isAdding && (
          <div className="text-center py-12 opacity-50">
            <p>Your menu is empty. Start adding items!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuBuilder;
