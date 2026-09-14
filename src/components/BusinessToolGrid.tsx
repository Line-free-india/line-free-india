import { useNavigate } from 'react-router-dom';
import { useApp, getCategoryInfo } from '../store/AppContext';
import { BUSINESS_TOOLS, SHARED_TOOLS, ToolItem } from '../config/businessTools';
import { triggerHaptic } from '../utils/haptics';
import { 
  Sparkles, 
  Layers, 
  Scissors, 
  Star, 
  Users, 
  FileText, 
  MessageSquare, 
  Receipt, 
  Package, 
  Wallet, 
  TrendingDown, 
  ShoppingBag, 
  UserCheck, 
  Fingerprint, 
  Coins, 
  Calendar, 
  Bell, 
  Tag, 
  Percent, 
  Award, 
  TrendingUp,
  Tv,
  CheckSquare,
  Clock,
  Settings
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  'Queue': FileText,
  'Feedback': Star,
  'CRM': Users,
  'Service Menu': Scissors,
  'Live Queue Sheet': FileText,
  'WhatsApp CRM': MessageSquare,
  'Invoices & Billing': Receipt,
  'Smart Inventory': Package,
  'Cash Register': Wallet,
  'Expense Tracker': TrendingDown,
  'Retail POS': ShoppingBag,
  'Staff Roster': UserCheck,
  'Staff Attendance': Fingerprint,
  'Staff Payroll': Coins,
  'Booking Calendar': Calendar,
  'Appointment Reminders': Bell,
  'Dynamic Pricing': Tag,
  'Coupons & Promos': Percent,
  'Loyalty Program': Award,
  'Analytics Pro': TrendingUp,
};

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  emerald: { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-600' },
  blue: { bg: 'bg-blue-50 border-blue-100', text: 'text-blue-600' },
  orange: { bg: 'bg-orange-50 border-orange-100', text: 'text-orange-600' },
  violet: { bg: 'bg-violet-50 border-violet-100', text: 'text-violet-600' },
  rose: { bg: 'bg-rose-50 border-rose-100', text: 'text-rose-600' },
  purple: { bg: 'bg-purple-50 border-purple-100', text: 'text-purple-600' },
  cyan: { bg: 'bg-cyan-50 border-cyan-100', text: 'text-cyan-600' },
  amber: { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-600' },
  pink: { bg: 'bg-pink-50 border-pink-100', text: 'text-pink-600' },
  indigo: { bg: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-600' },
  yellow: { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-600' },
  teal: { bg: 'bg-teal-50 border-teal-100', text: 'text-teal-600' },
  slate: { bg: 'bg-gray-100 border-gray-200', text: 'text-gray-700' },
  sky: { bg: 'bg-sky-50 border-sky-100', text: 'text-sky-600' },
};

function ToolCard({ tool }: { tool: ToolItem }) {
  const nav = useNavigate();
  const IconComponent = ICON_MAP[tool.label] || Sparkles;
  const colors = COLOR_MAP[tool.color] || COLOR_MAP.blue;

  return (
    <button
      onClick={() => {
        triggerHaptic('light');
        nav(tool.path);
      }}
      className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs flex items-center gap-3 text-left hover:border-emerald-200 transition cursor-pointer group"
    >
      <div className={`w-11 h-11 rounded-xl ${colors.bg} border flex items-center justify-center shrink-0`}>
        <IconComponent className={`w-5 h-5 ${colors.text}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-gray-900 truncate group-hover:text-emerald-700 transition">
          {tool.label}
        </p>
        {tool.description && (
          <p className="text-xs font-semibold text-gray-500 truncate mt-0.5">
            {tool.description}
          </p>
        )}
      </div>
    </button>
  );
}

export default function BusinessToolGrid() {
  const { businessProfile } = useApp();
  const catType = businessProfile?.businessType || 'mens_salon';
  const categoryTools = BUSINESS_TOOLS[catType] || BUSINESS_TOOLS.mens_salon || [
    { label: 'Queue', icon: '📋', path: '/barber/customers', color: 'blue', description: 'Live Queue' },
    { label: 'Feedback', icon: '⭐', path: '/barber/customer-feedback', color: 'yellow', description: 'Reviews' },
    { label: 'CRM', icon: '💼', path: '/barber/crm', color: 'purple', description: 'Client Records' },
    { label: 'Service Menu', icon: '✂️', path: '/barber/menu-editor', color: 'cyan', description: 'Edit Services' }
  ];

  return (
    <div className="space-y-5 select-none">
      
      {/* 1. Industry-Specific Features (Screen 5) */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 pl-1">
          <Layers className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
            Industry-Specific Features
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {categoryTools.map((tool) => (
            <ToolCard key={tool.path + tool.label} tool={tool} />
          ))}
        </div>
      </div>

      {/* 2. Universal Tools (Screens 5 & 7) */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center gap-2 pl-1">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
              Universal Tools
            </h2>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">
              Everything you need to grow your business
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {SHARED_TOOLS.map((tool) => (
            <ToolCard key={tool.path + tool.label} tool={tool} />
          ))}
        </div>
      </div>
    </div>
  );
}
