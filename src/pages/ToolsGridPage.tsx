import { useApp } from '../store/AppContext';
import BusinessToolGrid from '../components/BusinessToolGrid';
import BottomNav from '../components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, ChevronDown } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export default function ToolsGridPage() {
  const { businessProfile } = useApp();
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 pb-36 flex flex-col select-none overflow-x-hidden relative">
      {/* ─── Top Safe-Area Header (Screens 5 & 7) ─── */}
      <header className="bg-white border-b border-gray-100 px-4 app-header-safe pb-3.5 shadow-xs sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              triggerHaptic('light');
              nav(-1);
            }}
            className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black text-gray-900 tracking-tight leading-tight">
                  {businessProfile?.businessName || 'My Business'}
                </h1>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-xs font-bold text-gray-500 mt-0.5">Business Suite & Tools</p>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <div className="p-4 flex-1">
        <BusinessToolGrid />
      </div>

      <BottomNav />
    </div>
  );
}
