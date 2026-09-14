import React, { useState } from 'react';
import { Layout, Grid, Image as ImageIcon, Plus, Trash2, Maximize2, Heart, Share2 } from 'lucide-react';

interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  likes: number;
  date: string;
}

const PortfolioGallery: React.FC = () => {
  const [items, setItems] = useState<PortfolioItem[]>([
    { id: '1', title: 'Cyberpunk Haircut', category: 'Styling', imageUrl: 'https://images.unsplash.com/photo-1599351431202-1e0f013d899a?w=800&auto=format&fit=crop&q=60', likes: 124, date: '2024-03-25' },
    { id: '2', title: 'Bridal Glow-up', category: 'Makeup', imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=60', likes: 89, date: '2024-03-20' },
    { id: '3', title: 'Organic Facials', category: 'Skincare', imageUrl: 'https://images.unsplash.com/photo-1570172619245-207a97217ca2?w=800&auto=format&fit=crop&q=60', likes: 210, date: '2024-03-15' },
  ]);

  const [filter, setFilter] = useState('All');
  const categories = ['All', 'Styling', 'Makeup', 'Skincare', 'Art'];

  const filteredItems = items.filter(item => filter === 'All' || item.category === filter);

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-outfit">Work Portfolio</h2>
        <button className="btn-primary flex items-center gap-2 px-4 py-2 text-sm w-auto">
          <Plus size={18} /> Upload Work
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              filter === cat 
                ? 'bg-primary text-white shadow-lg' 
                : 'bg-white/5 text-text-dim border border-white/10 hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredItems.map(item => (
          <div key={item.id} className="group relative rounded-2xl overflow-hidden glass-card aspect-square animate-scaleIn">
            <img 
              src={item.imageUrl} 
              alt={item.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
              <h3 className="text-xs font-bold text-white mb-1">{item.title}</h3>
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Heart size={14} className="text-danger fill-danger" />
                  <span className="text-xs text-white/80">{item.likes}</span>
                </div>
                <div className="flex gap-2">
                  <button className="p-1 hover:bg-white/20 rounded-lg text-white transition-colors">
                    <Maximize2 size={12} />
                  </button>
                  <button className="p-1 hover:bg-white/20 rounded-lg text-white transition-colors">
                    <Share2 size={12} />
                  </button>
                </div>
              </div>
            </div>

            <div className="absolute top-2 left-2">
               <span className="text-xs bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full uppercase font-black border border-white/10">
                 {item.category}
               </span>
            </div>
            
            <button className="absolute top-2 right-2 p-1.5 bg-danger/20 hover:bg-danger/80 backdrop-blur-md text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        
        <button className="aspect-square border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all text-text-dim hover:text-primary animate-pulse">
           <ImageIcon size={32} strokeWidth={1.5} />
           <span className="text-xs font-bold uppercase tracking-widest">New Showcase</span>
        </button>
      </div>
    </div>
  );
};

export default PortfolioGallery;
