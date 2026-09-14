import { useState } from 'react';
import { useApp } from '../store/AppContext';
import BottomNav from '../components/BottomNav';
import BackButton from '../components/BackButton';
import { useNavigate } from 'react-router-dom';
import ResponsiveContainer from '../components/ResponsiveContainer';

const categories = [
  {
    name: 'Classic',
    styles: [
      { name: 'Classic Fade', desc: 'Clean tapered sides with longer top', emoji: '💇‍♂️', difficulty: 'Easy', time: '20 min' },
      { name: 'Side Part', desc: 'Classic gentleman style', emoji: '🎩', difficulty: 'Easy', time: '15 min' },
      { name: 'Crew Cut', desc: 'Short sides and back, slightly longer top', emoji: '👔', difficulty: 'Easy', time: '15 min' },
      { name: 'Buzz Cut', desc: 'Short all around, low maintenance', emoji: '🔲', difficulty: 'Easy', time: '10 min' },
    ]
  },
  {
    name: 'Trending',
    styles: [
      { name: 'Textured Crop', desc: 'Messy textured top with fade', emoji: '🌊', difficulty: 'Medium', time: '25 min' },
      { name: 'French Crop', desc: 'Short with textured fringe', emoji: '🇫🇷', difficulty: 'Medium', time: '25 min' },
      { name: 'Wolf Cut', desc: 'Layered shaggy style', emoji: '🐺', difficulty: 'Medium', time: '30 min' },
      { name: 'Curtain Bangs', desc: 'Middle parted with face framing', emoji: '🎭', difficulty: 'Medium', time: '25 min' },
    ]
  },
  {
    name: 'Bold',
    styles: [
      { name: 'Undercut', desc: 'Disconnected sides with styled top', emoji: '✂️', difficulty: 'Medium', time: '30 min' },
      { name: 'Pompadour', desc: 'Volume on top, slicked back sides', emoji: '💫', difficulty: 'Hard', time: '35 min' },
      { name: 'Mohawk', desc: 'Bold strip of hair on top', emoji: '🤘', difficulty: 'Hard', time: '40 min' },
      { name: 'High Top Fade', desc: 'Flat top with faded sides', emoji: '⬆️', difficulty: 'Hard', time: '35 min' },
    ]
  },
  {
    name: 'Long Hair',
    styles: [
      { name: 'Man Bun', desc: 'Long hair tied up', emoji: '🧔', difficulty: 'Easy', time: '10 min' },
      { name: 'Quiff', desc: 'Voluminous front swept up and back', emoji: '💨', difficulty: 'Medium', time: '25 min' },
      { name: 'Slick Back', desc: 'All hair swept backwards', emoji: '🪮', difficulty: 'Easy', time: '15 min' },
      { name: 'Taper Fade', desc: 'Gradual length decrease', emoji: '📐', difficulty: 'Medium', time: '25 min' },
    ]
  }
];

const difficultyColor: Record<string, string> = {
  'Easy': 'badge-success',
  'Medium': 'badge-warning',
  'Hard': 'badge-danger',
};

export default function CustomerHairstyles() {
  const { t } = useApp();
  const nav = useNavigate();
  const [activeCategory, setActiveCategory] = useState('Classic');
  const [liked, setLiked] = useState<string[]>([]);

  const toggleLike = (name: string) => {
    setLiked(l => l.includes(name) ? l.filter(n => n !== name) : [...l, name]);
  };

  const startAIAnalysis = () => {
    nav('/customer/try-on');
  };

  const currentStyles = categories.find(c => c.name === activeCategory)?.styles || [];

  return (
    <ResponsiveContainer variant="customer">
    <div className="min-h-screen pb-40 animate-fadeIn">
      <div className="p-6">
        <BackButton to="/customer/home" />
        <h1 className="text-2xl font-bold mb-1">{t('hairstyles')}</h1>
        <p className="text-text-dim text-sm mb-4">Explore & save your favorite styles</p>

        {/* Category Tabs */}
        <div className="horizontal-scroll mb-5">
          {categories.map(cat => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.name
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-text-dim'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Liked Counter */}
        {liked.length > 0 && (
          <div className="mb-4 p-2.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2">
            <span className="text-base">❤️</span>
            <p className="text-xs font-medium">{liked.length} style{liked.length > 1 ? 's' : ''} saved</p>
          </div>
        )}

        {/* Styles Grid */}
        <div className="grid grid-cols-2 gap-3">
          {currentStyles.map((style, i) => (
            <div
              key={style.name}
              className="p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all relative animate-fadeIn"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <button
                onClick={() => toggleLike(style.name)}
                className="absolute top-2.5 right-2.5 text-lg transition-transform active:scale-75"
              >
                {liked.includes(style.name) ? '❤️' : '🤍'}
              </button>
              <span className="text-3xl block mb-2">{style.emoji}</span>
              <p className="font-semibold text-sm">{style.name}</p>
              <p className="text-text-dim text-xs mt-0.5 leading-tight">{style.desc}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`badge text-xs py-0.5 px-1.5 ${difficultyColor[style.difficulty]}`}>{style.difficulty}</span>
                <span className="text-text-dim text-xs">⏱ {style.time}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Share */}
        <button
          onClick={() => {
            const likedNames = liked.length > 0 ? `My picks: ${liked.join(', ')}` : 'Check out these hairstyles';
            window.open(`https://wa.me/?text=${encodeURIComponent(`${likedNames} — found on Line Free app 💈✂️`)}`, '_blank');
          }}
          className="btn-whatsapp mt-4"
        >
          📲 Share Your Picks
        </button>

        {/* AI Try on */}
        <div className="mt-4 p-5 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-accent/10 border border-primary/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10" />
          <span className="text-4xl block mb-3 animate-float relative z-10">🤖</span>
          <h2 className="font-bold text-lg relative z-10">AI Face Scanner</h2>
          <p className="text-text-dim text-xs mt-1 mb-4 relative z-10">Let our AI scan your facial structure and suggest the perfect matching hairstyle in seconds.</p>
          <button onClick={startAIAnalysis} className="btn-primary w-full relative z-10 shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
            <span>✨</span> Try AI Generator
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
    </ResponsiveContainer>
  );
}
