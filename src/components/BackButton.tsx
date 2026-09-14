import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export default function BackButton({ to }: { to?: string }) {
  const nav = useNavigate();
  return (
    <button
      onClick={() => {
        triggerHaptic('light');
        to ? nav(to) : nav(-1 as any);
      }}
      className="flex items-center gap-1.5 py-1.5 px-3 -ml-3 rounded-xl text-primary font-bold hover:bg-primary/10 transition-colors cursor-pointer"
    >
      <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
      <span>Back</span>
    </button>
  );
}
